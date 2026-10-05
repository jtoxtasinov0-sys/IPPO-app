// Savatcha: narxlar serverda qayta hisoblanadi (/api/cart/calculate)
import { useEffect, useState } from 'react';
import Img from '../components/Img';
import Icon from '../components/Icon';
import { api } from '../lib/api';
import { cart, useCart } from '../lib/store';
import { useI18n } from '../lib/i18n';
import { money, firstOrderInfo, firstOrderDiscount } from '../lib/format';
import { haptic } from '../lib/telegram';

const keyOf = (productId, variant) => `${productId}|${variant || ''}`;

export default function Cart({ products, config, user, market, mode, onCatalog, onCheckout, onOpen, refreshKey }) {
  const { t, pick } = useI18n();
  const items = useCart();
  const [calc, setCalc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!items.length) {
      setCalc(null);
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      api
        .calculate(items, market, mode)
        .then((r) => alive && (setCalc(r), setError(false)))
        .catch(() => alive && setError(true));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [items, refreshKey, market, mode]);

  if (!items.length) {
    return (
      <div className="page">
        <h1 className="page-title">{t.cart}</h1>
        <div className="empty">
          <div className="empty-ic">
            <Icon name="bag" size={32} />
          </div>
          <h3>{t.cartEmpty}</h3>
          <p>{t.cartEmptySub}</p>
          <button className="btn primary" onClick={onCatalog}>
            {t.toCatalog}
          </button>
        </div>
      </div>
    );
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const lineMap = new Map((calc?.lines || []).map((l) => [keyOf(l.productId, l.variant), l]));
  const problemMap = new Map((calc?.problems || []).map((pr) => [keyOf(pr.productId, pr.variant), pr]));
  const hasBlocking = (calc?.problems || []).length > 0;
  const first = firstOrderInfo(user, config?.markets?.find((m) => m.key === market), mode);
  const firstDisc = calc ? firstOrderDiscount(first, calc.subtotal) : 0;

  // Optom: keyingi chegirma bosqichigacha qancha qolgani (bitta mahsulotning barcha turlari birga)
  const tiers = mode === 'wholesale' ? [...(config?.wholesaleTiers || [])].sort((a, b) => a.min - b.min) : [];
  const qtyOf = (productId) => items.filter((i) => i.productId === productId).reduce((s, i) => s + i.qty, 0);
  function nextTier(productId) {
    const q = qtyOf(productId);
    const cur = tiers.filter((x) => q >= x.min).pop();
    const next = tiers.find((x) => q < x.min && x.pct > (cur?.pct || 0));
    return next ? t.tierMore(next.min - q, next.pct) : null;
  }

  function problemText(pr) {
    if (!pr) return null;
    if (pr.reason === 'noPrice') return t.noPrice;
    if (pr.reason === 'stock') return t.onlyLeft(pr.available);
    if (pr.reason === 'outOfStock') return t.outOfStock;
    return t.unavailable;
  }

  // Muammoli qatorlarni tuzatish: yetarli bo'lmasa — qoldiqqa tushiriladi, mavjud bo'lmasa — o'chiriladi
  function fixProblems() {
    for (const pr of calc?.problems || []) {
      const item = items.find((i) => i.productId === pr.productId && (i.variant || null) === (pr.variant || null));
      const it = item || items.find((i) => i.productId === pr.productId);
      if (!it) continue;
      if (pr.reason === 'stock' && pr.available > 0) cart.setQty(it.productId, it.variant, pr.available);
      else cart.remove(it.productId, it.variant);
    }
  }

  return (
    <div className="page cart">
      <h1 className="page-title">{t.cart}</h1>
      <div className="cart-list">
        {items.map((it) => {
          const p = byId.get(it.productId);
          const line = lineMap.get(keyOf(it.productId, it.variant));
          const pr = problemMap.get(keyOf(it.productId, it.variant)) || (!line && calc ? problemMap.get(keyOf(it.productId, null)) : null);
          const image = line?.image || p?.images?.[0];
          const title = line ? pick(line, 'name') : p ? pick(p, 'name') : `#${it.productId}`;
          const max = p?.stock != null ? p.stock : 99;
          return (
            <div className={`cart-item ${pr ? 'has-problem' : ''}`} key={keyOf(it.productId, it.variant)}>
              <button className="cart-thumb" onClick={() => p && onOpen(p)}>
                <Img src={image} width={320} alt="" />
              </button>
              <div className="cart-info">
                <div className="cart-name">{title}</div>
                {it.variant && <div className="cart-variant">{it.variant}</div>}
                {pr && <div className="cart-problem">{problemText(pr)}</div>}
                {!pr && line?.discountPct > 0 && <div className="cart-discount">−{line.discountPct}% · {money(line.unitPrice)}</div>}
                {!pr && tiers.length > 0 && nextTier(it.productId) && <div className="cart-tier-hint">{nextTier(it.productId)}</div>}
                <div className="cart-row">
                  <div className="cart-price">{line ? money(line.lineTotal) : p?.price ? money(p.price * it.qty) : '—'}</div>
                  <div className="stepper sm">
                    <button
                      onClick={() => {
                        haptic('light');
                        cart.setQty(it.productId, it.variant, it.qty - 1);
                      }}
                      aria-label="-"
                    >
                      <Icon name={it.qty <= 1 ? 'trash' : 'minus'} size={16} stroke={2.1} />
                    </button>
                    <span>{it.qty}</span>
                    <button
                      disabled={it.qty >= max}
                      onClick={() => {
                        haptic('light');
                        cart.setQty(it.productId, it.variant, it.qty + 1);
                      }}
                      aria-label="+"
                    >
                      <Icon name="plus" size={16} stroke={2.1} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="alert">
          {t.errorNetwork}
        </div>
      )}

      {calc && (
        <div className="summary card">
          <div className="sum-row">
            <span>{t.subtotal}</span>
            <span>{money(calc.subtotal)}</span>
          </div>
          {calc.savings > 0 && (
            <div className="sum-row">
              <span>{t.savings}</span>
              <span className="green">−{money(calc.savings)}</span>
            </div>
          )}
          {firstDisc > 0 && (
            <div className="sum-row">
              <span>{t.firstOrder}</span>
              <span className="green">−{money(firstDisc)}</span>
            </div>
          )}
          <div className="sum-row">
            <span>{t.delivery}</span>
            <span className={calc.deliveryFee ? '' : 'green'}>{calc.deliveryFee ? money(calc.deliveryFee) : t.free}</span>
          </div>
          {calc.deliveryFee > 0 && calc.freeFrom > 0 && (
            <div className="sum-hint">{t.freeLeft(money(calc.freeFrom - calc.subtotal), money(calc.freeFrom))}</div>
          )}
          {first && !firstDisc && calc.subtotal > 0 && (
            <div className="sum-hint">{t.firstOrderLeft(money(first.minOrder - calc.subtotal), first.percent)}</div>
          )}
          <div className="sum-row total">
            <span>{t.total}</span>
            <span>{money(calc.total - firstDisc)}</span>
          </div>
        </div>
      )}

      <div className="sticky-cta">
        {hasBlocking ? (
          <>
            <div className="cta-note">{t.cartHasProblems}</div>
            <button className="btn dark block lg" onClick={fixProblems}>
              <Icon name="check" size={18} /> {t.fixCart}
            </button>
          </>
        ) : (
          <button className="btn primary block lg" disabled={!calc || !calc.lines.length} onClick={() => onCheckout(calc)}>
            {t.checkout} {calc ? `· ${money(calc.total - firstDisc)}` : ''}
          </button>
        )}
      </div>
    </div>
  );
}
