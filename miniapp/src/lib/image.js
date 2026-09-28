// Rasm manzili (kichik nusxa ?w=) va server uxlaganda qayta yuklash
import { API_URL } from './api';

export function imageUrl(path, width) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return API_URL + path + (width ? `?w=${width}` : '');
}

// Buzilgan rasmlar ro'yxati — server uyg'onganda darhol qayta yuklanadi
const broken = new Set();

export function retryImage(e) {
  const img = e.currentTarget;
  const base = img.dataset.src || img.src;
  if (!img.dataset.src) img.dataset.src = base;
  const n = Number(img.dataset.retry || 0);
  broken.add(img);
  // ~1 daqiqa davomida: 1.5s dan 25s gacha oraliq
  if (n >= 7) return;
  const delay = Math.min(25000, 1500 * 2 ** n);
  img.dataset.retry = String(n + 1);
  setTimeout(() => {
    if (!img.isConnected) return broken.delete(img);
    img.src = base + (base.includes('?') ? '&' : '?') + 'r=' + (n + 1);
  }, delay);
}

export function markLoaded(e) {
  broken.delete(e.currentTarget);
  e.currentTarget.classList.add('loaded');
}

export function reloadBrokenImages() {
  for (const img of broken) {
    if (!img.isConnected) {
      broken.delete(img);
      continue;
    }
    const base = img.dataset.src || img.src;
    img.src = base + (base.includes('?') ? '&' : '?') + 'r=' + Date.now();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reloadBrokenImages());
}

// Admin belgilagan joylashuv (zoom, markaz)
export function frameStyle(f) {
  if (!f) return undefined;
  const x = f.x ?? 50;
  const y = f.y ?? 50;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: f.z > 1 ? `scale(${f.z})` : undefined,
    transformOrigin: `${x}% ${y}%`,
  };
}
