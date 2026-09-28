// Bot matnlari (uz/ru) va adminga xabar shablonlari
const cfg = require('../config/default');

// Mijoz yozgan matn HTML xabarni buzmasligi uchun
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} ${cfg.currency.symbol}`;

const regionName = (key, lang = 'uz') => {
  const r = cfg.regions.find((x) => x.key === key);
  return r ? r[lang] || r.uz : key;
};

const T = {
  uz: {
    welcome: (name) =>
      `Assalomu alaykum${name ? ', <b>' + esc(name) + '</b>' : ''}! 🤍\n\n` +
      `<b>IPPO by Fotima Zuhra</b> — Koreyadan original kosmetika, jenshen, kollagen va vitaminlar.\n\n` +
      `🛍 Do‘konni ochib, mahsulot tanlang — buyurtmangiz Koreya bo‘ylab yetkaziladi.\n` +
      `💳 To‘lov: naqd yoki kartaga o‘tkazma.`,
    openShop: '🛍 Do‘konni ochish',
    adminPanel: '🛠 Admin panel',
    menuShop: 'Do‘kon',
    menuAdmin: 'Admin',
    sendPhone: '📱 Raqamni yuborish',
    askPhone: 'Buyurtmalar bo‘yicha bog‘lanishimiz uchun telefon raqamingizni yuboring 👇',
    phoneSaved: '✅ Raqamingiz saqlandi.',
    langChosen: '🇺🇿 Til: O‘zbekcha',
    notHttps: '⚙️ Do‘kon hozir sozlanmoqda (lokal rejim). Tez orada ochiladi.',
    idMsg: (id) => `🆔 Chat ID: <code>${id}</code>`,
    adminOk: '✅ Siz endi adminsiz. Buyurtmalar shu yerga keladi.\n🛠 Pastdagi "Admin" tugmasi — admin panel.',
    adminBad: '❌ Parol noto‘g‘ri.',
    adminTooMany: '⏳ Urinishlar ko‘p. 1 soatdan keyin qayta urinib ko‘ring.',
    adminUsage: 'Foydalanish: <code>/admin PAROL</code>',
    fallback: 'Do‘konni ochish uchun pastdagi tugmani bosing 👇',
    orderCreated: (o) =>
      `✅ <b>Buyurtmangiz qabul qilindi — #${o.id}</b>\n\n` +
      `Summa: <b>${money(o.total)}</b>\n` +
      `To‘lov: ${o.paymentMethod === 'card' ? 'kartaga o‘tkazma' : 'naqd pul'}\n\n` +
      `Tez orada siz bilan bog‘lanamiz. Rahmat! 🤍`,
    payCard: (o, card) =>
      `💳 <b>To‘lov uchun karta</b>\n\n` +
      `<code>${esc(card.number)}</code>\n` +
      (card.bank ? `Bank: ${esc(card.bank)}\n` : '') +
      (card.holder ? `Egasi: ${esc(card.holder)}\n` : '') +
      `Summa: <b>${money(o.total)}</b>\n\n` +
      `📸 O‘tkazmadan so‘ng chek rasmini shu yerga yuboring.`,
    receiptOk: (id) => `🧾 Chek qabul qilindi (buyurtma #${id}). Tekshirib, sizga xabar beramiz.`,
    noOrderForReceipt: 'Chek biriktiriladigan to‘lanmagan buyurtma topilmadi. Buyurtmani do‘kon orqali bering 👇',
    payApproved: (id) => `✅ Buyurtma #${id} bo‘yicha to‘lovingiz tasdiqlandi. Rahmat!`,
    payRejected: (id) =>
      `❌ Buyurtma #${id} bo‘yicha chek tasdiqlanmadi.\nIltimos, to‘g‘ri chekni qayta yuboring yoki @${cfg.company.telegram} ga yozing.`,
    status: {
      confirmed: (id) => `✅ Buyurtmangiz #${id} tasdiqlandi. Tayyorlanmoqda!`,
      shipped: (id) => `🚚 Buyurtmangiz #${id} yo‘lga chiqdi.`,
      delivered: (id) => `🎁 Buyurtmangiz #${id} yetkazildi. Xaridingiz uchun rahmat! 🤍`,
      cancelled: (id) => `❌ Buyurtmangiz #${id} bekor qilindi. Savollar bo‘lsa: @${cfg.company.telegram}`,
    },
  },
  ru: {
    welcome: (name) =>
      `Здравствуйте${name ? ', <b>' + esc(name) + '</b>' : ''}! 🤍\n\n` +
      `<b>IPPO by Fotima Zuhra</b> — оригинальная косметика, женьшень, коллаген и витамины из Кореи.\n\n` +
      `🛍 Откройте магазин и выберите товар — доставим по всей Корее.\n` +
      `💳 Оплата: наличными или переводом на карту.`,
    openShop: '🛍 Открыть магазин',
    adminPanel: '🛠 Админ-панель',
    menuShop: 'Магазин',
    menuAdmin: 'Админ',
    sendPhone: '📱 Отправить номер',
    askPhone: 'Отправьте номер телефона, чтобы мы могли связаться с вами по заказу 👇',
    phoneSaved: '✅ Номер сохранён.',
    langChosen: '🇷🇺 Язык: Русский',
    notHttps: '⚙️ Магазин сейчас настраивается (локальный режим). Скоро откроется.',
    idMsg: (id) => `🆔 Chat ID: <code>${id}</code>`,
    adminOk: '✅ Теперь вы администратор. Заказы будут приходить сюда.\n🛠 Кнопка «Админ» внизу — админ-панель.',
    adminBad: '❌ Неверный пароль.',
    adminTooMany: '⏳ Слишком много попыток. Попробуйте через час.',
    adminUsage: 'Использование: <code>/admin ПАРОЛЬ</code>',
    fallback: 'Нажмите кнопку ниже, чтобы открыть магазин 👇',
    orderCreated: (o) =>
      `✅ <b>Заказ принят — #${o.id}</b>\n\n` +
      `Сумма: <b>${money(o.total)}</b>\n` +
      `Оплата: ${o.paymentMethod === 'card' ? 'перевод на карту' : 'наличными'}\n\n` +
      `Скоро свяжемся с вами. Спасибо! 🤍`,
    payCard: (o, card) =>
      `💳 <b>Карта для оплаты</b>\n\n` +
      `<code>${esc(card.number)}</code>\n` +
      (card.bank ? `Банк: ${esc(card.bank)}\n` : '') +
      (card.holder ? `Владелец: ${esc(card.holder)}\n` : '') +
      `Сумма: <b>${money(o.total)}</b>\n\n` +
      `📸 После перевода отправьте сюда фото чека.`,
    receiptOk: (id) => `🧾 Чек получен (заказ #${id}). Проверим и сообщим вам.`,
    noOrderForReceipt: 'Не найден неоплаченный заказ для этого чека. Оформите заказ через магазин 👇',
    payApproved: (id) => `✅ Оплата по заказу #${id} подтверждена. Спасибо!`,
    payRejected: (id) =>
      `❌ Чек по заказу #${id} не подтверждён.\nПожалуйста, отправьте правильный чек или напишите @${cfg.company.telegram}.`,
    status: {
      confirmed: (id) => `✅ Ваш заказ #${id} подтверждён и готовится!`,
      shipped: (id) => `🚚 Ваш заказ #${id} отправлен.`,
      delivered: (id) => `🎁 Ваш заказ #${id} доставлен. Спасибо за покупку! 🤍`,
      cancelled: (id) => `❌ Ваш заказ #${id} отменён. Вопросы: @${cfg.company.telegram}`,
    },
  },
};

const t = (lang) => T[lang === 'ru' ? 'ru' : 'uz'];

// ——— Adminga xabarlar (o'zbekcha) ———
const PAY_STATUS = {
  unpaid: '⏳ hali qilinmadi',
  pending: '🧾 chek yuborildi — tekshiring',
  paid: '✅ tasdiqlangan',
  rejected: '❌ rad etilgan',
};
const ORDER_STATUS = {
  new: '🆕 Yangi',
  confirmed: '✅ Tasdiqlangan',
  shipped: '🚚 Yo‘lda',
  delivered: '🎁 Yetkazilgan',
  cancelled: '❌ Bekor qilingan',
};

function customerLine(o) {
  const tid = o.user?.telegramId;
  if (tid && /^\d+$/.test(tid)) {
    const uname = o.user.username ? ` (@${esc(o.user.username)})` : '';
    return `💬 <a href="tg://user?id=${tid}">Telegramda yozish</a>${uname}`;
  }
  return '🌐 Saytdan (Telegramsiz) — telefon orqali bog‘laning';
}

function adminOrderText(o, { title } = {}) {
  const items = (o.items || [])
    .map((it, i) => {
      const variant = it.variant ? ` · 🎨 ${esc(it.variant)}` : '';
      return `${i + 1}. <b>${esc(it.name)}</b> [${esc(it.article)}]${variant}\n    ${it.qty} × ${money(it.unitPrice)} = <b>${money(it.lineTotal)}</b>`;
    })
    .join('\n');
  const delivery = o.deliveryFee ? `\n🚚 Yetkazish: ${money(o.deliveryFee)}` : '';
  return (
    `${title || '🆕 <b>Yangi buyurtma #' + o.id + '</b>'}\n\n` +
    `${items}\n\n` +
    `📦 Jami: ${o.totalQty} dona${delivery}\n` +
    `💰 <b>Summa: ${money(o.total)}</b>\n` +
    `💳 To‘lov: ${o.paymentMethod === 'card' ? 'Kartaga o‘tkazma' : 'Naqd pul'}\n` +
    `📌 To‘lov holati: ${PAY_STATUS[o.paymentStatus] || o.paymentStatus}\n\n` +
    `👤 ${esc(o.customerName)}\n` +
    `📞 ${esc(o.phone)}\n` +
    `📍 ${esc(regionName(o.region))}, ${esc(o.address)}\n` +
    (o.comment ? `📝 ${esc(o.comment)}\n` : '') +
    customerLine(o)
  );
}

module.exports = { t, esc, money, regionName, adminOrderText, PAY_STATUS, ORDER_STATUS };
