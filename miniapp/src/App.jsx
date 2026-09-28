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

function loadSeen() {
  try {
    return new Set(JSON.parse(ls.get('ippo_seen_stories') || '[]'));
  } catch {
    return new Set();
  }
}

export default function App() {
  const [lang, setLangState] = useState(initialLang);
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState(null);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [waking, setWaking] = useState(false);

  const [tab, setTab] = useState('home');
  const [filter, setFilter] = useState({ category: null, tag: null, q: '' });
  const [openProductId, setOpenProductId] = useState(null);
  const [storyIndex, setStoryIndex] = useState(null);
  const [seenStories, setSeenStories] = useState(loadSeen);
  const [checkoutCalc, setCheckoutCalc] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payOrder, setPayOrder] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showIntro, setShowIntro] = useState(() => !ls.get('ippo_intro'));

  useEffect(() => onWaking(setWaking), []);

  const loadAll = useCallback(() => {
    setLoadError(false);
    Promise.all([api.config(), api.products(), api.stories().catch(() => [])])
      .then(([c, p, s]) => {
        setConfig(c);
        setProducts(p);
        setStories(s);
        reloadBrokenImages();
      })
      .catch(() => setLoadError(true));
    api
      .me()
      .then((u) => {
        setUser(u);
        if (!ls.get('ippo_lang') && (u.lang === 'uz' || u.lang === 'ru')) setLangState(u.lang);
        if (u.seenIntro) setShowIntro(false);
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

  function finishIntro() {
    setShowIntro(false);
    ls.set('ippo_intro', '1');
    api.updateMe({ seenIntro: true }).catch(() => {});
  }

  function goTab(next) {
    setTab(next);
    window.scrollTo({ top: 0 });
  }

  function openCatalog(patch = {}) {
    setFilter({ category: null, tag: null, q: '', ...patch });
    goTab('catalog');
  }

  function markSeen(id) {
    setSeenStories((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      ls.set('ippo_seen_stories', JSON.stringify([...next].slice(-100)));
      return next;
    });
  }

  const productById = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);
  const openProduct = openProductId ? productById.get(openProductId) : null;

  function onOrderDone(order) {
    setCheckoutOpen(false);
    setRefreshKey((k) => k + 1);
    // mahsulot qoldiqlari o'zgargan bo'lishi mumkin
    api.products().then(setProducts).catch(() => {});
    setTimeout(() => (order.paymentMethod === 'card' ? setPayOrder(order) : setSuccessOrder(order)), 280);
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
  } else if (!products) {
    page = <Loading />;
  } else if (tab === 'home') {
    page = (
      <Home
        config={config}
        products={products}
        stories={stories}
        seenStories={seenStories}
        user={user}
        onStory={setStoryIndex}
        onOpen={(p) => setOpenProductId(p.id)}
        onCatalog={openCatalog}
      />
    );
  } else if (tab === 'catalog') {
    page = (
      <Catalog config={config} products={products} filter={filter} setFilter={setFilter} onOpen={(p) => setOpenProductId(p.id)} />
    );
  } else if (tab === 'cart') {
    page = (
      <Cart
        products={products}
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
        refreshKey={refreshKey}
        onPay={setPayOrder}
        onGoCart={() => goTab('cart')}
        onIntro={() => setShowIntro(true)}
      />
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      {showIntro ? (
        <Onboarding onDone={finishIntro} />
      ) : (
        <>
          {waking && <div className="waking">{t.waking}</div>}
          <main className="app">{page}</main>
          <BottomNav tab={tab} onTab={goTab} />

          <ProductSheet
            product={openProduct}
            config={config}
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
            card={config?.payment?.card}
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
