import { useEffect, useMemo, useState } from 'react';
import ProductForm from '../components/ProductForm';
import { api, imageUrl, frameStyle, money } from '../lib/api';

export default function Products({ meta }) {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api
      .products()
      .then(setList)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (list || []).filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!s || [p.name, p.nameRu, p.article, p.brand].some((x) => String(x || '').toLowerCase().includes(s)))
    );
  }, [list, q, cat]);

  const nextArticle = useMemo(() => {
    const nums = (list || []).map((p) => parseInt(String(p.article).replace(/\D/g, ''), 10)).filter(Number.isFinite);
    return `IP-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
  }, [list]);

  async function toggle(p, field) {
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, [field]: !p[field] } : x)));
    await api.patchProduct(p.id, { [field]: !p[field] }).catch((e) => (alert(e.message), load()));
  }

  async function remove(p) {
    if (!confirm(`«${p.name}» o‘chirilsinmi? Buni qaytarib bo‘lmaydi.\n(Yashirish uchun «Faol» belgisini oling)`)) return;
    await api.deleteProduct(p.id).catch((e) => alert(e.message));
    load();
  }

  const catName = (k) => meta?.categories?.find((c) => c.key === k)?.uz || k;
  const noPrice = (list || []).filter((p) => !p.price && p.isActive).length;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Mahsulotlar {list && <span className="count">{list.length}</span>}</h1>
        <button className="btn primary" onClick={() => setEditing('new')}>
          + Yangi mahsulot
        </button>
      </div>

      {noPrice > 0 && (
        <div className="notice">
          ⚠️ {noPrice} ta mahsulotning narxi kiritilmagan — do‘konda «Narxini so‘rang» bo‘lib ko‘rinadi va savatchaga qo‘shib bo‘lmaydi.
        </div>
      )}

      <div className="toolbar-row">
        <input className="input" placeholder="Qidirish: nom, artikul, brend" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {meta?.categories?.map((c) => (
            <option key={c.key} value={c.key}>
              {c.uz}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}
      {!list && !error && <div className="muted">Yuklanmoqda…</div>}

      <div className="product-grid">
        {filtered.map((p) => (
          <div className={`product-card ${p.isActive ? '' : 'inactive'}`} key={p.id}>
            <div className="pc-img" onClick={() => setEditing(p)}>
              <img src={imageUrl(p.images[0], 320)} alt="" style={frameStyle(p.imageFrames?.[0])} />
              {!p.isActive && <span className="pc-flag">Yashirin</span>}
              {p.stock === 0 && <span className="pc-flag red">Tugagan</span>}
            </div>
            <div className="pc-body">
              <div className="muted small">
                {p.article} · {catName(p.category)}
              </div>
              <div className="pc-name" onClick={() => setEditing(p)}>
                {p.name}
              </div>
              <div className="pc-price">{p.price ? money(p.price) : <span className="warn-text">Narx yo‘q</span>}</div>
              <div className="muted small">Ombor: {p.stock == null ? '∞' : p.stock}</div>
              <div className="pc-toggles">
                <label className="switch">
                  <input type="checkbox" checked={p.isActive} onChange={() => toggle(p, 'isActive')} />
                  <span /> Faol
                </label>
                <label className="switch">
                  <input type="checkbox" checked={p.isFeatured} onChange={() => toggle(p, 'isFeatured')} />
                  <span /> Mashhur
                </label>
              </div>
              <div className="pc-actions">
                <button className="btn ghost sm" onClick={() => setEditing(p)}>
                  ✎ Tahrirlash
                </button>
                <button className="btn text sm" onClick={() => remove(p)}>
                  O‘chirish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          meta={meta}
          nextArticle={nextArticle}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
