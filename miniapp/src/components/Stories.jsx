import Img from './Img';
import { useI18n } from '../lib/i18n';

export default function Stories({ stories, seen, onOpen }) {
  const { pick } = useI18n();
  if (!stories?.length) return null;
  return (
    <div className="stories">
      {stories.map((s, i) => (
        <button key={s.id} className={`story ${seen.has(s.id) ? 'seen' : ''}`} onClick={() => onOpen(i)}>
          <span className="story-ring">
            <Img src={s.image} width={160} alt="" />
          </span>
          <span className="story-title">{pick(s, 'title')}</span>
        </button>
      ))}
    </div>
  );
}
