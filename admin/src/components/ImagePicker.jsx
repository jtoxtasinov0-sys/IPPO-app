// 8 tagacha rasm: yuklash (tanlash yoki sudrab tashlash), tartib, turga biriktirish, joylash
import { useRef, useState } from 'react';
import ImageEditor from './ImageEditor';
import { api, imageUrl, frameStyle } from '../lib/api';

const MAX = 8;

export default function ImagePicker({ images, frames, imageVariants, variants, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [editing, setEditing] = useState(null);

  const emit = (imgs, frs, vars) => onChange({ images: imgs, imageFrames: frs, imageVariants: vars });
  const fr = (i) => frames?.[i] || { z: 1, x: 50, y: 50 };
  const vr = (i) => imageVariants?.[i] ?? null;

  async function upload(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, MAX - images.length);
    if (!list.length) return;
    setBusy(true);
    const imgs = [...images];
    const frs = images.map((_, i) => fr(i));
    const vars = images.map((_, i) => vr(i));
    try {
      for (const f of list) {
        const r = await api.upload(f, 'products');
        imgs.push(r.path);
        frs.push({ z: 1, x: 50, y: 50 });
        vars.push(null);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
      emit(imgs, frs, vars);
    }
  }

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const swap = (arr) => {
      const a = [...arr];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    };
    emit(swap(images), swap(images.map((_, k) => fr(k))), swap(images.map((_, k) => vr(k))));
  }

  function remove(i) {
    const keep = (_, k) => k !== i;
    emit(images.filter(keep), images.map((_, k) => fr(k)).filter(keep), images.map((_, k) => vr(k)).filter(keep));
  }

  function setVariant(i, v) {
    emit(images, images.map((_, k) => fr(k)), images.map((_, k) => (k === i ? v || null : vr(k))));
  }

  function setFrame(i, f) {
    emit(images, images.map((_, k) => (k === i ? f : fr(k))), images.map((_, k) => vr(k)));
  }

  return (
    <div>
      <div className="img-grid">
        {images.map((src, i) => (
          <div className="img-cell" key={src + i}>
            <div className="img-thumb" onClick={() => setEditing(i)} title="Joylashni o‘zgartirish">
              <img src={imageUrl(src, 320)} alt="" style={frameStyle(fr(i))} />
              {i === 0 && <span className="img-main">Asosiy</span>}
            </div>
            {variants.length > 0 && (
              <select className="input xs" value={vr(i) || ''} onChange={(e) => setVariant(i, e.target.value)}>
                <option value="">Turi: belgilanmagan</option>
                {variants.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            <div className="img-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>
                ←
              </button>
              <button type="button" onClick={() => setEditing(i)}>
                ✎
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                →
              </button>
              <button type="button" className="danger" onClick={() => remove(i)}>
                ✕
              </button>
            </div>
          </div>
        ))}
        {images.length < MAX && (
          <button
            type="button"
            className={`img-add ${over ? 'over' : ''}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              upload(e.dataTransfer.files);
            }}
            disabled={busy}
          >
            {busy ? 'Yuklanmoqda…' : '+ Rasm qo‘shish'}
            <small>yoki shu yerga tashlang</small>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ''))} />
      {editing !== null && images[editing] && (
        <ImageEditor
          src={images[editing]}
          frame={fr(editing)}
          onClose={() => setEditing(null)}
          onSave={(f) => {
            setFrame(editing, f);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
