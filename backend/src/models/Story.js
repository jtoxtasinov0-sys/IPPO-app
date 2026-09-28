const prisma = require('../database/connection');

function listActive() {
  return prisma.story.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    take: 30,
  });
}

function sanitizeInput(b = {}) {
  const pid = parseInt(b.productId, 10);
  return {
    title: String(b.title || '').trim().slice(0, 120),
    titleRu: String(b.titleRu || '').trim().slice(0, 120) || null,
    image: String(b.image || '').trim(),
    productId: Number.isFinite(pid) ? pid : null,
    isActive: b.isActive !== false,
    sortOrder: parseInt(b.sortOrder, 10) || 0,
  };
}

module.exports = { listActive, sanitizeInput };
