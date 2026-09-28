// IPPO by Fotima Zuhra — server: API + Telegram bot + rasmlar
const express = require('express');
const cors = require('cors');
const cfg = require('./config/default');
const prisma = require('./database/connection');
const bot = require('./core/bot');
const { handleUpdate } = require('./controllers/botController');
const { serveUploads } = require('./utils/upload');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.send('IPPO API ishlayapti ✅'));
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use(require('./routes/bot.routes'));
app.use('/api', require('./routes/client.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.get('/uploads/*', serveUploads);

app.use((_req, res) => res.status(404).json({ error: 'Topilmadi' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Fayl juda katta (15 MB gacha)' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON noto‘g‘ri' });
  console.error('[api]', err);
  res.status(500).json({ error: 'Serverda xatolik' });
});

const server = app.listen(cfg.port, () => {
  console.log(`✅ Server: http://localhost:${cfg.port}`);
  bot.start(handleUpdate).catch((e) => console.error('[bot] start:', e.message));

  // Render bepul reja uxlamasligi uchun o'zini ping qiladi
  if (bot.isHttps(cfg.publicUrl)) {
    setInterval(() => fetch(cfg.publicUrl + '/api/health').catch(() => {}), 10 * 60_000);
  }
});

async function shutdown() {
  server.close();
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
