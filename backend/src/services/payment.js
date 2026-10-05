// To'lov: karta ma'lumoti, chek biriktirish, Tasdiqlash / Rad etish
const prisma = require('../database/connection');
const Order = require('../models/Order');
const bot = require('../core/bot');
const cashback = require('./cashback');
const { t, adminOrderText } = require('../utils/i18n');

const payButtons = (orderId) => ({
  inline_keyboard: [
    [
      { text: '✅ Tasdiqlash', callback_data: `pay:ok:${orderId}` },
      { text: '❌ Rad etish', callback_data: `pay:no:${orderId}` },
    ],
  ],
});

// Chek keldi (Mini App'dan yoki botdan) — buyurtmaga yozib, adminlarga yuboradi
async function attachReceipt(orderId, receiptUrl) {
  await prisma.order.update({
    where: { id: orderId },
    data: { receiptUrl, receiptAt: new Date(), paymentStatus: 'pending' },
  });
  const order = await Order.findWithUser(orderId);
  const text = adminOrderText(order, { title: `🧾 <b>Chek keldi — buyurtma #${order.id}</b>` });
  bot.notifyAdmins(text, { images: [receiptUrl], extra: { reply_markup: payButtons(order.id) } }).catch((e) =>
    console.error('[payment] adminga chek yuborilmadi:', e.message)
  );
  return order;
}

// Admin qarori: to'lov tasdiqlandi / rad etildi — cashback beriladi yoki qaytariladi, mijozga xabar
async function decide(orderId, ok) {
  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: ok ? 'paid' : 'rejected' },
      include: { user: true },
    });
    return ok ? cashback.credit(tx, o) : cashback.revoke(tx, o);
  });
  if (order.user) {
    const L = t(order.user.lang);
    bot.safeSend(order.user.telegramId, ok ? L.payApproved(order.id) : L.payRejected(order.id)).then(() => {
      if (ok && order.cashbackEarned > 0) {
        const balance = cashback.balanceOf(order.user, order.market);
        bot.safeSend(order.user.telegramId, L.cashbackEarned(order, balance));
      }
    });
  }
  return order;
}

module.exports = { attachReceipt, decide, payButtons };
