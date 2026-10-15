// Rasmni yuborishdan oldin telefonning o'zida kichraytirish (galereyadagi 5–10 MB rasm -> ~300 KB).
// Chek o'qilishi uchun 1600px yetarli. Xato bo'lsa — asl fayl yuboriladi.
async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  if (!file || !/^image\//.test(file.type || 'image/') || /gif|svg/.test(file.type)) return file;
  try {
    const img = await loadImage(file);
    const w0 = img.width || img.naturalWidth;
    const h0 = img.height || img.naturalHeight;
    if (!w0 || !h0) return file;
    const k = Math.min(1, maxSize / Math.max(w0, h0));
    const w = Math.round(w0 * k);
    const h = Math.round(h0 * k);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // PNG shaffof joylari qora bo'lib qolmasin
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    img.close?.();
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return blob;
  } catch {
    return file;
  }
}
