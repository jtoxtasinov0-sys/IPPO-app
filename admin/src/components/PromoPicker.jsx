// Aksiya tanlash: tayyor tugmalar (1+1, 2+1, 3+1) yoki qo'lda "N+M" (masalan 4+1)
import { useEffect, useState } from 'react';

// Server bilan bir xil: "4 + 2" -> "4+2", noto'g'ri bo'lsa null
export function normPromo(s) {
  const m = String(s || '').match(/^\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*$/);
  if (!m) return null;
  const buy = +m[1];
  const free = +m[2];
  return buy >= 1 && free >= 1 && buy <= 20 && free <= 20 ? `${buy}+${free}` : null;
}

// compact — kartochkadagi kichik ko'rinish (4 ta bo'lim ustma-ust turadi)
export default function PromoPicker({ value, presets = [], onChange, withNone, compact }) {
  const custom = value && !presets.some((x) => x.key === value) ? value : '';
  const [draft, setDraft] = useState(custom);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    setDraft(custom);
    setBad(false);
  }, [custom]);

  function commit() {
    const s = draft.trim();
    if (!s) return custom && onChange(null);
    const key = normPromo(s);
    if (!key) return setBad(true);
    setDraft(key);
    if (key !== value) onChange(key);
  }

  return (
    <div className={`promo-picker ${compact ? 'compact' : ''}`}>
      {withNone && (
        <button type="button" className={!value ? 'on' : ''} onClick={() => onChange(null)}>
          Yo‘q
        </button>
      )}
      {presets.map((x) => (
        <button type="button" key={x.key} className={value === x.key ? 'on' : ''} onClick={() => onChange(value === x.key ? null : x.key)}>
          {x.key}
        </button>
      ))}
      <input
        className={`${custom ? 'on' : ''} ${bad ? 'bad' : ''}`}
        value={draft}
        inputMode="tel"
        placeholder={compact ? '✎' : '✎ boshqa'}
        title="Boshqa aksiya: masalan 4+1 yoki 2+2 (Enter — saqlash, bo‘sh qoldirsa — o‘chadi)"
        onChange={(e) => {
          setDraft(e.target.value);
          setBad(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
      />
    </div>
  );
}
