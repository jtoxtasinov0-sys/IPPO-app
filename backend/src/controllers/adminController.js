// Admin panel API
const crypto = require('crypto');
const cfg = require('../config/default');
const prisma = require('../database/connection');
const Product = require('../models/Product');
const Story = require('../models/Story');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const bot = require('../core/bot');
const broadcast = require('../core/broadcast');
const payment = require('../services/payment');
const { returnStock, retakeStock } = require('../services/stock');
const { saveImage } = require('../utils/upload');
const { t } = require('../utils/i18n');
const { verifyInitData, signAdminToken } = require('../middlewares/auth.middleware');
const User = require('../models/User');

// ——— Kirish ———
const loginAttempts = new Map();

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function login(req, res) {
  const ip = req.ip;
  const now = Date.now();
  const rec = (loginAttempts.get(ip) || []).filter((ts) => now - ts < 15 * 60_000);
  if (rec.length >= 10) return res.status(429).json({ error: 'Urinishlar ko‘p. 15 daqiqadan keyin qayta urinib ko‘ring' });
  const { username, password } = req.body || {};
  if (!safeEqual(username || '', cfg.adminUsername) || !safeEqual(password || '', cfg.adminPassword)) {
    rec.push(now);
    loginAttempts.set(ip, rec);
    return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
  }
  loginAttempts.delete(ip);
  res.json({ token: signAdminToken({ sub: 'panel', name: username }) });
}

// Telegram ichidan ochilganda — parolsiz
async function tgLogin(req, res) {
  const tgUser = verifyInitData(req.body?.initData);
  if (!tgUser) return res.status(401).json({ error: 'initData yaroqsiz' });
  if (!(await User.isAdminTelegramId(tgUser.id))) return res.status(403).json({ error: 'Siz admin emassiz. Botda /admin PAROL yozing' });
  res.json({ token: signAdminToken({ sub: String(tgUser.id), name: tgUser.first_name }) });
}

// ——— Statistika ———
async function stats(_req, res) {
  // "Bugun" — Koreya vaqti (UTC+9) bo'yicha, server qaysi zonada bo'lishidan qat'i nazar
  const KST = 9 * 3600_000;
  const startOfDay = new Date(Math.floor((Date.now() + KST) / 86400_000) * 86400_000 - KST);
  const notCancelled = { status: { not: 'cancelled' } };
  const [total, today, byStatus, revenue, revenueToday, pendingReceipts, users, products] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.groupBy({ by: ['market'], _sum: { total: true }, where: notCancelled }),
    prisma.order.groupBy({ by: ['market'], _sum: { total: true }, where: { ...notCancelled, createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { paymentStatus: 'pending' } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
  ]);
  res.json({
    total,
    today,
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    // davlat bo'yicha: { kr: 120000, uz: 3500000 } — valyutalar har xil, qo'shib bo'lmaydi
    revenue: Object.fromEntries(revenue.map((r) => [r.market, r._sum.total || 0])),
    revenueToday: Object.fromEntries(revenueToday.map((r) => [r.market, r._sum.total || 0])),
    pendingReceipts,
    users,
    products,
  });
}

// ——— Buyurtmalar ———
async function listOrders(req, res) {
  const where = {};
  if (cfg.orderStatuses.includes(req.query.status)) where.status = req.query.status;
  if (cfg.paymentStatuses.includes(req.query.payment)) where.paymentStatus = req.query.payment;
  const q = String(req.query.q || '').trim();
  if (q) {
    const id = parseInt(q.replace('#', ''), 10);
    where.OR = [
      { customerName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q.replace(/\D/g, '') || q } },
      ...(Number.isFinite(id) ? [{ id }] : []),
    ];
  }
  const rows = await prisma.order.findMany({
    where,
    orderBy: { id: 'desc' },
    take: 300,
    include: { user: { select: { telegramId: true, username: true, firstName: true } } },
  });
  res.json(rows);
}

async function updateOrder(req, res) {
  const id = Number(req.params.id);
  const { status, paymentStatus } = req.body || {};
  const order = await prisma.order.findUnique({ where: { id }, include: { user: true } });
  if (!order) return res.status(404).json({ error: 'Topilmadi' });

  let updated = order;
  if (status && status !== order.status) {
    if (!cfg.orderStatuses.includes(status)) return res.status(400).json({ error: 'status' });
    updated = await prisma.$transaction(async (tx) => {
      const data = { status };
      // Bekor qilinsa — ombor qaytariladi; qayta tiklansa — yana ayriladi
      if (status === 'cancelled' && !order.stockReturned) {
        await returnStock(tx, order.items);
        data.stockReturned = true;
      } else if (order.status === 'cancelled' && order.stockReturned) {
        await retakeStock(tx, order.items);
        data.stockReturned = false;
      }
      return tx.order.update({ where: { id }, data, include: { user: true } });
    });
    if (updated.user && t(updated.user.lang).status[status]) {
      bot.safeSend(updated.user.telegramId, t(updated.user.lang).status[status](id));
    }
  }
  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    if (!cfg.paymentStatuses.includes(paymentStatus)) return res.status(400).json({ error: 'paymentStatus' });
    if (paymentStatus === 'paid' || paymentStatus === 'rejected') updated = await payment.decide(id, paymentStatus === 'paid');
    else updated = await prisma.order.update({ where: { id }, data: { paymentStatus }, include: { user: true } });
  }
  res.json(updated);
}

async function deleteOrder(req, res) {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: 'Topilmadi' });
  await prisma.$transaction(async (tx) => {
    if (order.status !== 'cancelled' && !order.stockReturned) await returnStock(tx, order.items);
    await tx.order.delete({ where: { id } });
  });
  res.json({ ok: true });
}

// Hammasini tozalash — raqamlash #1 dan boshlanadi
async function clearOrders(req, res) {
  if ((req.body?.confirm || '') !== 'TOZALASH') return res.status(400).json({ error: '"TOZALASH" deb yozing' });
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Order" RESTART IDENTITY');
  res.json({ ok: true });
}

// ——— Mahsulotlar ———
async function listProducts(_req, res) {
  res.json(await prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }] }));
}

function validateProduct(data) {
  if (!data.article) return 'Artikul kiriting';
  if (!data.name) return 'Nomini kiriting';
  if (!cfg.categories.some((c) => c.key === data.category)) return 'Kategoriyani tanlang';
  if (data.tag && !cfg.tags.some((x) => x.key === data.tag)) data.tag = null;
  if (!data.images.length) return 'Kamida bitta rasm yuklang';
  return null;
}

async function createProduct(req, res) {
  const data = Product.sanitizeInput(req.body);
  const err = validateProduct(data);
  if (err) return res.status(400).json({ error: err });
  try {
    res.status(201).json(await prisma.product.create({ data }));
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Bu artikul band' });
    throw e;
  }
}

async function updateProduct(req, res) {
  const data = Product.sanitizeInput(req.body);
  const err = validateProduct(data);
  if (err) return res.status(400).json({ error: err });
  try {
    res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data }));
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Bu artikul band' });
    if (e.code === 'P2025') return res.status(404).json({ error: 'Topilmadi' });
    throw e;
  }
}

// Tez o'zgartirish: faol/nofaol, ombor, narx
async function patchProduct(req, res) {
  const b = req.body || {};
  const data = {};
  if (typeof b.isActive === 'boolean') data.isActive = b.isActive;
  if (typeof b.isFeatured === 'boolean') data.isFeatured = b.isFeatured;
  if ('stock' in b) data.stock = b.stock === null || b.stock === '' ? null : Math.max(0, parseInt(b.stock, 10) || 0);
  for (const k of Object.values(Product.PRICE_FIELD).flatMap(Object.values)) {
    if (k in b) data[k] = Math.max(0, parseInt(b[k], 10) || 0);
  }
  res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data }));
}

async function deleteProduct(req, res) {
  await prisma.product.delete({ where: { id: Number(req.params.id) } }).catch(() => null);
  res.json({ ok: true });
}

async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Rasm tanlang' });
  const folder = ['products', 'stories', 'broadcast', 'categories'].includes(req.body.folder) ? req.body.folder : 'products';
  res.json({ path: await saveImage(req.file.buffer, folder) });
}

// ——— Storylar ———
async function listStories(_req, res) {
  res.json(await prisma.story.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }] }));
}
async function createStory(req, res) {
  const data = Story.sanitizeInput(req.body);
  if (!data.title || !data.image) return res.status(400).json({ error: 'Sarlavha va rasm kerak' });
  res.status(201).json(await prisma.story.create({ data }));
}
async function updateStory(req, res) {
  const data = Story.sanitizeInput(req.body);
  if (!data.title || !data.image) return res.status(400).json({ error: 'Sarlavha va rasm kerak' });
  res.json(await prisma.story.update({ where: { id: Number(req.params.id) }, data }));
}
async function deleteStory(req, res) {
  await prisma.story.delete({ where: { id: Number(req.params.id) } }).catch(() => null);
  res.json({ ok: true });
}

// ——— Mijozlar ———
async function listUsers(req, res) {
  const q = String(req.query.q || '').trim();
  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      }
    : {};
  const rows = await prisma.user.findMany({
    where,
    orderBy: { id: 'desc' },
    take: 500,
    include: { _count: { select: { orders: true } } },
  });
  res.json(rows);
}

async function setUserAdmin(req, res) {
  const u = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { isAdmin: !!req.body.isAdmin } });
  if (u.isAdmin) bot.setAdminMenu(u.telegramId);
  res.json(u);
}

// ——— Rassilka ———
async function startBroadcast(req, res) {
  const text = String(req.body?.text || '').trim().slice(0, 4000);
  const image = typeof req.body?.image === 'string' && req.body.image.startsWith('/uploads/') ? req.body.image : null;
  if (!text && !image) return res.status(400).json({ error: 'Matn yoki rasm kerak' });
  try {
    res.json(await broadcast.start({ text, image, test: !!req.body?.test }));
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
}
function broadcastStatus(_req, res) {
  res.json(broadcast.status());
}

// ——— Sozlamalar ———
async function getSettings(_req, res) {
  res.json(await Setting.all());
}
async function saveSettings(req, res) {
  res.json(await Setting.setMany(req.body));
}

function meta(_req, res) {
  res.json({
    categories: cfg.categories,
    tags: cfg.tags,
    markets: cfg.markets,
    modes: cfg.modes,
    orderStatuses: cfg.orderStatuses,
    paymentStatuses: cfg.paymentStatuses,
    company: cfg.company,
  });
}

module.exports = {
  login,
  tgLogin,
  stats,
  listOrders,
  updateOrder,
  deleteOrder,
  clearOrders,
  listProducts,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
  uploadImage,
  listStories,
  createStory,
  updateStory,
  deleteStory,
  listUsers,
  setUserAdmin,
  startBroadcast,
  broadcastStatus,
  getSettings,
  saveSettings,
  meta,
};
