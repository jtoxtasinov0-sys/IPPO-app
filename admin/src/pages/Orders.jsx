// Buyurtmalar: statistika, filtr, holat va to'lov holatini o'zgartirish, chek, o'chirish
import { useCallback, useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { api, imageUrl, money, formatDate, ORDER_STATUS, PAY_STATUS, FLAG } from '../lib/api';

export default function Orders({ meta }) {
  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [q, setQ] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([api.orders({ status, payment, q }), api.stats()])
      .then(([o, s]) => {
        setOrders(o);
        setStats(s);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [status, payment, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    const iv = setInterval(load, 30_000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [load]);

  async function update(o, body) {
    const prev = orders;
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, ...body } : x)));
    try {
      await api.updateOrder(o.id, body);
      load();
    } catch (e) {
      setOrders(prev);
      alert(e.message);
    }
  }

  async function remove(o) {
    if (!confirm(`#${o.id} buyurtmani o‘chirasizmi? (Ombor qaytariladi)`)) return;
    await api.deleteOrder(o.id).catch((e) => alert(e.message));
    load();
  }

  async function clearAll() {
    const v = prompt('Barcha buyurtmalar o‘chadi va raqamlash #1 dan boshlanadi.\nTasdiqlash uchun TOZALASH deb yozing:');
    if (v !== 'TOZALASH') return;
    await api.clearOrders().catch((e) => alert(e.message));
    load();
  }

  const region = (key) => meta?.markets?.flatMap((m) => m.regions).find((r) => r.key === key)?.uz || key;
  const modeName = (k) => meta?.modes?.find((m) => m.key === k)?.uz || 'Dona';
  // Tushum davlat bo'yicha alohida: "120,000 ₩ · 3 500 000 so‘m"
  const revenue = (obj) =>
    Object.entries(obj || {})
      .filter(([, v]) => v > 0)
      .map(([m, v]) => money(v, m))
      .join(' · ') || money(0);
  const count = (k) => stats?.byStatus?.[k] || 0;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Buyurtmalar</h1>
        <button className="btn ghost sm" onClick={clearAll}>
          🗑 Hammasini tozalash
        </button>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat">
            <span>Bugun</span>
            <b>{stats.today}</b>
            <small>{revenue(stats.revenueToday)}</small>
          </div>
          <div className="stat">
            <span>Jami buyurtma</span>
            <b>{stats.total}</b>
            <small>{revenue(stats.revenue)}</small>
          </div>
          <div className={`stat ${stats.pendingReceipts ? 'warn' : ''}`}>
            <span>Chek kutmoqda</span>
            <b>{stats.pendingReceipts}</b>
            <small>tekshiring</small>
          </div>
          <div className="stat">
            <span>Mijozlar</span>
            <b>{stats.users}</b>
            <small>{stats.products} ta mahsulot</small>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="seg">
          <button className={!status ? 'on' : ''} onClick={() => setStatus('')}>
            Hammasi
          </button>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <button key={k} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>
              {v} {count(k) ? <em>{count(k)}</em> : null}
            </button>
          ))}
        </div>
        <div className="toolbar-row">
          <input className="input" placeholder="Qidirish: ism, telefon, #raqam" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">To‘lov: hammasi</option>
            {Object.entries(PAY_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {!orders && !error && <div className="muted">Yuklanmoqda…</div>}
      {orders && !orders.length && <div className="empty">Buyurtmalar yo‘q</div>}

      <div className="order-list">
        {orders?.map((o) => {
          const tid = o.user?.telegramId;
          const isTg = tid && /^\d+$/.test(tid);
          return (
            <div className={`order-card st-border-${o.status}`} key={o.id}>
              <div className="oc-head">
                <div>
                  <div className="oc-no">#{o.id}</div>
                  <div className="muted small">{formatDate(o.createdAt)}</div>
                  <div className="oc-market">
                    {FLAG[o.market]} {o.market === 'uz' ? 'O‘zbekiston' : 'Koreya'} · {modeName(o.mode)}
                  </div>
                </div>
                <div className="oc-total">{money(o.total, o.market)}</div>
              </div>

              <div className="oc-items">
                {o.items.map((it, i) => (
                  <div className="oc-item" key={i}>
                    <img src={imageUrl(it.image, 160)} alt="" />
                    <div>
                      <div className="oc-item-name">{it.name}</div>
                      <div className="muted small">
                        {it.article}
                        {it.variant ? ` · ${it.variant}` : ''} · {it.qty} × {money(it.unitPrice, o.market)}
                      </div>
                    </div>
                  </div>
                ))}
                {o.deliveryFee > 0 && <div className="muted small">🚚 Yetkazish: {money(o.deliveryFee, o.market)}</div>}
              </div>

              <div className="oc-customer">
                <div>
                  👤 <b>{o.customerName}</b>
                </div>
                <div>
                  📞 <a href={`tel:${o.phone}`}>{o.phone}</a>
                </div>
                <div>
                  📍 {region(o.region)}, {o.address}
                </div>
                {o.comment && <div>📝 {o.comment}</div>}
                <div>
                  {isTg ? (
                    <a href={`tg://user?id=${tid}`}>💬 Telegramda yozish{o.user.username ? ` (@${o.user.username})` : ''}</a>
                  ) : (
                    <span className="muted">🌐 Saytdan — telefon orqali bog‘laning</span>
                  )}
                </div>
              </div>

              <div className="oc-controls">
                <label>
                  Holat
                  <select className={`input st-${o.status}`} value={o.status} onChange={(e) => update(o, { status: e.target.value })}>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  To‘lov · {o.paymentMethod === 'card' ? '💳 Karta' : '💵 Naqd'}
                  <select
                    className={`input ps-${o.paymentStatus}`}
                    value={o.paymentStatus}
                    onChange={(e) => update(o, { paymentStatus: e.target.value })}
                  >
                    {Object.entries(PAY_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="oc-actions">
                {o.receiptUrl && (
                  <button className="btn ghost sm" onClick={() => setReceipt(o)}>
                    🧾 Chekni ko‘rish
                  </button>
                )}
                {o.paymentStatus === 'pending' && (
                  <>
                    <button className="btn success sm" onClick={() => update(o, { paymentStatus: 'paid' })}>
                      ✅ Tasdiqlash
                    </button>
                    <button className="btn danger-ghost sm" onClick={() => update(o, { paymentStatus: 'rejected' })}>
                      ❌ Rad etish
                    </button>
                  </>
                )}
                <button className="btn text sm right" onClick={() => remove(o)}>
                  O‘chirish
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {receipt && (
        <Modal title={`Chek — #${receipt.id}`} onClose={() => setReceipt(null)}>
          <img className="receipt-img" src={imageUrl(receipt.receiptUrl)} alt="Chek" />
          <div className="muted small">{receipt.receiptAt ? formatDate(receipt.receiptAt) : ''}</div>
          <div className="row gap mt">
            <button
              className="btn success"
              onClick={() => {
                update(receipt, { paymentStatus: 'paid' });
                setReceipt(null);
              }}
            >
              ✅ Tasdiqlash
            </button>
            <button
              className="btn danger-ghost"
              onClick={() => {
                update(receipt, { paymentStatus: 'rejected' });
                setReceipt(null);
              }}
            >
              ❌ Rad etish
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
