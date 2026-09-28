import { money } from '../lib/format';
import { useI18n } from '../lib/i18n';

export default function PriceTag({ price, oldPrice, size = 'md' }) {
  const { t } = useI18n();
  if (!price) return <div className={`price ask ${size}`}>{t.askPrice}</div>;
  const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
  return (
    <div className={`price ${size}`}>
      <span className="now">{money(price)}</span>
      {discount > 0 && (
        <>
          <span className="old">{money(oldPrice)}</span>
          {size === 'lg' && <span className="off">−{discount}%</span>}
        </>
      )}
    </div>
  );
}
