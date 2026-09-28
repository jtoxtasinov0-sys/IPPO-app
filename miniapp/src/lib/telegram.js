// Telegram WebApp: ishga tushirish, haptic, Orqaga tugmasi
import { useEffect, useRef } from 'react';

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
export const isTelegram = !!(tg && tg.initData);
export const initData = isTelegram ? tg.initData : '';
export const tgUser = isTelegram ? tg.initDataUnsafe?.user : null;

export function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.('#1E1006');
    tg.setBackgroundColor?.('#FAF6EF');
    tg.setBottomBarColor?.('#FFFFFF');
    tg.disableVerticalSwipes?.();
  } catch {}
}

export function haptic(kind = 'light') {
  try {
    const h = tg?.HapticFeedback;
    if (!h) return;
    if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind);
    else if (kind === 'select') h.selectionChanged();
    else h.impactOccurred(kind);
  } catch {}
}

export function openLink(url) {
  if (/^https:\/\/t\.me\//.test(url) && tg?.openTelegramLink && isTelegram) return tg.openTelegramLink(url);
  if (tg?.openLink && isTelegram) return tg.openLink(url);
  window.open(url, '_blank', 'noopener');
}

// Orqaga tugmasi: ochiq oynalar stek bo'lib turadi, eng yuqoridagisi yopiladi
const stack = [];
let bound = false;
function dispatch() {
  const top = stack[stack.length - 1];
  top?.current?.();
}
function sync() {
  if (!bound && typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => e.key === 'Escape' && dispatch());
    if (isTelegram) tg.BackButton?.onClick(dispatch);
    bound = true;
  }
  if (!isTelegram || !tg.BackButton) return;
  stack.length ? tg.BackButton.show() : tg.BackButton.hide();
}

export function useBackButton(active, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const entry = ref;
    stack.push(entry);
    sync();
    return () => {
      const i = stack.lastIndexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      sync();
    };
  }, [active]);
}
