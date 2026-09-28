import Icon from './Icon';
import { useI18n } from '../lib/i18n';
import { useCart, cartCount } from '../lib/store';
import { haptic } from '../lib/telegram';

export default function BottomNav({ tab, onTab }) {
  const { t } = useI18n();
  const count = cartCount(useCart());
  const tabs = [
    { key: 'home', icon: 'home', label: t.home },
    { key: 'catalog', icon: 'grid', label: t.catalog },
    { key: 'cart', icon: 'bag', label: t.cart, badge: count },
    { key: 'profile', icon: 'user', label: t.profile },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map((x) => (
        <button
          key={x.key}
          className={tab === x.key ? 'on' : ''}
          onClick={() => {
            haptic('select');
            onTab(x.key);
          }}
        >
          <span className="nav-ic">
            <Icon name={x.icon} size={23} stroke={tab === x.key ? 2.1 : 1.7} />
            {x.badge > 0 && <span className="nav-badge">{x.badge > 99 ? '99+' : x.badge}</span>}
          </span>
          <span className="nav-label">{x.label}</span>
        </button>
      ))}
    </nav>
  );
}
