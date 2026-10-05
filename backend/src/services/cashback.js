// Cashback: to'langan buyurtmadan foiz balansga qo'shiladi, keyingi xaridda summadan ayiriladi.
// Har davlatning balansi alohida (₩ va so'm). Hammasi tranzaksiya ichida (tx).
const Setting = require('../models/Setting');

const field = (market) => (market === 'uz' ? 'cashbackUz' : 'cashbackKr');
const balanceOf = (user, market) => (user ? user[field(market)] || 0 : 0);

// Balansdan ayirish (manfiyga tushmaydi) yoki qo'shish
async function change(tx, userId, market, amount) {
  if (!userId || !amount) return;
  const f = field(market);
  const u = await tx.user.findUnique({ where: { id: userId }, select: { [f]: true } });
  if (!u) return;
  await tx.user.update({ where: { id: userId }, data: { [f]: Math.max(0, (u[f] || 0) + amount) } });
}

// Buyurtmadan beriladigan cashback: mahsulotlar uchun to'langan summa (yetkazishsiz) chegaradan oshsa — foiz
async function earnedFor(order) {
  const c = await Setting.cashback(order.market);
  const paid = Math.max(0, order.subtotal - (order.firstOrderDiscount || 0) - (order.cashbackUsed || 0));
  if (!c.percent || paid < c.minOrder || paid <= 0) return 0;
  return Math.floor((paid * c.percent) / 100);
}

// To'lov tasdiqlandi — cashback beriladi (bir marta)
async function credit(tx, order) {
  if (order.cashbackEarned > 0 || order.status === 'cancelled' || !order.userId) return order;
  const amount = await earnedFor(order);
  if (!amount) return order;
  await change(tx, order.userId, order.market, amount);
  return tx.order.update({ where: { id: order.id }, data: { cashbackEarned: amount }, include: { user: true } });
}

// To'lov rad etildi / buyurtma bekor qilindi — berilgan cashback qaytarib olinadi
async function revoke(tx, order) {
  if (!(order.cashbackEarned > 0)) return order;
  await change(tx, order.userId, order.market, -order.cashbackEarned);
  return tx.order.update({ where: { id: order.id }, data: { cashbackEarned: 0 }, include: { user: true } });
}

module.exports = { field, balanceOf, change, earnedFor, credit, revoke };
