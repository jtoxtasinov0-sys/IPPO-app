// BREND SOZLAMALARI — yangi brendda asosan shu fayl o'zgaradi
require('dotenv').config();

const env = process.env;
const trimSlash = (s) => (s || '').trim().replace(/\/+$/, '');

module.exports = {
  port: Number(env.PORT) || 5000,
  // Render o'zi RENDER=true qo'yadi
  isProd: env.NODE_ENV === 'production' || !!env.RENDER,

  botToken: (env.BOT_TOKEN || '').trim(),
  adminChatIds: (env.ADMIN_CHAT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  miniappUrl: trimSlash(env.MINIAPP_URL) || 'http://localhost:5173',
  adminUrl: trimSlash(env.ADMIN_URL) || 'http://localhost:5174',
  publicUrl: trimSlash(env.PUBLIC_URL || env.RENDER_EXTERNAL_URL),

  adminUsername: env.ADMIN_USERNAME || 'admin',
  adminPassword: env.ADMIN_PASSWORD || 'ippo12345',
  jwtSecret: env.JWT_SECRET || 'ippo-dev-secret-change-me',

  company: {
    name: 'IPPO by Fotima Zuhra',
    short: 'IPPO',
    slogan: { uz: 'Koreyadan original go‘zallik', ru: 'Оригинальная красота из Кореи' },
    phone: env.COMPANY_PHONE || '',
    address: env.COMPANY_ADDRESS || '',
    telegram: 'fotimazuhrashop', // admin bilan yozishish
    channel: 'korea_fotima_zuhra_shop',
    instagram: 'ippo_by_fotimazuhra',
  },


  // Kategoriyalar (kalit bazada saqlanadi — o'zgartirmang, nomini o'zgartirsa bo'ladi)
  categories: [
    { key: 'jenshen', uz: 'Jenshen', ru: 'Женьшень', emoji: '🌿' },
    { key: 'kollagen', uz: 'Kollagen', ru: 'Коллаген', emoji: '🍎' },
    { key: 'vitaminlar', uz: 'Vitaminlar', ru: 'Витамины', emoji: '💊' },
    { key: 'soch', uz: 'Soch parvarishi', ru: 'Уход за волосами', emoji: '💆‍♀️' },
    { key: 'yuz', uz: 'Yuz parvarishi', ru: 'Уход за лицом', emoji: '✨' },
    { key: 'parfyum', uz: 'Parfyumeriya', ru: 'Парфюмерия', emoji: '🌸' },
  ],

  // Teglar (katalogdagi filtr)
  tags: [
    { key: 'new', uz: 'Yangi', ru: 'Новинка' },
    { key: 'hit', uz: 'Xit', ru: 'Хит' },
    { key: 'sale', uz: 'Aksiya', ru: 'Акция' },
    { key: 'set', uz: 'To‘plam', ru: 'Набор' },
  ],

  // Davlatlar: har birining valyutasi, hududlari va telefon kodi.
  // Mijoz birinchi kirganda davlatni, keyin optom yoki donani tanlaydi.
  markets: [
    {
      key: 'uz',
      uz: 'O‘zbekiston',
      ru: 'Узбекистан',
      flag: '🇺🇿',
      currency: { code: 'UZS', symbol: 'so‘m' },
      phoneCode: '998',
      regions: [
        { key: 'toshkent_sh', uz: 'Toshkent shahri', ru: 'г. Ташкент' },
        { key: 'toshkent_v', uz: 'Toshkent viloyati', ru: 'Ташкентская обл.' },
        { key: 'andijon', uz: 'Andijon', ru: 'Андижан' },
        { key: 'buxoro', uz: 'Buxoro', ru: 'Бухара' },
        { key: 'fargona', uz: 'Farg‘ona', ru: 'Фергана' },
        { key: 'jizzax', uz: 'Jizzax', ru: 'Джизак' },
        { key: 'xorazm', uz: 'Xorazm', ru: 'Хорезм' },
        { key: 'namangan', uz: 'Namangan', ru: 'Наманган' },
        { key: 'navoiy', uz: 'Navoiy', ru: 'Навои' },
        { key: 'qashqadaryo', uz: 'Qashqadaryo', ru: 'Кашкадарья' },
        { key: 'qoraqalpogiston', uz: 'Qoraqalpog‘iston', ru: 'Каракалпакстан' },
        { key: 'samarqand', uz: 'Samarqand', ru: 'Самарканд' },
        { key: 'sirdaryo', uz: 'Sirdaryo', ru: 'Сырдарья' },
        { key: 'surxondaryo', uz: 'Surxondaryo', ru: 'Сурхандарья' },
      ],
    },
    {
      key: 'kr',
      uz: 'Koreya',
      ru: 'Корея',
      flag: '🇰🇷',
      currency: { code: 'KRW', symbol: '₩' },
      phoneCode: '82',
      regions: [
        { key: 'seoul', uz: 'Seul', ru: 'Сеул' },
        { key: 'gyeonggi', uz: 'Gyeonggi-do', ru: 'Кёнгидо' },
        { key: 'incheon', uz: 'Incheon', ru: 'Инчхон' },
        { key: 'busan', uz: 'Busan', ru: 'Пусан' },
        { key: 'daegu', uz: 'Daegu', ru: 'Тэгу' },
        { key: 'daejeon', uz: 'Daejeon', ru: 'Тэджон' },
        { key: 'gwangju', uz: 'Gwangju', ru: 'Кванджу' },
        { key: 'ulsan', uz: 'Ulsan', ru: 'Ульсан' },
        { key: 'sejong', uz: 'Sejong', ru: 'Сечжон' },
        { key: 'gangwon', uz: 'Gangwon-do', ru: 'Канвондо' },
        { key: 'chungbuk', uz: 'Chungcheongbuk-do', ru: 'Чхунчхон-Пукто' },
        { key: 'chungnam', uz: 'Chungcheongnam-do', ru: 'Чхунчхон-Намдо' },
        { key: 'jeonbuk', uz: 'Jeollabuk-do', ru: 'Чолла-Пукто' },
        { key: 'jeonnam', uz: 'Jeollanam-do', ru: 'Чолла-Намдо' },
        { key: 'gyeongbuk', uz: 'Gyeongsangbuk-do', ru: 'Кёнсан-Пукто' },
        { key: 'gyeongnam', uz: 'Gyeongsangnam-do', ru: 'Кёнсан-Намдо' },
        { key: 'jeju', uz: 'Jeju', ru: 'Чеджу' },
      ],
    },
  ],

  // Savdo turi: dona (chakana) yoki optom
  modes: [
    { key: 'retail', uz: 'Dona', ru: 'В розницу' },
    { key: 'wholesale', uz: 'Optom', ru: 'Оптом' },
  ],

  // To'lov: naqd va kartaga o'tkazma (har davlatning kartasi admin paneldan kiritiladi)
  payment: {
    methods: ['cash', 'card'],
    card: {
      number: env.PAYMENT_CARD || '',
      holder: env.PAYMENT_CARD_HOLDER || '',
      bank: env.PAYMENT_BANK || '',
    },
  },

  orderStatuses: ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  paymentStatuses: ['unpaid', 'pending', 'paid', 'rejected'],
};

// Yordamchilar: davlat va savdo turini tekshirish
const M = module.exports;
M.market = (key) => M.markets.find((m) => m.key === key) || M.markets.find((m) => m.key === 'kr');
M.isMarket = (key) => M.markets.some((m) => m.key === key);
M.isMode = (key) => M.modes.some((m) => m.key === key);
M.allRegions = () => M.markets.flatMap((m) => m.regions);
