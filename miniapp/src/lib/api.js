// Server bilan aloqa: qayta urinish, "server uyg'onmoqda", Telegram yoki veb-token
import { isTelegram, initData } from './telegram';

// Vercel build'da localhost qolib ketmasligi uchun zaxira manzil
const PROD_API_URL = 'https://ippo-app.onrender.com';
export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : 'http://localhost:5000')
).replace(/\/+$/, '');

const TOKEN_KEY = 'ippo_web_token';
const wakingSubs = new Set();
let waking = false;

function setWaking(v) {
  if (waking === v) return;
  waking = v;
  wakingSubs.forEach((fn) => fn(v));
}
export function onWaking(fn) {
  wakingSubs.add(fn);
  return () => wakingSubs.delete(fn);
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function setToken(t) {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

let tokenPromise = null;
async function ensureWebToken(force = false) {
  if (isTelegram) return;
  if (!force && getToken()) return;
  if (!tokenPromise) {
    tokenPromise = request('/api/web/session', { method: 'POST' })
      .then((r) => setToken(r.token))
      .finally(() => (tokenPromise = null));
  }
  return tokenPromise;
}

function authHeaders() {
  if (isTelegram) return { 'X-Telegram-Init-Data': initData };
  const t = getToken();
  return t ? { 'X-Web-Token': t } : {};
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Render bepul reja uyg'onishi 1 daqiqadan oshishi mumkin — ~3 daqiqa urinib turamiz
const RETRY_WINDOW = 180_000;
const retryDelay = (n) => Math.min(10_000, 1500 * 1.5 ** n);
// Osilib qolgan GET so'rovni to'xtatib, qayta yuboramiz (buyurtma ikki marta ketmasligi uchun faqat GET)
const ATTEMPT_TIMEOUT = 30_000;

async function fetchWithTimeout(url, opts, timeout) {
  if (!timeout || typeof AbortController === 'undefined') return fetch(url, opts);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function request(path, { method = 'GET', body, form, auth = false } = {}) {
  if (auth) await ensureWebToken();
  let retried401 = false;
  const started = Date.now();
  const canRetry = () => Date.now() - started < RETRY_WINDOW;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetchWithTimeout(
        API_URL + path,
        {
          method,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(auth ? authHeaders() : {}),
          },
          body: form || (body ? JSON.stringify(body) : undefined),
        },
        method === 'GET' ? ATTEMPT_TIMEOUT : 0
      );
    } catch (e) {
      // Tarmoq xatosi yoki javob kelmadi — server uxlayotgan bo'lishi mumkin
      if (canRetry()) {
        setWaking(true);
        await sleep(retryDelay(attempt));
        continue;
      }
      setWaking(false);
      throw Object.assign(new Error('network'), { network: true });
    }
    if ([502, 503, 504].includes(res.status) && canRetry()) {
      setWaking(true);
      await sleep(retryDelay(attempt));
      continue;
    }
    setWaking(false);
    if (res.status === 401 && auth && !isTelegram && !retried401) {
      retried401 = true;
      await ensureWebToken(true);
      continue;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(data?.error || `HTTP ${res.status}`), { status: res.status, data });
    return data;
  }
}

export const api = {
  config: () => request('/api/config'),
  products: () => request('/api/products'),
  stories: () => request('/api/stories'),
  me: () => request('/api/me', { auth: true }),
  updateMe: (body) => request('/api/me', { method: 'PATCH', body, auth: true }),
  calculate: (items, market, mode) => request('/api/cart/calculate', { method: 'POST', body: { items, market, mode } }),
  createOrder: (body) => request('/api/orders', { method: 'POST', body, auth: true }),
  myOrders: () => request('/api/orders/my', { auth: true }),
  uploadReceipt: (id, file) => {
    const form = new FormData();
    form.append('receipt', file);
    return request(`/api/orders/${id}/receipt`, { method: 'POST', form, auth: true });
  },
};
