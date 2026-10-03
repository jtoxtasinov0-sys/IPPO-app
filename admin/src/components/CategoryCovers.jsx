// Bosh sahifadagi kategoriya rasmlari: yuklash, mavjud mahsulot rasmidan tanlash, joylash yoki avtomatikka qaytarish
import { useEffect, useRef, useState } from 'react';
import ImageEditor from './ImageEditor';
import Modal from './Modal';
import { api, imageUrl, frameStyle } from '../lib/api';

const DEFAULT_FRAME = { z: 1, x: 50, y: 50 };

export default function CategoryCovers({ value, onChange }) {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null); // { key, image, frame }
  const [choosing, setChoosing] = useState(null); // kategoriya kaliti
  const input = useRef(null);
  const target = useRef(null);

  useEffect(() => {
    api.meta().then((m) => setCats(m.categories || [])).catch(() => {});
    api.products().then(setProducts).catch(() => {});
  }, []);

  // Rasm yuklanmagan bo'lsa — Mini App shu kategoriyadagi birinchi mahsulot rasmini ko'rsatadi
  const autoProduct = (key) => products.find((p) => p.category === key && p.isActive !== false && p.images?.length);
  const auto = (key) => autoProduct(key)?.images[0];

  function current(key) {
    const own = value[key];
    if (own) return { key, image: own.image, frame: own.frame || DEFAULT_FRAME };
    const p = autoProduct(key);
    return p ? { key, image: p.images[0], frame: p.imageFrames?.[0] || DEFAULT_FRAME } : null;
  }

  function pickFile(key) {
    target.current = key;
    input.current.value = '';
    input.current.click();
  }

  async function upload(file) {
    const key = target.current;
    if (!file || !key) return;
    setBusy(key);
    try {
      const r = await api.upload(file, 'categories');
      setEditing({ key, image: r.path, frame: DEFAULT_FRAME });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  function edit(key) {
    const c = current(key);
    if (c) setEditing(c);
    else setChoosing(key);
  }

  function reset(key) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <div className="cover-grid">
        {cats.map((c) => {
          const own = value[c.key];
          const src = own?.image || auto(c.key);
          return (
            <div className="cover-cell" key={c.key}>
              <div className="cover-thumb" onClick={() => edit(c.key)} title="Joylashni o‘zgartirish">
                {src ? (
                  <img src={imageUrl(src, 320)} alt="" style={own ? frameStyle(own.frame) : undefined} />
                ) : (
                  <span className="cover-empty">{c.emoji || '🖼'}</span>
                )}
                <span className={'cover-tag' + (own ? ' own' : '')}>{own ? 'Tanlangan' : 'Avtomatik'}</span>
              </div>
              <div className="cover-name">{c.uz}</div>
              <div className="img-actions">
                <button type="button" onClick={() => setChoosing(c.key)} title="Mahsulot rasmlaridan tanlash">
                  🖼
                </button>
                <button type="button" onClick={() => pickFile(c.key)} disabled={busy === c.key} title="Telefondan yuklash">
                  {busy === c.key ? '…' : '⤒'}
                </button>
                <button type="button" onClick={() => edit(c.key)} title="Joylash (kattalashtirish, surish)">
                  ✎
                </button>
                <button type="button" className="danger" onClick={() => reset(c.key)} disabled={!own} title="Avtomatikka qaytarish">
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {choosing && (
        <ProductImageChooser
          products={products}
          category={cats.find((c) => c.key === choosing)}
          onClose={() => setChoosing(null)}
          onPick={(image, frame) => {
            const key = choosing;
            setChoosing(null);
            setEditing({ key, image, frame: frame || DEFAULT_FRAME });
          }}
          onUpload={() => {
            const key = choosing;
            setChoosing(null);
            pickFile(key);
          }}
        />
      )}

      {editing && (
        <ImageEditor
          key={editing.key + editing.image}
          src={editing.image}
          frame={editing.frame}
          aspect="1 / 1"
          title="Kategoriya rasmi"
          hint="Bosh sahifadagi kategoriya kartochkasida qanday ko‘rinishi."
          onClose={() => setEditing(null)}
          onSave={(frame) => {
            onChange({ ...value, [editing.key]: { image: editing.image, frame } });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

// Barcha mahsulotlarning rasmlari: avval shu kategoriyadagilar, keyin qolganlari
function ProductImageChooser({ products, category, onPick, onClose, onUpload }) {
  const [q, setQ] = useState('');
  const match = (p) => !q || (p.name || '').toLowerCase().includes(q.toLowerCase());
  const withImgs = products.filter((p) => p.images?.length && match(p));
  const own = withImgs.filter((p) => p.category === category?.key);
  const rest = withImgs.filter((p) => p.category !== category?.key);

  const group = (title, list) =>
    list.length > 0 && (
      <>
        <div className="chooser-title">{title}</div>
        <div className="chooser-grid">
          {list.flatMap((p) =>
            p.images.map((src, i) => (
              <button type="button" key={p.id + ':' + i} className="chooser-item" onClick={() => onPick(src, p.imageFrames?.[i])}>
                <img src={imageUrl(src, 320)} alt="" loading="lazy" />
                <span>{p.name}</span>
              </button>
            ))
          )}
        </div>
      </>
    );

  return (
    <Modal
      wide
      title={`Rasm tanlash — ${category?.uz || ''}`}
      onClose={onClose}
      footer={
        <button className="btn" onClick={onUpload}>
          ⤒ Telefondan yuklash
        </button>
      }
    >
      <input className="input" placeholder="Mahsulot nomi bo‘yicha qidirish…" value={q} onChange={(e) => setQ(e.target.value)} />
      {group('Shu kategoriyadagi mahsulotlar', own)}
      {group('Boshqa mahsulotlar', rest)}
      {!withImgs.length && <p className="muted small">Rasmli mahsulot topilmadi.</p>}
    </Modal>
  );
}
