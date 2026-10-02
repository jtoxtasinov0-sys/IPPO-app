// YANGI-MAHSULOTLAR papkasidagi rasmlarni o'qiydi, nomidan narxlarni ajratadi
// va TEKSHIRUV.csv yaratadi. Hech narsani o'zgartirmaydi va yuklamaydi.
// Nom formati: "Mahsulot nomi kr optom-dona uz optom-dona (2).jpg"
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const IMG = /\.(jpe?g|png|webp)$/i;

// "25 000" / "25.000" / "25000" -> 25000; bo'sh yoki xato -> NaN
const num = (s) => {
  const clean = String(s || '').replace(/[\s.,]/g, '');
  return /^\d+$/.test(clean) ? Number(clean) : NaN;
};

// "kr 25000-30000" -> { optom, dona }
function parsePrices(text, code) {
  const m = new RegExp(`(?:^|[\\s;])${code}\\s*(\\d[\\d.,]*)\\s*-\\s*(\\d[\\d.,]*)`, 'i').exec(text);
  return m ? { optom: num(m[1]), dona: num(m[2]) } : null;
}

// "Qizil jenshen kr 35000-49000 uz 850000-1200000 (2).jpg" (";" bilan ham bo'ladi)
function parseFile(file) {
  const noExt = file.replace(IMG, '');
  const base = noExt.replace(/\s*\(\d+\)\s*$/, ''); // (1), (2) ni olib tashlaymiz
  const order = Number((/\((\d+)\)\s*$/.exec(noExt) || [])[1] || 0);
  const name = base.split(/;|\s(?=(?:kr|uz)\s*\d)/i)[0].trim();
  const kr = parsePrices(base, 'kr');
  const uz = parsePrices(base, 'uz');
  return { name, order, kr, uz, hasKr: !!kr, hasUz: !!uz };
}

function readDescription(dir, name) {
  const f = path.join(dir, name + '.txt');
  if (!fs.existsSync(f)) return { uz: '', ru: '' };
  const [uz, ru = ''] = fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/^\s*---RU---\s*$/m);
  return { uz: uz.trim(), ru: ru.trim() };
}

const products = [];
const errors = [];

const folders = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const folder of folders) {
  const category = folder.replace(/^\d+[-_.\s]*/, '');
  const dir = path.join(ROOT, folder);
  const groups = new Map();

  for (const file of fs.readdirSync(dir).filter((f) => IMG.test(f))) {
    const p = parseFile(file);
    const key = p.name.toLowerCase();
    if (!groups.has(key)) groups.set(key, { name: p.name, files: [], prices: [] });
    const g = groups.get(key);
    g.files.push({ file, order: p.order });
    if (p.hasKr || p.hasUz) g.prices.push({ file, ...p });
    if (!p.name) errors.push(`${folder}/${file}: mahsulot nomi yo'q`);
  }

  for (const g of groups.values()) {
    g.files.sort((a, b) => a.order - b.order || a.file.localeCompare(b.file));
    const src = g.prices[0];
    const label = `${folder}/${g.name}`;
    if (!src) {
      errors.push(`${label}: narx yozilmagan ( kr optom-dona uz optom-dona )`);
    } else {
      if (!src.kr) errors.push(`${label}: kr narxi yo'q yoki noto'g'ri — namuna: kr 25000-30000`);
      if (!src.uz) errors.push(`${label}: uz narxi yozilmagan — O'zbekistonda «Narxini so'rang» chiqadi (namuna: uz 230000-280000)`);
      for (const [code, pr] of [['KR', src.kr], ['UZ', src.uz]]) {
        if (!pr) continue;
        if (Number.isNaN(pr.optom) || Number.isNaN(pr.dona)) errors.push(`${label}: ${code} narxida raqam emas belgi bor`);
        else if (pr.optom && pr.dona && pr.optom > pr.dona)
          errors.push(`${label}: ${code} optom (${pr.optom}) donadan (${pr.dona}) qimmat — joyi almashganmi?`);
      }
      // bir mahsulotning rasmlarida har xil narx yozilgan bo'lsa
      const sig = (p) => JSON.stringify([p.kr, p.uz]);
      if (g.prices.some((p) => sig(p) !== sig(src))) errors.push(`${label}: rasmlarida har xil narx yozilgan`);
    }
    const desc = readDescription(dir, g.name);
    products.push({
      category,
      name: g.name,
      images: g.files.map((f) => `${folder}/${f.file}`),
      krOptom: src?.kr?.optom,
      krDona: src?.kr?.dona,
      uzOptom: src?.uz?.optom,
      uzDona: src?.uz?.dona,
      description: desc.uz,
      descriptionRu: desc.ru,
    });
  }
}

// Excel uchun CSV (";" ajratuvchi, UTF-8 BOM — o'zbekcha harflar buzilmasin)
const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const header = ['Kategoriya', 'Nomi', 'KR optom ₩', 'KR dona ₩', 'UZ optom so\'m', 'UZ dona so\'m', 'Rasmlar soni', 'Tavsif bor'];
const rows = products.map((p) =>
  [p.category, p.name, p.krOptom, p.krDona, p.uzOptom, p.uzDona, p.images.length, p.description ? 'ha' : 'yo\'q'].map(cell).join(';')
);
fs.writeFileSync(path.join(ROOT, 'TEKSHIRUV.csv'), '﻿' + [header.map(cell).join(';'), ...rows].join('\r\n'));
fs.writeFileSync(path.join(ROOT, 'mahsulotlar.json'), JSON.stringify(products, null, 2));

console.log(`\nTopildi: ${products.length} ta mahsulot, ${products.reduce((s, p) => s + p.images.length, 0)} ta rasm\n`);
for (const p of products)
  console.log(`  [${p.category}] ${p.name}  |  KR ${p.krOptom ?? '-'} / ${p.krDona ?? '-'} ₩  |  UZ ${p.uzOptom ?? '-'} / ${p.uzDona ?? '-'} so'm  |  ${p.images.length} rasm`);

if (errors.length) {
  console.log(`\n!!! ${errors.length} ta xato — tuzatib, qayta ishga tushiring:\n`);
  for (const e of errors) console.log('  - ' + e);
} else if (products.length) {
  console.log('\nHammasi to\'g\'ri! TEKSHIRUV.csv ni Excel\'da ochib ko\'rishingiz mumkin.');
}
