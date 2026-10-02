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

module.exports = { all, setMany, payment, delivery, DEFAULTS };
