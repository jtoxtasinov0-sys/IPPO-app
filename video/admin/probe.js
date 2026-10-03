const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { setup } = require('./mock');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 790 }, deviceScaleFactor: 1.2, isMobile: true, hasTouch: true });
  await setup(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://admin.local/'); await p.waitForTimeout(800);
  await p.screenshot({ path: 'probe1.png' });
  await p.click('text=Mahsulotlar'); await p.waitForTimeout(600);
  await p.screenshot({ path: 'probe2.png' });
  await p.click('text=+ Yangi mahsulot'); await p.waitForTimeout(400);
  await p.screenshot({ path: 'probe3.png' });
  const info = await p.evaluate(() => { const mb = document.querySelector('.modal-body'); const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [s, Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    return { mbScroll: mb && mb.scrollHeight, mbClient: mb && mb.clientHeight, docH: document.documentElement.scrollHeight, modal: r('.modal'), body: r('.modal-body'), foot: r('.modal-foot'), add: r('.img-add'), labels: [...document.querySelectorAll('.modal label')].map(l => { const b = l.getBoundingClientRect(); return [l.textContent.trim().slice(0, 22), Math.round(b.x), Math.round(b.y), Math.round(b.width)]; }) }; });
  console.log(JSON.stringify(info));
  await b.close();
})();
