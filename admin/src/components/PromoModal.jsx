// Aksiya va optom minimum — bitta mahsulot uchun, har davlat va savdo turiga alohida. Har bosish darhol saqlanadi
import Modal from './Modal';
import PromoPicker from './PromoPicker';
import MinPicker from './MinPicker';
import { money, FLAG, PRICE_FIELDS, MIN_FIELDS } from '../lib/api';

export default function PromoModal({ product: p, meta, onChange, onClose }) {
  const marketName = (m) => meta?.markets?.find((x) => x.key === m)?.uz || m;

  return (
    <Modal
      title="Aksiya va minimum"
      onClose={onClose}
      footer={
        <button className="btn primary" onClick={onClose}>
          Tayyor
        </button>
      }
    >
      <div className="pm-product">
        <span className="muted">{p.article}</span> {p.name}
      </div>
      <p className="muted small pm-hint">
        Aksiya — donada N ta olsa, yana M tasi bepul. Kamida — optomda bitta mahsulotdan shuncha dona olinadi. Tanlov darhol
        saqlanadi.
      </p>
      {['kr', 'uz'].map((m) => (
        <section className="pm-market" key={m}>
          <h3>
            {FLAG[m]} {marketName(m)}
          </h3>
          <div className="pm-box">
            {PRICE_FIELDS.filter((x) => x.market === m).map((x) => {
              const min = MIN_FIELDS.find((y) => y.price === x.key);
              return (
                <div className="pm-row" key={x.key}>
                  <div className="pm-row-head">
                    <b>{x.kind}</b>
                    {p[x.key] ? <span>{money(p[x.key], m)}</span> : <span className="warn-text">narx yo‘q</span>}
                  </div>
                  {x.promo && (
                    <>
                      <div className="form-label">Aksiya</div>
                      <PromoPicker withNone value={p[x.promo]} presets={meta?.promos} onChange={(v) => onChange(x.promo, v)} />
                    </>
                  )}
                  {min && meta?.optomMins?.length > 0 && !!p[x.key] && (
                    <>
                      <div className="form-label">Kamida (dona)</div>
                      <MinPicker withNone value={p[min.key]} presets={meta.optomMins} onChange={(v) => onChange(min.key, v)} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </Modal>
  );
}
