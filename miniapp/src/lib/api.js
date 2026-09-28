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
const DELAYS = [1500, 3000, 5000, 8000, 12000, 15000];

export async function request(path, { method = 'GET', body, form, auth = false } = {}) {
  if (auth) await ensureWebToken();
  let retried401 = false;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(API_URL + path, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(auth ? authHeaders() : {}),
        },
        body: form || (body ? JSON.stringify(body) : undefined),
      });
    } catch (e) {
      // Tarmoq xatosi — server uxlayotgan bo'lishi mumkin
      if (attempt < DELAYS.length) {
        setWaking(true);
        await sleep(DELAYS[attempt]);
        continue;
      }
      setWaking(false);
      throw Object.assign(new Error('network'), { network: true });
    }
    if ([502, 503, 504].includes(res.status) && attempt < DELAYS.length) {
      setWaking(true);
      await sleep(DELAYS[attempt]);
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
  calculate: (items) => request('/api/cart/calculate', { method: 'POST', body: { items } }),
  createOrder: (body) => request('/api/orders', { method: 'POST', body, auth: true }),
  myOrders: () => request('/api/orders/my', { auth: true }),
  uploadReceipt: (id, file) => {
    const form = new FormData();
    form.append('receipt', file);
    return request(`/api/orders/${id}/receipt`, { method: 'POST', form, auth: true });
  },
};
