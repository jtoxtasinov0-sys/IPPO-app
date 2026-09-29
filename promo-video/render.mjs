// IPPO promo videoni MP4 ga render qilish
// Ishlatish:  node render.mjs [chiqish.mp4] [--fps 30] [--ffmpeg /yo'l/ffmpeg]
//             node render.mjs --stills 0,5,12   (faqat tekshiruv kadrlari, PNG)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const fps = Number(opt('--fps', 30));
const ffmpeg = opt('--ffmpeg', process.env.FFMPEG || 'ffmpeg');
const stills = opt('--stills', null);
const out = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--')) || path.join(here, 'ippo-buyurtma.mp4');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?render');
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
await page.waitForTimeout(500);
const stage = await page.$('#stage');

if (stills) {
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate((t) => window.seek(t), s);
    const f = path.join(opt('--dir', here), `still_${String(s).replace('.', '_')}.png`);
    await stage.screenshot({ path: f });
    console.log(f);
  }
  await browser.close();
  process.exit(0);
}

const dur = await page.evaluate(() => window.DUR);
const total = Math.round(dur * fps);
const ff = spawn(ffmpeg, [
  '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.seek(t), i / fps);
  const buf = await stage.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${i}/${total}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('\nTayyor:', out);
