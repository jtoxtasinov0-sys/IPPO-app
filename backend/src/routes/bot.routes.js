// Telegram webhook: yo'l token hash'idan, secret_token tekshiriladi
const router = require('express').Router();
const bot = require('../core/bot');
const { handleUpdate } = require('../controllers/botController');

router.post(bot.webhookPath, (req, res) => {
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== bot.webhookSecret) return res.sendStatus(401);
  res.sendStatus(200); // Telegram kutib qolmasin
  handleUpdate(req.body || {});
});

module.exports = router;
