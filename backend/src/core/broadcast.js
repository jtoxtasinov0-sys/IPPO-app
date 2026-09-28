// Rassilka: soniyasiga ~20 ta xabar, jarayon holati admin panelda ko'rinadi
const prisma = require('../database/connection');
const bot = require('./bot');
const { adminChatIds } = require('../models/User');

const state = { running: false, test: false, total: 0, sent: 0, failed: 0, startedAt: null, finishedAt: null };

function status() {
  return { ...state };
}

async function start({ text, image, test }) {
  if (state.running) throw new Error('Rassilka allaqachon ketmoqda');
  const recipients = test
    ? await adminChatIds()
    : (
        await prisma.user.findMany({
          where: { isBlocked: false },
          select: { telegramId: true },
        })
      )
        .map((u) => u.telegramId)
        .filter(bot.isChatId);

  Object.assign(state, {
    running: true,
    test: !!test,
    total: recipients.length,
    sent: 0,
    failed: 0,
    startedAt: new Date(),
    finishedAt: null,
  });

  (async () => {
    let fileId = null;
    for (const chatId of recipients) {
      let msg = null;
      if (image) {
        msg = await bot.sendPhoto(chatId, fileId || image, text ? text.slice(0, 1024) : undefined, { parse_mode: undefined });
        if (msg && !fileId) fileId = bot.lastFileId(msg);
        if (msg && text && text.length > 1024) await bot.safeSend(chatId, text, { parse_mode: undefined });
      } else {
        msg = await bot.safeSend(chatId, text, { parse_mode: undefined });
      }
      if (msg) state.sent++;
      else state.failed++;
      await new Promise((r) => setTimeout(r, 50));
    }
    state.running = false;
    state.finishedAt = new Date();
  })().catch((e) => {
    console.error('[broadcast]', e);
    state.running = false;
    state.finishedAt = new Date();
  });

  return status();
}

module.exports = { start, status };
