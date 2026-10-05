// Admin paneldan o'zgaradigan sozlamalar (kalit/qiymat), 30 soniya keshlanadi
const prisma = require('../database/connection');
const cfg = require('../config/default');

// Koreya kalitlari eski nomida qoldi (bazadagi qiymatlar saqlansin), O'zbekistonniki — ...Uz
const DEFAULTS = {
  cardNumber: cfg.payment.card.number,
  cardHolder: cfg.payment.card.holder,
  bankName: cfg.payment.card.bank,
  deliveryFee: '0', // ₩, 0 = bepul
  freeDeliveryFrom: '0', // shu summadan boshlab bepul (0 = chegara yo'q)
  cardNumberUz: '',
  cardHolderUz: '',
  bankNameUz: '',
  deliveryFeeUz: '0', // so'm
  freeDeliveryFromUz: '0',
  // Optom: bitta mahsulotdan shuncha dona olinsa — optom narxdan chegirma (%), 0 = chegirma yo'q (namuna qiymatlar)
  wholesaleDiscount3: '5',
  wholesaleDiscount5: '7',
  wholesaleDiscount10: '10',
  // Cashback: to'langan summadan foiz (0 = o'chiq), shu summadan boshlab beriladi (namuna qiymatlar)
  cashbackPercent: '3',
  cashbackMinOrder: '30000', // ₩
  cashbackPercentUz: '3',
  cashbackMinOrderUz: '100000', // so'm
  // Birinchi xarid chegirmasi (faqat dona bo'limi, telefon raqami bo'yicha bir marta), 0% = o'chiq
  firstOrderPercent: '10',
  firstOrderMinOrder: '50000', // ₩
  firstOrderPercentUz: '10',
  firstOrderMinOrderUz: '250000', // so'm
  shopNote: '', // Mini App'da ko'rinadigan qisqa e'lon (ixtiyoriy)
  categoryCovers: '{}', // JSON: { [kategoriya kaliti]: { image, frame: {z,x,y} } }
};

// Kategoriya muqovalari: faqat mavjud kategoriyalar, rasm yo'li va to'g'ri joylashuv saqlanadi
const num = (v, min, max, def) => (Number.isFinite(+v) ? Math.max(min, Math.min(max, +v)) : def);
function cleanCovers(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  const out = {};
  for (const c of cfg.categories) {
    const v = obj?.[c.key];
    if (!v || typeof v.image !== 'string' || !v.image || v.image.length > 500) continue;
    const f = v.frame || {};
    out[c.key] = { image: v.image, frame: { z: num(f.z, 1, 4, 1), x: num(f.x, 0, 100, 50), y: num(f.y, 0, 100, 50) } };
  }
  return JSON.stringify(out);
}

function covers(s) {
  try {
    return JSON.parse(s.categoryCovers || '{}') || {};
  } catch {
    return {};
  }
}

let cache = null;
let cacheAt = 0;

async function all() {
  if (cache && Date.now() - cacheAt < 30_000) return cache;
  const rows = await prisma.setting.findMany();
  const out = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  cache = out;
  cacheAt = Date.now();
  return out;
}

async function setMany(obj) {
  const keys = Object.keys(DEFAULTS);
  for (const [key, raw] of Object.entries(obj || {})) {
    if (!keys.includes(key)) continue;
    const value = key === 'categoryCovers' ? cleanCovers(raw) : String(raw ?? '').slice(0, 2000);
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  cache = null;
  return all();
}

const suffix = (market) => (market === 'uz' ? 'Uz' : '');

// Davlatga mos karta: market = 'kr' | 'uz'
async function payment(market) {
  const s = await all();
  const x = suffix(market);
  const card = {
    number: (s['cardNumber' + x] || '').trim(),
    holder: (s['cardHolder' + x] || '').trim(),
    bank: (s['bankName' + x] || '').trim(),
  };
  return { card, cardEnabled: !!card.number };
}

async function delivery(market) {
  const s = await all();
  const x = suffix(market);
  return {
    fee: Math.max(0, parseInt(s['deliveryFee' + x], 10) || 0),
    freeFrom: Math.max(0, parseInt(s['freeDeliveryFrom' + x], 10) || 0),
  };
}

async function cashback(market) {
  const s = await all();
  const x = suffix(market);
  return {
    percent: Math.max(0, Math.min(50, parseFloat(s['cashbackPercent' + x]) || 0)),
    minOrder: Math.max(0, parseInt(s['cashbackMinOrder' + x], 10) || 0),
  };
}

async function firstOrder(market) {
  const s = await all();
  const x = suffix(market);
  return {
    percent: Math.max(0, Math.min(50, parseFloat(s['firstOrderPercent' + x]) || 0)),
    minOrder: Math.max(0, parseInt(s['firstOrderMinOrder' + x], 10) || 0),
  };
}

// Optom chegirma bosqichlari, kattasidan kichigiga: [{ min: 10, pct }, { min: 5, pct }, { min: 3, pct }]
const TIER_MINS = [10, 5, 3];
async function wholesaleTiers() {
  const s = await all();
  return TIER_MINS.map((min) => ({ min, pct: Math.max(0, Math.min(90, parseFloat(s['wholesaleDiscount' + min]) || 0)) })).filter(
    (x) => x.pct > 0
  );
}

module.exports = { all, setMany, payment, delivery, cashback, firstOrder, wholesaleTiers, covers, DEFAULTS };
