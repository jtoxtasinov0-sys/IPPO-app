import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Stories from './pages/Stories';
import Users from './pages/Users';
import Broadcast from './pages/Broadcast';
import Settings from './pages/Settings';
import { api, token, onLogout, isTelegram } from './lib/api';

const TABS = [
  { key: 'orders', label: 'Buyurtmalar', icon: '🧾' },
  { key: 'products', label: 'Mahsulotlar', icon: '🛍' },
  { key: 'stock', label: 'Ombor', icon: '📦' },
  { key: 'stories', label: 'Storylar', icon: '✨' },
  { key: 'users', label: 'Mijozlar', icon: '👥' },
  { key: 'broadcast', label: 'Rassilka', icon: '📣' },
  { key: 'settings', label: 'Sozlamalar', icon: '⚙️' },
];

function tabFromHash() {
  const h = window.location.hash.replace('#', '');
  return TABS.some((t) => t.key === h) ? h : 'orders';
}

export default function App() {
  const [authed, setAuthed] = useState(!!token.get());
  const [checking, setChecking] = useState(!token.get() && isTelegram);
  const [tab, setTab] = useState(tabFromHash);
  const [meta, setMeta] = useState(null);

  // Telegram ichidan ochilsa — parolsiz kirish
  useEffect(() => {
    if (token.get() || !isTelegram) return;
    api
      .tgLogin()
      .then((r) => {
        token.set(r.token);
        setAuthed(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => onLogout(() => setAuthed(false)), []);
  useEffect(() => {
    const fn = () => setTab(tabFromHash());
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    if (authed) api.meta().then(setMeta).catch(() => {});
  }, [authed]);

  if (checking) return <div className="center-screen">Yuklanmoqda…</div>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const go = (k) => {
    window.location.hash = k;
    setTab(k);
    window.scrollTo({ top: 0 });
  };

  const pages = {
    orders: <Orders meta={meta} />,
    products: <Products meta={meta} />,
    stock: <Stock />,
    stories: <Stories />,
    users: <Users />,
    broadcast: <Broadcast />,
    settings: <Settings />,
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="IPPO" />
          <span>Admin</span>
        </div>
        <nav>
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => go(t.key)}>
              <span className="ni">{t.icon}</span>
              <span className="nl">{t.label}</span>
            </button>
          ))}
        </nav>
        <button
          className="logout"
          onClick={() => {
            token.set(null);
            setAuthed(false);
          }}
        >
          Chiqish
        </button>
      </aside>
      <main className="content">{pages[tab]}</main>
    </div>
  );
}
