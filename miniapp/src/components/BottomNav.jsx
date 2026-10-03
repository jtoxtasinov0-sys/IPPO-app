import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useI18n } from '../lib/i18n';
import { useCart, cartCount } from '../lib/store';
import { haptic } from '../lib/telegram';

// Suzuvchi menyu: o'rtada ko'tarilgan oltin savatcha tugmasi, faol tab ostida siljiydigan pufak
export default function BottomNav({ tab, onTab, onSearch }) {
  const { t } = useI18n();
  const count = cartCount(useCart());
  const slots = [
    { key: 'home', icon: 'home', label: t.home },
    { key: 'catalog', icon: 'grid', label: t.catalog },
    { key: 'cart' },
    { key: 'search', icon: 'search', label: t.searchTab },
    { key: 'profile', icon: 'user', label: t.profile },
  ];
  const active = slots.findIndex((x) => x.key === tab);

  // Savatchaga mahsulot qo'shilganda badge "sakraydi"
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const id = setTimeout(() => setBump(false), 500);
      prev.current = count;
      return () => clearTimeout(id);
    }
    prev.current = count;
  }, [count]);

  function go(key) {
    haptic(key === 'cart' ? 'medium' : 'select');
    if (key === 'search') onSearch();
    else onTab(key);
  }

  return (
    <nav className="bottom-nav">
      <span
        className={'nav-blob' + (tab === 'cart' ? ' hide' : '')}
        style={{ transform: `translateX(${Math.max(active, 0) * 100}%)` }}
        aria-hidden
      />
      {slots.map((x) =>
        x.key === 'cart' ? (
          <div key="cart" className="nav-fab-slot">
            <button
              className={'nav-fab' + (tab === 'cart' ? ' on' : '') + (bump ? ' bump' : '')}
              onClick={() => go('cart')}
              aria-label={t.cart}
            >
              <span className="nav-fab-halo" aria-hidden />
              <span className="nav-fab-core">
                <Icon name="bag" size={25} stroke={2} />
              </span>
              {count > 0 && <span className="nav-badge">{count > 99 ? '99+' : count}</span>}
            </button>
          </div>
        ) : (
          <button key={x.key} className={tab === x.key ? 'nav-tab on' : 'nav-tab'} onClick={() => go(x.key)}>
            <span className="nav-ic">
              <Icon name={x.icon} size={23} stroke={tab === x.key ? 2.2 : 1.7} />
            </span>
            <span className="nav-label">{x.label}</span>
            <span className="nav-dot" aria-hidden />
          </button>
        )
      )}
    </nav>
  );
}
