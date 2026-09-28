// Admin API: JWT token, Telegram ichidan parolsiz kirish, qayta urinish
const PROD_API_URL = 'https://ippo-app.onrender.com';
export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : 'http://localhost:5000')
).replace(/\/+$/, '');

export const tg = window.Telegram?.WebApp;
export const isTelegram = !!(tg && tg.initData);

const KEY = 'ippo_admin_token';
export const token = {
  get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(v) {
    try {
      v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY);
    } catch {}
  },
};

const logoutSubs = new Set();
export const onLogout = (fn) => (logoutSubs.add(fn), () => logoutSubs.delete(fn));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DELAYS = [1500, 3000, 6000, 10000, 15000];

export async function request(path, { method = 'GET', body, form } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      const t = token.get();
      res = await fetch(API_URL + path, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
          ...(isTelegram && !t ? { 'X-Telegram-Init-Data': tg.initData } : {}),
        },
        body: form || (body ? JSON.stringify(body) : undefined),
      });
    } catch {
      if (attempt < DELAYS.length) {
        await sleep(DELAYS[attempt]);
        continue;
      }
      throw new Error('Server bilan aloqa yo‘q');
    }
    if ([502, 503, 504].includes(res.status) && attempt < DELAYS.length) {
      await sleep(DELAYS[attempt]);
      continue;
    }
    const data = await res.json().catch(() => null);
    if (res.status === 401 && !path.includes('/login')) {
      token.set(null);
      logoutSubs.forEach((fn) => fn());
    }
    if (!res.ok) throw Object.assign(new Error(data?.error || `Xatolik (${res.status})`), { status: res.status, data });
    return data;
  }
}

export const api = {
  login: (username, password) => request('/api/admin/login', { method: 'POST', body: { username, password } }),
  tgLogin: () => request('/api/admin/tg-login', { method: 'POST', body: { initData: tg.initData } }),
  meta: () => request('/api/admin/meta'),
  stats: () => request('/api/admin/stats'),
  orders: (params = {}) => request('/api/admin/orders?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v))),
  updateOrder: (id, body) => request(`/api/admin/orders/${id}`, { method: 'PATCH', body }),
  deleteOrder: (id) => request(`/api/admin/orders/${id}`, { method: 'DELETE' }),
  clearOrders: () => request('/api/admin/orders/clear', { method: 'POST', body: { confirm: 'TOZALASH' } }),
  products: () => request('/api/admin/products'),
  createProduct: (body) => request('/api/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => request(`/api/admin/products/${id}`, { method: 'PUT', body }),
  patchProduct: (id, body) => request(`/api/admin/products/${id}`, { method: 'PATCH', body }),
  deleteProduct: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' }),
  upload: (file, folder = 'products') => {
    const form = new FormData();
    form.append('folder', folder);
    form.append('file', file);
    return request('/api/admin/upload', { method: 'POST', form });
  },
  stories: () => request('/api/admin/stories'),
  createStory: (body) => request('/api/admin/stories', { method: 'POST', body }),
  updateStory: (id, body) => request(`/api/admin/stories/${id}`, { method: 'PUT', body }),
  deleteStory: (id) => request(`/api/admin/stories/${id}`, { method: 'DELETE' }),
  users: (q) => request('/api/admin/users' + (q ? `?q=${encodeURIComponent(q)}` : '')),
  setAdmin: (id, isAdmin) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: { isAdmin } }),
  broadcast: (body) => request('/api/admin/broadcast', { method: 'POST', body }),
  broadcastStatus: () => request('/api/admin/broadcast'),
  settings: () => request('/api/admin/settings'),
  saveSettings: (body) => request('/api/admin/settings', { method: 'PUT', body }),
};

export function imageUrl(path, width) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return API_URL + path + (width ? `?w=${width}` : '');
}

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

export const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} ₩`;

export function formatDate(d) {
  const dt = new Date(d);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(dt.getDate())}.${p(dt.getMonth() + 1)}.${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

export const ORDER_STATUS = {
  new: 'Yangi',
  confirmed: 'Tasdiqlangan',
  shipped: 'Yo‘lda',
  delivered: 'Yetkazilgan',
  cancelled: 'Bekor qilingan',
};
export const PAY_STATUS = {
  unpaid: 'To‘lanmagan',
  pending: 'Chek tekshirilmoqda',
  paid: 'To‘langan',
  rejected: 'Rad etilgan',
};
