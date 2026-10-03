// Rasmlar: yuklash, siqish, bazada zaxira, kichik nusxalar (?w=)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const prisma = require('../database/connection');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const THUMB_DIR = path.join(UPLOAD_DIR, '_thumbs');
const FOLDERS = ['products', 'stories', 'receipts', 'broadcast', 'categories'];
const THUMB_WIDTHS = [160, 320, 480, 800];

for (const f of [...FOLDERS, '_thumbs']) fs.mkdirSync(path.join(UPLOAD_DIR, f), { recursive: true });

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

// "/uploads/products/a.jpg" -> xavfsiz nisbiy yo'l "products/a.jpg"
function toRel(p) {
  const rel = String(p || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/?uploads\//, '')
    .split('?')[0];
  const norm = path.posix.normalize(rel);
  if (!norm || norm.startsWith('..') || norm.includes('\0') || path.isAbsolute(norm)) return null;
  return norm;
}

// Rasmni siqib diskka va bazaga yozadi, "/uploads/<folder>/<nom>" qaytaradi
async function saveImage(buffer, folder, { maxSize = 1600, quality = 84 } = {}) {
  if (!FOLDERS.includes(folder)) throw new Error('bad folder');
  const out = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  const name = `custom-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
  const rel = `${folder}/${name}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, rel), out);
  await prisma.storedFile
    .upsert({ where: { path: rel }, update: { data: out, mime: 'image/jpeg' }, create: { path: rel, data: out, mime: 'image/jpeg' } })
    .catch((e) => console.warn('[upload] zaxira yozilmadi:', e.message));
  return `/uploads/${rel}`;
}

// Faylni o'qiydi: avval diskdan, bo'lmasa bazadagi zaxiradan (va diskka qaytaradi)
async function readUpload(p) {
  const rel = toRel(p);
  if (!rel) return null;
  const abs = path.join(UPLOAD_DIR, rel);
  try {
    return await fs.promises.readFile(abs);
  } catch {
    const row = await prisma.storedFile.findUnique({ where: { path: rel } }).catch(() => null);
    if (!row) return null;
    const buf = Buffer.from(row.data);
    await fs.promises.mkdir(path.dirname(abs), { recursive: true }).catch(() => {});
    await fs.promises.writeFile(abs, buf).catch(() => {});
    return buf;
  }
}

// GET /uploads/... — ?w=480 bo'lsa WebP kichik nusxa
async function serveUploads(req, res) {
  const rel = toRel(decodeURIComponent(req.path));
  if (!rel || rel.startsWith('_thumbs')) return res.sendStatus(404);
  const w = parseInt(req.query.w, 10);
  const longCache = /(^|\/)custom-/.test(rel) || rel.startsWith('products/');
  res.set('Cache-Control', longCache ? 'public, max-age=31536000, immutable' : 'public, max-age=86400');

  try {
    if (THUMB_WIDTHS.includes(w)) {
      const thumbAbs = path.join(THUMB_DIR, String(w), rel + '.webp');
      try {
        const cached = await fs.promises.readFile(thumbAbs);
        return res.type('image/webp').send(cached);
      } catch {}
      const src = await readUpload(rel);
      if (!src) return res.sendStatus(404);
      const thumb = await sharp(src, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      await fs.promises.mkdir(path.dirname(thumbAbs), { recursive: true });
      fs.promises.writeFile(thumbAbs, thumb).catch(() => {});
      return res.type('image/webp').send(thumb);
    }
    const buf = await readUpload(rel);
    if (!buf) return res.sendStatus(404);
    res.type(MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream').send(buf);
  } catch (e) {
    console.warn('[uploads]', rel, e.message);
    res.sendStatus(500);
  }
}

module.exports = { upload, saveImage, readUpload, serveUploads, toRel, UPLOAD_DIR };
