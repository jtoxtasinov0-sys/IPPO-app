import { useEffect, useState } from 'react';

// Bosh sahifa banneridagi fonsiz mahsulot rasmlari: suzib turadi va navbat bilan almashadi
const SLIDES = ['/hero/ginseng', '/hero/suncream'];
const EVERY = 3800;

export default function HeroShowcase() {
  const [i, setI] = useState(0);
  const prev = (i - 1 + SLIDES.length) % SLIDES.length;
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setStarted(true);
        setI((x) => (x + 1) % SLIDES.length);
      }
    }, EVERY);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-show" aria-hidden>
      <span className="hero-glow" />
      <span className="hero-rays" />
      <div className="hero-float">
        {SLIDES.map((src, k) => (
          <picture key={src} className={'hero-slide' + (k === i ? ' on' : started && k === prev ? ' out' : '')}>
            <source srcSet={src + '.webp'} type="image/webp" />
            <img src={src + '.png'} alt="" draggable={false} decoding="async" />
          </picture>
        ))}
      </div>
      <span className="hero-shadow" />
      <div className="hero-dots">
        {SLIDES.map((src, k) => (
          <span key={src} className={k === i ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
