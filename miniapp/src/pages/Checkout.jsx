// Buyurtmani rasmiylashtirish: avto-to'ldirish, qizil maydonlar, to'lov usuli
import { useEffect, useRef, useState } from 'react';
import Sheet from '../components/Sheet';
import Icon from '../components/Icon';
import { toast } from '../components/Toast';
import { api } from '../lib/api';
import { cart } from '../lib/store';
import { useI18n } from '../lib/i18n';
import { money, formatPhone, onlyDigits } from '../lib/format';
import { haptic, tgUser } from '../lib/telegram';

const REQUIRED = ['customerName', 'phone', 'region', 'address'];

export default function Checkout({ open, calc, config, user, onClose, onDone, onProblems }) {
  const { t, label } = useI18n();
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    region: '',
    address: '',
    comment: '',
    paymentMethod: 'cash',
  });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const refs = useRef({});
  const filled = useRef(false);

  const methods = config?.payment?.methods || ['cash'];

  // Qayta buyurtmada: oxirgi buyurtmadan ism, telefon, hudud, manzil (yozilgan maydonga tegmaydi)
  useEffect(() => {
    if (!open || filled.current) return;
    filled.current = true;
    const base = {
      customerName: [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || user?.firstName || '',
      phone: user?.phone ? formatPhone(user.phone) : '',
    };
    setForm((f) => ({
      ...f,
      customerName: f.customerName || base.customerName,
      phone: f.phone || base.phone,
    }));
    api
      .myOrders()
      .then((orders) => {
        const last = orders?.[0];
        if (!last) return;
        setForm((f) => ({
          ...f,
          customerName: f.customerName || last.customerName,
          phone: f.phone || formatPhone(last.phone),
          region: f.region || (config?.regions?.some((r) => r.key === last.region) ? last.region : ''),
          address: f.address || last.address,
        }));
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!methods.includes(form.paymentMethod)) setForm((f) => ({ ...f, paymentMethod: methods[0] }));
  }, [methods.join()]);

  const set = (k) => (e) => {
    const v = k === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  function errorOf(k) {
    const v = String(form[k] || '').trim();
    if (!v) return t.fillField;
    if (k === 'phone' && onlyDigits(v).length < 10) return t.phoneIncomplete;
    if (k === 'customerName' && v.length < 2) return t.fillField;
    if (k === 'address' && v.length < 3) return t.fillField;
    return null;
  }
  const showErr = (k) => (touched[k] ? errorOf(k) : null);

  async function submit() {
    const bad = REQUIRED.find((k) => errorOf(k));
    if (bad) {
      setTouched(Object.fromEntries(REQUIRED.map((k) => [k, true])));
      haptic('error');
      const el = refs.current[bad];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el?.focus({ preventScroll: true }), 300);
      return;
    }
    setBusy(true);
    try {
      const order = await api.createOrder({
        ...form,
        items: cart.get(),
      });
      haptic('success');
      cart.clear();
      onDone(order);
    } catch (err) {
      haptic('error');
      if (err.status === 409) {
        toast(t.orderProblems, 'err');
        onProblems();
      } else if (err.status === 400 && err.data?.field && refs.current[err.data.field]) {
        setTouched((x) => ({ ...x, [err.data.field]: true }));
        toast(err.message, 'err');
      } else {
        toast(err.network ? t.errorNetwork : err.message || t.errorGeneric, 'err');
      }
    } finally {
      setBusy(false);
    }
  }

  const field = (k, labelText, input) => (
    <label className={`field ${showErr(k) ? 'invalid' : ''}`}>
      <span className="field-label">{labelText}</span>
      {input}
      {showErr(k) && <span className="field-error">{showErr(k)}</span>}
    </label>
  );

  const blur = (k) => () => setTouched((x) => ({ ...x, [k]: true }));

  return (
    <Sheet open={open} onClose={onClose} full className="checkout-sheet">
      <div className="ps-scroll checkout">
        <h2 className="sheet-title">{t.checkoutTitle}</h2>

        {field(
          'customerName',
          t.name,
          <input
            ref={(el) => (refs.current.customerName = el)}
            value={form.customerName}
            onChange={set('customerName')}
            onBlur={blur('customerName')}
            placeholder={t.namePh}
            autoComplete="name"
            maxLength={80}
          />
        )}
        {field(
          'phone',
          t.phone,
          <input
            ref={(el) => (refs.current.phone = el)}
            value={form.phone}
            onChange={set('phone')}
            onBlur={blur('phone')}
            placeholder="+82 10 1234 5678"
            inputMode="tel"
            autoComplete="tel"
          />
        )}
        {field(
          'region',
          t.region,
          <div className="select">
            <select ref={(el) => (refs.current.region = el)} value={form.region} onChange={set('region')} onBlur={blur('region')}>
              <option value="">{t.chooseRegion}</option>
              {config?.regions?.map((r) => (
                <option key={r.key} value={r.key}>
                  {label(r)}
                </option>
              ))}
            </select>
            <Icon name="chevron" size={16} className="select-ic" />
          </div>
        )}
        {field(
          'address',
          t.address,
          <textarea
            ref={(el) => (refs.current.address = el)}
            value={form.address}
            onChange={set('address')}
            onBlur={blur('address')}
            placeholder={t.addressPh}
            rows={2}
            maxLength={300}
          />
        )}
        <label className="field">
          <span className="field-label">{t.comment}</span>
          <textarea value={form.comment} onChange={set('comment')} placeholder={t.commentPh} rows={2} maxLength={500} />
        </label>

        <div className="field-label mt">{t.payMethod}</div>
        <div className="pay-methods">
          {methods.map((m) => (
            <button
              key={m}
              className={`pay-method ${form.paymentMethod === m ? 'on' : ''}`}
              onClick={() => {
                haptic('select');
                setForm((f) => ({ ...f, paymentMethod: m }));
              }}
            >
              <span className="pm-ic">
                <Icon name={m === 'card' ? 'card' : 'cash'} size={22} />
              </span>
              <span className="pm-text">
                <b>{m === 'card' ? t.card : t.cash}</b>
                <small>{m === 'card' ? t.cardSub : t.cashSub}</small>
              </span>
              <span className="pm-radio" />
            </button>
          ))}
        </div>

        {calc && (
          <div className="summary card">
            <div className="sum-row">
              <span>{t.subtotal}</span>
              <span>{money(calc.subtotal)}</span>
            </div>
            <div className="sum-row">
              <span>{t.delivery}</span>
              <span className={calc.deliveryFee ? '' : 'green'}>{calc.deliveryFee ? money(calc.deliveryFee) : t.free}</span>
            </div>
            <div className="sum-row total">
              <span>{t.total}</span>
              <span>{money(calc.total)}</span>
            </div>
          </div>
        )}
      </div>
      <div className="ps-footer">
        <button className="btn primary grow lg" onClick={submit} disabled={busy}>
          {busy ? t.sending : `${t.confirmOrder}${calc ? ' · ' + money(calc.total) : ''}`}
        </button>
      </div>
    </Sheet>
  );
}
