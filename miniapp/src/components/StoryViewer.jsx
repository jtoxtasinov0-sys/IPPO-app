// Story: 5 soniyadan avtomatik o'tadi, chap/o'ng tomonga bosib almashtiriladi
import { useEffect, useState } from 'react';
import { useBackButton } from '../lib/telegram';
import { useI18n } from '../lib/i18n';
import { imageUrl, retryImage } from '../lib/image';
import { lockScroll } from './Sheet';
import Icon from './Icon';

const DURATION = 5000;

export default function StoryViewer({ stories, start, onClose, onSeen, onProduct }) {
  const { t, pick } = useI18n();
  const [i, setI] = useState(start);
  const [paused, setPaused] = useState(false);
  const s = stories[i];

  useBackButton(true, onClose);
  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  useEffect(() => {
    if (s) onSeen(s.id);
  }, [s]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => (i < stories.length - 1 ? setI(i + 1) : onClose()), DURATION);
    return () => clearTimeout(timer);
  }, [i, paused]);

  if (!s) return null;

  function tap(e) {
    const x = e.clientX / window.innerWidth;
    if (x < 0.33) setI(Math.max(0, i - 1));
    else if (i < stories.length - 1) setI(i + 1);
    else onClose();
  }

  return (
    <div className="storyv" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
      <div className="storyv-bars">
        {stories.map((_, k) => (
          <span key={k} className="bar">
            <span
              className={`fill ${k < i ? 'done' : ''} ${k === i ? 'run' : ''}`}
              style={k === i ? { animationDuration: `${DURATION}ms`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
              key={k === i ? `run-${i}` : k}
            />
          </span>
        ))}
      </div>
      <button className="storyv-close" onClick={onClose} aria-label="Yopish">
        <Icon name="close" size={22} stroke={2.2} />
      </button>
      <div className="storyv-media" onClick={tap}>
        <img src={imageUrl(s.image)} alt="" onError={retryImage} />
      </div>
      <div className="storyv-bottom">
        <div className="storyv-title">{pick(s, 'title')}</div>
        {s.productId && (
          <button className="btn primary" onClick={() => onProduct(s.productId)}>
            {t.viewProduct}
          </button>
        )}
      </div>
    </div>
  );
}
