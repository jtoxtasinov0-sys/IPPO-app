// Profil: ma'lumotlar, til, buyurtmalarim, bog'lanish
import { useEffect, useState } from 'react';
import Img from '../components/Img';
import Icon from '../components/Icon';
import { toast } from '../components/Toast';
import { api } from '../lib/api';
import { cart } from '../lib/store';
import { useI18n } from '../lib/i18n';
import { money, formatDate, formatPhone } from '../lib/format';
import { tgUser, openLink, haptic } from '../lib/telegram';
import Flag from '../components/Flag';

export default function Profile({ config, user, market, mode, onMarket, refreshKey, onPay, onGoCart, onRefreshUser }) {
  const { t, lang, setLang, label } = useI18n();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    onRefreshUser?.();
    api
      .myOrders()
      .then(setOrders)
      .catch(() => setError(true));
  }
  useEffect(load, [refreshKey]);

  const name = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || user?.firstName || t.guest;
  const username = tgUser?.username || user?.username;
  const phone = user?.phone;
  const photo = tgUser?.photo_url;
  const c = config?.company || {};

  function reorder(o) {
    for (const it of o.items || []) cart.add(it.productId, it.variant, it.qty);
    haptic('success');
    toast(t.added);
    onGoCart();
  }

  const cb = config?.markets?.find((m) => m.key === market)?.cashback;
  const balance = user?.cashback?.[market] || 0;

  const region = (key) => label(config?.markets?.flatMap((m) => m.regions).find((r) => r.key === key)) || key;

  return (
    <div className="page profile">
      <div className="profile-card">
        <div className="avatar">{photo ? <img src={photo} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}</div>
        <div className="profile-info">
          <div className="profile-name">{name}</div>
          <div className="profile-sub">
            {username && <span>@{username}</span>}
            {phone && <span>{formatPhone(phone)}</span>}
          </div>
        </div>
        <div className="lang-switch">
          {['uz', 'ru'].map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {(balance > 0 || cb?.percent > 0) && (
        <div className="cashback-card card">
          <div className="cashback-ic">
            <Icon name="gift" size={22} />
          </div>
          <div className="cashback-text">
            <div className="muted small">{t.cashbackBalance}</div>
            <b>{money(balance, market)}</b>
            {cb?.percent > 0 && <div className="muted small">{t.cashbackRule(cb.percent, cb.minOrder ? money(cb.minOrder, market) : null)}</div>}
          </div>
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{t.myOrders}</h2>
          {orders?.length > 0 && <span className="count-pill">{orders.length}</span>}
        </div>

        {error && (
          <div className="alert">
            {t.errorNetwork}{' '}
            <button className="link" onClick={load}>
              {t.retry}
            </button>
          </div>
        )}
        {!orders && !error && <div className="skeleton-list" />}
        {orders && !orders.length && (
          <div className="empty small">
            <div className="empty-ic">
              <Icon name="box" size={28} />
            </div>
            <p>{t.noOrders}</p>
          </div>
        )}

        <div className="orders">
          {orders?.map((o) => {
            const needsReceipt = o.paymentMethod === 'card' && ['unpaid', 'rejected'].includes(o.paymentStatus) && o.status !== 'cancelled';
            return (
              <div className="order card" key={o.id}>
                <div className="order-top">
                  <div>
                    <div className="order-no">#{o.id}</div>
                    <div className="muted small">{formatDate(o.createdAt, lang)}</div>
                  </div>
                  <span className={`status st-${o.status}`}>{t.status[o.status] || o.status}</span>
                </div>
                <div className="order-thumbs">
                  {o.items.slice(0, 5).map((it, i) => (
                    <div className="order-thumb" key={i}>
                      <Img src={it.image} width={160} alt="" />
                      {it.qty > 1 && <span>×{it.qty}</span>}
                    </div>
                  ))}
                  {o.items.length > 5 && <div className="order-thumb more">+{o.items.length - 5}</div>}
                </div>
                <div className="order-meta">
                  <span className="muted small">
                    <Flag market={o.market} size={14} /> {region(o.region)} · {t.modeName[o.mode] || ''} · {o.paymentMethod === 'card' ? t.card : t.payCashLabel}
                  </span>
                  {o.paymentMethod === 'card' && <span className={`pay-status ps-${o.paymentStatus}`}>{t.payStatus[o.paymentStatus]}</span>}
                </div>
                {(o.cashbackUsed > 0 || o.cashbackEarned > 0) && (
                  <div className="order-cashback small">
                    {o.cashbackUsed > 0 && <span>{t.cashbackUsedLine(money(o.cashbackUsed, o.market))}</span>}
                    {o.cashbackEarned > 0 && <span className="green">{t.cashbackEarnedLine(money(o.cashbackEarned, o.market))}</span>}
                  </div>
                )}
                <div className="order-bottom">
                  <div className="order-total">{money(o.total, o.market)}</div>
                  <div className="order-actions">
                    {needsReceipt && (
                      <button className="btn primary sm" onClick={() => onPay(o)}>
                        <Icon name="camera" size={16} /> {t.sendReceipt}
                      </button>
                    )}
                    <button className="btn ghost sm" onClick={() => reorder(o)}>
                      <Icon name="repeat" size={16} /> {t.reorder}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t.contacts}</h2>
        </div>
        <div className="contact-list card">
          {c.telegram && (
            <button onClick={() => openLink(`https://t.me/${c.telegram}`)}>
              <span className="ci">
                <Icon name="telegram" size={20} />
              </span>
              <span className="ct">
                <b>{t.writeAdmin}</b>
                <small>@{c.telegram}</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          )}
          {c.channel && (
            <button onClick={() => openLink(`https://t.me/${c.channel}`)}>
              <span className="ci">
                <Icon name="megaphone" size={20} />
              </span>
              <span className="ct">
                <b>{t.channel}</b>
                <small>@{c.channel}</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          )}
          {c.instagram && (
            <button onClick={() => openLink(`https://instagram.com/${c.instagram}`)}>
              <span className="ci">
                <Icon name="instagram" size={20} />
              </span>
              <span className="ct">
                <b>{t.instagram}</b>
                <small>@{c.instagram}</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/\s/g, '')}`}>
              <span className="ci">
                <Icon name="phone" size={20} />
              </span>
              <span className="ct">
                <b>{t.call}</b>
                <small>{c.phone}</small>
              </span>
              <Icon name="chevron" size={16} />
            </a>
          )}
          <button onClick={onMarket}>
            <span className="ci">
              <Icon name="globe" size={20} />
            </span>
            <span className="ct">
              <b>{t.marketAndMode}</b>
              <small>
                <Flag market={market} size={14} /> {t.marketName[market]} · {t.modeName[mode]}
              </small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
        <div className="brand-foot">
          <img src="/mark.png" alt="" />
          <span>IPPO by Fotima Zuhra · Made in Korea 🇰🇷</span>
        </div>
      </section>
    </div>
  );
}
