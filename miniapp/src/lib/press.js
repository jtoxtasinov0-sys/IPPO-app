// Har bir tugma bosilganda yumshoq "siqilish" animatsiyasi.
// composite: 'add' — elementning o'z transform'i (masalan, translateX) buzilmaydi.
const SELECTOR = 'button, a, [role="button"], .hero-card, .pcard';

export function initPressAnimation() {
  if (typeof window === 'undefined' || !Element.prototype.animate) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  let addOk = true;
  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = e.target.closest?.(SELECTOR);
      if (!el || el.disabled || el.closest('[data-no-press]')) return;
      // Kichik tugmalar ko'proq, katta kartalar kamroq siqiladi
      const big = el.offsetWidth > 200;
      const s = big ? 0.975 : 0.9;
      const frames = addOk
        ? [{ transform: 'scale(1)' }, { transform: `scale(${s})`, offset: 0.35 }, { transform: 'scale(1)' }]
        : null;
      try {
        el.animate(frames, { duration: big ? 320 : 380, easing: 'cubic-bezier(.34,1.56,.64,1)', composite: 'add' });
      } catch {
        addOk = false;
      }
    },
    { passive: true }
  );
}
