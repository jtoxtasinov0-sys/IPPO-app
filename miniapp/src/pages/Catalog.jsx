import { useEffect, useMemo, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icon';
import { useI18n } from '../lib/i18n';
import { haptic } from '../lib/telegram';

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[‘’ʻʼ`']/g, '')
    .trim();

export default function Catalog({ config, products, filter, setFilter, onOpen }) {
  const { t, label } = useI18n();
  const inputRef = useRef(null);

  useEffect(() => {
    if (filter.focus) {
      inputRef.current?.focus();
      setFilter((f) => ({ ...f, focus: false }));
    }
  }, [filter.focus]);

  const list = useMemo(() => {
    const q = norm(filter.q);
    return products.filter((p) => {
      if (filter.category && p.category !== filter.category) return false;
      if (filter.tag && p.tag !== filter.tag) return false;
      if (!q) return true;
      return [p.name, p.nameRu, p.brand, p.article, p.description, p.descriptionRu].some((x) => norm(x).includes(q));
    });
  }, [products, filter.category, filter.tag, filter.q]);

  const set = (patch) => {
    haptic('select');
    setFilter((f) => ({ ...f, ...patch }));
  };

  return (
    <div className="page catalog">
      <div className="catalog-head">
        <h1 className="page-title">{t.catalog}</h1>
        <label className="search">
          <Icon name="search" size={19} />
          <input
            ref={inputRef}
            value={filter.q || ''}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder={t.searchPh}
            enterKeyHint="search"
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {filter.q && (
            <button className="search-clear" onClick={() => set({ q: '' })} aria-label="Tozalash">
              <Icon name="close" size={16} stroke={2.2} />
            </button>
          )}
        </label>
        <div className="chips">
          <button className={`chip ${!filter.category ? 'on' : ''}`} onClick={() => set({ category: null })}>
            {t.all}
          </button>
          {config?.categories?.filter((c) => products.some((p) => p.category === c.key)).map((c) => (
            <button
              key={c.key}
              className={`chip ${filter.category === c.key ? 'on' : ''}`}
              onClick={() => set({ category: filter.category === c.key ? null : c.key })}
            >
              {label(c)}
            </button>
          ))}
        </div>
        <div className="chips small">
          {config?.tags?.map((x) => (
            <button
              key={x.key}
              className={`chip outline tag-chip-${x.key} ${filter.tag === x.key ? 'on' : ''}`}
              onClick={() => set({ tag: filter.tag === x.key ? null : x.key })}
            >
              {label(x)}
            </button>
          ))}
        </div>
      </div>

      {list.length ? (
        <div className="grid">
          {list.map((p) => (
            <ProductCard key={p.id} p={p} tags={config?.tags} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-ic">
            <Icon name="search" size={30} />
          </div>
          <h3>{t.nothingFound}</h3>
          <p>{t.tryOther}</p>
        </div>
      )}
    </div>
  );
}
