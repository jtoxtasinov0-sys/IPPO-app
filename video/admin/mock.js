// Serves the built admin panel with a mocked backend inside Playwright.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const DIST = process.env.ADMIN_DIST;
const FONTS = path.resolve(__dirname, '../source/fonts');
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8')).products;

const CATMAP = { jenshen: 'jenshen', kollagen: 'kollagen', vitaminlar: 'vitaminlar', soch_parvarishi: 'soch', yuz_parvarishi: 'yuz', parfyumeriya: 'parfyum' };
const meta = {
  categories: [
    { key: 'jenshen', uz: 'Jenshen' }, { key: 'kollagen', uz: 'Kollagen' }, { key: 'vitaminlar', uz: 'Vitaminlar' },
    { key: 'soch', uz: 'Soch parvarishi' }, { key: 'yuz', uz: 'Yuz parvarishi' }, { key: 'parfyum', uz: 'Parfyumeriya' },
  ],
  tags: [{ key: 'new', uz: 'Yangi' }, { key: 'hit', uz: 'Xit' }, { key: 'sale', uz: 'Aksiya' }, { key: 'set', uz: 'To‘plam' }],
  markets: [{ key: 'kr', uz: 'Koreya', regions: [] }, { key: 'uz', uz: 'O‘zbekiston', regions: [] }],
  modes: [{ key: 'dona', uz: 'Dona' }, { key: 'optom', uz: 'Optom' }],
};
const NEW_IMG = '/' + P[0].image; // product used as the "new" one in the tutorial
const PR = [165000, 98000, 65000, 120000, 40000, 45000, 52000, 38000, 33000, 29000, 27000, 31000, 24000, 85000, 19000, 23000, 110000, 25000, 135000, 142000];
let products = P.slice(1).map((p, i) => ({
  id: p.id, article: 'IP-' + String(100 + p.id).padStart(3, '0'), name: p.name, nameRu: '', brand: '',
  category: CATMAP[p.category] || p.category, tag: null, volume: '',
  price: PR[p.id - 1], priceOptom: Math.round(PR[p.id - 1] * 0.85 / 1000) * 1000,
  priceUz: Math.round(PR[p.id - 1] * 9.6 / 1000) * 1000, priceUzOptom: Math.round(PR[p.id - 1] * 8.4 / 1000) * 1000,
  oldPrice: null, stock: 10 + (i * 7) % 30, variants: [], description: '', descriptionRu: '',
  images: ['/' + p.image], imageFrames: [], imageVariants: [], isActive: true, isFeatured: i < 4, sortOrder: 0,
})).reverse();
const img = (n) => '/' + P[n].image;
const orders = [{
  id: 6, status: 'new', market: 'kr', mode: 'dona', total: 111000, deliveryFee: 0, createdAt: '2026-10-03T10:52:00',
  customerName: 'Dilnoza', phone: '+82 10 1234 5678', paymentMethod: 'card', paymentStatus: 'unpaid', user: { telegramId: 1 },
  items: [
    { name: 'Qizil jenshen ekstrakti — 4 bankali set', article: 'IP-103', qty: 1, unitPrice: 49000, image: img(2) },
    { name: 'Red Apple Collagen jelly stik', article: 'IP-106', qty: 1, unitPrice: 40000, image: img(4) },
    { name: 'Lacto Fit probiotik', article: 'IP-110', qty: 1, unitPrice: 22000, image: img(9) },
  ],
}];
const stats = { today: 1, revenueToday: { kr: 111000 }, total: 5, revenue: { kr: 348000 }, pendingReceipts: 0, users: 39, products: 18, byStatus: { new: 5 } };

const ctype = (f) => ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' })[path.extname(f)] || 'application/octet-stream';

async function setup(context) {
  await context.addInitScript(() => localStorage.setItem('ippo_admin_token', 'demo'));
  await context.route('**/*', async (route) => {
    const req = route.request(), u = new URL(req.url());
    const file = (f) => route.fulfill({ status: 200, contentType: ctype(f), body: fs.readFileSync(f) });
    const json = (d) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) });
    if (u.host === 'fonts.googleapis.com') {
      const css = fs.readFileSync(path.join(FONTS, 'app.css'), 'utf8').replace(/url\((f\d+\.woff2)\)/g, 'url(http://admin.local/__fonts/$1)');
      return route.fulfill({ status: 200, contentType: 'text/css', body: css });
    }
    if (u.host === 'telegram.org') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (u.host === 'admin.local') {
      if (u.pathname.startsWith('/__fonts/')) return file(path.join(FONTS, path.basename(u.pathname)));
      const f = path.join(DIST, u.pathname === '/' ? 'index.html' : u.pathname);
      return fs.existsSync(f) ? file(f) : file(path.join(DIST, 'index.html'));
    }
    if (u.host === 'mock.api') {
      const p = u.pathname, m = req.method();
      if (p.startsWith('/products/')) return file(path.join(ROOT, decodeURIComponent(p)));
      if (p === '/api/admin/meta') return json(meta);
      if (p === '/api/admin/stats') return json(stats);
      if (p.startsWith('/api/admin/orders')) return json(orders);
      if (p === '/api/admin/products' && m === 'GET') return json(products);
      if (p === '/api/admin/products' && m === 'POST') {
        const b = JSON.parse(req.postData()); const np = { ...b, id: 999, price: +b.price || 0, priceOptom: +b.priceOptom || 0, priceUz: +b.priceUz || 0, priceUzOptom: +b.priceUzOptom || 0, stock: b.stock === '' ? null : +b.stock };
        products = [np, ...products]; return json(np);
      }
      if (p === '/api/admin/upload') return json({ path: NEW_IMG });
      return json({});
    }
    return route.abort();
  });
}
module.exports = { setup, NEW_IMG };
