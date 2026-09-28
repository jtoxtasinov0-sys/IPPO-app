const router = require('express').Router();
const c = require('../controllers/cartController');
const { telegramAuth } = require('../middlewares/auth.middleware');
const { upload } = require('../utils/upload');

// Express 4 da async xatolarni ushlash
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/config', a(c.getConfig));
router.get('/products', a(c.listProducts));
router.get('/products/:id', a(c.getProduct));
router.get('/stories', a(c.listStories));
router.post('/cart/calculate', a(c.calculate));
router.post('/web/session', c.webSession);

router.get('/me', telegramAuth, a(c.me));
router.patch('/me', telegramAuth, a(c.updateMe));
router.post('/orders', telegramAuth, a(c.createOrder));
router.get('/orders/my', telegramAuth, a(c.myOrders));
router.post('/orders/:id/receipt', telegramAuth, upload.single('receipt'), a(c.uploadReceipt));

module.exports = router;
