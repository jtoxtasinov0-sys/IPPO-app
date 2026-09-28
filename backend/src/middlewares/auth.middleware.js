// Telegram initData (HMAC) tekshiruvi + brauzer veb-tokeni + admin JWT
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cfg = require('../config/default');
const User = require('../models/User');

// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData(initData) {
  if (!initData || !cfg.botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(cfg.botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  // 7 kundan eski imzo qabul qilinmaydi
  const authDate = Number(params.get('auth_date')) * 1000;
  if (!authDate || Date.now() - authDate > 7 * 24 * 3600 * 1000) return null;
  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

function signWebToken() {
  const sub = 'web_' + crypto.randomBytes(8).toString('hex');
  return jwt.sign({ role: 'web', sub }, cfg.jwtSecret, { expiresIn: '3650d' });
}

// Mijoz: Telegram yoki brauzer (X-Web-Token). Lokal rejimda — "Demo Mijoz"
async function telegramAuth(req, res, next) {
  try {
    const initData = req.get('X-Telegram-Init-Data');
    if (initData) {
      const tgUser = verifyInitData(initData);
      if (!tgUser) return res.status(401).json({ error: 'initData yaroqsiz' });
      req.user = await User.upsertFromTelegram(tgUser);
      return next();
    }
    const webToken = req.get('X-Web-Token');
    if (webToken) {
      try {
        const p = jwt.verify(webToken, cfg.jwtSecret);
        if (p.role !== 'web' || !/^web_[a-f0-9]{16}$/.test(p.sub)) throw new Error('role');
        req.user = await User.findOrCreateWeb(p.sub);
        req.isWeb = true;
        return next();
      } catch {
        return res.status(401).json({ error: 'token' });
      }
    }
    if (!cfg.isProd) {
      req.user = await User.upsertFromTelegram({ id: 'demo', first_name: 'Demo', last_name: 'Mijoz' });
      req.isWeb = true;
      return next();
    }
    return res.status(401).json({ error: 'auth' });
  } catch (e) {
    next(e);
  }
}

// Admin: JWT (login/parol) yoki Telegram ichidan admin foydalanuvchi
async function adminAuth(req, res, next) {
  try {
    const h = req.get('Authorization') || '';
    if (h.startsWith('Bearer ')) {
      try {
        const p = jwt.verify(h.slice(7), cfg.jwtSecret);
        if (p.role === 'admin') {
          req.admin = p;
          return next();
        }
      } catch {}
    }
    const initData = req.get('X-Telegram-Init-Data');
    if (initData) {
      const tgUser = verifyInitData(initData);
      if (tgUser && (await User.isAdminTelegramId(tgUser.id))) {
        req.admin = { role: 'admin', sub: String(tgUser.id), name: tgUser.first_name };
        return next();
      }
    }
    return res.status(401).json({ error: 'Kirish kerak' });
  } catch (e) {
    next(e);
  }
}

function signAdminToken(payload) {
  return jwt.sign({ role: 'admin', ...payload }, cfg.jwtSecret, { expiresIn: '30d' });
}

module.exports = { telegramAuth, adminAuth, verifyInitData, signWebToken, signAdminToken };
