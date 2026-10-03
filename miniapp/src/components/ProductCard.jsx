import Img from './Img';
import Icon from './Icon';
import PriceTag from './PriceTag';
import { useI18n } from '../lib/i18n';
import { cart } from '../lib/store';
import { haptic } from '../lib/telegram';
import { toast } from './Toast';
import { flyToCart } from '../lib/flyToCart';

export default function ProductCard({ p, tags, onOpen }) {
  const { t, pick, label } = useI18n();
  const out = p.stock === 0;
  const tag = tags?.find((x) => x.key === p.tag);
  const canQuickAdd = p.price > 0 && !out && !(p.variants?.length > 1);

  function quickAdd(e) {
    e.stopPropagation();
    if (!canQuickAdd) return onOpen(p);
    cart.add(p.id, p.variants?.[0] || null, 1);
    haptic('light');
    flyToCart(e.currentTarget.closest('.pcard')?.querySelector('.pcard-media img'));
    toast(t.added);
  }

  return (
    <article className={`pcard ${out ? 'is-out' : ''}`} onClick={() => onOpen(p)}>
      <div className="pcard-media">
        <Img src={p.images?.[0]} width={480} frame={p.imageFrames?.[0]} alt={pick(p, 'name')} />
        {tag && <span className={`badge tag-${tag.key}`}>{label(tag)}</span>}
        {out && <span className="out-label">{t.outOfStock}</span>}
        {!out && p.stock != null && p.stock > 0 && p.stock <= 5 && <span className="left-label">{t.left(p.stock)}</span>}
        {p.price > 0 && !out && (
          <button className="pcard-add" onClick={quickAdd} aria-label={t.addToCart}>
            <Icon name="plus" size={18} stroke={2.4} />
          </button>
        )}
      </div>
      <div className="pcard-body">
        {p.brand && <div className="pcard-brand">{p.brand}</div>}
        <h3 className="pcard-name">{pick(p, 'name')}</h3>
        {p.volume && <div className="pcard-vol">{p.volume}</div>}
        <PriceTag price={p.price} oldPrice={p.oldPrice} size="sm" />
      </div>
    </article>
  );
}
