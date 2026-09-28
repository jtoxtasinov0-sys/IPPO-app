// Savatcha: [{productId, variant, qty}] — telefonda saqlanadi
import { useSyncExternalStore } from 'react';

const KEY = 'ippo_cart_v1';
const subs = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && i.productId && i.qty > 0) : [];
  } catch {
    return [];
  }
}

let items = load();

function commit(next) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  subs.forEach((fn) => fn());
}

const same = (a, productId, variant) => a.productId === productId && (a.variant || null) === (variant || null);

export const cart = {
  get: () => items,
  add(productId, variant, qty = 1) {
    const found = items.find((i) => same(i, productId, variant));
    if (found) commit(items.map((i) => (i === found ? { ...i, qty: Math.min(99, i.qty + qty) } : i)));
    else commit([...items, { productId, variant: variant || null, qty: Math.min(99, qty) }]);
  },
  setQty(productId, variant, qty) {
    if (qty <= 0) return cart.remove(productId, variant);
    commit(items.map((i) => (same(i, productId, variant) ? { ...i, qty: Math.min(99, qty) } : i)));
  },
  remove(productId, variant) {
    commit(items.filter((i) => !same(i, productId, variant)));
  },
  clear() {
    commit([]);
  },
  qtyOf(productId) {
    return items.filter((i) => i.productId === productId).reduce((s, i) => s + i.qty, 0);
  },
};

function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function useCart() {
  return useSyncExternalStore(subscribe, () => items);
}

export const cartCount = (list) => list.reduce((s, i) => s + i.qty, 0);
