// Kartaga o'tkazma: karta raqami (nusxalash), summa, chek rasmini yuklash
import { useRef, useState } from 'react';
import Sheet from './Sheet';
import Icon from './Icon';
import { toast } from './Toast';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { money } from '../lib/format';
import { haptic, isTelegram } from '../lib/telegram';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export default function PaymentScreen({ order, card, onClose, onUpdated }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(order?.paymentStatus === 'pending');

  async function copy(v) {
    if (await copyText(v)) {
      haptic('light');
      toast(t.copied);
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const updated = await api.uploadReceipt(order.id, file);
      setSent(true);
      haptic('success');
      onUpdated?.(updated);
    } catch (err) {
      haptic('error');
      toast(err.network ? t.errorNetwork : err.message || t.errorGeneric, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!order} onClose={onClose} className="pay-sheet">
      {order && (
        <div className="pay">
          <div className="pay-head">
            <div className="pay-icon">
              <Icon name="card" size={26} />
            </div>
            <div>
              <div className="pay-title">{t.payTitle}</div>
              <div className="muted">{t.orderNo(order.id)}</div>
            </div>
          </div>

          {sent ? (
            <div className="pay-done">
              <div className="done-circle">
                <Icon name="check" size={34} stroke={2.4} />
              </div>
              <p>{isTelegram ? t.receiptSent : t.receiptSentWeb}</p>
              <button className="btn primary block" onClick={onClose}>
                OK
              </button>
            </div>
          ) : (
            <>
              <p className="muted small">{t.payHint}</p>
              {card ? (
                <div className="bank-card">
                  <div className="bank-card-top">
                    <span>{card.bank || 'Bank'}</span>
                    <img src="/mark.png" alt="" />
                  </div>
                  <button className="bank-number" onClick={() => copy(card.number.replace(/\s/g, ''))}>
                    {card.number}
                    <Icon name="copy" size={18} />
                  </button>
                  {card.holder && <div className="bank-holder">{card.holder}</div>}
                </div>
              ) : null}

              <button className="amount-row" onClick={() => copy(String(order.total))}>
                <span className="muted">{t.amount}</span>
                <span className="amount">
                  {money(order.total, order.market)} <Icon name="copy" size={16} />
                </span>
              </button>

              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              <button className="btn primary block" disabled={busy} onClick={() => fileRef.current?.click()}>
                <Icon name="camera" size={20} /> {busy ? t.uploading : t.uploadReceipt}
              </button>
              <button className="btn text block" onClick={onClose}>
                {t.payLater}
              </button>
              <p className="muted small center">{isTelegram ? t.payLaterHint : t.payLaterHintWeb}</p>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
