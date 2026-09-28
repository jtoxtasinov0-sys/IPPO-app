import Sheet from './Sheet';
import Icon from './Icon';
import { useI18n } from '../lib/i18n';
import { money } from '../lib/format';

export default function OrderSuccess({ order, onClose, onOrders }) {
  const { t } = useI18n();
  return (
    <Sheet open={!!order} onClose={onClose}>
      {order && (
        <div className="success">
          <div className="done-circle big">
            <Icon name="check" size={40} stroke={2.4} />
          </div>
          <h2>{t.orderAccepted}</h2>
          <div className="success-no">
            {t.orderNo(order.id)} · {money(order.total)}
          </div>
          <p className="muted">{t.weWillCall}</p>
          <button className="btn primary block lg" onClick={onClose}>
            {t.toHome}
          </button>
          <button className="btn text block" onClick={onOrders}>
            {t.myOrders}
          </button>
        </div>
      )}
    </Sheet>
  );
}
