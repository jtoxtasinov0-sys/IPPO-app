const router = require('express').Router();
const c = require('../controllers/adminController');
const { adminAuth } = require('../middlewares/auth.middleware');
const { upload } = require('../utils/upload');

const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/login', a(c.login));
router.post('/tg-login', a(c.tgLogin));

router.use(adminAuth);

router.get('/meta', c.meta);
router.get('/stats', a(c.stats));

router.get('/orders', a(c.listOrders));
router.patch('/orders/:id', a(c.updateOrder));
router.delete('/orders/:id', a(c.deleteOrder));
router.post('/orders/clear', a(c.clearOrders));

router.get('/products', a(c.listProducts));
router.post('/products', a(c.createProduct));
router.put('/products/:id', a(c.updateProduct));
router.patch('/products/:id', a(c.patchProduct));
router.delete('/products/:id', a(c.deleteProduct));
router.post('/upload', upload.single('file'), a(c.uploadImage));

router.get('/stories', a(c.listStories));
router.post('/stories', a(c.createStory));
router.put('/stories/:id', a(c.updateStory));
router.delete('/stories/:id', a(c.deleteStory));

router.get('/users', a(c.listUsers));
router.patch('/users/:id', a(c.setUserAdmin));

router.post('/broadcast', a(c.startBroadcast));
router.get('/broadcast', c.broadcastStatus);

router.get('/settings', a(c.getSettings));
router.put('/settings', a(c.saveSettings));

module.exports = router;
