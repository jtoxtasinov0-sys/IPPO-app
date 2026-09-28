// Pastdan chiqadigan oyna (Orqaga tugmasi va fonga bosish bilan yopiladi)
import { useEffect, useState } from 'react';
import { useBackButton } from '../lib/telegram';
import SheetClose from './SheetClose';

// Ochiq oynalar soni — orqadagi sahifa aylanmasligi uchun
let openCount = 0;
export function lockScroll(on) {
  openCount = Math.max(0, openCount + (on ? 1 : -1));
  document.body.classList.toggle('no-scroll', openCount > 0);
}

export default function Sheet({ open, onClose, children, className = '', full = false }) {
  const [visible, setVisible] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      lockScroll(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => {
        cancelAnimationFrame(r);
        lockScroll(false);
      };
    }
    setShown(false);
    const t = setTimeout(() => setVisible(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  useBackButton(open, onClose);

  if (!visible) return null;
  return (
    <div className={`sheet-backdrop ${shown ? 'shown' : ''}`} onClick={onClose}>
      <div className={`sheet ${full ? 'full' : ''} ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <SheetClose onClose={onClose} />
        {children}
      </div>
    </div>
  );
}
