import Stories from '../components/Stories';
import ProductCard from '../components/ProductCard';
import Img from '../components/Img';
import Icon from '../components/Icon';
import { useI18n } from '../lib/i18n';
import { tgUser } from '../lib/telegram';

export default function Home({ config, products, stories, seenStories, user, onStory, onOpen, onCatalog }) {
  const { t, label } = useI18n();
  const name = tgUser?.first_name || user?.firstName || '';
  const featured = products.filter((p) => p.isFeatured).slice(0, 6);
  const popular = featured.length ? featured : products.slice(0, 6);
  const onSale = products.filter((p) => p.tag === 'sale' || (p.oldPrice && p.oldPrice > p.price)).slice(0, 8);

  const catCover = (key) => products.find((p) => p.category === key)?.images?.[0];
  const catCount = (key) => products.filter((p) => p.category === key).length;

  return (
    <div className="page home">
      <header className="home-head">
        <div className="home-head-row">
          <img className="home-logo" src="/logo.png" alt="IPPO" />
        </div>
        <div className="home-hello">
          {t.hello}, <b>{name || t.guest}</b> 👋
        </div>
        <button className="search-pill" onClick={() => onCatalog({ focus: true })}>
          <Icon name="search" size={19} />
          <span>{t.searchPh}</span>
        </button>
      </header>

      <Stories stories={stories} seen={seenStories} onOpen={onStory} />

      {config?.shopNote && (
        <div className="note-bar">
          <Icon name="megaphone" size={18} /> {config.shopNote}
        </div>
      )}

      <section className="hero-card" onClick={() => onCatalog({})}>
        <svg className="hero-lines" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M120 -10 C 150 40, 175 70, 215 90" />
          <path d="M140 -10 C 165 35, 185 55, 215 65" />
        </svg>
        <div className="hero-kicker">🇰🇷 Made in Korea</div>
        <h2 className="hero-title">{t.heroTitle}</h2>
        <div className="hero-sub">{t.heroSub}</div>
        <span className="btn primary sm">
          {t.heroBtn} <Icon name="chevron" size={16} stroke={2.2} />
        </span>
      </section>

      <div className="trust-row">
        <div>
          <Icon name="shield" size={20} />
          <span>{t.trustOriginal}</span>
        </div>
        <div>
          <Icon name="truck" size={20} />
          <span>{t.trustDelivery}</span>
        </div>
        <div>
          <Icon name="card" size={20} />
          <span>{t.trustPay}</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>{t.categories}</h2>
        </div>
        <div className="cat-grid">
          {config?.categories?.map((c) => (
            <button key={c.key} className="cat-tile" onClick={() => onCatalog({ category: c.key })}>
              <div className="cat-img">
                <Img src={catCover(c.key)} width={320} alt="" />
              </div>
              <div className="cat-name">{label(c)}</div>
              <div className="cat-count">{catCount(c.key)}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t.popular}</h2>
          <button className="link" onClick={() => onCatalog({})}>
            {t.seeAll} <Icon name="chevron" size={14} stroke={2.2} />
          </button>
        </div>
        <div className="grid">
          {popular.map((p) => (
            <ProductCard key={p.id} p={p} tags={config?.tags} onOpen={onOpen} />
          ))}
        </div>
      </section>

      {onSale.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{t.sale}</h2>
            <button className="link" onClick={() => onCatalog({ tag: 'sale' })}>
              {t.seeAll} <Icon name="chevron" size={14} stroke={2.2} />
            </button>
          </div>
          <div className="hscroll">
            {onSale.map((p) => (
              <div className="hscroll-item" key={p.id}>
                <ProductCard p={p} tags={config?.tags} onOpen={onOpen} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
