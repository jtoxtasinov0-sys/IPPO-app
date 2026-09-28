// Telegram Bot API bilan ishlash: yuborish, rasmlar, webhook/polling, Menu tugmasi
const crypto = require('crypto');
const path = require('path');
const cfg = require('../config/default');
const prisma = require('../database/connection');
const { readUpload } = require('../utils/upload');

const API = `https://api.telegram.org/bot${cfg.botToken}`;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const webhookPath = `/tg/${sha(cfg.botToken || 'none').slice(0, 24)}`;
const webhookSecret = sha(`${cfg.botToken}:secret`).slice(0, 32);

const isHttps = (u) => /^https:\/\//.test(u || '');
const isChatId = (id) => /^-?\d+$/.test(String(id || ''));

async function call(method, params = {}) {
  if (!cfg.botToken) throw new Error('BOT_TOKEN yo‘q');
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return unwrap(method, res);
}

// Fayl bilan yuborish (multipart)
async function callForm(method, fields, files = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
    fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  for (const [k, f] of Object.entries(files)) {
    fd.append(k, new Blob([f.buffer], { type: f.mime || 'image/jpeg' }), f.filename || `${k}.jpg`);
  }
  const res = await fetch(`${API}/${method}`, { method: 'POST', body: fd });
  return unwrap(method, res);
}

async function unwrap(method, res) {
  const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!data.ok) {
    const err = new Error(`${method}: ${data.description}`);
    err.code = data.error_code;
    err.retryAfter = data.parameters?.retry_after;
    throw err;
  }
  return data.result;
}

// Xatoni yutadigan yuborish: web_... mijozlarga urinmaydi, 429 da bir marta kutadi
async function safe(chatId, fn) {
  if (!isChatId(chatId)) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (e.code === 429 && e.retryAfter && attempt === 0) {
        await new Promise((r) => setTimeout(r, (e.retryAfter + 1) * 1000));
        continue;
      }
      if (e.code === 403) {
        await prisma.user.updateMany({ where: { telegramId: String(chatId) }, data: { isBlocked: true } }).catch(() => {});
      }
      console.warn('[bot]', chatId, e.message);
      return null;
    }
  }
  return null;
}

const safeSend = (chatId, text, extra = {}) =>
  safe(chatId, () =>
    call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra })
  );

// Rasm: "/uploads/..." yo'li, tayyor file_id yoki Buffer
async function photoInput(src) {
  if (Buffer.isBuffer(src)) return { file: { buffer: src, filename: 'photo.jpg' } };
  if (typeof src === 'string' && src.startsWith('/uploads/')) {
    const buffer = await readUpload(src);
    return buffer ? { file: { buffer, filename: path.basename(src) } } : null;
  }
  if (typeof src === 'string' && src) return { id: src }; // file_id
  return null;
}

async function sendPhoto(chatId, src, caption, extra = {}) {
  const input = await photoInput(src);
  if (!input) return null;
  const fields = { chat_id: chatId, caption, parse_mode: 'HTML', ...extra };
  return safe(chatId, () =>
    input.id ? call('sendPhoto', { ...fields, photo: input.id }) : callForm('sendPhoto', fields, { photo: input.file })
  );
}

const lastFileId = (msg) => msg?.photo?.[msg.photo.length - 1]?.file_id;

/**
 * Rasm(lar) + matn bitta xabarda. Matn 1024 dan uzun bo'lsa — rasmlar, keyin matn.
 * cache — rasm bir marta yuklanadi, keyingi chatlarga file_id bilan boradi.
 */
async function sendPhotosWithText(chatId, images, text, extra = {}, cache = new Map()) {
  const list = images.slice(0, 10);
  const fits = text.length <= 1024;
  const src = (img) => cache.get(img) || img;

  if (!list.length) return safeSend(chatId, text, extra);

  if (list.length === 1) {
    const msg = await sendPhoto(chatId, src(list[0]), fits ? text : undefined, fits ? extra : {});
    if (msg && lastFileId(msg)) cache.set(list[0], lastFileId(msg));
    if (!msg) return safeSend(chatId, text, extra);
    if (!fits) return safeSend(chatId, text, extra);
    return msg;
  }

  // Albom
  const media = [];
  const files = {};
  for (let i = 0; i < list.length; i++) {
    const input = await photoInput(src(list[i]));
    if (!input) continue;
    const item = { type: 'photo' };
    if (input.id) item.media = input.id;
    else {
      item.media = `attach://f${i}`;
      files[`f${i}`] = input.file;
    }
    media.push({ item, key: list[i] });
  }
  if (!media.length) return safeSend(chatId, text, extra);
  // Albomda tugma bo'lmaydi — tugmali xabar bo'lsa matnni alohida yuboramiz
  const captionInAlbum = fits && !extra.reply_markup;
  if (captionInAlbum) Object.assign(media[0].item, { caption: text, parse_mode: 'HTML' });
  const msgs = await safe(chatId, () =>
    callForm('sendMediaGroup', { chat_id: chatId, media: media.map((m) => m.item) }, files)
  );
  if (Array.isArray(msgs)) msgs.forEach((m, i) => lastFileId(m) && media[i] && cache.set(media[i].key, lastFileId(m)));
  if (!msgs || !captionInAlbum) return safeSend(chatId, text, extra);
  return msgs;
}

// Adminlarga xabar (rasm bilan bo'lsa — bir marta yuklab, qolganlarga file_id)
async function notifyAdmins(text, { images = [], extra = {} } = {}) {
  const { adminChatIds } = require('../models/User');
  const ids = await adminChatIds();
  if (!ids.length) console.warn('[bot] Adminlar yo‘q: ADMIN_CHAT_IDS bo‘sh va hech kim /admin qilmagan');
  const cache = new Map();
  for (const id of ids) {
    await sendPhotosWithText(id, images, text, extra, cache);
  }
}

// Telegramdagi faylni yuklab olish (chek rasmi)
async function downloadFile(fileId) {
  const f = await call('getFile', { file_id: fileId });
  const res = await fetch(`https://api.telegram.org/file/bot${cfg.botToken}/${f.file_path}`);
  if (!res.ok) throw new Error('getFile download ' + res.status);
  return Buffer.from(await res.arrayBuffer());
}

// Pastki Menu tugmasi: mijozlarga do'kon, adminga admin panel
async function setDefaultMenu() {
  if (!isHttps(cfg.miniappUrl)) return;
  await call('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Do‘kon', web_app: { url: cfg.miniappUrl } },
  }).catch((e) => console.warn('[bot] menu:', e.message));
}

async function setAdminMenu(chatId) {
  if (!isHttps(cfg.adminUrl) || !isChatId(chatId)) return;
  await safe(chatId, () =>
    call('setChatMenuButton', {
      chat_id: chatId,
      menu_button: { type: 'web_app', text: 'Admin', web_app: { url: cfg.adminUrl } },
    })
  );
}

async function setCommands() {
  await call('setMyCommands', {
    commands: [
      { command: 'start', description: 'Do‘konni ochish' },
      { command: 'help', description: 'Yordam' },
      { command: 'id', description: 'Chat ID' },
    ],
  }).catch(() => {});
  await call('setMyCommands', {
    language_code: 'ru',
    commands: [
      { command: 'start', description: 'Открыть магазин' },
      { command: 'help', description: 'Помощь' },
      { command: 'id', description: 'Chat ID' },
    ],
  }).catch(() => {});
}

// ——— Ishga tushirish: https bo'lsa webhook, aks holda polling ———
let polling = false;

async function start(handleUpdate) {
  if (!cfg.botToken) {
    console.warn('[bot] BOT_TOKEN yo‘q — bot o‘chirilgan');
    return;
  }
  try {
    const me = await call('getMe');
    console.log(`[bot] @${me.username} ulandi`);
  } catch (e) {
    console.error('[bot] Token noto‘g‘ri yoki internet yo‘q:', e.message);
    return;
  }
  setCommands();
  setDefaultMenu();

  if (isHttps(cfg.publicUrl)) {
    const url = cfg.publicUrl + webhookPath;
    await call('setWebhook', {
      url,
      secret_token: webhookSecret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    });
    console.log('[bot] Webhook rejimi:', cfg.publicUrl + '/tg/…');
    return;
  }

  // Lokal: polling
  await call('deleteWebhook', { drop_pending_updates: false }).catch(() => {});
  console.log('[bot] Polling rejimi (lokal)');
  polling = true;
  let offset = 0;
  (async function loop() {
    while (polling) {
      try {
        const updates = await call('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
        for (const u of updates) {
          offset = u.update_id + 1;
          handleUpdate(u).catch((e) => console.error('[bot] update xato:', e));
        }
      } catch (e) {
        if (e.code === 409) {
          console.warn('[bot] Boshqa joyda ham ishlayapti (409). 10 soniya kutaman...');
          await new Promise((r) => setTimeout(r, 10_000));
        } else {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }
  })();
}

module.exports = {
  call,
  callForm,
  safeSend,
  sendPhoto,
  sendPhotosWithText,
  notifyAdmins,
  downloadFile,
  setAdminMenu,
  setDefaultMenu,
  start,
  webhookPath,
  webhookSecret,
  isHttps,
  isChatId,
  lastFileId,
};
