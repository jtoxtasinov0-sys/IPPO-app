// To'liq ekranda rasm ko'rish (asl o'lchamda)
import { useEffect, useRef } from 'react';
import { useBackButton } from '../lib/telegram';
import { imageUrl, retryImage } from '../lib/image';
import { lockScroll } from './Sheet';
import Icon from './Icon';

export default function PhotoViewer({ images, index = 0, onClose }) {
  const ref = useRef(null);
  useBackButton(true, onClose);

  useEffect(() => {
    lockScroll(true);
    const el = ref.current;
    if (el) el.scrollLeft = el.clientWidth * index;
    return () => lockScroll(false);
  }, [index]);

  return (
    <div className="viewer">
      <button className="viewer-close" onClick={onClose} aria-label="Yopish">
        <Icon name="close" size={22} stroke={2.2} />
      </button>
      <div className="viewer-track" ref={ref}>
        {images.map((src, i) => (
          <div className="viewer-slide" key={i}>
            <img src={imageUrl(src)} alt="" onError={retryImage} />
          </div>
        ))}
      </div>
    </div>
  );
}
