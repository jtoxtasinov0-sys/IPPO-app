// Telegram bot buyruqlari va xabarlarini qayta ishlash
const path = require('path');
const cfg = require('../config/default');
const prisma = require('../database/connection');
const bot = require('../core/bot');
const User = require('../models/User');
const payment = require('../services/payment');
const { saveImage } = require('../utils/upload');
const { t, esc } = require('../utils/i18n');

const WELCOME_IMAGE = path.join(__dirname, '../../assets/welcome.jpg');
let welcomeFileId = null;

// /admin parol urinishlari: 1 soatda 5 ta xato
const attempts = new Map();

function shopKeyboard(L, isAdmin) {
  const rows = [];
  if (bot.isHttps(cfg.miniappUrl)) rows.push([{ text: L.openShop, web_app: { url: cfg.miniappUrl } }]);
  if (isAdmin && bot.isHttps(cfg.adminUrl)) rows.push([{ text: L.adminPanel, web_app: { url: cfg.adminUrl } }]);
  rows.push([
    { text: '🇺🇿 O‘zbekcha', callback_data: 'lang:uz' },
    { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
  ]);
  return { inline_keyboard: rows };
}

async function sendWelcome(user) {
  const L = t(user.lang);
  const isAdmin = await User.isAdminTelegramId(user.telegramId);
  let text = L.welcome(user.firstName);
  if (!bot.isHttps(cfg.miniappUrl)) text += `\n\n${L.notHttps}`;
  const extra = { reply_markup: shopKeyboard(L, isAdmin) };

  const fs = require('fs');
  let msg = null;
  if (welcomeFileId) msg = await bot.sendPhoto(user.telegramId, welcomeFileId, text, extra);
  else if (fs.existsSync(WELCOME_IMAGE)) {
    msg = await bot.sendPhoto(user.telegramId, fs.readFileSync(WELCOME_IMAGE), text, extra);
    welcomeFileId = bot.lastFileId(msg) || null;
  }
  if (!msg) await bot.safeSend(user.telegramId, text, extra);

  if (!user.phone) {
    await bot.safeSend(user.telegramId, L.askPhone, {
      reply_markup: {
        keyboard: [[{ text: L.sendPhone, request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
  if (isAdmin) bot.setAdminMenu(user.telegramId);
}

async function onAdminCommand(msg, user) {
  const L = t(user.lang);
  const chatId = msg.chat.id;
  const pass = (msg.text || '').split(/\s+/).slice(1).join(' ').trim();
  // Parolli xabarni o'chiramiz
  bot.call('deleteMessage', { chat_id: chatId, message_id: msg.message_id }).catch(() => {});
  if (!pass) return bot.safeSend(chatId, L.adminUsage);

  const now = Date.now();
  const rec = (attempts.get(user.telegramId) || []).filter((ts) => now - ts < 3600_000);
  if (rec.length >= 5) return bot.safeSend(chatId, L.adminTooMany);

  if (pass !== cfg.adminPassword) {
    rec.push(now);
    attempts.set(user.telegramId, rec);
    return bot.safeSend(chatId, L.adminBad);
  }
  attempts.delete(user.telegramId);
  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  await bot.setAdminMenu(chatId);
  await bot.safeSend(chatId, L.adminOk, {
    reply_markup: bot.isHttps(cfg.adminUrl)
      ? { inline_keyboard: [[{ text: L.adminPanel, web_app: { url: cfg.adminUrl } }]] }
      : undefined,
  });
}

// Mijoz chek rasmini botga yuborsa — oxirgi to'lanmagan karta buyurtmasiga biriktiriladi
async function onReceiptPhoto(msg, user) {
  const L = t(user.lang);
  const order = await prisma.order.findFirst({
    where: {
      userId: user.id,
      paymentMethod: 'card',
      paymentStatus: { in: ['unpaid', 'rejected'] },
      status: { not: 'cancelled' },
    },
    orderBy: { id: 'desc' },
  });
  if (!order) {
    return bot.safeSend(msg.chat.id, L.noOrderForReceipt, { reply_markup: shopKeyboard(L, false) });
  }
  const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.document.file_id;
  const buffer = await bot.downloadFile(fileId);
  const url = await saveImage(buffer, 'receipts', { maxSize: 2000 });
  await payment.attachReceipt(order.id, url);
  await bot.safeSend(msg.chat.id, L.receiptOk(order.id));
}

async function onMessage(msg) {
  const chat = msg.chat;
  const text = (msg.text || '').trim();
  const cmd = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : '';

  // Guruhlarda faqat /id ishlaydi (ADMIN_CHAT_IDS ga yozish uchun)
  if (chat.type !== 'private') {
    if (cmd === '/id') await bot.safeSend(chat.id, t('uz').idMsg(chat.id));
    return;
  }
  if (!msg.from || msg.from.is_bot) return;

  const user = await User.upsertFromTelegram(msg.from);
  const L = t(user.lang);

  if (cmd === '/start' || cmd === '/help') return sendWelcome(user);
  if (cmd === '/id') return bot.safeSend(chat.id, L.idMsg(chat.id));
  if (cmd === '/admin') return onAdminCommand(msg, user);

  if (msg.contact) {
    if (String(msg.contact.user_id) === user.telegramId) {
      const phone = '+' + String(msg.contact.phone_number).replace(/\D/g, '');
      await prisma.user.update({ where: { id: user.id }, data: { phone } });
      return bot.safeSend(chat.id, L.phoneSaved, { reply_markup: { remove_keyboard: true } });
    }
    return;
  }

  const isImageDoc = msg.document && /^image\//.test(msg.document.mime_type || '');
  if (msg.photo || isImageDoc) return onReceiptPhoto(msg, user);

  return bot.safeSend(chat.id, L.fallback, { reply_markup: shopKeyboard(L, false) });
}

async function onCallback(q) {
  const data = q.data || '';
  const answer = (text, alert = false) =>
    bot.call('answerCallbackQuery', { callback_query_id: q.id, text, show_alert: alert }).catch(() => {});

  if (data.startsWith('lang:')) {
    const lang = data.slice(5) === 'ru' ? 'ru' : 'uz';
    const user = await User.upsertFromTelegram(q.from);
    await prisma.user.update({ where: { id: user.id }, data: { lang } });
    await answer(t(lang).langChosen);
    return sendWelcome({ ...user, lang });
  }

  if (data.startsWith('pay:')) {
    const [, action, idStr] = data.split(':');
    if (!(await User.isAdminTelegramId(q.from.id))) return answer('Faqat adminlar uchun', true);
    const id = parseInt(idStr, 10);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return answer('Buyurtma topilmadi', true);
    const ok = action === 'ok';
    await payment.decide(id, ok);
    await answer(ok ? 'Tasdiqlandi ✅' : 'Rad etildi ❌');

    // Xabar ostidagi tugmalarni olib, natijani yozamiz
    const who = q.from.username ? '@' + q.from.username : esc(q.from.first_name || 'admin');
    const note = `\n\n${ok ? '✅ To‘lov tasdiqlandi' : '❌ To‘lov rad etildi'} — ${who}`;
    const m = q.message;
    if (m) {
      const params = { chat_id: m.chat.id, message_id: m.message_id, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } };
      // Asl matnni HTML siz qayta yozamiz (formatlash yo'qolmasin deb sodda qo'shimcha)
      if (m.caption !== undefined) {
        bot.call('editMessageCaption', { ...params, caption: esc(m.caption).slice(0, 1024 - note.length) + note }).catch(() => {});
      } else if (m.text !== undefined) {
        bot.call('editMessageText', { ...params, text: esc(m.text) + note }).catch(() => {});
      }
    }
    return;
  }

  return answer();
}

async function handleUpdate(update) {
  try {
    if (update.message) return await onMessage(update.message);
    if (update.callback_query) return await onCallback(update.callback_query);
  } catch (e) {
    console.error('[bot] xato:', e);
  }
}

module.exports = { handleUpdate };
