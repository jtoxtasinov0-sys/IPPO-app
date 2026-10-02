// Mahsulot oynasi: rasmlar, turi, soni, tavsif
import { useEffect, useMemo, useRef, useState } from 'react';
import Sheet from './Sheet';
import Img from './Img';
import Icon from './Icon';
import PriceTag from './PriceTag';
import PhotoViewer from './PhotoViewer';
import { toast } from './Toast';
import { useI18n } from '../lib/i18n';
import { cart, useCart } from '../lib/store';
import { haptic, openLink } from '../lib/telegram';
import { money } from '../lib/format';

export default function ProductSheet({ product, config, market, onClose, onGoCart }) {
  const open = !!product;
  // Yopilish animatsiyasi paytida ham kontent turadi
  const [p, setP] = useState(product);
  useEffect(() => {
    if (product) setP(product);
  }, [product]);

  return (
    <Sheet open={open} onClose={onClose} full className="product-sheet">
      {p && <ProductBody key={p.id} p={p} config={config} market={market} onClose={onClose} onGoCart={onGoCart} />}
    </Sheet>
  );
}

function ProductBody({ p, config, market, onClose, onGoCart }) {
  const { t, pick, label } = useI18n();
  const items = useCart();
  const [variant, setVariant] = useState(p.variants?.[0] || null);
  const [qty, setQty] = useState(1);
  const [slide, setSlide] = useState(0);
  const [viewer, setViewer] = useState(null);
  const track = useRef(null);

  const images = p.images?.length ? p.images : [null];
  const variantMap = Array.isArray(p.imageVariants) ? p.imageVariants : [];
  const out = p.stock === 0;
  const inCart = items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
  const maxQty = p.stock != null ? Math.max(0, p.stock - inCart) : 99;
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
    if (qty > maxQty) return;
    cart.add(p.id, variant, qty);
    haptic('success');
    toast(t.added);
    setQty(1);
  }

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
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="-">
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
            <button className="btn primary grow" onClick={add} disabled={out || maxQty <= 0}>
              {out ? t.outOfStock : `${t.addToCart} · ${money(p.price * qty)}`}
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
