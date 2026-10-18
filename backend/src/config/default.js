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
    phone: env.COMPANY_PHONE || '', // Koreya raqami
    phoneUz: env.COMPANY_PHONE_UZ || '+998902810585', // O'zbekiston raqami
    address: env.COMPANY_ADDRESS || '',
    telegram: 'fotimazuhrashop', // admin bilan yozishish
    channel: 'korea_fotima_zuhra_shop',
    instagram: 'ippo_by_fotimazuhra',
  },

  // Bot profili. short — t.me/IPPO_by_fotimazuhrabot link preview'da rasm yonida chiqadi (120 belgigacha),
  // description — bo'sh chatda "Start" ustida (512 belgigacha). Rasm: BotFather → /setuserpic
  botProfile: {
    uz: {
      short: 'Koreyadan original kosmetika, jenshen, kollagen va vitaminlar — O‘zbekiston va Koreya bo‘ylab yetkazib berish',
      description:
        'IPPO by Fotima Zuhra — Koreyadan original kosmetika 🇰🇷\n\n' +
        '🌿 Jenshen  🍎 Kollagen  💊 Vitaminlar\n✨ Yuz va soch parvarishi  🌸 Atirlar\n\n' +
        '🚚 O‘zbekiston va Koreya bo‘ylab yetkazib berish\n💳 Kartaga to‘lov  🎁 Cashback\n\n' +
        'Do‘konni ochish uchun «Start» ni bosing 👇',
    },
    ru: {
      short: 'Оригинальная корейская косметика, женьшень, коллаген и витамины — доставка по Узбекистану и Корее',
      description:
        'IPPO by Fotima Zuhra — оригинальная косметика из Кореи 🇰🇷\n\n' +
        '🌿 Женьшень  🍎 Коллаген  💊 Витамины\n✨ Уход за лицом и волосами  🌸 Парфюм\n\n' +
        '🚚 Доставка по Узбекистану и Корее\n💳 Оплата на карту  🎁 Кэшбэк\n\n' +
        'Нажмите «Старт», чтобы открыть магазин 👇',
    },
  },


  // Kategoriyalar (kalit bazada saqlanadi — o'zgartirmang, nomini o'zgartirsa bo'ladi)
  // only: shu bo'lim faqat Koreya + dona uchun. Boshqa davlat/optomda bu bo'limdagi mahsulot
  // faqat admin o'sha narxni kiritgan bo'lsa ko'rinadi.
  categories: [
    { key: 'jenshen', uz: 'Jenshen', ru: 'Женьшень', emoji: '🌿' },
    { key: 'kollagen', uz: 'Kollagen', ru: 'Коллаген', emoji: '🍎' },
    { key: 'vitaminlar', uz: 'Vitaminlar', ru: 'Витамины', emoji: '💊' },
    { key: 'soch', uz: 'Soch parvarishi', ru: 'Уход за волосами', emoji: '💆‍♀️' },
    { key: 'yuz', uz: 'Yuz parvarishi', ru: 'Уход за лицом', emoji: '✨' },
    { key: 'parfyum', uz: 'Atir', ru: 'Парфюм', emoji: '🌸', only: { market: 'kr', mode: 'retail' } },
    { key: 'kitob', uz: 'Kitob', ru: 'Книги', emoji: '📚', only: { market: 'kr', mode: 'retail' } },
    { key: 'islomiy', uz: 'Islomiy', ru: 'Исламское', emoji: '🕌', only: { market: 'kr', mode: 'retail' } },
    { key: 'tilla', uz: 'Tilla taqinchoqlar', ru: 'Золотые украшения', emoji: '💍', only: { market: 'kr', mode: 'retail' } },
  ],

  // Teglar (katalogdagi filtr)
  tags: [
    { key: 'new', uz: 'Yangi', ru: 'Новинка' },
    { key: 'hit', uz: 'Xit', ru: 'Хит' },
    { key: 'sale', uz: 'Aksiya', ru: 'Акция' },
    { key: 'set', uz: 'To‘plam', ru: 'Набор' },
  ],

  // Aksiya "N+M": bitta mahsulotdan N ta olsa, yana M tasi bepul. Har davlatning optom va donasiga alohida yoqiladi.
  // Admin panelda tayyor tugmalar; boshqasini qo'lda yozsa bo'ladi (masalan 4+1)
  promos: [
    { key: '1+1', buy: 1, free: 1 },
    { key: '2+1', buy: 2, free: 1 },
    { key: '3+1', buy: 3, free: 1 },
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

  // To'lov: faqat kartaga o'tkazma (har davlatning kartasi admin paneldan kiritiladi)
  payment: {
    methods: ['card'],
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
