// Rasmni kartochkada joylash: ikki barmoq bilan kattalashtirish/kichraytirish,
// bir barmoq bilan surish (kompyuterda — sichqoncha g'ildiragi), slayderlar ham bor
import { useRef, useState } from 'react';
import Modal from './Modal';
import { imageUrl, frameStyle } from '../lib/api';

const Z_MIN = 1;
const Z_MAX = 4;
const clampZ = (z) => Math.max(Z_MIN, Math.min(Z_MAX, z));
const clamp100 = (n) => Math.max(0, Math.min(100, n));

export default function ImageEditor({ src, frame, onSave, onClose, aspect = '4 / 5', title = 'Rasmni joylash', hint }) {
  const [f, setF] = useState({ z: 1, x: 50, y: 50, ...(frame || {}) });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const latest = useRef(f);
  latest.current = f;

  // Barmoqlar soni o'zgarganda gestni yangidan boshlaymiz — rasm "sakramaydi"
  function startGesture(el, cur) {
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = { kind: 'pan', x: pts[0].x, y: pts[0].y, f: cur, w: el.clientWidth, h: el.clientHeight };
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = { kind: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, f: cur };
    } else {
      gesture.current = null;
    }
  }

  function onDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture(e.currentTarget, latest.current);
  }
  function onMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (g.kind === 'pinch' && pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setF((p) => ({ ...p, z: clampZ(g.f.z * (dist / g.dist)) }));
    } else if (g.kind === 'pan') {
      // Kattalashtirilganda surish sezgirligi kamayadi — barmoq ostidagi nuqta bilan yuradi
      const k = 100 / Math.max(1, g.f.z);
      const dx = ((pts[0].x - g.x) / g.w) * k;
      const dy = ((pts[0].y - g.y) / g.h) * k;
      setF((p) => ({ ...p, x: clamp100(g.f.x - dx), y: clamp100(g.f.y - dy) }));
    }
  }
  function onUp(e) {
    pointers.current.delete(e.pointerId);
    startGesture(e.currentTarget, latest.current);
  }
  function onWheel(e) {
    setF((p) => ({ ...p, z: clampZ(p.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)) }));
  }
  const zoomBy = (k) => setF((p) => ({ ...p, z: clampZ(+(p.z * k).toFixed(2)) }));

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn text" onClick={() => setF({ z: 1, x: 50, y: 50 })}>
            Asliga qaytarish
          </button>
          <button className="btn primary" onClick={() => onSave(f)}>
            Saqlash
          </button>
        </>
      }
    >
      <p className="muted small">
        {hint || 'Kartochkada qanday ko‘rinishi.'} Ikki barmoq bilan kattalashtiring yoki kichraytiring, bir barmoq bilan suring.
      </p>
      <div className="frame-wrap">
        <div
          className="frame-preview"
          style={{ aspectRatio: aspect }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
        >
          <img src={imageUrl(src, 800)} alt="" style={frameStyle(f)} draggable={false} />
        </div>
        <div className="zoom-btns">
          <button type="button" onClick={() => zoomBy(1.15)} disabled={f.z >= Z_MAX} aria-label="Kattalashtirish">
            +
          </button>
          <button type="button" onClick={() => zoomBy(1 / 1.15)} disabled={f.z <= Z_MIN} aria-label="Kichraytirish">
            −
          </button>
        </div>
      </div>
      <label className="range">
        Kattalashtirish: {f.z.toFixed(2)}×
        <input type="range" min={Z_MIN} max={Z_MAX} step="0.05" value={f.z} onChange={(e) => setF({ ...f, z: +e.target.value })} />
      </label>
      <label className="range">
        Gorizontal: {Math.round(f.x)}%
        <input type="range" min="0" max="100" value={f.x} onChange={(e) => setF({ ...f, x: +e.target.value })} />
      </label>
      <label className="range">
        Vertikal: {Math.round(f.y)}%
        <input type="range" min="0" max="100" value={f.y} onChange={(e) => setF({ ...f, y: +e.target.value })} />
      </label>
    </Modal>
  );
}
