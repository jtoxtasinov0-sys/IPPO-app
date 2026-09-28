// Mahsulot qo'shish / tahrirlash
import { useState } from 'react';
import Modal from './Modal';
import ImagePicker from './ImagePicker';
import { api } from '../lib/api';

const EMPTY = {
  article: '',
  name: '',
  nameRu: '',
  brand: '',
  category: '',
  tag: '',
  volume: '',
  price: '',
  oldPrice: '',
  stock: '',
  variants: [],
  description: '',
  descriptionRu: '',
  images: [],
  imageFrames: [],
  imageVariants: [],
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

export default function ProductForm({ product, meta, nextArticle, onClose, onSaved }) {
  const [f, setF] = useState(() =>
    product
      ? {
          ...EMPTY,
          ...product,
          price: product.price || '',
          oldPrice: product.oldPrice ?? '',
          stock: product.stock ?? '',
          tag: product.tag || '',
          imageFrames: product.imageFrames || [],
          imageVariants: product.imageVariants || [],
        }
      : { ...EMPTY, article: nextArticle }
  );
  const [variantInput, setVariantInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  function addVariant() {
    const v = variantInput.trim();
    if (!v || f.variants.includes(v)) return setVariantInput('');
    setF({ ...f, variants: [...f.variants, v] });
    setVariantInput('');
  }
  function removeVariant(v) {
    setF({
      ...f,
      variants: f.variants.filter((x) => x !== v),
      imageVariants: (f.imageVariants || []).map((x) => (x === v ? null : x)),
    });
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const body = { ...f, tag: f.tag || null };
      const saved = product ? await api.updateProduct(product.id, body) : await api.createProduct(body);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const priceNum = parseInt(String(f.price).replace(/\D/g, ''), 10) || 0;

  return (
    <Modal
      wide
      title={product ? `Tahrirlash — ${product.article}` : 'Yangi mahsulot'}
      onClose={onClose}
      footer={
        <>
          {error && <div className="error grow">{error}</div>}
          <button className="btn text" onClick={onClose}>
            Bekor qilish
          </button>
          <button className="btn primary" onClick={save} disabled={busy}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </>
      }
    >
      <div className="form-section">
        <div className="form-label">Rasmlar (8 tagacha) — birinchisi asosiy</div>
        <ImagePicker
          images={f.images}
          frames={f.imageFrames}
          imageVariants={f.imageVariants}
          variants={f.variants}
          onChange={(x) => setF((prev) => ({ ...prev, ...x }))}
        />
      </div>

      <div className="form-grid">
        <label>
          Artikul *
          <input className="input" value={f.article} onChange={set('article')} placeholder="IP-021" />
        </label>
        <label>
          Brend
          <input className="input" value={f.brand || ''} onChange={set('brand')} placeholder="ANUA" />
        </label>
        <label className="span2">
          Nomi (o‘zbekcha) *
          <input className="input" value={f.name} onChange={set('name')} />
        </label>
        <label className="span2">
          Nomi (ruscha)
          <input className="input" value={f.nameRu || ''} onChange={set('nameRu')} />
        </label>
        <label>
          Kategoriya *
          <select className="input" value={f.category} onChange={set('category')}>
            <option value="">Tanlang</option>
            {meta?.categories?.map((c) => (
              <option key={c.key} value={c.key}>
                {c.uz}
              </option>
            ))}
          </select>
        </label>
        <label>
          Teg
          <select className="input" value={f.tag} onChange={set('tag')}>
            <option value="">Yo‘q</option>
            {meta?.tags?.map((t) => (
              <option key={t.key} value={t.key}>
                {t.uz}
              </option>
            ))}
          </select>
        </label>
        <label>
          Narx (₩) {priceNum === 0 && <em className="warn-text">— 0 bo‘lsa «Narxini so‘rang»</em>}
          <input className="input" inputMode="numeric" value={f.price} onChange={set('price')} placeholder="25000" />
        </label>
        <label>
          Eski narx (chizilgan)
          <input className="input" inputMode="numeric" value={f.oldPrice} onChange={set('oldPrice')} placeholder="ixtiyoriy" />
        </label>
        <label>
          Hajmi / o‘lchami
          <input className="input" value={f.volume || ''} onChange={set('volume')} placeholder="50 ml, 30 stik" />
        </label>
        <label>
          Ombor (dona)
          <input className="input" inputMode="numeric" value={f.stock} onChange={set('stock')} placeholder="bo‘sh = cheklanmagan" />
        </label>
      </div>

      <div className="form-section">
        <div className="form-label">Turlari (rang, ta’m, variant) — ixtiyoriy</div>
        <div className="variant-row">
          {f.variants.map((v) => (
            <span className="vchip" key={v}>
              {v}
              <button type="button" onClick={() => removeVariant(v)}>
                ✕
              </button>
            </span>
          ))}
          <input
            className="input xs"
            value={variantInput}
            onChange={(e) => setVariantInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
            placeholder="Masalan: Pushti"
          />
          <button type="button" className="btn ghost sm" onClick={addVariant}>
            + Qo‘shish
          </button>
        </div>
        {f.variants.length > 0 && <div className="muted small">Har bir rasm ostida qaysi turga tegishli ekanini tanlang.</div>}
      </div>

      <div className="form-grid">
        <label className="span2">
          Tavsif (o‘zbekcha)
          <textarea className="input" rows={5} value={f.description || ''} onChange={set('description')} />
        </label>
        <label className="span2">
          Tavsif (ruscha)
          <textarea className="input" rows={5} value={f.descriptionRu || ''} onChange={set('descriptionRu')} />
        </label>
        <label className="check">
          <input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Faol (do‘konda ko‘rinadi)
        </label>
        <label className="check">
          <input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Bosh sahifada (mashhur)
        </label>
        <label>
          Tartib raqami
          <input className="input" inputMode="numeric" value={f.sortOrder} onChange={set('sortOrder')} />
        </label>
      </div>
    </Modal>
  );
}
