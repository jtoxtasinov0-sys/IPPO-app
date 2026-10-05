import { useCallback, useEffect, useMemo, useState } from 'react';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import BottomNav from './components/BottomNav';
import ProductSheet from './components/ProductSheet';
import StoryViewer from './components/StoryViewer';
import PaymentScreen from './components/PaymentScreen';
import OrderSuccess from './components/OrderSuccess';
import Toaster from './components/Toast';
import Icon from './components/Icon';
import { api, onWaking } from './lib/api';
import { I18nContext, getDict } from './lib/i18n';
import { tgUser } from './lib/telegram';
import { reloadBrokenImages } from './lib/image';
import { priceFor, setMoneyMarket } from './lib/format';

const ls = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

function initialLang() {
  const saved = ls.get('ippo_lang');
  if (saved === 'uz' || saved === 'ru') return saved;
  return tgUser?.language_code === 'ru' ? 'ru' : 'uz';
}

// Oxirgi ma'lumotlar telefonda saqlanadi — server uxlasa ham ilova darhol ochiladi
const CACHE_KEY = 'ippo_cache_v2'; // v2: davlat/optom narxlari bilan
function loadCache() {
  try {
    const c = JSON.parse(ls.get(CACHE_KEY) || 'null');
    return c && Array.isArray(c.products) ? c : null;
  } catch {
    return null;
  }
}
const cached = loadCache();

const savedMarket = () => (['uz', 'kr'].includes(ls.get('ippo_market')) ? ls.get('ippo_market') : null);
const savedMode = () => (['retail', 'wholesale'].includes(ls.get('ippo_mode')) ? ls.get('ippo_mode') : null);

function loadSeen() {
  try {
    return new Set(JSON.parse(ls.get('ippo_seen_stories') || '[]'));
  } catch {
    return new Set();
  }
}

export default function App() {
  const [lang, setLangState] = useState(initialLang);
  const [config, setConfig] = useState(cached?.config || null);
  const [products, setProducts] = useState(cached?.products || null);
  const [stories, setStories] = useState(cached?.stories || []);
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [waking, setWaking] = useState(false);

  const [tab, setTab] = useState('home');
  // Pastki menyudagi faol tugma (Qidiruv ham katalogni ochadi, lekin o'zi yonadi)
  const [navKey, setNavKey] = useState('home');
  const [filter, setFilter] = useState({ category: null, tag: null, q: '' });
  const [openProductId, setOpenProductId] = useState(null);
  const [storyIndex, setStoryIndex] = useState(null);
  const [seenStories, setSeenStories] = useState(loadSeen);
  const [checkoutCalc, setCheckoutCalc] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payOrder, setPayOrder] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Davlat (uz | kr) va savdo turi (retail | wholesale) — tanlanmagan bo'lsa tanlash ekrani chiqadi
  const [market, setMarket] = useState(savedMarket);
  const [mode, setMode] = useState(savedMode);
  const [showIntro, setShowIntro] = useState(() => !savedMarket() || !savedMode());
  setMoneyMarket(market);

  useEffect(() => onWaking(setWaking), []);

  const loadAll = useCallback(() => {
    setLoadError(false);
    Promise.all([api.config(), api.products(), api.stories().catch(() => [])])
      .then(([c, p, s]) => {
        setConfig(c);
        setProducts(p);
        setStories(s);
        ls.set(CACHE_KEY, JSON.stringify({ config: c, products: p, stories: s }));
        reloadBrokenImages();
      })
      .catch(() => setLoadError(true));
    api
      .me()
      .then((u) => {
        setUser(u);
        if (!ls.get('ippo_lang') && (u.lang === 'uz' || u.lang === 'ru')) setLangState(u.lang);
        // Telefon xotirasi tozalangan bo'lsa — serverda saqlangan tanlov
        if (!savedMarket() && !savedMode() && u.market && u.mode) {
          setMarket(u.market);
          setMode(u.mode);
          ls.set('ippo_market', u.market);
          ls.set('ippo_mode', u.mode);
          setShowIntro(false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(loadAll, [loadAll]);

  const setLang = useCallback((l) => {
    setLangState(l);
    ls.set('ippo_lang', l);
    document.documentElement.lang = l;
    api.updateMe({ lang: l }).catch(() => {});
  }, []);

  const i18n = useMemo(() => ({ lang, t: getDict(lang), setLang }), [lang, setLang]);
  const t = i18n.t;

  function finishIntro(m, md) {
    setMarket(m);
    setMode(md);
    ls.set('ippo_market', m);
    ls.set('ippo_mode', md);
    setShowIntro(false);
    window.scrollTo({ top: 0 });
    api.updateMe({ seenIntro: true, market: m, mode: md }).catch(() => {});
  }

  function changeMarket(m, md) {
    setMarket(m);
    setMode(md);
    ls.set('ippo_market', m);
    ls.set('ippo_mode', md);
    api.updateMe({ market: m, mode: md }).catch(() => {});
  }

  function goTab(next) {
    setTab(next);
    setNavKey(next);
    window.scrollTo({ top: 0 });
  }

  function openCatalog(patch = {}) {
    setFilter({ category: null, tag: null, q: '', ...patch });
    goTab('catalog');
  }

  function openSearch() {
    openCatalog({ focus: true });
    setNavKey('search');
  }

  function markSeen(id) {
    setSeenStories((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      ls.set('ippo_seen_stories', JSON.stringify([...next].slice(-100)));
      return next;
    });
  }

  // Narx tanlangan davlat va savdo turiga qarab almashtiriladi — komponentlar p.price ni ishlatadi
  const shown = useMemo(
    () =>
      products?.map((p) => ({
        ...p,
        price: priceFor(p, market, mode),
        oldPrice: market === 'kr' && mode === 'retail' ? p.oldPrice : null,
      })) || null,
    [products, market, mode]
  );
  const marketCfg = config?.markets?.find((m) => m.key === market) || null;
  const productById = useMemo(() => new Map((shown || []).map((p) => [p.id, p])), [shown]);
  const openProduct = openProductId ? productById.get(openProductId) : null;

  // Cashback balansi o'zgarganda (buyurtma, to'lov tasdiqlanishi) — profil yangilanadi
  function refreshUser() {
    api.me().then(setUser).catch(() => {});
  }

  function onOrderDone(order) {
    setCheckoutOpen(false);
    refreshUser();
    setRefreshKey((k) => k + 1);
    // mahsulot qoldiqlari o'zgargan bo'lishi mumkin
    api.products().then(setProducts).catch(() => {});
    setTimeout(() => (order.paymentMethod === 'card' && order.total > 0 ? setPayOrder(order) : setSuccessOrder(order)), 280);
  }

  let page;
  if (loadError && !products) {
    page = (
      <div className="page">
        <div className="empty">
          <div className="empty-ic">
            <Icon name="globe" size={30} />
          </div>
          <h3>{t.errorNetwork}</h3>
          <button className="btn primary" onClick={loadAll}>
            {t.retry}
          </button>
        </div>
      </div>
    );
  } else if (!shown) {
    page = <Loading />;
  } else if (tab === 'home') {
    page = (
      <Home
        config={config}
        market={market}
        mode={mode}
        onMarketChange={changeMarket}
        products={shown}
        stories={stories}
        seenStories={seenStories}
        user={user}
        onStory={setStoryIndex}
        onOpen={(p) => setOpenProductId(p.id)}
        onCatalog={openCatalog}
        onSearch={openSearch}
      />
    );
  } else if (tab === 'catalog') {
    page = (
      <Catalog config={config} products={shown} filter={filter} setFilter={setFilter} onOpen={(p) => setOpenProductId(p.id)} />
    );
  } else if (tab === 'cart') {
    page = (
      <Cart
        products={shown}
        config={config}
        market={market}
        mode={mode}
        refreshKey={refreshKey}
        onCatalog={() => openCatalog()}
        onOpen={(p) => setOpenProductId(p.id)}
        onCheckout={(calc) => {
          setCheckoutCalc(calc);
          setCheckoutOpen(true);
        }}
      />
    );
  } else {
    page = (
      <Profile
        config={config}
        user={user}
        market={market}
        mode={mode}
        onMarket={() => setShowIntro(true)}
        refreshKey={refreshKey}
        onPay={setPayOrder}
        onGoCart={() => goTab('cart')}
        onRefreshUser={refreshUser}
      />
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      {showIntro ? (
        <Onboarding
          initialMarket={market}
          initialMode={mode}
          onDone={finishIntro}
          onCancel={market && mode ? () => setShowIntro(false) : null}
        />
      ) : (
        <>
          {waking && !products && <div className="waking">{t.waking}</div>}
          <main className="app">{page}</main>
          <BottomNav tab={navKey} onTab={goTab} onSearch={openSearch} />

          <ProductSheet
            product={openProduct}
            config={config}
            market={market}
            mode={mode}
            onClose={() => setOpenProductId(null)}
            onGoCart={() => {
              setOpenProductId(null);
              goTab('cart');
            }}
          />

          <Checkout
            open={checkoutOpen}
            calc={checkoutCalc}
            config={config}
            market={market}
            mode={mode}
            marketCfg={marketCfg}
            user={user}
            onClose={() => setCheckoutOpen(false)}
            onDone={onOrderDone}
            onProblems={() => {
              setCheckoutOpen(false);
              setRefreshKey((k) => k + 1);
              api.products().then(setProducts).catch(() => {});
            }}
          />

          <PaymentScreen
            order={payOrder}
            card={config?.markets?.find((m) => m.key === (payOrder?.market || market))?.payment?.card}
            onClose={() => {
              setPayOrder(null);
              setRefreshKey((k) => k + 1);
            }}
            onUpdated={() => setRefreshKey((k) => k + 1)}
          />

          <OrderSuccess
            order={successOrder}
            onClose={() => {
              setSuccessOrder(null);
              goTab('home');
            }}
            onOrders={() => {
              setSuccessOrder(null);
              goTab('profile');
            }}
          />

          {storyIndex !== null && stories.length > 0 && (
            <StoryViewer
              stories={stories}
              start={storyIndex}
              onClose={() => setStoryIndex(null)}
              onSeen={markSeen}
              onProduct={(id) => {
                setStoryIndex(null);
                if (productById.has(id)) setOpenProductId(id);
              }}
            />
          )}
        </>
      )}
      <Toaster />
    </I18nContext.Provider>
  );
}

function Loading() {
  return (
    <div className="page loading">
      <div className="sk sk-head" />
      <div className="sk sk-hero" />
      <div className="grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="sk sk-card" key={i} />
        ))}
      </div>
    </div>
  );
}
