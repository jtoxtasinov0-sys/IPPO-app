export const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} ₩`;

export function formatDate(d, lang = 'uz') {
  const dt = new Date(d);
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

// Koreya raqami: +82 10 1234 5678 (boshqa davlat raqami ham qabul qilinadi)
export function formatPhone(raw) {
  let d = onlyDigits(raw).slice(0, 15);
  if (!d) return '';
  if (d.startsWith('0')) d = '82' + d.slice(1);
  if (d.startsWith('82')) {
    const r = d.slice(2);
    return ('+82 ' + [r.slice(0, 2), r.slice(2, 6), r.slice(6, 10)].filter(Boolean).join(' ')).trim();
  }
  if (d.startsWith('998')) {
    const r = d.slice(3);
    return ('+998 ' + [r.slice(0, 2), r.slice(2, 5), r.slice(5, 7), r.slice(7, 9)].filter(Boolean).join(' ')).trim();
  }
  return '+' + d;
}
