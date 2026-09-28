// Ombor: har mahsulot qoldig'i (bo'sh = cheklanmagan) va narxni tez o'zgartirish
import { useEffect, useState } from 'react';
import { api, imageUrl } from '../lib/api';

export default function Stock() {
  const [list, setList] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState({});
  const [filter, setFilter] = useState('all');

  const load = () => api.products().then((l) => (setList(l), setDraft({})));
  useEffect(() => {
    load();
  }, []);

  const val = (p, k) => (draft[p.id]?.[k] !== undefined ? draft[p.id][k] : p[k] ?? '');
  const setVal = (p, k, v) => setDraft((d) => ({ ...d, [p.id]: { ...d[p.id], [k]: v } }));
  const dirty = (p) => draft[p.id] && Object.keys(draft[p.id]).some((k) => String(draft[p.id][k]) !== String(p[k] ?? ''));

  async function save(p) {
    setSaving((s) => ({ ...s, [p.id]: true }));
    try {
      const d = draft[p.id] || {};
      const body = {};
      if ('stock' in d) body.stock = d.stock === '' ? null : Math.max(0, parseInt(d.stock, 10) || 0);
      if ('price' in d) body.price = Math.max(0, parseInt(String(d.price).replace(/\D/g, ''), 10) || 0);
      const updated = await api.patchProduct(p.id, body);
      setList((l) => l.map((x) => (x.id === p.id ? updated : x)));
      setDraft((dr) => {
        const n = { ...dr };
        delete n[p.id];
        return n;
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving((s) => ({ ...s, [p.id]: false }));
    }
  }

  const bump = (p, n) => {
    const cur = val(p, 'stock');
    setVal(p, 'stock', String(Math.max(0, (parseInt(cur, 10) || 0) + n)));
  };

  const shown = (list || []).filter((p) =>
    filter === 'low' ? p.stock != null && p.stock <= 3 : filter === 'unlimited' ? p.stock == null : filter === 'noprice' ? !p.price : true
  );

  return (
    <div className="page">
      <div className="page-head">
        <h1>Ombor</h1>
      </div>
      <p className="muted small">
        Qoldiq bo‘sh bo‘lsa — cheklanmagan (hisoblanmaydi). Buyurtmada qoldiq avtomatik ayriladi, bekor qilinsa qaytariladi.
      </p>
      <div className="seg mb">
        {[
          ['all', 'Hammasi'],
          ['low', 'Kam qolgan (≤3)'],
          ['unlimited', 'Cheklanmagan'],
          ['noprice', 'Narxsiz'],
        ].map(([k, v]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
            {v}
          </button>
        ))}
      </div>
      {!list && <div className="muted">Yuklanmoqda…</div>}
      <div className="stock-list">
        {shown.map((p) => (
          <div className={`stock-row ${p.stock === 0 ? 'zero' : ''}`} key={p.id}>
            <img src={imageUrl(p.images[0], 160)} alt="" />
            <div className="stock-name">
              <b>{p.name}</b>
              <span className="muted small">{p.article}</span>
            </div>
            <label className="stock-field">
              Narx ₩
              <input className="input" inputMode="numeric" value={val(p, 'price') || ''} placeholder="0" onChange={(e) => setVal(p, 'price', e.target.value)} />
            </label>
            <div className="stock-field">
              Qoldiq
              <div className="stock-ctrl">
                <button onClick={() => bump(p, -1)}>−</button>
                <input className="input" inputMode="numeric" value={val(p, 'stock')} placeholder="∞" onChange={(e) => setVal(p, 'stock', e.target.value.replace(/\D/g, ''))} />
                <button onClick={() => bump(p, 1)}>+</button>
              </div>
            </div>
            <button className="btn primary sm" disabled={!dirty(p) || saving[p.id]} onClick={() => save(p)}>
              {saving[p.id] ? '…' : 'Saqlash'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
