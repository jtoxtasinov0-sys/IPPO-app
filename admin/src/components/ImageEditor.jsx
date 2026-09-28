// Rasmni kartochkada joylash: kattalashtirish va markazni surish (sudrab yoki slayder bilan)
import { useRef, useState } from 'react';
import Modal from './Modal';
import { imageUrl, frameStyle } from '../lib/api';

export default function ImageEditor({ src, frame, onSave, onClose }) {
  const [f, setF] = useState({ z: 1, x: 50, y: 50, ...(frame || {}) });
  const drag = useRef(null);

  function onDown(e) {
    drag.current = { x: e.clientX, y: e.clientY, fx: f.x, fy: f.y, w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.x) / d.w) * 100;
    const dy = ((e.clientY - d.y) / d.h) * 100;
    const clamp = (n) => Math.max(0, Math.min(100, n));
    setF((p) => ({ ...p, x: clamp(d.fx - dx), y: clamp(d.fy - dy) }));
  }

  return (
    <Modal
      title="Rasmni joylash"
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
      <p className="muted small">Kartochkada (4:5) qanday ko‘rinishi. Rasmni sudrab suring.</p>
      <div className="frame-preview" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
        <img src={imageUrl(src, 800)} alt="" style={frameStyle(f)} draggable={false} />
      </div>
      <label className="range">
        Kattalashtirish: {f.z.toFixed(2)}×
        <input type="range" min="1" max="3" step="0.05" value={f.z} onChange={(e) => setF({ ...f, z: +e.target.value })} />
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
