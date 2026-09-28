// Admin paneldan o'zgaradigan sozlamalar (kalit/qiymat), 30 soniya keshlanadi
const prisma = require('../database/connection');
const cfg = require('../config/default');

const DEFAULTS = {
  cardNumber: cfg.payment.card.number,
  cardHolder: cfg.payment.card.holder,
  bankName: cfg.payment.card.bank,
  deliveryFee: '0', // ₩, 0 = bepul
  freeDeliveryFrom: '0', // shu summadan boshlab bepul (0 = chegara yo'q)
  shopNote: '', // Mini App'da ko'rinadigan qisqa e'lon (ixtiyoriy)
};

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
    const value = String(raw ?? '').slice(0, 2000);
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  cache = null;
  return all();
}

async function payment() {
  const s = await all();
  const card = {
    number: (s.cardNumber || '').trim(),
    holder: (s.cardHolder || '').trim(),
    bank: (s.bankName || '').trim(),
  };
  return { card, cardEnabled: !!card.number };
}

async function delivery() {
  const s = await all();
  return {
    fee: Math.max(0, parseInt(s.deliveryFee, 10) || 0),
    freeFrom: Math.max(0, parseInt(s.freeDeliveryFrom, 10) || 0),
  };
}

module.exports = { all, setMany, payment, delivery, DEFAULTS };
