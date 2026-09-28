const prisma = require('../database/connection');

function findWithUser(id) {
  return prisma.order.findUnique({ where: { id: Number(id) }, include: { user: true } });
}

// Mijozga qaytariladigan ko'rinish
function toPublic(o) {
  return {
    id: o.id,
    items: o.items,
    totalQty: o.totalQty,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    customerName: o.customerName,
    phone: o.phone,
    region: o.region,
    address: o.address,
    comment: o.comment,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    receiptUrl: o.receiptUrl,
    status: o.status,
    createdAt: o.createdAt,
  };
}

module.exports = { findWithUser, toPublic };
