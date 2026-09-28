// Brauzerda (Telegramsiz) pastdan chiqqan oynani yopish tugmasi — Telegramda BackButton bor
import { isTelegram } from '../lib/telegram';
import Icon from './Icon';

export default function SheetClose({ onClose, dark = false }) {
  if (isTelegram) return null;
  return (
    <button className={`sheet-close ${dark ? 'dark' : ''}`} onClick={onClose} aria-label="Orqaga">
      <Icon name="back" size={20} stroke={2.2} />
    </button>
  );
}
