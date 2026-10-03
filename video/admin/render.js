// Renders the admin "add product" tutorial: drives the real admin panel (mock backend)
// and composites each frame into stage.html, piping JPEG frames into ffmpeg.
// Usage: ADMIN_DIST=<built admin dir> node render.js [--snap t1,t2,...]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path');
const { setup } = require('./mock');

const FPS = 30, DUR = 56.5;
const SNAP = process.argv[2] === '--snap' ? process.argv[3].split(',').map(Number) : null;

/* ---------- easing helpers ---------- */
const E = { lin: (x) => x, out: (x) => 1 - Math.pow(1 - x, 3), in: (x) => x * x * x, io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), back: (x) => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); } };
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const P = (t, a, b, e = E.io) => (t <= a ? 0 : t >= b ? 1 : e((t - a) / (b - a)));
const L = (a, b, x) => a + (b - a) * x;
const W = (t, a, b, d = 0.35) => Math.min(P(t, a, a + d, E.out), 1 - P(t, b - d, b, E.out));
const K = (t, kf, e = E.io) => { if (t <= kf[0][0]) return kf[0][1]; for (let i = 1; i < kf.length; i++) if (t <= kf[i][0]) { const [a, va] = kf[i - 1], [b, vb] = kf[i]; return L(va, vb, e((t - a) / (b - a))); } return kf[kf.length - 1][1]; };

/* ---------- content ---------- */
const STEPS = [4.5, 8.0, 11.0, 17.0, 25.6, 31.6, 38.0, 41.2, 45.4, 47.4, 51.6];
const OUTRO = 51.6;
const CFG = {
  heads: [
    { t: 'IPPO Admin · qo‘llanma', a: 'Admin panel', b: '<span class="serif">qo‘llanmasi</span>' },
    { t: 'Admin panel', a: 'Mahsulot', b: '<span class="serif">qo‘shish</span>' },
    { t: 'Hammasi tayyor!', a: 'Mahsulot', b: '<span class="serif">do‘konda</span>' },
  ],
  caps: [
    { m: '<q>Mahsulotlar</q> bo‘limini oching', s: 'yuqoridagi menyuda' },
    { m: '<q>+ Yangi mahsulot</q> ni bosing', s: 'mahsulot oynasi ochiladi' },
    { m: 'Rasm qo‘shing', s: '8 tagacha · birinchisi asosiy rasm bo‘ladi' },
    { m: 'Nomi va brendini yozing', s: 'o‘zbekcha nomi majburiy, ruschasi ixtiyoriy' },
    { m: 'Kategoriya va tegni tanlang', s: 'teg: Yangi, Xit, Aksiya yoki To‘plam' },
    { m: 'Narxlarni kiriting', s: '🇰🇷 Koreya va 🇺🇿 O‘zbekiston · optom va dona' },
    { m: 'Hajmi va ombordagi soni', s: 'ombor bo‘sh qolsa — cheklanmagan' },
    { m: 'Tavsif yozing', s: 'mahsulot haqida qisqacha ma’lumot' },
    { m: '<q>Bosh sahifada</q> belgisi', s: 'mahsulot «Mashhur» bo‘limida chiqadi' },
    { m: '<q>Saqlash</q> ni bosing', s: 'mahsulot darhol do‘konda paydo bo‘ladi' },
  ],
  photos: ['01_jenshen/01_punggi_red_ginseng_extract_gold_6_yillik.jpg', '02_kollagen/05_red_apple_collagen_qizil_olma_kollageni.jpg', '05_yuz_parvarishi/18_24k_gold_kosmetika_seti.jpg',
    '01_jenshen/03_qora_jenshen_royal_gold_seti_4_dona.jpg', '03_vitaminlar/10_lacto_fit_probiotik.jpg', '05_yuz_parvarishi/15_dr_ippo_yuz_parvarish_seti.jpg',
    '02_kollagen/07_anorli_kollagen_pomegranate_collagen.jpg', '04_soch_parvarishi/11_k_ginseng_jenshen_shampuni.jpg', '05_yuz_parvarishi/16_anua_pdrn_hyaluronic_acid_mist.jpg',
    '01_jenshen/04_qizil_jenshen_stiklari.jpg', '03_vitaminlar/08_kalsiy_magniy_vitamin_d_sink_kompleksi.jpg', '06_parfyumeriya/19_chanel_allure_homme.jpg'].map((p) => '../../products/' + p),
};
const CATS = ['Tanlang', 'Jenshen', 'Kollagen', 'Vitaminlar', 'Soch parvarishi', 'Yuz parvarishi', 'Parfyumeriya'];
const TAGS = ['Yo‘q', 'Yangi', 'Xit', 'Aksiya', 'To‘plam'];

/* ---------- scripted interaction ---------- */
// modal-body scroll keyframes
const MSCROLL = [[17.2, 0], [17.9, 300], [25.7, 300], [26.3, 480], [31.7, 480], [32.3, 720], [38.1, 720], [38.7, 1180], [41.3, 1180], [41.9, 9999]];
const TYPE = [
  { t0: 19.0, t1: 19.8, f: 'Brend', text: 'Punggi' },
  { t0: 20.7, t1: 22.6, f: 'Nomi (o‘zbekcha)', text: 'Qizil jenshen ekstrakti Gold' },
  { t0: 23.3, t1: 24.8, f: 'Nomi (ruscha)', text: 'Экстракт красного женьшеня' },
  { t0: 33.1, t1: 33.7, f: '🇰🇷 Optom', text: '140000' },
  { t0: 34.3, t1: 34.9, f: '🇰🇷 Dona', text: '165000' },
  { t0: 35.5, t1: 36.2, f: '🇺🇿 Optom', text: '1450000' },
  { t0: 36.8, t1: 37.5, f: '🇺🇿 Dona', text: '1650000' },
  { t0: 39.3, t1: 39.8, f: 'Hajmi', text: '240 g' },
  { t0: 40.4, t1: 40.7, f: 'Ombor', text: '25' },
  { t0: 42.4, t1: 44.6, f: 'Tavsif (o‘zbekcha)', text: '6 yillik qizil jenshen ekstrakti. Immunitet va quvvat uchun.' },
];
// targets: {f:label} field inside modal, {text} button/tab text, {sel} css, or [x,y] screen coords
const PICK_PHOTO = [78, 252], PICK_ADD = [414, 96];
const FINGER = [
  { show: [4.9, 6.6], to: { text: 'Mahsulotlar', tag: 'button' }, move: [5.0, 5.8], press: 6.0 },
  { show: [8.3, 9.9], to: { text: '+ Yangi mahsulot' }, move: [8.4, 9.1], press: 9.3 },
  { show: [11.3, 12.8], to: { sel: '.img-add' }, move: [11.4, 12.0], press: 12.3 },
  { show: [13.3, 14.4], to: PICK_PHOTO, move: [13.3, 13.8], press: 14.0 },
  { show: [14.4, 15.6], to: PICK_ADD, move: [14.4, 14.9], press: 15.15 },
  { show: [17.9, 19.0], to: { f: 'Brend' }, move: [17.9, 18.3], press: 18.5 },
  { show: [19.9, 20.9], to: { f: 'Nomi (o‘zbekcha)' }, move: [19.9, 20.3], press: 20.5 },
  { show: [22.6, 23.5], to: { f: 'Nomi (ruscha)' }, move: [22.6, 22.95], press: 23.1 },
  { show: [26.4, 27.5], to: { f: 'Kategoriya' }, move: [26.4, 26.8], press: 27.0 },
  { show: [27.6, 28.7], to: { menu: 1 }, move: [27.6, 28.1], press: 28.3 },
  { show: [28.8, 29.8], to: { f: 'Teg' }, move: [28.8, 29.2], press: 29.4 },
  { show: [29.9, 31.1], to: { menu: 2 }, move: [29.9, 30.4], press: 30.6 },
  { show: [32.3, 33.1], to: { f: '🇰🇷 Optom' }, move: [32.3, 32.7], press: 32.9 },
  { show: [33.7, 34.3], to: { f: '🇰🇷 Dona' }, move: [33.7, 34.0], press: 34.1 },
  { show: [34.9, 35.5], to: { f: '🇺🇿 Optom' }, move: [34.9, 35.2], press: 35.3 },
  { show: [36.2, 36.8], to: { f: '🇺🇿 Dona' }, move: [36.2, 36.5], press: 36.6 },
  { show: [38.7, 39.3], to: { f: 'Hajmi' }, move: [38.7, 39.0], press: 39.1 },
  { show: [39.8, 40.4], to: { f: 'Ombor' }, move: [39.8, 40.1], press: 40.2 },
  { show: [41.6, 42.4], to: { f: 'Tavsif (o‘zbekcha)' }, move: [41.6, 42.0], press: 42.2 },
  { show: [45.6, 46.7], to: { check: 'Bosh sahifada' }, move: [45.6, 46.0], press: 46.2 },
  { show: [47.6, 48.8], to: { text: 'Saqlash' }, move: [47.6, 48.1], press: 48.3 },
];
const KB = [[18.55, 25.0], [32.95, 44.8]]; // keyboard visible windows
const MENUS = [
  { open: 27.05, close: 28.4, f: 'Kategoriya', items: CATS, from: 0, to: 1, pickAt: 28.3, value: 'jenshen' },
  { open: 29.45, close: 30.7, f: 'Teg', items: TAGS, from: 0, to: 2, pickAt: 30.6, value: 'hit' },
];
const FOCUS = [[18.5, 'Brend'], [20.5, 'Nomi (o‘zbekcha)'], [23.1, 'Nomi (ruscha)'], [32.9, '🇰🇷 Optom'], [34.1, '🇰🇷 Dona'], [35.3, '🇺🇿 Optom'], [36.6, '🇺🇿 Dona'], [39.1, 'Hajmi'], [40.2, 'Ombor'], [42.2, 'Tavsif (o‘zbekcha)']];
const BLUR = [25.0, 44.8];

/* ---------- in-page helpers (admin) ---------- */
const PAGE_HELPERS = () => {
  window.__field = (label) => {
    for (const l of document.querySelectorAll('.modal label')) {
      const txt = [...l.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (txt.startsWith(label)) return l.querySelector('input,select,textarea');
    }
    return null;
  };
  window.__check = (label) => [...document.querySelectorAll('.modal label.check')].find((l) => l.textContent.includes(label))?.querySelector('input');
  window.__text = (text, tag) => [...document.querySelectorAll(tag || 'button')].find((b) => b.textContent.trim().includes(text));
  window.__rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  window.__setVal = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
};
const toScreen = (r) => [(r.x + r.w / 2) * 1.2, 54 + (r.y + r.h / 2) * 1.2];

(async () => {
  const browser = await chromium.launch();
  const actx = await browser.newContext({ viewport: { width: 393, height: 790 }, deviceScaleFactor: 1.2, isMobile: true, hasTouch: true });
  await setup(actx);
  await actx.addInitScript(PAGE_HELPERS);
  const A = await actx.newPage();
  A.on('pageerror', (e) => console.log('ADMIN ERR', e.message));
  await A.goto('http://admin.local/');
  await A.waitForTimeout(1200);
  await A.evaluate(() => document.fonts.ready);
  await A.addStyleTag({ content: '*{caret-color:transparent!important;transition:none!important;animation:none!important}' });

  const S = await (await browser.newContext({ viewport: { width: 1080, height: 1920 } })).newPage();
  S.on('pageerror', (e) => console.log('STAGE ERR', e.message));
  await S.goto('file://' + path.join(__dirname, 'stage.html'));
  await S.evaluate(() => document.fonts.ready);
  await S.evaluate((c) => setup(c), CFG);

  const shot = async () => 'data:image/jpeg;base64,' + (await A.screenshot({ type: 'jpeg', quality: 92 })).toString('base64');

  // action queue (executed once when time passes)
  const ACTIONS = [
    { t: 6.05, fade: true, fn: () => A.evaluate(() => __text('Mahsulotlar').click()) },
    { t: 9.35, fade: true, fn: () => A.evaluate(() => __text('+ Yangi mahsulot').click()) },
    { t: 15.5, fade: true, fn: async () => { await A.setInputFiles('input[type=file]', path.join(__dirname, '../../products/01_jenshen/01_punggi_red_ginseng_extract_gold_6_yillik.jpg')); await A.waitForTimeout(400); } },
    ...FOCUS.map(([t, f]) => ({ t, fn: () => A.evaluate((f) => __field(f).focus({ preventScroll: true }), f) })),
    ...BLUR.map((t) => ({ t, fn: () => A.evaluate(() => document.activeElement && document.activeElement.blur()) })),
    ...MENUS.map((m) => ({ t: m.pickAt + 0.05, fn: () => A.evaluate(([f, v]) => __setVal(__field(f), v), [m.f, m.value]) })),
    { t: 46.25, fn: () => A.evaluate(() => __check('Bosh sahifada').click()) },
    { t: 48.35, fade: true, fn: async () => { await A.evaluate(() => __text('Saqlash').click()); await A.waitForTimeout(500); } },
  ].sort((a, b) => a.t - b.t);
  let ai = 0;
  const typed = TYPE.map(() => -1);
  let curImg = null, sentImg = null, prevImg = null, fadeAt = -9, lastScroll = -1, settleUntil = 0;
  const fingerTargets = {}; const menuPos = {};

  const resolve = async (to, i) => {
    if (Array.isArray(to)) return to;
    if (to.menu !== undefined) { const m = menuPos[to.menu === 1 ? 0 : 1]; return [m.x + 150, m.y + 23 + to.menu * 46]; }
    const r = await A.evaluate((to) => __rect(to.f ? __field(to.f) : to.check ? __check(to.check)?.parentElement : to.sel ? document.querySelector(to.sel) : __text(to.text, to.tag)), to);
    if (!r) { console.log('target missing', JSON.stringify(to)); return [236, 500]; }
    if (to.check) return [(r.x + 14) * 1.2, 54 + (r.y + r.h / 2) * 1.2];
    return toScreen(r);
  };

  const N = Math.round(DUR * FPS);
  const frames = SNAP ? SNAP.map((t) => Math.round(t * FPS)) : [...Array(N).keys()];
  const ff = SNAP ? null : spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(__dirname, 'admin-silent.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let fi = 0; fi < frames.length; fi++) {
    const t = frames[fi] / FPS;
    let dirty = !curImg;
    // actions
    while (ai < ACTIONS.length && ACTIONS[ai].t <= t) {
      const a = ACTIONS[ai++];
      if (a.fade) { prevImg = curImg; fadeAt = a.t; }
      await a.fn(); dirty = true; settleUntil = a.t + 0.6;
    }
    // menus: remember positions
    for (let k = 0; k < MENUS.length; k++) if (!menuPos[k] && t >= MENUS[k].open - 0.6) {
      const r = await A.evaluate((f) => __rect(__field(f)), MENUS[k].f);
      menuPos[k] = { x: Math.min(472 - 316, r.x * 1.2), y: 54 + (r.y + r.h) * 1.2 + 8 };
    }
    // typing
    let key = '';
    for (let k = 0; k < TYPE.length; k++) {
      const ty = TYPE[k];
      const n = Math.round(ty.text.length * P(t, ty.t0, ty.t1, E.lin));
      if (t >= ty.t0 && n !== typed[k]) {
        typed[k] = n; dirty = true;
        await A.evaluate(([f, v]) => __setVal(__field(f), v), [ty.f, ty.text.slice(0, n)]);
      }
      if (t >= ty.t0 && t < ty.t1 + 0.05 && n > 0) key = ty.text[n - 1].toUpperCase();
    }
    // modal scroll
    const sc = Math.round(K(t, MSCROLL));
    if (t >= 9.35 && t < 48.35 && sc !== lastScroll) {
      lastScroll = sc; dirty = true;
      await A.evaluate((v) => { const b = document.querySelector('.modal-body'); if (b) b.scrollTop = v; }, sc);
    }
    if (t < settleUntil) dirty = true;
    if (dirty) curImg = await shot();

    // finger
    const f = { op: 0, x: 0, y: 0, sc: 1, rs: 0, ro: 0 };
    for (let k = 0; k < FINGER.length; k++) {
      const g = FINGER[k];
      if (t < g.show[0] - 0.01 || t > g.show[1] + 0.01) continue;
      if (!fingerTargets[k]) fingerTargets[k] = await resolve(g.to, k);
      const [tx, ty] = fingerTargets[k];
      const fx = tx + 70, fy = ty + 160;
      const m = P(t, g.move[0], g.move[1]);
      f.op = W(t, g.show[0], g.show[1], 0.25); f.x = L(fx, tx, m); f.y = L(fy, ty, m);
      const d = t - g.press;
      if (d > -0.15 && d < 0.25) f.sc = 1 - 0.22 * Math.sin(cl((d + 0.15) / 0.4) * Math.PI);
      if (d >= 0 && d < 0.7) { f.rs = L(0.6, 2.6, E.out(d / 0.7)); f.ro = 1 - d / 0.7; }
    }

    // menus
    let menu = null;
    for (let k = 0; k < MENUS.length; k++) {
      const m = MENUS[k];
      if (t >= m.open && t < m.close + 0.25) {
        const op = Math.min(P(t, m.open, m.open + 0.2, E.out), 1 - P(t, m.close, m.close + 0.2));
        menu = { ...menuPos[k], items: m.items, op, on: t >= m.pickAt ? m.to : m.from, hl: t >= m.pickAt - 0.15 && t < m.close ? m.to : -1 };
      }
    }

    // headline / captions
    const hw = [[0, STEPS[0] - 0.1], [STEPS[0] - 0.1, OUTRO + 0.3], [OUTRO + 0.3, 99]];
    const heads = hw.map(([a, b], i) => {
      const inP = i === 0 ? P(t, 0.25, 1.3, E.out) : P(t, a, a + 0.8, E.out), outP = P(t, b - 0.35, b + 0.15, E.in);
      return { vis: !(t < a - 0.5 || t > b + 0.3), tag: inP * (1 - outP), tagY: (1 - inP) * 20,
        lines: [0, 1].map((k) => { const ip = i === 0 ? P(t, 0.35 + k * 0.12, 1.35 + k * 0.12, E.out) : P(t, a + 0.05 + k * 0.1, a + 0.85 + k * 0.1, E.out); return (1 - ip) * 110 - outP * 110; }) };
    });
    const caps = CFG.caps.map((_, k) => { const s = STEPS[k] + 0.05, e = STEPS[k + 1] - 0.05; return { op: W(t, s, e, 0.35), y: (1 - P(t, s, s + 0.5, E.out)) * 26 }; });
    let cur_step = -1; for (let k = 0; k < 10; k++) if (t >= STEPS[k] && t < STEPS[k + 1]) cur_step = k;

    // phone placement
    const rise = P(t, 0.5, 2.1, E.out);
    const bobY = Math.sin(t * 1.25) * 6, bobR = Math.sin(t * 0.9) * 0.5;
    const pr = K(t, [[0.5, 12], [2.1, -2]]), ps = K(t, [[OUTRO, 1], [OUTRO + 1.2, 0.84]]);
    const py = L(1000, 0, rise) + K(t, [[OUTRO, 0], [OUTRO + 1.2, -80]]);

    // new-product highlight ring after save
    let ring = null;
    if (t >= 48.9) {
      if (!fingerTargets.card) { const r = await A.evaluate(() => __rect(document.querySelector('.product-card'))); fingerTargets.card = r; }
      const r = fingerTargets.card;
      ring = { x: r.x * 1.2 - 6, y: 54 + r.y * 1.2 - 6, w: r.w * 1.2 + 12, h: Math.min(r.h * 1.2 + 12, 1002 - 54 - r.y * 1.2), op: W(t, 48.9, 51.4, 0.3) * (0.75 + 0.25 * Math.sin(t * 8)) };
    }

    const modalOpen = t >= 9.35 && t < 48.35;
    const s = {
      t, band: P(t, 0.1, 1.4, E.out), bandY: K(t, [[OUTRO, 0], [OUTRO + 1.2, -90]]), nav: P(t, 0.2, 1, E.out), navOn: t >= STEPS[0],
      heads, phone: `translate(0px,${py + bobY}px) rotate(${pr + bobR}deg) scale(${ps})`,
      cur: curImg !== sentImg ? curImg : null, prev: null, prevOp: 1 - P(t, fadeAt, fadeAt + 0.3, E.lin),
      dim: modalOpen ? P(t, 9.35, 9.65, E.lin) : 1 - P(t, 48.35, 48.65, E.lin),
      kb: Math.max(...KB.map(([a, b]) => Math.min(P(t, a, a + 0.35, E.out), 1 - P(t, b, b + 0.3, E.in)))), key,
      pick: Math.min(P(t, 12.55, 13.0, E.out), 1 - P(t, 15.3, 15.7, E.in)), pchk: P(t, 14.0, 14.15, E.back),
      menu, ring, f, caps, cur_step, dots: W(t, STEPS[0] - 0.2, OUTRO + 0.2, 0.3),
      outro: P(t, OUTRO + 0.6, OUTRO + 1.4, E.out), fade: 1 - P(t, 0, 0.35) + P(t, DUR - 0.6, DUR),
    };
    if (s.prevOp > 0 && prevImg) s.prev = prevImg; else s.prevOp = 0;
    sentImg = curImg;
    await S.evaluate((s) => render(s), s);
    const buf = await S.screenshot({ type: 'jpeg', quality: 94 });
    if (SNAP) require('fs').writeFileSync(path.join(__dirname, `snap_${t.toFixed(1)}.jpg`), buf);
    else if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (!SNAP && fi % 150 === 0) console.log('frame', fi, '/', frames.length);
  }
  if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
  await browser.close();
  console.log('done');
})();
