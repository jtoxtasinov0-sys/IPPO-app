// Bosh sahifadagi kategoriya rasmlari: o'z rasmini yuklash, joylash yoki avtomatikka qaytarish
import { useEffect, useRef, useState } from 'react';
import ImageEditor from './ImageEditor';
import { api, imageUrl, frameStyle } from '../lib/api';

export default function CategoryCovers({ value, onChange }) {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null);
  const input = useRef(null);
  const target = useRef(null);

  useEffect(() => {
    api.meta().then((m) => setCats(m.categories || [])).catch(() => {});
    api.products().then(setProducts).catch(() => {});
  }, []);

  // Rasm yuklanmagan bo'lsa — Mini App shu kategoriyadagi birinchi mahsulot rasmini ko'rsatadi
  const auto = (key) => products.find((p) => p.category === key && p.isActive !== false && p.images?.length)?.images[0];

  function pick(key) {
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
      onChange({ ...value, [key]: { image: r.path, frame: { z: 1, x: 50, y: 50 } } });
      setEditing(key);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  function reset(key) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  const cur = editing && value[editing];

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <div className="cover-grid">
        {cats.map((c) => {
          const own = value[c.key];
          const src = own?.image || auto(c.key);
          return (
            <div className="cover-cell" key={c.key}>
              <div className="cover-thumb" onClick={() => (own ? setEditing(c.key) : pick(c.key))}>
                {src ? (
                  <img src={imageUrl(src, 320)} alt="" style={own ? frameStyle(own.frame) : undefined} />
                ) : (
                  <span className="cover-empty">{c.emoji || '🖼'}</span>
                )}
                <span className={'cover-tag' + (own ? ' own' : '')}>{own ? 'O‘z rasmi' : 'Avtomatik'}</span>
              </div>
              <div className="cover-name">{c.uz}</div>
              <div className="img-actions">
                <button type="button" onClick={() => pick(c.key)} disabled={busy === c.key} title="Rasm yuklash">
                  {busy === c.key ? '…' : '⤒'}
                </button>
                <button type="button" onClick={() => setEditing(c.key)} disabled={!own} title="Joylash">
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
      {cur && (
        <ImageEditor
          src={cur.image}
          frame={cur.frame}
          aspect="1 / 1"
          title="Kategoriya rasmi"
          hint="Bosh sahifadagi kategoriya kartochkasida qanday ko‘rinishi."
          onClose={() => setEditing(null)}
          onSave={(frame) => {
            onChange({ ...value, [editing]: { ...cur, frame } });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
