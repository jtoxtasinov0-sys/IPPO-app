// Sozlamalar: to'lov kartasi, yetkazish narxi, e'lon
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Settings() {
  const [f, setF] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.settings().then(setF).catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => {
    setSaved(false);
    setF({ ...f, [k]: e.target.value });
  };

  async function save() {
    setBusy(true);
    setError('');
    try {
      setF(await api.saveSettings(f));
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!f) return <div className="page">{error ? <div className="error">{error}</div> : <div className="muted">Yuklanmoqda…</div>}</div>;

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>⚙️ Sozlamalar</h1>
      </div>

      <section className="panel">
        <h3>💳 Kartaga o‘tkazma</h3>
        <p className="muted small">Karta/hisob raqami kiritilsa — Mini App'da «Kartaga o‘tkazma» usuli paydo bo‘ladi. Bo‘sh bo‘lsa faqat naqd.</p>
        <div className="form-grid">
          <label className="span2">
            Karta yoki hisob raqami
            <input className="input" value={f.cardNumber} onChange={set('cardNumber')} placeholder="1002-123-456789" />
          </label>
          <label>
            Bank nomi
            <input className="input" value={f.bankName} onChange={set('bankName')} placeholder="KB Kookmin, Shinhan, Woori…" />
          </label>
          <label>
            Egasi (ism familiya)
            <input className="input" value={f.cardHolder} onChange={set('cardHolder')} placeholder="FOTIMA ZUHRA" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>🚚 Yetkazib berish</h3>
        <div className="form-grid">
          <label>
            Yetkazish narxi (₩)
            <input className="input" inputMode="numeric" value={f.deliveryFee} onChange={set('deliveryFee')} placeholder="0 = bepul" />
          </label>
          <label>
            Shu summadan bepul (₩)
            <input className="input" inputMode="numeric" value={f.freeDeliveryFrom} onChange={set('freeDeliveryFrom')} placeholder="0 = chegara yo‘q" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>📢 Do‘kondagi e’lon</h3>
        <p className="muted small">Bosh sahifada ko‘rinadigan qisqa matn (bo‘sh bo‘lsa ko‘rinmaydi).</p>
        <input className="input" value={f.shopNote} onChange={set('shopNote')} placeholder="Masalan: Shu hafta barcha kollagenlarga −10%!" />
      </section>

      {error && <div className="error">{error}</div>}
      <div className="row gap">
        <button className="btn primary" onClick={save} disabled={busy}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        {saved && <span className="ok-text">✓ Saqlandi</span>}
      </div>
    </div>
  );
}
