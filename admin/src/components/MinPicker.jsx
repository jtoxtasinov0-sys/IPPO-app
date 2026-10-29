// Optom minimum tanlash: tayyor tugmalar (5, 6, 10) yoki qo'lda son (2 dan 99 gacha)
import { useEffect, useState } from 'react';

// Server bilan bir xil: 2..99 yoki null
export function normMin(v) {
  const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10);
  return n >= 2 && n <= 99 ? n : null;
}

// compact — kartochkadagi kichik ko'rinish
export default function MinPicker({ value, presets = [], onChange, withNone, compact }) {
  const custom = value && !presets.includes(value) ? String(value) : '';
  const [draft, setDraft] = useState(custom);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    setDraft(custom);
    setBad(false);
  }, [custom]);

  function commit() {
    const s = draft.trim();
    if (!s) return custom && onChange(null);
    const n = normMin(s);
    if (!n) return setBad(true);
    setDraft(String(n));
    if (n !== value) onChange(n);
  }

  return (
    <div className={`promo-picker min-picker ${compact ? 'compact' : ''}`}>
      {withNone && (
        <button type="button" className={!value ? 'on' : ''} onClick={() => onChange(null)}>
          Yo‘q
        </button>
      )}
      {presets.map((n) => (
        <button type="button" key={n} className={value === n ? 'on' : ''} onClick={() => onChange(value === n ? null : n)}>
          {n}
        </button>
      ))}
      <input
        className={`${custom ? 'on' : ''} ${bad ? 'bad' : ''}`}
        value={draft}
        inputMode="numeric"
        placeholder={compact ? '✎' : '✎ boshqa'}
        title="Boshqa son: masalan 8 yoki 12 (Enter — saqlash, bo‘sh qoldirsa — o‘chadi)"
        onChange={(e) => {
          setDraft(e.target.value.replace(/\D/g, '').slice(0, 2));
          setBad(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
      />
    </div>
  );
}
