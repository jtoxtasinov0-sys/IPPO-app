import { useEffect, useState } from 'react';
import { api, formatDate } from '../lib/api';

export default function Users() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api.users(q).then(setList), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [q]);

  async function toggleAdmin(u) {
    const next = !u.isAdmin;
    if (!confirm(next ? `${u.firstName || u.telegramId} admin qilinsinmi? Unga buyurtma xabarlari boradi.` : 'Adminlikdan olinsinmi?')) return;
    const r = await api.setAdmin(u.id, next).catch((e) => alert(e.message));
    if (r) setList((l) => l.map((x) => (x.id === u.id ? { ...x, isAdmin: r.isAdmin } : x)));
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Mijozlar {list && <span className="count">{list.length}</span>}</h1>
      </div>
      <input className="input mb" placeholder="Qidirish: ism, @username, telefon" value={q} onChange={(e) => setQ(e.target.value)} />
      {!list && <div className="muted">Yuklanmoqda…</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Mijoz</th>
              <th>Telefon</th>
              <th>Til</th>
              <th>Buyurtma</th>
              <th>Qo‘shilgan</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {list?.map((u) => {
              const isTg = /^\d+$/.test(u.telegramId);
              return (
                <tr key={u.id}>
                  <td>
                    <b>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</b>
                    <div className="muted small">
                      {isTg ? (
                        <a href={`tg://user?id=${u.telegramId}`}>{u.username ? '@' + u.username : 'ID ' + u.telegramId}</a>
                      ) : (
                        '🌐 Sayt'
                      )}
                      {u.isBlocked && ' · 🚫 botni bloklagan'}
                    </div>
                  </td>
                  <td>{u.phone ? <a href={`tel:${u.phone}`}>{u.phone}</a> : '—'}</td>
                  <td>{u.lang.toUpperCase()}</td>
                  <td>{u._count?.orders || 0}</td>
                  <td className="small">{formatDate(u.createdAt)}</td>
                  <td>
                    {isTg && (
                      <label className="switch">
                        <input type="checkbox" checked={u.isAdmin} onChange={() => toggleAdmin(u)} />
                        <span />
                      </label>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
