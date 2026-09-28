import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import { api, imageUrl } from '../lib/api';

const EMPTY = { title: '', titleRu: '', image: '', productId: '', isActive: true, sortOrder: 0 };

export default function Stories() {
  const [list, setList] = useState(null);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.stories().then(setList);
  useEffect(() => {
    load();
    api.products().then(setProducts);
  }, []);

  async function remove(s) {
    if (!confirm(`«${s.title}» storyni o‘chirasizmi?`)) return;
    await api.deleteStory(s.id);
    load();
  }

  const pName = (id) => products.find((p) => p.id === id)?.name;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Storylar</h1>
        <button className="btn primary" onClick={() => setEditing({ ...EMPTY })}>
          + Yangi story
        </button>
      </div>
      <p className="muted small">Mini App bosh sahifasining tepasidagi doiralar. Mahsulotga bog‘lansa — «Mahsulotni ko‘rish» tugmasi chiqadi.</p>
      {!list && <div className="muted">Yuklanmoqda…</div>}
      <div className="story-grid">
        {list?.map((s) => (
          <div className={`story-card ${s.isActive ? '' : 'inactive'}`} key={s.id}>
            <img src={imageUrl(s.image, 320)} alt="" onClick={() => setEditing({ ...s, productId: s.productId ?? '' })} />
            <div className="story-body">
              <b>{s.title}</b>
              {s.productId && <span className="muted small">🔗 {pName(s.productId) || '#' + s.productId}</span>}
              {!s.isActive && <span className="muted small">Yashirin</span>}
              <div className="row gap">
                <button className="btn ghost sm" onClick={() => setEditing({ ...s, productId: s.productId ?? '' })}>
                  ✎
                </button>
                <button className="btn text sm" onClick={() => remove(s)}>
                  O‘chirish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <StoryForm
          story={editing}
          products={products}
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

function StoryForm({ story, products, onClose, onSaved }) {
  const [f, setF] = useState(story);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api.upload(file, 'stories');
      setF((x) => ({ ...x, image: r.path }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      if (story.id) await api.updateStory(story.id, f);
      else await api.createStory(f);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={story.id ? 'Storyni tahrirlash' : 'Yangi story'}
      onClose={onClose}
      footer={
        <>
          {error && <div className="error grow">{error}</div>}
          <button className="btn primary" onClick={save} disabled={busy}>
            Saqlash
          </button>
        </>
      }
    >
      <div className="story-upload" onClick={() => input.current?.click()}>
        {f.image ? <img src={imageUrl(f.image, 480)} alt="" /> : <span>{busy ? 'Yuklanmoqda…' : '+ Rasm yuklash (tik rasm yaxshi)'}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <div className="form-grid">
        <label>
          Sarlavha (o‘zbekcha) *
          <input className="input" value={f.title} onChange={set('title')} />
        </label>
        <label>
          Sarlavha (ruscha)
          <input className="input" value={f.titleRu || ''} onChange={set('titleRu')} />
        </label>
        <label className="span2">
          Mahsulotga bog‘lash
          <select className="input" value={f.productId} onChange={set('productId')}>
            <option value="">Bog‘lanmagan</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.article} — {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Faol
        </label>
        <label>
          Tartib
          <input className="input" inputMode="numeric" value={f.sortOrder} onChange={set('sortOrder')} />
        </label>
      </div>
    </Modal>
  );
}
