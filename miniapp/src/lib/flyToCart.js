// "Savatga uchish": mahsulot rasmi kichrayib, egri yo'l bo'ylab pastdagi savatcha tugmasiga tushadi
export const CART_LAND = 'ippo:cart-land';

export function flyToCart(imgEl) {
  const target = document.querySelector('.nav-fab');
  const land = () => window.dispatchEvent(new Event(CART_LAND));
  if (!imgEl || !target || !Element.prototype.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    land();
    return;
  }
  const from = imgEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !from.height) return land();

  // Kvadrat "uchuvchi" nusxa: rasm markazidan olinadi
  const size = Math.min(from.width, from.height, 260);
  const sx = from.left + from.width / 2;
  const sy = from.top + from.height / 2;
  const ex = to.left + to.width / 2;
  const ey = to.top + to.height / 2;

  const fly = document.createElement('div');
  fly.className = 'fly-cart';
  Object.assign(fly.style, {
    width: size + 'px',
    height: size + 'px',
    left: sx - size / 2 + 'px',
    top: sy - size / 2 + 'px',
    backgroundImage: `url("${imgEl.currentSrc || imgEl.src}")`,
  });
  document.body.appendChild(fly);

  // Kvadratik Bezier: avval biroz tepaga ko'tarilib, keyin savatchaga sho'ng'iydi
  const cx = sx + (ex - sx) * 0.35;
  const cy = Math.min(sy, ey) - 120;
  const endScale = 30 / size;
  const frames = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex;
    const y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey;
    // Boshida biroz "pulsatsiya", keyin tez kichrayadi
    const s = t < 0.12 ? 1 + t * 0.6 : 1.07 - (1.07 - endScale) * Math.pow((t - 0.12) / 0.88, 0.75);
    frames.push({
      transform: `translate(${x - sx}px, ${y - sy}px) scale(${s}) rotate(${t * -18}deg)`,
      borderRadius: `${12 + t * 38}%`,
      opacity: t > 0.92 ? 0.6 : 1,
      offset: t,
    });
  }
  const anim = fly.animate(frames, { duration: 780, easing: 'cubic-bezier(.45,.05,.55,1)', fill: 'forwards' });
  anim.onfinish = () => {
    fly.remove();
    land();
  };
  anim.oncancel = () => fly.remove();
}
