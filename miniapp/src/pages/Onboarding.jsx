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

export default function Onboarding({ initialMarket, initialMode, onDone, onCancel }) {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [market, setMarket] = useState(initialMarket || null);
  const [mode, setMode] = useState(initialMode || null);

  // Kirish ekrani och — Telegram sarlavhasi ham shu rangda, chiqqanda asl rangga qaytadi
  useEffect(() => {
    try {
      tg?.setHeaderColor?.('#FBF6EC');
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

  return (
    <div className="intro">
      <div className="intro-top">
        {step === 1 ? (
          <button className="intro-skip intro-back" onClick={() => setStep(0)}>
            <Icon name="chevron" size={16} stroke={2.4} /> {t.back}
          </button>
        ) : onCancel ? (
          <button className="intro-skip intro-back" onClick={onCancel}>
            <Icon name="chevron" size={16} stroke={2.4} /> {t.back}
          </button>
        ) : (
          <span />
        )}
        <div className="lang-switch">
          {['uz', 'ru'].map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="intro-visual intro-visual-sm" key={'v' + step}>
        <div className="intro-logo-wrap">
          <img className="intro-logo" src="/logo.png" alt="IPPO by Fotima Zuhra" />
        </div>
      </div>

      <div className="intro-text" key={'t' + step}>
        <h1>{isMarket ? t.chooseMarketTitle : t.chooseModeTitle}</h1>
        <p>{isMarket ? t.chooseMarketText : t.chooseModeText}</p>
      </div>

      <div className="choice-list" key={'c' + step}>
        {isMarket
          ? MARKETS.map((m, k) => (
              <button
                key={m.key}
                className={`choice ${market === m.key ? 'on' : ''}`}
                style={{ animationDelay: `${k * 70}ms` }}
                onClick={() => chooseMarket(m.key)}
              >
                <span className="choice-ic flagbox">
                  <Flag market={m.key} size={32} />
                </span>
                <span className="choice-text">
                  <b>{t.marketName[m.key]}</b>
                  <small>{t.marketSub[m.key]}</small>
                </span>
                <Icon name="chevron" size={18} stroke={2.2} />
              </button>
            ))
          : MODES.map((m, k) => (
              <button
                key={m.key}
                className={`choice ${mode === m.key ? 'on' : ''}`}
                style={{ animationDelay: `${k * 70}ms` }}
                onClick={() => chooseMode(m.key)}
              >
                <span className="choice-ic">
                  <Icon name={m.icon} size={24} stroke={1.8} />
                </span>
                <span className="choice-text">
                  <b>{t.modeName[m.key]}</b>
                  <small>{t.modeSub[m.key]}</small>
                </span>
                <Icon name="chevron" size={18} stroke={2.2} />
              </button>
            ))}
      </div>

      <div className="intro-dots">
        {[0, 1].map((k) => (
          <span key={k} className={k === step ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
