// Mijoz API: katalog, savatcha, buyurtma, chek
const cfg = require('../config/default');
const prisma = require('../database/connection');
const Product = require('../models/Product');
const Story = require('../models/Story');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const bot = require('../core/bot');
const payment = require('../services/payment');
const { takeStock } = require('../services/stock');
const { saveImage } = require('../utils/upload');
const { t, adminOrderText } = require('../utils/i18n');
const { signWebToken } = require('../middlewares/auth.middleware');

// Mijoz tanlagan davlat va savdo turi (noto'g'ri bo'lsa — Koreya, dona)
const pickMarket = (v) => (cfg.isMarket(v) ? v : 'kr');
const pickMode = (v) => (cfg.isMode(v) ? v : 'retail');

async function getConfig(_req, res) {
  const s = await Setting.all();
  // Har davlatga: hududlar, valyuta, o'z kartasi va yetkazish narxi
  const markets = await Promise.all(
    cfg.markets.map(async (m) => {
      const [pay, delivery] = await Promise.all([Setting.payment(m.key), Setting.delivery(m.key)]);
      return {
        ...m,
        payment: { methods: pay.cardEnabled ? ['cash', 'card'] : ['cash'], card: pay.cardEnabled ? pay.card : null },
        delivery,
      };
    })
  );
  res.json({
    company: cfg.company,
    categories: cfg.categories,
    tags: cfg.tags,
    markets,
    modes: cfg.modes,
    shopNote: s.shopNote || '',
  });
}

async function listProducts(_req, res) {
  const rows = await Product.listActive();
  res.set('Cache-Control', 'no-cache');
  res.json(rows.map(Product.toPublic));
}

async function getProduct(req, res) {
  const p = await prisma.product.findFirst({ where: { id: Number(req.params.id) || 0, isActive: true } });
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(Product.toPublic(p));
}

async function listStories(_req, res) {
  res.json(await Story.listActive());
}

function webSession(_req, res) {
  res.json({ token: signWebToken() });
}

function me(req, res) {
  const u = req.user;
  res.json({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    phone: u.phone,
    lang: u.lang,
    market: u.market,
    mode: u.mode,
    seenIntro: u.seenIntro,
    isWeb: !!req.isWeb,
  });
}

async function updateMe(req, res) {
  const data = {};
  if (['uz', 'ru'].includes(req.body.lang)) data.lang = req.body.lang;
  if (typeof req.body.seenIntro === 'boolean') data.seenIntro = req.body.seenIntro;
  if (cfg.isMarket(req.body.market)) data.market = req.body.market;
  if (cfg.isMode(req.body.mode)) data.mode = req.body.mode;
  const u = await prisma.user.update({ where: { id: req.user.id }, data });
  req.user = u;
  me(req, res);
}

/**
 * Narxlar FAQAT shu yerda hisoblanadi — Mini App yuborgan narxga ishonilmaydi.
 * rawItems: [{productId, variant, qty}], market: kr | uz, mode: retail | wholesale
 */
async function priceCart(rawItems, market = 'kr', mode = 'retail') {
  const merged = new Map();
  for (const r of (Array.isArray(rawItems) ? rawItems : []).slice(0, 50)) {
    const productId = parseInt(r?.productId, 10);
    const qty = Math.min(99, Math.max(1, parseInt(r?.qty, 10) || 1));
    if (!productId) continue;
    const key = `${productId}|${r.variant || ''}`;
    const prev = merged.get(key);
    merged.set(key, { productId, variant: r.variant || null, qty: Math.min(99, (prev?.qty || 0) + qty) });
  }
  const ids = [...new Set([...merged.values()].map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  const problems = [];
  const usedPerProduct = new Map();
  for (const it of merged.values()) {
    const p = byId.get(it.productId);
    if (!p) {
      problems.push({ productId: it.productId, variant: it.variant, reason: 'unavailable' });
      continue;
    }
    const unitPrice = Product.priceFor(p, market, mode);
    if (!unitPrice) {
      problems.push({ productId: p.id, variant: it.variant, reason: 'noPrice' });
      continue;
    }
    const variant = p.variants.length ? (p.variants.includes(it.variant) ? it.variant : p.variants[0]) : null;
    let qty = it.qty;
    if (p.stock !== null) {
      const left = p.stock - (usedPerProduct.get(p.id) || 0);
      if (left <= 0) {
        problems.push({ productId: p.id, variant, reason: 'outOfStock', available: 0 });
        continue;
      }
      if (qty > left) {
        problems.push({ productId: p.id, variant, reason: 'stock', available: left });
        qty = left;
      }
      usedPerProduct.set(p.id, (usedPerProduct.get(p.id) || 0) + qty);
    }
    lines.push({
      productId: p.id,
      article: p.article,
      name: p.name,
      nameRu: p.nameRu,
      image: Product.imageForVariant(p, variant),
      variant,
      qty,
      unitPrice,
      // chizilgan eski narx faqat Koreya donasi uchun kiritiladi
      oldPrice: market === 'kr' && mode === 'retail' ? p.oldPrice : null,
      lineTotal: unitPrice * qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const d = await Setting.delivery(market);
  const deliveryFee = subtotal > 0 && d.fee > 0 && !(d.freeFrom > 0 && subtotal >= d.freeFrom) ? d.fee : 0;
  return { lines, problems, subtotal, totalQty, deliveryFee, total: subtotal + deliveryFee, freeFrom: d.freeFrom };
}

async function calculate(req, res) {
  res.json(await priceCart(req.body.items, pickMarket(req.body.market), pickMode(req.body.mode)));
}

function badRequest(res, field, error) {
  return res.status(400).json({ error, field });
}

async function createOrder(req, res) {
  const b = req.body || {};
  const name = String(b.customerName || '').trim().slice(0, 80);
  const phoneDigits = String(b.phone || '').replace(/\D/g, '');
  const region = String(b.region || '');
  const address = String(b.address || '').trim().slice(0, 300);
  const comment = String(b.comment || '').trim().slice(0, 500) || null;
  const method = String(b.paymentMethod || '');
  const market = pickMarket(b.market);
  const mode = pickMode(b.mode);

  if (name.length < 2) return badRequest(res, 'customerName', 'Ismni kiriting');
  if (phoneDigits.length < 9 || phoneDigits.length > 15) return badRequest(res, 'phone', 'Telefon noto‘g‘ri');
  if (!cfg.market(market).regions.some((r) => r.key === region)) return badRequest(res, 'region', 'Hududni tanlang');
  if (address.length < 3) return badRequest(res, 'address', 'Manzilni kiriting');
  const pay = await Setting.payment(market);
  if (!(method === 'cash' || (method === 'card' && pay.cardEnabled))) return badRequest(res, 'paymentMethod', 'To‘lov usuli');

  const priced = await priceCart(b.items, market, mode);
  if (!priced.lines.length) return res.status(400).json({ error: 'Savatcha bo‘sh', problems: priced.problems });
  // Har qanday muammo (tugagan, narxsiz, yetarli emas) — mijoz savatchada ko'rib, qayta tasdiqlaydi
  if (priced.problems.length) return res.status(409).json({ error: 'problems', problems: priced.problems });

  const phone = '+' + phoneDigits;
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      await takeStock(tx, priced.lines);
      return tx.order.create({
        data: {
          userId: req.user.id,
          market,
          mode,
          items: priced.lines.map(({ oldPrice, ...l }) => l),
          totalQty: priced.totalQty,
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee,
          total: priced.total,
          customerName: name,
          phone,
          region,
          address,
          comment,
          paymentMethod: method,
        },
        include: { user: true },
      });
    });
  } catch (e) {
    if (e.short) return res.status(409).json({ error: 'stock', problems: e.short.map((s) => ({ ...s, reason: 'stock' })) });
    throw e;
  }

  // Profilni to'ldirib qo'yamiz
  const upd = {};
  if (!req.user.phone) upd.phone = phone;
  if (!req.user.firstName) upd.firstName = name;
  if (req.user.market !== market) upd.market = market;
  if (req.user.mode !== mode) upd.mode = mode;
  if (Object.keys(upd).length) prisma.user.update({ where: { id: req.user.id }, data: upd }).catch(() => {});

  // Adminlarga: rasm(lar) + to'liq ma'lumot bitta xabarda
  const images = [...new Set(order.items.map((i) => i.image).filter(Boolean))];
  bot.notifyAdmins(adminOrderText(order), { images }).catch((e) => console.error('[order] admin xabari:', e.message));

  // Mijozga botdan tasdiq
  const L = t(req.user.lang);
  bot.safeSend(req.user.telegramId, L.orderCreated(order)).then(() => {
    if (method === 'card') bot.safeSend(req.user.telegramId, L.payCard(order, pay.card));
  });

  res.status(201).json(Order.toPublic(order));
}

async function myOrders(req, res) {
  const rows = await prisma.order.findMany({ where: { userId: req.user.id }, orderBy: { id: 'desc' }, take: 50 });
  res.json(rows.map(Order.toPublic));
}

async function uploadReceipt(req, res) {
  const id = Number(req.params.id);
  const order = await prisma.order.findFirst({ where: { id, userId: req.user.id } });
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  if (order.paymentStatus === 'paid') return res.status(400).json({ error: 'Allaqachon to‘langan' });
  if (!req.file) return res.status(400).json({ error: 'Rasm yuklang' });
  const url = await saveImage(req.file.buffer, 'receipts', { maxSize: 2000 });
  const updated = await payment.attachReceipt(order.id, url);
  res.json(Order.toPublic(updated));
}

module.exports = {
  getConfig,
  listProducts,
  getProduct,
  listStories,
  webSession,
  me,
  updateMe,
  calculate,
  createOrder,
  myOrders,
  uploadReceipt,
  priceCart,
};
