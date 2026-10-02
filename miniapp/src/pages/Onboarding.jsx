// Birinchi kirish: 1) davlat (O'zbekiston / Koreya), 2) savdo turi (optom / dona).
// Profildan yoki bosh sahifadagi tugmadan qayta ochib, o'zgartirish mumkin.
import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { useI18n } from '../lib/i18n';
import { haptic, tg } from '../lib/telegram';
import Flag from '../components/Flag';

const MARKETS = ['uz', 'kr'].map((key) => ({ key }));
const MODES = [
  { key: 'wholesale', icon: 'box' },
  { key: 'retail', icon: 'bag' },
];
const FEATS = [
  { icon: 'shield', key: 0 },
  { icon: 'truck', key: 1 },
  { icon: 'sparkle', key: 2 },
];

export default function Onboarding({ initialMarket, initialMode, onDone, onCancel }) {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [market, setMarket] = useState(initialMarket || null);
  const [mode, setMode] = useState(initialMode || null);

  // Kirish ekrani oq — Telegram sarlavhasi ham shu rangda, chiqqanda asl rangga qaytadi
  useEffect(() => {
    try {
      tg?.setHeaderColor?.('#FFFBF5');
    } catch {}
    return () => {
      try {
        tg?.setHeaderColor?.('#1E1006');
      } catch {}
    };
  }, []);

  function chooseMarket(m) {
    haptic('select');
    setMarket(m);
    setTimeout(() => setStep(1), 160);
  }

  function chooseMode(m) {
    haptic('success');
    setMode(m);
    setTimeout(() => onDone(market, m), 160);
  }

  const isMarket = step === 0;
  const back = step === 1 ? () => setStep(0) : onCancel;
  const items = isMarket
    ? MARKETS.map((m) => ({
        key: m.key,
        on: market === m.key,
        icon: <Flag market={m.key} size={30} />,
        flag: true,
        name: t.marketName[m.key],
        sub: t.marketSub[m.key],
        pick: () => chooseMarket(m.key),
      }))
    : MODES.map((m) => ({
        key: m.key,
        on: mode === m.key,
        icon: <Icon name={m.icon} size={24} stroke={1.8} />,
        name: t.modeName[m.key],
        sub: t.modeSub[m.key],
        pick: () => chooseMode(m.key),
      }));

  return (
    <div className="onb">
      <span className="onb-spark s1" />
      <span className="onb-spark s2" />
      <span className="onb-dotgrid" />

      <header className="onb-top">
        {back ? (
          <button className="onb-round" onClick={back} aria-label={t.back}>
            <Icon name="chevron" size={18} stroke={2.4} />
          </button>
        ) : null}
        <img className="onb-logo" src="/logo.png" alt="IPPO by Fotima Zuhra" />
        <div className="lang-switch">
          {['uz', 'ru'].map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="onb-main">
        <section className="onb-hero" key={'h' + step}>
          <div className="onb-hero-text">
            <span className="onb-script">{t.onbEyebrow}</span>
            <h1>{isMarket ? t.chooseMarketTitle : t.chooseModeTitle}</h1>
            <p>{isMarket ? t.chooseMarketText : t.chooseModeText}</p>
            <span className="onb-step">
              {t.onbStep} {step + 1} / 2 <Icon name="chevron" size={13} stroke={2.6} />
            </span>
          </div>
          <div className="onb-hero-art">
            <span className="onb-ring" />
            <img src="/mark.png" alt="" />
          </div>
        </section>

        <div className="onb-label">
          <b>{isMarket ? t.onbPickMarket : t.onbPickMode}</b>
        </div>

        <div className="onb-list" key={'c' + step}>
          {items.map((it, k) => (
            <button
              key={it.key}
              className={`onb-card ${it.on ? 'on' : ''}`}
              style={{ animationDelay: `${k * 70}ms` }}
              onClick={it.pick}
            >
              <span className={`onb-tile ${it.flag ? 'is-flag' : ''}`}>{it.icon}</span>
              <span className="onb-card-text">
                <b>{it.name}</b>
                <small>{it.sub}</small>
              </span>
              <span className="onb-go">
                <Icon name="chevron" size={18} stroke={2.6} />
              </span>
            </button>
          ))}
        </div>

        <div className="onb-feats">
          {FEATS.map((f) => (
            <div key={f.key} className="onb-feat">
              <span>
                <Icon name={f.icon} size={18} stroke={2} />
              </span>
              <small>{t.onbFeats[f.key]}</small>
            </div>
          ))}
        </div>
      </main>

      <div className="onb-dots">
        {[0, 1].map((k) => (
          <span key={k} className={k === step ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
