// Mahsulot oynasi: rasmlar, turi, soni, tavsif
import { useEffect, useMemo, useRef, useState } from 'react';
import Sheet from './Sheet';
import Img from './Img';
import Icon from './Icon';
import PriceTag from './PriceTag';
import PhotoViewer from './PhotoViewer';
import { toast } from './Toast';
import { flyToCart } from '../lib/flyToCart';
import { useI18n } from '../lib/i18n';
import { cart, useCart } from '../lib/store';
import { haptic, openLink } from '../lib/telegram';
import { money, promoFree, tierPctFor } from '../lib/format';

export default function ProductSheet({ product, config, market, mode, onClose, onGoCart }) {
  const open = !!product;
  // Yopilish animatsiyasi paytida ham kontent turadi
  const [p, setP] = useState(product);
  useEffect(() => {
    if (product) setP(product);
  }, [product]);

  return (
    <Sheet open={open} onClose={onClose} full className="product-sheet">
      {p && <ProductBody key={p.id} p={p} config={config} market={market} mode={mode} onClose={onClose} onGoCart={onGoCart} />}
    </Sheet>
  );
}

function ProductBody({ p, config, market, mode, onClose, onGoCart }) {
  const { t, pick, label } = useI18n();
  const items = useCart();
  const [variant, setVariant] = useState(p.variants?.[0] || null);
  // Optomda savatdagi bilan birga kamida p.minQty bo'lishi kerak — shundan boshlanadi
  const [qty, setQty] = useState(() => Math.max(1, (p.minQty || 1) - cart.qtyOf(p.id)));
  const [slide, setSlide] = useState(0);
  const [viewer, setViewer] = useState(null);
  const track = useRef(null);

  const images = p.images?.length ? p.images : [null];
  const variantMap = Array.isArray(p.imageVariants) ? p.imageVariants : [];
  const out = p.stock === 0;
  const inCart = items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
  const maxQty = p.stock != null ? Math.max(0, p.stock - inCart) : 99;
  const minQty = Math.max(1, (p.minQty || 1) - inCart);
  const tag = config?.tags?.find((x) => x.key === p.tag);
  const category = config?.categories?.find((c) => c.key === p.category);

  // Turini tanlaganda — o'sha turdagi rasmga o'tadi
  function chooseVariant(v) {
    setVariant(v);
    haptic('select');
    const i = variantMap.findIndex((x) => x === v);
    if (i >= 0 && track.current) track.current.scrollTo({ left: track.current.clientWidth * i, behavior: 'smooth' });
  }

  function onScroll(e) {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== slide) {
      setSlide(i);
      if (variantMap[i]) setVariant(variantMap[i]);
    }
  }

  function add() {
    if (qty > maxQty || qty < minQty) return;
    cart.add(p.id, variant, qty);
    haptic('success');
    toast(t.added);
    // Oyna yopilib, ko'rinib turgan rasm savatchaga "uchib" tushadi
    const img = track.current?.children[slide]?.querySelector('img');
    flyToCart(img);
    onClose();
  }

  // Optom: savatdagi bilan birga shu mahsulot soniga mos chegirma
  const tiers = mode === 'wholesale' ? config?.wholesaleTiers || [] : [];
  const tierPct = tierPctFor(tiers, inCart + qty);
  // Dona: savatdagi bilan birga optom minimumicha bo'lsa — optom narx
  const bulkOn = !!p.bulk && inCart + qty >= p.bulk.min;
  const unitNow = bulkOn ? p.bulk.price : tierPct ? Math.round(p.price * (1 - tierPct / 100)) : p.price;
  const bulkFill = p.bulk ? p.bulk.min - inCart : 0; // optom narxgacha shuncha tanlash kerak

  // Optom minimumdan kichik bosqichlar minimumga qo'shiladi (masalan minimum 5 bo'lsa, «3 ta» bosqich ko'rinmaydi)
  const tierRows = Object.values(
    tiers.reduce((acc, x) => {
      const n = Math.max(x.min, p.minQty || 1);
      if (!acc[n] || acc[n].pct < x.pct) acc[n] = { min: n, pct: x.pct };
      return acc;
    }, {})
  ).sort((a, b) => a.min - b.min);

  // Aksiya N+M: savatdagi bilan birga — shu qo'shilayotganlardan nechtasi bepul
  const promo = p.promo;
  const group = promo ? promo.buy + promo.free : 0;
  const freeNow = promoFree(promo, inCart + qty) - promoFree(promo, inCart);
  const rem = promo ? (inCart + qty) % group : 0;
  const fillQty = rem ? qty + group - rem : qty; // to'liq to'plamgacha

  const adminLink = `https://t.me/${config?.company?.telegram || 'fotimazuhrashop'}`;
  const description = pick(p, 'description');

  return (
    <>
      <div className="ps-scroll">
        <div className="ps-gallery">
          <div className="ps-track" ref={track} onScroll={onScroll}>
            {images.map((src, i) => (
              <div className="ps-slide" key={i} onClick={() => src && setViewer(i)}>
                <Img src={src} width={800} eager={i === 0} alt={pick(p, 'name')} />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <div className="dots">
              {images.map((_, i) => (
                <span key={i} className={i === slide ? 'on' : ''} />
              ))}
            </div>
          )}
          {tag && <span className={`badge tag-${tag.key} ps-badge`}>{label(tag)}</span>}
        </div>

        <div className="ps-info">
          <div className="ps-meta">
            {category && <span>{label(category)}</span>}
            {p.brand && <span>· {p.brand}</span>}
          </div>
          <h2 className="ps-title">{pick(p, 'name')}</h2>
          {p.volume && <div className="ps-volume">{p.volume}</div>}
          <PriceTag price={p.price} oldPrice={p.oldPrice} size="lg" />

          {p.packPrice > 0 && (
            <div className="ps-pack">
              <div className="ps-gift-head">
                <span className="ps-pack-ic">
                  <Icon name="box" size={20} />
                </span>
                <span>
                  <b>{t.packTitle(p.minQty)}</b>
                  <small>{t.packSub(money(p.price))}</small>
                </span>
              </div>
              <div className="ps-pack-sum">{t.packPrice(p.minQty, money(p.packPrice))}</div>
              {p.stock != null && p.stock < p.minQty && !out && <div className="ps-pack-warn">{t.minNoStock(p.minQty)}</div>}
            </div>
          )}

          {p.bulk && !out && (
            <div className={`ps-pack ${bulkOn ? 'on' : ''}`}>
              <div className="ps-gift-head">
                <span className="ps-pack-ic">
                  <Icon name="box" size={20} />
                </span>
                <span>
                  <b>{t.bulkTitle(p.bulk.min)}</b>
                  <small>{t.bulkSub(money(p.bulk.price))}</small>
                </span>
              </div>
              {(bulkOn || bulkFill <= maxQty) && (
                <div className="ps-gift-row">
                  {bulkOn ? (
                    <span className="ps-gift-free">{t.bulkOn}</span>
                  ) : (
                    <button
                      className="ps-gift-btn"
                      onClick={() => {
                        haptic('select');
                        setQty(bulkFill);
                      }}
                    >
                      {t.giftTake(bulkFill)}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'wholesale' && p.price > 0 && tierRows.length > 0 && (
            <div className="ps-tiers">
              <div className="ps-label">{t.tiersTitle}</div>
              {tierRows.map((x) => (
                <div key={x.min} className={`ps-tier ${inCart + qty >= x.min ? 'on' : ''}`}>
                  <span>{t.tierRow(x.min, x.pct)}</span>
                  <b>{money(Math.round(p.price * (1 - x.pct / 100)))}</b>
                </div>
              ))}
            </div>
          )}

          {promo && !out && (
            <div className="ps-gift">
              <div className="ps-gift-head">
                <span className="ps-gift-ic">
                  <Icon name="gift" size={20} />
                </span>
                <span>
                  <b>{t.giftTitle(promo.key)}</b>
                  <small>{t.giftRule(promo.buy, promo.free)}</small>
                </span>
              </div>
              {(freeNow > 0 || (rem > 0 && fillQty <= maxQty)) && (
                <div className="ps-gift-row">
                  {freeNow > 0 && <span className="ps-gift-free">🎁 {t.giftFree(freeNow)}</span>}
                  {rem > 0 && fillQty <= maxQty && (
                    <button
                      className="ps-gift-btn"
                      onClick={() => {
                        haptic('select');
                        setQty(fillQty);
                      }}
                    >
                      {rem >= promo.buy ? t.giftAddFree(group - rem) : t.giftTake(fillQty)}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {out ? (
            <div className="stock-note out">{t.outOfStock}</div>
          ) : (
            p.stock != null && p.stock <= 10 && <div className="stock-note">{t.inStock(p.stock)}</div>
          )}

          {p.variants?.length > 0 && (
            <div className="ps-block">
              <div className="ps-label">{t.variant}</div>
              <div className="chips wrap">
                {p.variants.map((v) => (
                  <button key={v} className={`chip ${variant === v ? 'on' : ''}`} onClick={() => chooseVariant(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {p.price > 0 && !out && (
            <div className="ps-block row-between">
              <div className="ps-label">{t.qty}</div>
              <div className="stepper">
                <button onClick={() => setQty((q) => Math.max(minQty, q - 1))} disabled={qty <= minQty} aria-label="-">
                  <Icon name="minus" size={18} stroke={2.2} />
                </button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="+">
                  <Icon name="plus" size={18} stroke={2.2} />
                </button>
              </div>
            </div>
          )}

          {description && (
            <div className="ps-block">
              <div className="ps-label">{t.description}</div>
              <p className="ps-desc">{description}</p>
            </div>
          )}

          <div className="ps-trust">
            <div>
              <Icon name="shield" size={18} /> {t.trustOriginal}
            </div>
            <div>
              <Icon name="truck" size={18} /> {market === 'uz' ? t.trustDeliveryUz : t.trustDelivery}
            </div>
          </div>
        </div>
      </div>

      <div className="ps-footer">
        {p.price > 0 ? (
          <>
            {inCart > 0 && (
              <button className="btn ghost" onClick={onGoCart}>
                <Icon name="bag" size={18} /> {inCart}
              </button>
            )}
            <button className="btn primary grow" onClick={add} disabled={out || maxQty <= 0 || minQty > maxQty}>
              {!out && <Icon name="bag" size={18} stroke={2.2} />}
              {out ? t.outOfStock : `${t.addToCart} · ${money(unitNow * (qty - freeNow))}`}
            </button>
          </>
        ) : (
          <button className="btn dark grow" onClick={() => openLink(adminLink)}>
            <Icon name="telegram" size={18} /> {t.askPriceBtn}
          </button>
        )}
      </div>

      {viewer !== null && <PhotoViewer images={p.images} index={viewer} onClose={() => setViewer(null)} />}
    </>
  );
}
