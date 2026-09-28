// Rasm: kichik nusxa, server uxlasa qayta urinish, admin belgilagan joylashuv
import { imageUrl, retryImage, markLoaded, frameStyle } from '../lib/image';

export default function Img({ src, width, frame, alt = '', className = '', eager = false, style }) {
  if (!src) return <div className={`img-ph ${className}`} />;
  return (
    <img
      className={`img ${className}`}
      src={imageUrl(src, width)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={retryImage}
      onLoad={markLoaded}
      style={{ ...frameStyle(frame), ...style }}
    />
  );
}
