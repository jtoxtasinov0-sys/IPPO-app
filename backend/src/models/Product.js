const prisma = require('../database/connection');

// Mahsulot turiga (variant) mos rasm; topilmasa — birinchi rasm
function imageForVariant(p, variant) {
  const images = p.images || [];
  const map = Array.isArray(p.imageVariants) ? p.imageVariants : [];
  if (variant) {
    const i = map.findIndex((v) => v === variant);
    if (i >= 0 && images[i]) return images[i];
  }
  return images[0] || null;
}

// Davlat va savdo turiga mos narx (0 = narx kiritilmagan)
const PRICE_FIELD = {
  kr: { retail: 'price', wholesale: 'priceOptom' },
  uz: { retail: 'priceUz', wholesale: 'priceUzOptom' },
};
function priceFor(p, market, mode) {
  const field = (PRICE_FIELD[market] || PRICE_FIELD.kr)[mode] || 'price';
  return p[field] || 0;
}

// Aksiya ham har davlat va savdo turi uchun alohida yoqiladi
const PROMO_FIELD = {
  kr: { retail: 'promo', wholesale: 'promoOptom' },
  uz: { retail: 'promoUz', wholesale: 'promoUzOptom' },
};
const PROMO_FIELDS = Object.values(PROMO_FIELD).flatMap(Object.values);

// Aksiya "N+M" (1+1, 2+1, 4+2 ...): {key, buy, free} yoki null
function parsePromo(s) {
  const m = String(s ?? '').match(/^\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*$/);
  if (!m) return null;
  const buy = +m[1];
  const free = +m[2];
  if (buy < 1 || free < 1 || buy > 20 || free > 20) return null;
  return { key: `${buy}+${free}`, buy, free };
}

// Shuncha donadan nechtasi bepul: har to'liq N+M to'plamda M ta, chala to'plamda N dan oshgani
function promoFree(promo, qty) {
  if (!promo) return 0;
  const group = promo.buy + promo.free;
  return Math.floor(qty / group) * promo.free + Math.max(0, (qty % group) - promo.buy);
}

// Davlat va savdo turiga mos aksiya: {key, buy, free} yoki null
function promoFor(p, market, mode) {
  return parsePromo(p[(PROMO_FIELD[market] || PROMO_FIELD.kr)[mode] || 'promo']);
}

// Mijozga ko'rinadigan maydonlar
function toPublic(p) {
  return {
    id: p.id,
    article: p.article,
    name: p.name,
    nameRu: p.nameRu,
    brand: p.brand,
    description: p.description,
    descriptionRu: p.descriptionRu,
    category: p.category,
    tag: p.tag,
    volume: p.volume,
    images: p.images,
    imageFrames: p.imageFrames,
    imageVariants: p.imageVariants,
    variants: p.variants,
    price: p.price,
    priceOptom: p.priceOptom,
    priceUz: p.priceUz,
    priceUzOptom: p.priceUzOptom,
    oldPrice: p.oldPrice,
    promo: p.promo,
    promoOptom: p.promoOptom,
    promoUz: p.promoUz,
    promoUzOptom: p.promoUzOptom,
    stock: p.stock,
    isFeatured: p.isFeatured,
  };
}

function listActive() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
  });
}

// Admin formasidan kelgan ma'lumotni tozalash
function sanitizeInput(b = {}) {
  const str = (v, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);
  const int = (v) => {
    if (v === '' || v == null) return null;
    const n = parseInt(String(v).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };
  const images = Array.isArray(b.images) ? b.images.filter((s) => typeof s === 'string').slice(0, 8) : [];
  const variants = Array.isArray(b.variants)
    ? [...new Set(b.variants.map((v) => String(v).trim().slice(0, 40)).filter(Boolean))].slice(0, 12)
    : [];
  const frames = Array.isArray(b.imageFrames)
    ? images.map((_, i) => {
        const f = b.imageFrames[i] || {};
        const clamp = (n, a, z, d) => (Number.isFinite(+n) ? Math.min(z, Math.max(a, +n)) : d);
        return { z: clamp(f.z, 1, 3, 1), x: clamp(f.x, 0, 100, 50), y: clamp(f.y, 0, 100, 50) };
      })
    : null;
  const imageVariants = Array.isArray(b.imageVariants)
    ? images.map((_, i) => (variants.includes(b.imageVariants[i]) ? b.imageVariants[i] : null))
    : null;

  return {
    article: str(b.article, 40),
    name: str(b.name, 160),
    nameRu: str(b.nameRu, 160),
    brand: str(b.brand, 80),
    description: str(b.description, 5000),
    descriptionRu: str(b.descriptionRu, 5000),
    category: str(b.category, 40),
    tag: str(b.tag, 20),
    volume: str(b.volume, 40),
    images,
    imageFrames: frames,
    imageVariants,
    variants,
    price: int(b.price) ?? 0,
    priceOptom: int(b.priceOptom) ?? 0,
    priceUz: int(b.priceUz) ?? 0,
    priceUzOptom: int(b.priceUzOptom) ?? 0,
    oldPrice: int(b.oldPrice),
    ...Object.fromEntries(PROMO_FIELDS.map((k) => [k, parsePromo(b[k])?.key || null])),
    stock: b.stock === '' || b.stock == null ? null : int(b.stock),
    isActive: b.isActive !== false,
    isFeatured: !!b.isFeatured,
    sortOrder: int(b.sortOrder) ?? 0,
  };
}

module.exports = { PRICE_FIELD, PROMO_FIELDS, priceFor, parsePromo, promoFree, promoFor, imageForVariant, toPublic, listActive, sanitizeInput };
