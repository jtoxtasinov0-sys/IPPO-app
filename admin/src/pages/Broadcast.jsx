// Rassilka: matn + ixtiyoriy rasm. Avval sinov (faqat adminlarga)
import { useEffect, useRef, useState } from 'react';
import { api, imageUrl } from '../lib/api';

export default function Broadcast() {
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const input = useRef(null);

  useEffect(() => {
    api.broadcastStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (!status?.running) return;
    const t = setInterval(() => api.broadcastStatus().then(setStatus).catch(() => {}), 1500);
    return () => clearInterval(t);
  }, [status?.running]);

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api.upload(file, 'broadcast');
      setImage(r.path);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function send(test) {
    if (!test && !confirm('Xabar BARCHA mijozlarga yuboriladi. Davom etasizmi?')) return;
    setError('');
    try {
      setStatus(await api.broadcast({ text, image: image || null, test }));
    } catch (e) {
      setError(e.message);
    }
  }

  const pct = status?.total ? Math.round(((status.sent + status.failed) / status.total) * 100) : 0;

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>📣 Rassilka</h1>
      </div>
      <p className="muted small">Botdan foydalangan barcha mijozlarga xabar. Soniyasiga ~20 ta yuboriladi.</p>

      <label className="form-label">Xabar matni</label>
      <textarea className="input" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Masalan: 🎉 Yangi kollagenlar keldi! Do‘konni ochib ko‘ring 👇" />
      <div className="muted small right-text">{text.length} / {image ? 1024 : 4000}</div>

      <div className="bc-image">
        {image ? (
          <div className="bc-preview">
            <img src={imageUrl(image, 480)} alt="" />
            <button className="btn text sm" onClick={() => setImage('')}>
              Rasmni olib tashlash
            </button>
          </div>
        ) : (
          <button className="btn ghost" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? 'Yuklanmoqda…' : '🖼 Rasm qo‘shish (ixtiyoriy)'}
          </button>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="row gap mt">
        <button className="btn ghost" disabled={status?.running || (!text && !image)} onClick={() => send(true)}>
          🧪 Sinov (faqat adminlarga)
        </button>
        <button className="btn primary" disabled={status?.running || (!text && !image)} onClick={() => send(false)}>
          📣 Hammaga yuborish
        </button>
      </div>

      {status?.startedAt && (
        <div className="bc-status">
          <div className="row between">
            <b>{status.running ? 'Yuborilmoqda…' : 'Tugadi'}</b>
            <span className="muted small">{status.test ? 'Sinov' : 'Hammaga'}</span>
          </div>
          <div className="progress">
            <span style={{ width: pct + '%' }} />
          </div>
          <div className="muted small">
            ✅ {status.sent} yuborildi · ❌ {status.failed} yetmadi · jami {status.total}
          </div>
        </div>
      )}
    </div>
  );
}
