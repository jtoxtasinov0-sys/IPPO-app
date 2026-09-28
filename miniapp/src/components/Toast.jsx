// Qisqa bildirishnomalar
import { useEffect, useState } from 'react';

const subs = new Set();
export function toast(text, kind = 'ok') {
  subs.forEach((fn) => fn({ text, kind, id: Date.now() + Math.random() }));
}

export default function Toaster() {
  const [item, setItem] = useState(null);
  useEffect(() => {
    const fn = (x) => setItem(x);
    subs.add(fn);
    return () => subs.delete(fn);
  }, []);
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => setItem(null), 2600);
    return () => clearTimeout(t);
  }, [item]);
  if (!item) return null;
  return (
    <div key={item.id} className={`toast ${item.kind}`} role="status">
      {item.text}
    </div>
  );
}
