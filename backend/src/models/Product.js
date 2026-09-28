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
    oldPrice: p.oldPrice,
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
    oldPrice: int(b.oldPrice),
    stock: b.stock === '' || b.stock == null ? null : int(b.stock),
    isActive: b.isActive !== false,
    isFeatured: !!b.isFeatured,
    sortOrder: int(b.sortOrder) ?? 0,
  };
}

module.exports = { imageForVariant, toPublic, listActive, sanitizeInput };
