// Tanlangan davlat (App o'rnatadi) — money() valyutani shundan oladi
let currentMarket = 'kr';
export const setMoneyMarket = (m) => (currentMarket = m === 'uz' ? 'uz' : 'kr');

// kr -> "25,000 ₩", uz -> "250 000 so‘m"
export const money = (n, market = currentMarket) => {
  const v = Math.round(Number(n) || 0).toLocaleString('en-US');
  return market === 'uz' ? `${v.replace(/,/g, ' ')} so‘m` : `${v} ₩`;
};

// Davlat va savdo turiga mos narx (0 = narx kiritilmagan)
export function priceFor(p, market, mode) {
  if (market === 'uz') return (mode === 'wholesale' ? p.priceUzOptom : p.priceUz) || 0;
  return (mode === 'wholesale' ? p.priceOptom : p.price) || 0;
}

// Aksiya "N+M" (1+1, 2+1, 4+2 ...): {key, buy, free} yoki null — server ham xuddi shunday tekshiradi
export function parsePromo(s) {
  const m = String(s || '').match(/^\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*$/);
  if (!m) return null;
  const buy = +m[1];
  const free = +m[2];
  return buy >= 1 && free >= 1 && buy <= 20 && free <= 20 ? { key: `${buy}+${free}`, buy, free } : null;
}

// Shuncha donadan nechtasi bepul: har to'liq N+M to'plamda M ta, chala to'plamda N dan oshgani
export function promoFree(promo, qty) {
  if (!promo) return 0;
  const group = promo.buy + promo.free;
  return Math.floor(qty / group) * promo.free + Math.max(0, (qty % group) - promo.buy);
}

// Birinchi xarid chegirmasi (server ham qayta tekshiradi): faqat dona, yangi mijoz, summa chegaradan oshsa
export function firstOrderInfo(user, marketCfg, mode) {
  const f = marketCfg?.firstOrder;
  return user?.firstOrder && mode === 'retail' && f?.percent > 0 ? f : null;
}
export function firstOrderDiscount(info, subtotal) {
  return info && subtotal >= info.minOrder ? Math.floor((subtotal * info.percent) / 100) : 0;
}

export function formatDate(d, lang = 'uz') {
  const dt = new Date(d);
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

// Koreya: +82 10 1234 5678, O'zbekiston: +998 90 123 45 67 (boshqa davlat raqami ham qabul qilinadi)
export function formatPhone(raw, market = currentMarket) {
  let d = onlyDigits(raw).slice(0, 15);
  if (!d) return '';
  if (market === 'uz' && d.length <= 9 && !/^(998|0|82)/.test(d)) d = '998' + d;
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
