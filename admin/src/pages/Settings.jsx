// Sozlamalar: to'lov kartasi, yetkazish narxi, e'lon
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import CategoryCovers from '../components/CategoryCovers';

function parseCovers(raw) {
  try {
    return JSON.parse(raw || '{}') || {};
  } catch {
    return {};
  }
}

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

  // Kategoriya rasmlari darhol saqlanadi (alohida "Saqlash" shart emas)
  const [coverMsg, setCoverMsg] = useState('');
  async function saveCovers(next) {
    const raw = JSON.stringify(next);
    setF((prev) => ({ ...prev, categoryCovers: raw }));
    setCoverMsg('Saqlanmoqda…');
    try {
      const r = await api.saveSettings({ categoryCovers: raw });
      setF((prev) => ({ ...prev, categoryCovers: r.categoryCovers }));
      setCoverMsg('✓ Saqlandi');
    } catch (e) {
      setCoverMsg('');
      setError(e.message);
    }
  }

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
        <h3>🇺🇿 O‘zbekiston — karta</h3>
        <p className="muted small">O‘zbekistonni tanlagan mijozlar shu kartaga o‘tkazadi. Bo‘sh bo‘lsa — karta raqamini mijozga o‘zingiz yuborasiz.</p>
        <div className="form-grid">
          <label className="span2">
            Karta raqami
            <input className="input" value={f.cardNumberUz} onChange={set('cardNumberUz')} placeholder="8600 1234 5678 9012" />
          </label>
          <label>
            Bank / karta turi
            <input className="input" value={f.bankNameUz} onChange={set('bankNameUz')} placeholder="Uzcard, Humo, Visa…" />
          </label>
          <label>
            Egasi (ism familiya)
            <input className="input" value={f.cardHolderUz} onChange={set('cardHolderUz')} placeholder="FOTIMA ZUHRA" />
          </label>
          <label>
            Yetkazish narxi (so‘m)
            <input className="input" inputMode="numeric" value={f.deliveryFeeUz} onChange={set('deliveryFeeUz')} placeholder="0 = bepul" />
          </label>
          <label>
            Shu summadan bepul (so‘m)
            <input className="input" inputMode="numeric" value={f.freeDeliveryFromUz} onChange={set('freeDeliveryFromUz')} placeholder="0 = chegara yo‘q" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>🇰🇷 Koreya — karta</h3>
        <p className="muted small">Koreyani tanlagan mijozlar shu karta/hisobga o‘tkazadi. Bo‘sh bo‘lsa — karta raqamini mijozga o‘zingiz yuborasiz.</p>
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
        <h3>🇰🇷 Koreya — yetkazib berish</h3>
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
        <h3>🎉 Birinchi xarid chegirmasi</h3>
        <p className="muted small">
          Yangi mijozning birinchi buyurtmasiga (faqat dona bo‘limi) chegirma. Telefon raqami bo‘yicha bir marta beriladi. Bosh sahifada banner
          chiqadi. 0% — o‘chiq.
        </p>
        <div className="form-grid">
          <label>
            🇺🇿 Chegirma (%)
            <input className="input" inputMode="decimal" value={f.firstOrderPercentUz} onChange={set('firstOrderPercentUz')} placeholder="0 = o‘chiq" />
          </label>
          <label>
            🇺🇿 Shu summadan boshlab (so‘m)
            <input className="input" inputMode="numeric" value={f.firstOrderMinOrderUz} onChange={set('firstOrderMinOrderUz')} placeholder="0 = har qanday summa" />
          </label>
          <label>
            🇰🇷 Chegirma (%)
            <input className="input" inputMode="decimal" value={f.firstOrderPercent} onChange={set('firstOrderPercent')} placeholder="0 = o‘chiq" />
          </label>
          <label>
            🇰🇷 Shu summadan boshlab (₩)
            <input className="input" inputMode="numeric" value={f.firstOrderMinOrder} onChange={set('firstOrderMinOrder')} placeholder="0 = har qanday summa" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>🎁 Cashback</h3>
        <p className="muted small">
          To‘lov tasdiqlanganda mijoz balansiga mahsulotlar summasidan (yetkazishsiz) foiz qo‘shiladi. Balans Mini App profilida ko‘rinadi va keyingi
          xaridda summadan ayiriladi. Buyurtma bekor qilinsa yoki to‘lov rad etilsa — qaytariladi. 0% — o‘chiq.
        </p>
        <div className="form-grid">
          <label>
            🇺🇿 Cashback (%)
            <input className="input" inputMode="decimal" value={f.cashbackPercentUz} onChange={set('cashbackPercentUz')} placeholder="0 = o‘chiq" />
          </label>
          <label>
            🇺🇿 Shu summadan boshlab (so‘m)
            <input className="input" inputMode="numeric" value={f.cashbackMinOrderUz} onChange={set('cashbackMinOrderUz')} placeholder="0 = har xariddan" />
          </label>
          <label>
            🇰🇷 Cashback (%)
            <input className="input" inputMode="decimal" value={f.cashbackPercent} onChange={set('cashbackPercent')} placeholder="0 = o‘chiq" />
          </label>
          <label>
            🇰🇷 Shu summadan boshlab (₩)
            <input className="input" inputMode="numeric" value={f.cashbackMinOrder} onChange={set('cashbackMinOrder')} placeholder="0 = har xariddan" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>📦 Optom chegirmalari</h3>
        <p className="muted small">
          Optom bo‘limida bitta mahsulotdan (barcha turlari birga) shuncha dona olinsa, optom narxidan avtomatik chegirma qilinadi. 0 —
          chegirma yo‘q.
        </p>
        <div className="form-grid">
          {[3, 5, 10].map((n) => (
            <label key={n}>
              {n} ta va undan ko‘p (%)
              <input
                className="input"
                inputMode="decimal"
                value={f['wholesaleDiscount' + n]}
                onChange={set('wholesaleDiscount' + n)}
                placeholder="0"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>🖼 Kategoriya rasmlari {coverMsg && <span className="ok-text small">{coverMsg}</span>}</h3>
        <p className="muted small">
          Bosh sahifadagi kategoriya kartochkalari. Rasm tanlanmasa — shu kategoriyadagi birinchi mahsulot rasmi chiqadi. 🖼 — mahsulot rasmlaridan
          tanlash, ⤒ — telefondan yuklash, ✎ — kattalashtirish va surish, ✕ — avtomatikka qaytarish.
        </p>
        <CategoryCovers value={parseCovers(f.categoryCovers)} onChange={saveCovers} />
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
