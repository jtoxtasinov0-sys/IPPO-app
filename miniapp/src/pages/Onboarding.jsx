// 3 slayd: brend, qanday ishlaydi, yetkazish/to'lov — bir marta ko'rsatiladi
import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { useI18n } from '../lib/i18n';
import { haptic, tg } from '../lib/telegram';

export default function Onboarding({ onDone }) {
  const { t, lang, setLang } = useI18n();
  const [i, setI] = useState(0);

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

  const slides = [
    { title: t.intro1Title, text: t.intro1Text, hero: true },
    { title: t.intro2Title, text: t.intro2Text, icons: ['grid', 'bag', 'check'] },
    { title: t.intro3Title, text: t.intro3Text, icons: ['truck', 'cash', 'card'] },
  ];
  const s = slides[i];
  const last = i === slides.length - 1;

  function next() {
    haptic('light');
    last ? onDone() : setI(i + 1);
  }

  return (
    <div className="intro">
      <div className="intro-top">
        <div className="lang-switch">
          {['uz', 'ru'].map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        {!last && (
          <button className="intro-skip" onClick={onDone}>
            {t.introSkip}
          </button>
        )}
      </div>

      <div className="intro-visual" key={i}>
        {s.hero ? (
          <div className="intro-logo-wrap">
            <img className="intro-logo" src="/logo.png" alt="IPPO by Fotima Zuhra" />
          </div>
        ) : (
          <div className="intro-icons">
            {s.icons.map((n, k) => (
              <div key={n} className="intro-ic" style={{ animationDelay: `${k * 90}ms` }}>
                <Icon name={n} size={30} stroke={1.6} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="intro-text" key={'t' + i}>
        <h1>{s.title}</h1>
        <p>{s.text}</p>
      </div>

      <div className="intro-bottom">
        <div className="intro-dots">
          {slides.map((_, k) => (
            <span key={k} className={k === i ? 'on' : ''} />
          ))}
        </div>
        <button className="btn primary block lg" onClick={next}>
          {last ? t.introStart : t.introNext}
        </button>
      </div>
    </div>
  );
}
