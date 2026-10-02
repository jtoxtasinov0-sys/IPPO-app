// Bayroqlar SVG'da — Windows/Telegram Desktop'da emoji bayroq "UZ"/"KR" harfi bo'lib chiqadi
export default function Flag({ market, size = 20 }) {
  const h = Math.round(size * 0.7);
  if (market === 'uz') {
    return (
      <svg className="flag" width={size} height={h} viewBox="0 0 30 21" aria-label="O‘zbekiston">
        <rect width="30" height="7" fill="#1eb5e6" />
        <rect y="7" width="30" height="7" fill="#fff" />
        <rect y="14" width="30" height="7" fill="#1eb53a" />
        <rect y="6.6" width="30" height="0.8" fill="#ce1126" />
        <rect y="13.6" width="30" height="0.8" fill="#ce1126" />
        <circle cx="5.4" cy="3.5" r="2.4" fill="#fff" />
        <circle cx="6.3" cy="3.5" r="2.1" fill="#1eb5e6" />
        {[9, 11, 13].map((x) => (
          <circle key={x} cx={x} cy="3.5" r="0.55" fill="#fff" />
        ))}
      </svg>
    );
  }
  return (
    <svg className="flag" width={size} height={h} viewBox="0 0 30 21" aria-label="Koreya">
      <rect width="30" height="21" fill="#fff" />
      <g transform="translate(15 10.5) rotate(33.7)">
        <path d="M-5 0a5 5 0 0 1 10 0a2.5 2.5 0 0 1-5 0a2.5 2.5 0 0 0-5 0z" fill="#cd2e3a" />
        <path d="M-5 0a5 5 0 0 0 10 0a2.5 2.5 0 0 1-5 0a2.5 2.5 0 0 0-5 0z" fill="#0047a0" />
      </g>
      <g fill="#000">
        <rect x="3" y="3" width="4.4" height="0.9" transform="rotate(-56 5.2 3.4)" />
        <rect x="22.6" y="3" width="4.4" height="0.9" transform="rotate(56 24.8 3.4)" />
        <rect x="3" y="17" width="4.4" height="0.9" transform="rotate(56 5.2 17.4)" />
        <rect x="22.6" y="17" width="4.4" height="0.9" transform="rotate(-56 24.8 17.4)" />
      </g>
      <rect width="30" height="21" fill="none" stroke="rgba(0,0,0,.12)" />
    </svg>
  );
}
