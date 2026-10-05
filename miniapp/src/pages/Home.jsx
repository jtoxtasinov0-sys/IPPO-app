import Stories from '../components/Stories';
import ProductCard from '../components/ProductCard';
import Img from '../components/Img';
import HeroShowcase from '../components/HeroShowcase';
import Icon from '../components/Icon';
import { useI18n } from '../lib/i18n';
import { tgUser } from '../lib/telegram';
import { money, firstOrderInfo } from '../lib/format';
import MarketSwitch from '../components/MarketSwitch';

export default function Home({ config, market, mode, onMarketChange, products, stories, seenStories, user, onStory, onOpen, onCatalog, onSearch }) {
  const { t, label } = useI18n();
  const first = firstOrderInfo(user, config?.markets?.find((m) => m.key === market), mode);
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
          <MarketSwitch market={market} mode={mode} onChange={onMarketChange} />
        </div>
        <div className="home-hello">
          {t.hello}, <b>{name || t.guest}</b> 👋
        </div>
        <button className="search-pill" onClick={onSearch}>
          <Icon name="search" size={19} />
          <span>{t.searchPh}</span>
          <span className="search-go">
            <Icon name="grid" size={17} stroke={2} />
          </span>
        </button>
      </header>

      <Stories stories={stories} seen={seenStories} onOpen={onStory} />

      {first && (
        <div className="note-bar first-order-bar" onClick={() => onCatalog({})}>
          <Icon name="gift" size={18} /> {t.firstOrderBanner(first.percent, first.minOrder ? money(first.minOrder) : null)}
        </div>
      )}

      {config?.shopNote && (
        <div className="note-bar">
          <Icon name="megaphone" size={18} /> {config.shopNote}
        </div>
      )}

      <section className="hero-card" onClick={() => onCatalog({})}>
        <div className="hero-text">
          <div className="hero-kicker">Made in Korea</div>
          <h2 className="hero-title">{t.heroTitle}</h2>
          <div className="hero-sub">{t.heroSub}</div>
          <span className="hero-btn">
            {t.heroBtn} <Icon name="chevron" size={14} stroke={2.6} />
          </span>
        </div>
        <HeroShowcase />
      </section>

      <div className="trust-row">
        <div>
          <span className="trust-ic"><Icon name="shield" size={19} /></span>
          <span>{t.trustOriginal}</span>
        </div>
        <div>
          <span className="trust-ic"><Icon name="truck" size={19} /></span>
          <span>{market === 'uz' ? t.trustDeliveryUz : t.trustDelivery}</span>
        </div>
        <div>
          <span className="trust-ic"><Icon name="card" size={19} /></span>
          <span>{t.trustPay}</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>{t.categories}</h2>
        </div>
        <div className="cat-grid">
          {config?.categories?.filter((c) => catCount(c.key) > 0).map((c) => (
            <button key={c.key} className="cat-tile" onClick={() => onCatalog({ category: c.key })}>
              <div className="cat-img">
                <Img src={c.cover || catCover(c.key)} frame={c.cover ? c.coverFrame : undefined} width={320} alt="" />
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
