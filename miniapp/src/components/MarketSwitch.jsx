import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import Flag from './Flag';
import { useI18n } from '../lib/i18n';
import { haptic } from '../lib/telegram';

// Bayroqcha tugmasi: bosilganda davlat va xarid turini shu yerning o'zida almashtirish oynasi
export default function MarketSwitch({ market, mode, onChange }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function pick(m, md) {
    if (m === market && md === mode) return;
    haptic('select');
    onChange(m, md);
  }

  return (
    <div className="mswitch" ref={ref}>
      <button
        className={'market-pill' + (open ? ' open' : '')}
        onClick={() => {
          haptic('light');
          setOpen((o) => !o);
        }}
      >
        <span className="market-flag" key={market}>
          <Flag market={market} size={20} />
        </span>
        <span className="market-mode" key={mode}>
          {t.modeName[mode]}
        </span>
        <Icon name="chevron" size={14} stroke={2.4} />
      </button>

      {open && (
        <div className="mswitch-pop">
          <div className="mswitch-label">{t.country}</div>
          <div className="mswitch-seg">
            {['uz', 'kr'].map((m) => (
              <button key={m} className={market === m ? 'on' : ''} onClick={() => pick(m, mode)}>
                <Flag market={m} size={22} />
                <span>{t.marketName[m]}</span>
              </button>
            ))}
          </div>
          <div className="mswitch-label">{t.buyType}</div>
          <div className="mswitch-seg">
            {['retail', 'wholesale'].map((md) => (
              <button key={md} className={mode === md ? 'on' : ''} onClick={() => pick(market, md)}>
                <span>{t.modeName[md]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
