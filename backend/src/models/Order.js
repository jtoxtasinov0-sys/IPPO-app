const prisma = require('../database/connection');

function findWithUser(id) {
  return prisma.order.findUnique({ where: { id: Number(id) }, include: { user: true } });
}

// Mijozga qaytariladigan ko'rinish
function toPublic(o) {
  return {
    id: o.id,
    market: o.market,
    mode: o.mode,
    items: o.items,
    totalQty: o.totalQty,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    firstOrderDiscount: o.firstOrderDiscount || 0,
    cashbackUsed: o.cashbackUsed || 0,
    cashbackEarned: o.cashbackEarned || 0,
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
