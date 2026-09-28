const prisma = require('../database/connection');
const cfg = require('../config/default');

// Telegram "from" obyektidan foydalanuvchini yaratish/yangilash
async function upsertFromTelegram(from) {
  const telegramId = String(from.id);
  const data = {
    firstName: from.first_name || null,
    lastName: from.last_name || null,
    username: from.username || null,
  };
  const lang = from.language_code === 'ru' ? 'ru' : 'uz';
  return prisma.user.upsert({
    where: { telegramId },
    update: { ...data, isBlocked: false },
    create: { telegramId, ...data, lang },
  });
}

async function findOrCreateWeb(webId) {
  return prisma.user.upsert({
    where: { telegramId: webId },
    update: {},
    create: { telegramId: webId, lang: 'uz' },
  });
}

// Adminlar: .env dagi ADMIN_CHAT_IDS + bazadagi isAdmin
async function adminChatIds() {
  const rows = await prisma.user.findMany({ where: { isAdmin: true }, select: { telegramId: true } });
  const ids = new Set(cfg.adminChatIds);
  for (const r of rows) if (/^\d+$/.test(r.telegramId)) ids.add(r.telegramId);
  return [...ids];
}

async function isAdminTelegramId(telegramId) {
  const id = String(telegramId);
  if (cfg.adminChatIds.includes(id)) return true;
  const u = await prisma.user.findUnique({ where: { telegramId: id }, select: { isAdmin: true } });
  return !!u?.isAdmin;
}

module.exports = { upsertFromTelegram, findOrCreateWeb, adminChatIds, isAdminTelegramId };
