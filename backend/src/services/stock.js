// Ombor: buyurtmada qoldiqni ayirish, bekor qilinsa qaytarish (tranzaksiya ichida)

// items: [{productId, qty}] — tx: prisma tranzaksiya klienti
async function takeStock(tx, items) {
  const perProduct = new Map();
  for (const it of items) perProduct.set(it.productId, (perProduct.get(it.productId) || 0) + it.qty);

  const short = [];
  for (const [productId, qty] of perProduct) {
    // stock null = cheklanmagan — tegilmaydi
    const res = await tx.product.updateMany({
      where: { id: productId, stock: { not: null, gte: qty } },
      data: { stock: { decrement: qty } },
    });
    if (res.count === 0) {
      const p = await tx.product.findUnique({ where: { id: productId }, select: { stock: true, name: true } });
      if (p && p.stock !== null) short.push({ productId, name: p.name, available: Math.max(0, p.stock) });
    }
  }
  if (short.length) {
    const err = new Error('stock');
    err.short = short;
    throw err;
  }
}

async function returnStock(tx, items) {
  const perProduct = new Map();
  for (const it of items || []) perProduct.set(it.productId, (perProduct.get(it.productId) || 0) + (it.qty || 0));
  for (const [productId, qty] of perProduct) {
    await tx.product.updateMany({
      where: { id: productId, stock: { not: null } },
      data: { stock: { increment: qty } },
    });
  }
}

// Bekor qilingan buyurtma qayta tiklansa — qoldiq yana ayriladi (manfiyga tushmaydi)
async function retakeStock(tx, items) {
  for (const it of items || []) {
    const p = await tx.product.findUnique({ where: { id: it.productId }, select: { stock: true } });
    if (!p || p.stock === null) continue;
    await tx.product.update({ where: { id: it.productId }, data: { stock: Math.max(0, p.stock - (it.qty || 0)) } });
  }
}

module.exports = { takeStock, returnStock, retakeStock };
