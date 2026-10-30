// Mahsulotlar katalogi va storylar.
// CATALOG_VERSION o'zgarsa — bazadagi ESKI mahsulotlar va storylar o'chirilib, shu ro'yxat yoziladi (bir marta).
// Keyingi deploylarda tegmaydi (admin panelda qilingan o'zgarishlar saqlanadi). SEED_FORCE=1 — qayta yozadi.
require('dotenv').config();
const prisma = require('../src/database/connection');

const { warmThumbs } = require('../src/utils/upload');

const CATALOG_VERSION = '2026-10-02';
const ADDITIONS_VERSION = '2026-10-13';
const img = (f) => `/uploads/products/${f}.jpg`;
const FORCE = process.env.SEED_FORCE === '1';

// Narxlar: kr / krOptom — Koreya (₩), uz / uzOptom — O'zbekiston (so'm).
// 0 = narx kiritilmagan ("Narxini so'rang") — admin paneldan kiriting.
const products = [
  {
    article: 'IP-101', category: 'jenshen', tag: 'hit', brand: 'Punggi', isFeatured: true, volume: '240 g',
    krOptom: 125000, kr: 165000, uzOptom: 1350000, uz: 1800000,
    name: 'Punggi Red Ginseng Extract Gold (6 yillik)',
    nameRu: 'Punggi Red Ginseng Extract Gold (6-летний)',
    images: ['n01_punggi_gold_jenshen'],
    description:
      '100% 6 yillik Koreya qizil jensheni ekstrakti — Punggi.\n\n🛡️ Immunitetni qo‘llab-quvvatlaydi\n💪 Charchoqni kamaytiradi, quvvat beradi\n🧠 Xotira va diqqat uchun\n✨ Antioksidant himoya\n\n🥄 Kuniga 3 g (1 qoshiqcha) — iliq suv bilan.',
    descriptionRu:
      'Экстракт 100% 6-летнего корейского красного женьшеня Punggi.\n\n🛡️ Поддерживает иммунитет\n💪 Снимает усталость, придаёт энергию\n🧠 Для памяти и концентрации\n✨ Антиоксидантная защита\n\n🥄 3 г в день (1 ложечка) — с тёплой водой.',
  },
  {
    article: 'IP-102', category: 'jenshen', tag: 'new', brand: 'Punggi',
    krOptom: 55000, kr: 75000, uzOptom: 680000, uz: 780000,
    name: 'Bolajonlar uchun oltindek qadrli jenshen',
    nameRu: 'Детский красный женьшень Punggi',
    images: ['n02_bolalar_jenshen'],
    description:
      'Bolalar uchun maxsus 6 yillik qizil jenshen — qulay stiklarda, yoqimli ta’mli.\n\n🛡️ Immunitetni mustahkamlaydi\n⚡ O‘qish va o‘yin uchun quvvat\n🍯 Bolalar sevib ichadi',
    descriptionRu:
      'Специальный 6-летний красный женьшень для детей — в удобных стиках, с приятным вкусом.\n\n🛡️ Укрепляет иммунитет\n⚡ Энергия для учёбы и игр\n🍯 Дети пьют с удовольствием',
  },
  {
    article: 'IP-103', category: 'jenshen', tag: 'set', volume: '250 g × 4',
    krOptom: 35000, kr: 49000, uzOptom: 850000, uz: 1200000,
    name: 'Qizil jenshen ekstrakti — 4 bankali set',
    nameRu: 'Экстракт красного женьшеня — набор 4 банки',
    images: ['n03_qizil_jenshen_1', 'n03_qizil_jenshen_2'],
    description:
      'Koreya 6 yillik qizil jensheni ekstrakti (홍삼정 진액) — premium sovg‘abop qutida, 4 banka.\n\n🛡️ Immunitet va tetiklik\n❤️ Qon aylanishini qo‘llab-quvvatlaydi\n🎁 Yaqinlaringizga ajoyib sovg‘a',
    descriptionRu:
      'Экстракт корейского 6-летнего красного женьшеня (홍삼정 진액) — премиальная подарочная коробка, 4 банки.\n\n🛡️ Иммунитет и бодрость\n❤️ Поддерживает кровообращение\n🎁 Отличный подарок близким',
  },
  {
    article: 'IP-104', category: 'jenshen', tag: 'set', isFeatured: true, volume: '4 banka',
    krOptom: 45000, kr: 65000, uzOptom: 950000, uz: 1400000,
    name: 'Qora jenshen Royal Gold — 4 bankali set',
    nameRu: 'Чёрный женьшень Royal Gold — набор 4 банки',
    images: ['n04_qora_jenshen_1', 'n04_qora_jenshen_2'],
    description:
      'Koreya 6 yillik qora jensheni (흑삼) Royal Gold — 4 banka va qoshiqcha bilan sovg‘abop set.\n\n💪 Kuchli quvvat va chidamlilik\n🛡️ Immunitetni qo‘llab-quvvatlaydi\n🎁 Hurmatli insonlarga sovg‘a uchun',
    descriptionRu:
      'Корейский 6-летний чёрный женьшень (흑삼) Royal Gold — подарочный набор из 4 банок с ложечкой.\n\n💪 Сила и выносливость\n🛡️ Поддерживает иммунитет\n🎁 Достойный подарок',
  },
  {
    article: 'IP-105', category: 'kollagen', brand: 'Hurum', volume: '90 stik (3 oylik)',
    krOptom: 14000, kr: 15000, uzOptom: 0, uz: 0,
    name: 'Hurum Biotin Collagen Peptide',
    nameRu: 'Hurum Biotin Collagen Peptide',
    images: ['n05_biotin_collagen'],
    description:
      'Biotin + past molekulali baliq kollageni + vitamin C + gialuron kislotasi. 90 stik — 3 oyga yetadi.\n\n💅 Soch va tirnoqlarni mustahkamlaydi\n✨ Teri elastikligi va namligi uchun',
    descriptionRu:
      'Биотин + низкомолекулярный рыбный коллаген + витамин C + гиалуроновая кислота. 90 стиков — на 3 месяца.\n\n💅 Укрепляет волосы и ногти\n✨ Для упругости и увлажнения кожи',
  },
  {
    article: 'IP-106', category: 'kollagen', tag: 'hit', isFeatured: true, volume: '30 stik',
    krOptom: 26000, kr: 40000, uzOptom: 0, uz: 0,
    name: 'Red Apple Collagen jelly stik',
    nameRu: 'Red Apple Collagen желе-стики',
    images: ['n06_red_apple_collagen'],
    description:
      'Qizil olma ekstraktli baliq kollageni — mazali jelly stiklarda. Made in Korea, HACCP.\n\n🍎 Metabolizmni qo‘llab-quvvatlaydi\n💅 Soch, tirnoq va teri salomatligi uchun\n📦 Kuniga 1 stik',
    descriptionRu:
      'Рыбный коллаген с экстрактом красного яблока — вкусные желе-стики. Made in Korea, HACCP.\n\n🍎 Поддерживает метаболизм\n💅 Для здоровья волос, ногтей и кожи\n📦 1 стик в день',
  },
  {
    article: 'IP-107', category: 'kollagen', tag: 'new', brand: 'Vitasub', volume: '30 stik',
    krOptom: 6000, kr: 7000, uzOptom: 0, uz: 0,
    name: 'Vitasub Slim Collagen Plus (glutation)',
    nameRu: 'Vitasub Slim Collagen Plus (глутатион)',
    images: ['n07_slim_collagen'],
    description:
      'Past molekulali kollagen + oq glutation + vitamin C + biotin.\n\n🤍 Teri rangini tekislaydi va yoritadi\n💧 Namlik beradi\n✨ Yosh va sog‘lom ko‘rinish',
    descriptionRu:
      'Низкомолекулярный коллаген + белый глутатион + витамин C + биотин.\n\n🤍 Выравнивает и осветляет тон кожи\n💧 Увлажняет\n✨ Молодой и здоровый вид',
  },
  {
    article: 'IP-108', category: 'vitaminlar', volume: '120 dona',
    krOptom: 14000, kr: 19000, uzOptom: 0, uz: 0,
    name: 'Bolalar kaltsiysi (chaynaladigan)',
    nameRu: 'Детский кальций (жевательный)',
    images: ['n08_bolalar_kaltsiy'],
    description:
      'Kaltsiy + magniy + sink + vitamin D + foliy kislotasi — bolalar uchun chaynaladigan tabletkalar.\n\n🦴 Suyak va tish o‘sishi uchun\n📏 Bo‘y o‘sishini qo‘llab-quvvatlaydi',
    descriptionRu:
      'Кальций + магний + цинк + витамин D + фолиевая кислота — жевательные таблетки для детей.\n\n🦴 Для роста костей и зубов\n📏 Поддерживает рост',
  },
  {
    article: 'IP-109', category: 'vitaminlar',
    krOptom: 13000, kr: 19000, uzOptom: 0, uz: 0,
    name: 'Bolalar Omega-3 (Kanada)',
    nameRu: 'Детская Омега-3 (Канада)',
    images: ['n09_bolalar_omega3'],
    description: 'Bolalar uchun Omega-3 — Kanadada ishlab chiqarilgan.\n\n🧠 Miya rivojlanishi va diqqat uchun\n👀 Ko‘rish salomatligi uchun',
    descriptionRu: 'Омега-3 для детей — произведено в Канаде.\n\n🧠 Для развития мозга и внимания\n👀 Для здоровья зрения',
  },
  {
    article: 'IP-110', category: 'vitaminlar', tag: 'hit', volume: '300 tabletka',
    krOptom: 21000, kr: 30000, uzOptom: 0, uz: 0,
    name: 'Kaltsiy + Magniy + Vitamin D + Sink (Kanada)',
    nameRu: 'Кальций + Магний + Витамин D + Цинк (Канада)',
    images: ['n10_kaltsiy_kompleks'],
    description:
      'Premium kompleks, Made in Canada. 1 tabletkada: kaltsiy 400 mg, magniy 220 mg, vitamin D 10 mkg, sink 10 mg.\n\n🦴 Suyak va bo‘g‘imlar uchun\n💪 Mushaklar va immunitet uchun',
    descriptionRu:
      'Премиум-комплекс, Made in Canada. В 1 таблетке: кальций 400 мг, магний 220 мг, витамин D 10 мкг, цинк 10 мг.\n\n🦴 Для костей и суставов\n💪 Для мышц и иммунитета',
  },
  {
    article: 'IP-111', category: 'vitaminlar',
    krOptom: 21000, kr: 30000, uzOptom: 0, uz: 0,
    name: 'Omega-3 (Yangi Zelandiya)',
    nameRu: 'Омега-3 (Новая Зеландия)',
    images: ['n11_omega3'],
    description: 'Yangi Zelandiyada ishlab chiqarilgan sifatli Omega-3.\n\n❤️ Yurak va qon tomirlar uchun\n🧠 Miya faoliyati va xotira uchun',
    descriptionRu: 'Качественная Омега-3 из Новой Зеландии.\n\n❤️ Для сердца и сосудов\n🧠 Для работы мозга и памяти',
  },
  {
    article: 'IP-112', category: 'soch',
    krOptom: 15000, kr: 18000, uzOptom: 0, uz: 0,
    name: 'Jenshenli shampun',
    nameRu: 'Шампунь с женьшенем',
    images: ['n12_jenshen_shampun'],
    description: 'Jenshen ekstraktli shampun — soch ildizlarini oziqlantiradi va mustahkamlaydi.\n\n💆‍♀️ Soch to‘kilishiga qarshi\n✨ Sochga sog‘lom jilo beradi',
    descriptionRu: 'Шампунь с экстрактом женьшеня — питает и укрепляет корни волос.\n\n💆‍♀️ Против выпадения волос\n✨ Придаёт волосам здоровый блеск',
  },
  {
    article: 'IP-113', category: 'soch',
    krOptom: 9000, kr: 10000, uzOptom: 0, uz: 0,
    name: 'Rosemary soch spreyi',
    nameRu: 'Спрей для волос с розмарином',
    images: ['n13_rosemary_sprey'],
    description: 'Rozmarin spreyi soch ildizlarini mustahkamlaydi va o‘sishini qo‘llab-quvvatlaydi. 🌿',
    descriptionRu: 'Спрей с розмарином укрепляет корни и поддерживает рост волос. 🌿',
  },
  {
    article: 'IP-114', category: 'yuz', brand: 'Dr.IPPO',
    krOptom: 15000, kr: 22000, uzOptom: 0, uz: 0,
    name: 'Dr.IPPO Aqua penka',
    nameRu: 'Пенка Dr.IPPO Aqua',
    images: ['n14_drippo_aqua_penka'],
    description: 'Yuvinish uchun namlovchi penka — terini quritmasdan chuqur tozalaydi. 💧',
    descriptionRu: 'Увлажняющая пенка для умывания — глубоко очищает, не пересушивая кожу. 💧',
  },
  {
    article: 'IP-115', category: 'yuz', brand: 'Dr.IPPO',
    krOptom: 15000, kr: 22000, uzOptom: 0, uz: 0,
    name: 'Dr.IPPO Snow penka',
    nameRu: 'Пенка Dr.IPPO Snow',
    images: ['n15_drippo_snow_penka'],
    description: 'Yorituvchi penka — terini tozalaydi va rangini tekislaydi. ❄️',
    descriptionRu: 'Осветляющая пенка — очищает кожу и выравнивает тон. ❄️',
  },
  {
    article: 'IP-116', category: 'yuz', tag: 'hit', brand: 'Dr.IPPO', isFeatured: true,
    krOptom: 25000, kr: 43000, uzOptom: 0, uz: 0,
    name: 'Dr.IPPO ko‘z kremi',
    nameRu: 'Крем для глаз Dr.IPPO',
    images: ['n16_drippo_koz_kremi'],
    description: 'Ko‘z atrofi uchun parvarish kremi.\n\n👁️ Ajinlar va qoramtirlikni kamaytiradi\n💧 Nozik terini namlantiradi',
    descriptionRu: 'Уходовый крем для кожи вокруг глаз.\n\n👁️ Уменьшает морщинки и тёмные круги\n💧 Увлажняет нежную кожу',
  },
  {
    article: 'IP-117', category: 'yuz', brand: 'Dr.IPPO',
    krOptom: 18000, kr: 25000, uzOptom: 0, uz: 0,
    name: 'Dr.IPPO SPF quyosh kremi',
    nameRu: 'Солнцезащитный крем Dr.IPPO SPF',
    images: ['n17_drippo_spf'],
    description: 'Quyoshdan himoya kremi — terini UV nurlardan va dog‘lardan asraydi. ☀️',
    descriptionRu: 'Солнцезащитный крем — защищает кожу от UV-лучей и пигментации. ☀️',
  },
  {
    article: 'IP-118', category: 'yuz', tag: 'set', brand: 'ANJO', isFeatured: true, volume: '8 dona',
    krOptom: 26000, kr: 30000, uzOptom: 0, uz: 0,
    name: 'ANJO 24K Gold parvarish to‘plami',
    nameRu: 'Набор ухода ANJO 24K Gold',
    images: ['n18_anjo_24k_gold'],
    description: '24K oltinli yuz parvarishi to‘plami — 8 ta mahsulot: tonik, emulsiya, serum, krem, ko‘z kremi.\n\n✨ Teriga yorqinlik va taranglik\n🎁 Sovg‘a uchun ideal',
    descriptionRu: 'Набор ухода за лицом с 24K золотом — 8 средств: тоник, эмульсия, сыворотка, крем, крем для глаз.\n\n✨ Сияние и упругость кожи\n🎁 Идеален для подарка',
  },
];

// Qo'shimcha mahsulotlar (2026-10-13) — faqat Koreya, dona narxi (taxminiy, admin paneldan o'zgartiriladi).
// Katalogni o'chirmaydi: bazada shu artikul yo'q bo'lsagina qo'shiladi.
const KR = (kr) => ({ kr, krOptom: 0, uz: 0, uzOptom: 0 });
const book = (author, cover, uzExtra = '', ruExtra = '') => ({
  description: `✍️ Muallif: ${author}\n📖 O‘zbek tilida (kirill), ${cover === 'hard' ? 'qattiq' : 'yumshoq'} muqova${uzExtra ? '\n\n' + uzExtra : ''}`,
  descriptionRu: `✍️ Автор: ${author}\n📖 На узбекском языке (кириллица), ${cover === 'hard' ? 'твёрдый' : 'мягкий'} переплёт${ruExtra ? '\n\n' + ruExtra : ''}`,
});
const perfume = (uz, ru) => ({ description: uz, descriptionRu: ru });

const additions = [
  // — Vitaminlar va kollagen —
  {
    article: 'IP-201', category: 'vitaminlar', brand: 'Fine Health', volume: '365 kapsula', ...KR(35000),
    name: 'Fine Omega-3 baliq yog‘i 1000 mg', nameRu: 'Fine Омега-3 рыбий жир 1000 мг',
    images: ['v01_fine_omega3'],
    description: 'Chuqur dengiz baliqlari yog‘i — EPA + DHA, 1000 mg, 365 kapsula (1 yillik).\n\n❤️ Yurak va qon tomirlar uchun\n🧠 Miya va xotira uchun\n👀 Ko‘rish salomatligi uchun',
    descriptionRu: 'Рыбий жир глубоководных рыб — EPA + DHA, 1000 мг, 365 капсул (на год).\n\n❤️ Для сердца и сосудов\n🧠 Для мозга и памяти\n👀 Для здоровья зрения',
  },
  {
    article: 'IP-202', category: 'vitaminlar', tag: 'new', volume: '150 tabletka', ...KR(25000),
    name: 'Vitamin D + Kaltsiy + Magniy + Sink (Kanada, 150 tabletka)', nameRu: 'Витамин D + Кальций + Магний + Цинк (Канада, 150 таблеток)',
    images: ['v02_vitamin_d_kompleks'],
    description: 'Made in Canada. 1 tabletkada: vitamin D 400 IU, kaltsiy 400 mg, magniy 220 mg, sink 10 mg.\n\n🦴 Suyak va tishlar uchun\n💪 Mushaklar va immunitet uchun',
    descriptionRu: 'Made in Canada. В 1 таблетке: витамин D 400 МЕ, кальций 400 мг, магний 220 мг, цинк 10 мг.\n\n🦴 Для костей и зубов\n💪 Для мышц и иммунитета',
  },
  {
    article: 'IP-203', category: 'vitaminlar', tag: 'hit', brand: 'KU Kids Up', volume: '120 tabletka', ...KR(29000),
    name: 'Kids Up bolalar kaltsiysi (chaynaladigan)', nameRu: 'Kids Up детский кальций (жевательный)',
    images: ['v03_kids_up_kaltsiy'],
    description: 'Bolalar uchun chaynaladigan tabletka: kaltsiy + magniy + sink + vitamin D + foliy kislotasi. Koreya, Konkuk sut zavodi.\n\n📏 Bo‘y o‘sishini qo‘llab-quvvatlaydi\n🦴 Suyak va tishlar uchun',
    descriptionRu: 'Жевательные таблетки для детей: кальций + магний + цинк + витамин D + фолиевая кислота. Корея, Konkuk.\n\n📏 Поддерживает рост\n🦴 Для костей и зубов',
  },
  {
    article: 'IP-204', category: 'vitaminlar', brand: 'i-KLE Kids', volume: '60 dona', ...KR(29000),
    name: 'i-KLE Kids Omega Gummi (bolalar omegasi)', nameRu: 'i-KLE Kids Omega Gummi (детская омега)',
    images: ['v04_omega_gummi'],
    description: 'Bolalar uchun mazali omega-3 marmeladlari — EPA + DHA. Kanadada ishlab chiqarilgan, 60 dona.\n\n🧠 Miya rivojlanishi va diqqat uchun\n🍬 Bolalar sevib yeydi',
    descriptionRu: 'Вкусные мармеладки омега-3 для детей — EPA + DHA. Произведено в Канаде, 60 шт.\n\n🧠 Для развития мозга и внимания\n🍬 Дети едят с удовольствием',
  },
  {
    article: 'IP-205', category: 'kollagen', tag: 'new', brand: 'Wellness Bio', volume: '10 ml × 30 stik', ...KR(45000),
    name: 'Qizil jenshen + anor kollageni (30 stik)', nameRu: 'Коллаген с красным женьшенем и гранатом (30 стиков)',
    images: ['v05_jenshen_anor_kollagen'],
    description: 'Koreya qizil jensheni + anor sharbati + baliq kollageni — ichimlik stiklarda (10 ml × 30).\n\n✨ Teri elastikligi va yorqinligi uchun\n🛡️ Immunitet va tetiklik',
    descriptionRu: 'Корейский красный женьшень + гранатовый сок + рыбный коллаген — питьевые стики (10 мл × 30).\n\n✨ Для упругости и сияния кожи\n🛡️ Иммунитет и бодрость',
  },

  // — Islomiy —
  {
    article: 'IP-211', category: 'islomiy', tag: 'hit', isFeatured: true, brand: 'Munir nashriyoti', ...KR(60000),
    name: 'Qur’oni Karim — o‘zbekcha tarjima va tafsir', nameRu: 'Коран — перевод и тафсир на узбекском',
    images: ['i01_quroni_karim_tarjima_1', 'i01_quroni_karim_tarjima_2'],
    description: 'Qur’oni Karim ma’nolarining o‘zbek tilidagi tarjimasi va tafsiri. Katta format, qattiq muqova, Munir nashriyoti.\n\n🎁 Yaqinlaringizga eng qadrli sovg‘a',
    descriptionRu: 'Перевод и тафсир смыслов Корана на узбекском языке. Большой формат, твёрдый переплёт, издательство Munir.\n\n🎁 Самый ценный подарок близким',
  },
  {
    article: 'IP-212', category: 'islomiy', ...KR(55000),
    name: 'Tajvidli Qur’on', nameRu: 'Коран с таджвидом',
    images: ['i02_tajvidli_quron'],
    description: 'Tajvid qoidalari rang bilan belgilangan Qur’oni Karim — to‘g‘ri o‘qishni o‘rganish uchun qulay. Qattiq muqova.',
    descriptionRu: 'Коран с цветной разметкой правил таджвида — удобно учиться правильному чтению. Твёрдый переплёт.',
  },
  {
    article: 'IP-213', category: 'islomiy', ...KR(49000),
    name: 'Qur’oni Karim suralari va duolari fazilati', nameRu: 'Достоинства сур и молитв Корана',
    images: ['i03_suralar_duolar'],
    description: 'Suralarning tilovati va ma’no tarjimalari. QR-kod orqali ovozli tinglash imkoniyati bor. Qattiq muqova.',
    descriptionRu: 'Чтение сур и перевод смыслов. Есть QR-код для прослушивания аудио. Твёрдый переплёт.',
  },
  {
    article: 'IP-214', category: 'islomiy', ...KR(45000),
    name: 'Tajvidli Mus’haf (1-jild)', nameRu: 'Мусхаф с таджвидом (1 том)',
    images: ['i04_tajvidli_mushaf'],
    description: 'Arab tilidagi tajvidli Mus’haf — tajvid qoidalari rangli belgilangan. Dar al-Ma’rifa nashri.',
    descriptionRu: 'Мусхаф на арабском языке с цветной разметкой таджвида. Издательство Dar al-Ma’rifa.',
  },
  {
    article: 'IP-215', category: 'islomiy', ...KR(85000),
    name: 'Svyashchenniy Koran (rus tilida)', nameRu: 'Священный Коран (на русском)',
    images: ['i05_svyashchenniy_koran'],
    description: 'Qur’oni Karim ma’nolarining rus tilidagi tarjimasi — Shayx Alauddin Mansur. Qattiq muqova.',
    descriptionRu: 'Перевод смыслов Священного Корана на русский язык — шейх Алауддин Мансур. Твёрдый переплёт.',
  },
  {
    article: 'IP-216', category: 'islomiy', ...KR(35000),
    name: 'Daloilul Xayrot — Imom Jazuliy', nameRu: 'Далаиль аль-Хайрат — Имам Джазули',
    images: ['i06_daloilul_xayrot'],
    description: 'Har kuni o‘qiladigan muborak salavotlar to‘plami. Tirilish nashriyoti, qattiq muqova, xatcho‘p ipi bilan.',
    descriptionRu: 'Сборник благословенных салаватов для ежедневного чтения. Издательство Tirilish, твёрдый переплёт, с закладкой.',
  },

  // — Kitob —
  {
    article: 'IP-221', category: 'kitob', ...KR(25000),
    name: 'Umr yo‘ldosh tanlash — Yusuf Qarzoviy', nameRu: 'Выбор спутника жизни — Юсуф Карзави',
    images: ['b01_umr_yuldosh'],
    ...book('Yusuf Qarzoviy', 'hard', 'Yoshlarning muammolari va ularga yechimlar.', 'Проблемы молодёжи и их решения.'),
  },
  {
    article: 'IP-222', category: 'kitob', ...KR(16000),
    name: 'Nikoh ostonasida — Abdulbosit Hoshim', nameRu: 'На пороге никаха — Абдулбосит Хошим',
    images: ['b02_nikoh_ostonasida'],
    ...book('Abdulbosit Hoshim', 'soft', 'Nikoh — ikki taqdirning Alloh roziligi ila birlashuvidir.', 'Никах — союз двух судеб ради довольства Аллаха.'),
  },
  {
    article: 'IP-223', category: 'kitob', tag: 'hit', ...KR(22000),
    name: 'Eng baxtli oila — Tuba Qilich', nameRu: 'Самая счастливая семья — Туба Кылыч',
    images: ['b03_eng_baxtli_oila'],
    ...book('Tuba Qilich', 'soft', 'Mukammal bo‘lmagan juftlar ham eng baxtli oila qura oladi.', 'Даже неидеальные пары могут построить самую счастливую семью.'),
  },
  {
    article: 'IP-224', category: 'kitob', ...KR(26000),
    name: 'Er-xotinlik asoslari — Muhammad Ahmad Kan’on', nameRu: 'Основы супружества — Мухаммад Ахмад Канъон',
    images: ['b04_er_xotinlik'],
    ...book('Muhammad Ahmad Kan’on', 'soft'),
  },
  {
    article: 'IP-225', category: 'kitob', ...KR(30000),
    name: 'Nikoh kitobi — Abdulmannon Abdulloh', nameRu: 'Книга о никахе — Абдулманнон Абдуллох',
    images: ['b05_nikoh_kitobi'],
    ...book('Abdulmannon Abdulloh', 'hard', 'Nikohga oid muhim masalalar.', 'Важные вопросы, связанные с никахом.'),
  },
  {
    article: 'IP-226', category: 'kitob', ...KR(45000),
    name: 'Mukoshafatul qulub — Abu Homid G‘azzoliy', nameRu: 'Мукашафат аль-кулюб — Абу Хамид аль-Газали',
    images: ['b06_mukoshafatul_qulub'],
    ...book('Abu Homid G‘azzoliy', 'hard', '“Qalblar kashfiyoti” — Munir nashriyoti.', '«Раскрытие сердец» — издательство Munir.'),
  },
  {
    article: 'IP-227', category: 'kitob', ...KR(25000),
    name: 'Eng sharafli ummat — Muhammad Hasaniy', nameRu: 'Самая благородная умма — Мухаммад Хасани',
    images: ['b07_eng_sharafli_ummat'],
    ...book('Muhammad Hasaniy', 'soft'),
  },
  {
    article: 'IP-228', category: 'kitob', ...KR(28000),
    name: 'Islom psixologiyasi — Ma’ruf Zurayq', nameRu: 'Психология ислама — Маруф Зурайк',
    images: ['b08_islom_psixologiyasi'],
    ...book('Ma’ruf Zurayq', 'hard'),
  },
  {
    article: 'IP-229', category: 'kitob', ...KR(25000),
    name: 'Millioner sahobalar', nameRu: 'Сподвижники-миллионеры',
    images: ['b09_millioner_sahobalar'],
    ...book('Muhammad Shoh Ibrohim, Komil Umar', 'soft'),
  },
  {
    article: 'IP-230', category: 'kitob', ...KR(25000),
    name: 'Dam — Fotih Duman', nameRu: 'Дам — Фатих Думан',
    images: ['b10_dam'],
    ...book('Fotih Duman', 'soft', 'Istanbulning afsonaviy oshiqlari — Telli ota qissasi.', 'Легендарные влюблённые Стамбула — повесть о Телли-ата.'),
  },
  {
    article: 'IP-231', category: 'kitob', ...KR(65000),
    name: 'Hajj kitobi — Mahmud As’ad Jo‘shon', nameRu: 'Книга о хадже — Махмуд Асъад Джошан',
    images: ['b11_hajj_kitobi'],
    ...book('Mahmud As’ad Jo‘shon', 'hard', 'Hajning fazilatlari va nozik jihatlari.', 'Достоинства хаджа и его тонкости.'),
  },
  {
    article: 'IP-232', category: 'kitob', tag: 'hit', ...KR(28000),
    name: 'Baxtiyor oila — Shayx Muhammad Sodiq Muhammad Yusuf', nameRu: 'Счастливая семья — шейх Мухаммад Содик Мухаммад Юсуф',
    images: ['b12_baxtiyor_oila'],
    description: '✍️ Muallif: Shayx Muhammad Sodiq Muhammad Yusuf\n📖 O‘zbek tilida (lotin), qattiq muqova',
    descriptionRu: '✍️ Автор: шейх Мухаммад Содик Мухаммад Юсуф\n📖 На узбекском языке (латиница), твёрдый переплёт',
  },
  {
    article: 'IP-233', category: 'kitob', ...KR(25000),
    name: 'Sotilayotgan kasalliklar — Rey Moynihan, Alan Kassels', nameRu: 'Продаваемые болезни — Рэй Мойнихан, Алан Касселс',
    images: ['b13_sotilayotgan_kasalliklar'],
    ...book('Rey Moynihan, Alan Kassels', 'soft', 'Aslida kasal emasmiz! Farmatsevtika biznesi haqida.', 'На самом деле мы не больны! О фармацевтическом бизнесе.'),
  },
  {
    article: 'IP-234', category: 'kitob', ...KR(30000),
    name: 'Payg‘ambar bilan... — Adham Sharqoviy', nameRu: 'С Пророком... — Адхам Шаркави',
    images: ['b14_paygambar_bilan'],
    ...book('Adham Sharqoviy', 'hard', 'Munir nashriyoti.', 'Издательство Munir.'),
  },
  {
    article: 'IP-235', category: 'kitob', ...KR(22000),
    name: 'Fotimaning bolasi — Josim al-Umron', nameRu: 'Сын Фатимы — Джасим аль-Умран',
    images: ['b15_fotimaning_bolasi'],
    ...book('Josim al-Umron', 'soft', 'Falaq nashr.', 'Издательство Falaq.'),
  },

  // — Atir —
  {
    article: 'IP-241', category: 'parfyum', brand: 'JB Loves Fragrances', volume: '100 ml', ...KR(60000),
    name: 'Divine & Grace Light Blue', nameRu: 'Divine & Grace Light Blue',
    images: ['a01_divine_grace_light_blue'],
    ...perfume('Ayollar uchun yengil, tetiklashtiruvchi atir — sitrus va dengiz notalari. 100 ml.\n\n☀️ Kunduzi va yoz uchun ideal', 'Лёгкий освежающий женский аромат — цитрусовые и морские ноты. 100 мл.\n\n☀️ Идеален для дня и лета'),
  },
  {
    article: 'IP-242', category: 'parfyum', tag: 'hit', isFeatured: true, brand: 'Creed', volume: '100 ml', ...KR(140000),
    name: 'Creed Aventus for Her', nameRu: 'Creed Aventus for Her',
    images: ['a02_creed_aventus_her_1', 'a02_creed_aventus_her_2'],
    ...perfume('Ayollar uchun nafis gul-mevali atir — yashil olma, atirgul va mushk. 100 ml.\n\n💎 Har kuni va bayramlarda', 'Изысканный цветочно-фруктовый женский аромат — зелёное яблоко, роза и мускус. 100 мл.\n\n💎 На каждый день и для праздника'),
  },
  {
    article: 'IP-243', category: 'parfyum', isFeatured: true, brand: 'Jo Malone London', volume: '100 ml', ...KR(145000),
    name: 'Jo Malone Wood Sage & Sea Salt', nameRu: 'Jo Malone Wood Sage & Sea Salt',
    images: ['a03_jo_malone_wood_sage'],
    ...perfume('Uniseks odekolon — shalfey, dengiz tuzi va yog‘och notalari. Sovg‘abop qutida, lenta bilan.\n\n🎁 Sovg‘a uchun ajoyib tanlov', 'Унисекс-одеколон — шалфей, морская соль и древесные ноты. В подарочной коробке с лентой.\n\n🎁 Отличный выбор для подарка'),
  },
  {
    article: 'IP-244', category: 'parfyum', brand: 'Sistelle', volume: '100 ml', ...KR(75000),
    name: 'Diplomate pour Femme', nameRu: 'Diplomate pour Femme',
    images: ['a04_diplomate_1', 'a04_diplomate_2'],
    ...perfume('Ayollar uchun iliq, nafis parfyum suvi (Eau de Parfum). 100 ml.', 'Тёплая, изысканная женская парфюмерная вода (Eau de Parfum). 100 мл.'),
  },
  {
    article: 'IP-245', category: 'parfyum', brand: 'Lomani', volume: '100 ml', ...KR(150000),
    name: 'Lomani Orchidée Sauvage', nameRu: 'Lomani Orchidée Sauvage',
    images: ['a05_lomani_orchidee'],
    ...perfume('Ayollar uchun gulli parfyum suvi — yovvoyi orxideya notalari. Paris, 100 ml.\n\n🌸 Nafis va romantik', 'Цветочная женская парфюмерная вода — ноты дикой орхидеи. Париж, 100 мл.\n\n🌸 Нежный и романтичный'),
  },
  {
    article: 'IP-246', category: 'parfyum', brand: 'Versace', volume: '100 ml', ...KR(120000),
    name: 'Versace Man Eau Fraîche', nameRu: 'Versace Man Eau Fraîche',
    images: ['a06_versace_eau_fraiche'],
    ...perfume('Erkaklar uchun yangi, tetik atir (Eau de Toilette) — limon, dengiz va yog‘och notalari. 100 ml.', 'Свежий мужской аромат (Eau de Toilette) — лимон, море и древесные ноты. 100 мл.'),
  },
  {
    article: 'IP-247', category: 'parfyum', tag: 'new', brand: 'Louis Vuitton', ...KR(150000),
    name: 'Louis Vuitton Symphony', nameRu: 'Louis Vuitton Symphony',
    images: ['a07_lv_symphony'],
    ...perfume('Uniseks atir (Extrait de Parfum) — greypfrut, zanjabil va choy notalari.\n\n✨ Uzoq saqlanadigan hid', 'Унисекс-аромат (Extrait de Parfum) — грейпфрут, имбирь и чай.\n\n✨ Стойкий аромат'),
  },
  {
    article: 'IP-248', category: 'parfyum', brand: 'La Parfum Galleria', volume: '100 ml', ...KR(65000),
    name: 'Floral Bloom', nameRu: 'Floral Bloom',
    images: ['a08_floral_bloom'],
    ...perfume('Ayollar uchun gulli parfyum suvi (Eau de Parfum). 100 ml.\n\n🌺 Bahoriy, yorqin hid', 'Цветочная женская парфюмерная вода (Eau de Parfum). 100 мл.\n\n🌺 Весенний, яркий аромат'),
  },
  {
    article: 'IP-249', category: 'parfyum', brand: 'Rave', volume: '100 ml', ...KR(60000),
    name: 'Rave NOW', nameRu: 'Rave NOW',
    images: ['a09_rave_now'],
    ...perfume('Sharqona, chuqur parfyum suvi (Eau de Parfum) — chiroyli qora flakonda. 100 ml.', 'Восточная, глубокая парфюмерная вода (Eau de Parfum) — в красивом чёрном флаконе. 100 мл.'),
  },
  {
    article: 'IP-250', category: 'parfyum', tag: 'hit', brand: 'Tom Ford', volume: '100 ml', ...KR(140000),
    name: 'Tom Ford Black Orchid', nameRu: 'Tom Ford Black Orchid',
    images: ['a10_tom_ford_black_orchid'],
    ...perfume('Uniseks, sirli va to‘q atir (Eau de Toilette) — qora orxideya, trufel va paçuli notalari. 100 ml.\n\n🌙 Kechki tadbirlar uchun', 'Унисекс, загадочный тёмный аромат (Eau de Toilette) — чёрная орхидея, трюфель и пачули. 100 мл.\n\n🌙 Для вечерних выходов'),
  },
  {
    article: 'IP-251', category: 'parfyum', brand: 'Sevaverek', ...KR(55000),
    name: 'Sevaverek Moskow II', nameRu: 'Sevaverek Moskow II',
    images: ['a11_sevaverek_moskow'],
    ...perfume('Turkiyaning Sevaverek brendi atiri — chiroyli sovg‘abop qutida.', 'Аромат турецкого бренда Sevaverek — в красивой подарочной коробке.'),
  },
  {
    article: 'IP-252', category: 'parfyum', tag: 'new', ...KR(75000),
    name: 'Hayaati Women', nameRu: 'Hayaati Women',
    images: ['a12_hayaati_women'],
    ...perfume('Ayollar uchun arabcha atir — shirin, gulli va uzoq saqlanadigan hid. Naqshinkor qutida.', 'Арабский женский аромат — сладкий, цветочный и стойкий. В узорной коробке.'),
  },
  {
    article: 'IP-253', category: 'parfyum', brand: 'Sevaverek', ...KR(55000),
    name: 'Sevaverek Symphony', nameRu: 'Sevaverek Symphony',
    images: ['a13_sevaverek_symphony'],
    ...perfume('Turkiyaning Sevaverek brendi atiri — yangi, yengil hid.', 'Аромат турецкого бренда Sevaverek — свежий и лёгкий.'),
  },
];

const stories = [
  { title: 'Jenshen', titleRu: 'Женьшень', article: 'IP-101' },
  { title: 'Qora jenshen', titleRu: 'Чёрный женьшень', article: 'IP-104' },
  { title: 'Kollagen', titleRu: 'Коллаген', article: 'IP-106' },
  { title: 'Dr.IPPO', titleRu: 'Dr.IPPO', article: 'IP-116' },
  { title: '24K Gold', titleRu: '24K Gold', article: 'IP-118' },
];

function toData({ images, kr, krOptom, uz, uzOptom, ...p }, i) {
  return {
    ...p,
    price: kr || 0,
    priceOptom: krOptom || 0,
    priceUz: uz || 0,
    priceUzOptom: uzOptom || 0,
    variants: p.variants || [],
    images: images.map(img),
    imageFrames: images.map(() => ({ z: 1, x: 50, y: 50 })),
    sortOrder: i,
  };
}

// Karta kiritilmagan bo'lsa — TEST karta (haqiqiysini admin panel → Sozlamalar'da almashtiring)
const TEST_CARDS = {
  cardNumberUz: '8600 1234 5678 9012',
  cardHolderUz: 'TEST KARTA',
  bankNameUz: 'Uzcard (test)',
  cardNumber: '1002-123-456789',
  cardHolder: 'TEST KARTA',
  bankName: 'KB Kookmin (test)',
};

async function fillTestCards() {
  const group = (k) => k.replace(/^(cardNumber|cardHolder|bankName)/, '');
  const hasCard = {};
  for (const r of await prisma.setting.findMany({ where: { key: { in: ['cardNumber', 'cardNumberUz'] } } })) {
    if (r.value.trim()) hasCard[group(r.key)] = true;
  }
  for (const [key, value] of Object.entries(TEST_CARDS)) {
    if (hasCard[group(key)]) continue;
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

const setVersion = (key, value) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });

// Qo'shimcha mahsulotlar — bir marta: bazada yo'q artikullar katalog oxiriga qo'shiladi
async function addNewProducts() {
  const done = await prisma.setting.findUnique({ where: { key: 'additionsVersion' } });
  if (!FORCE && done?.value === ADDITIONS_VERSION) return console.log(`✅ Seed: qo‘shimcha mahsulotlar ${ADDITIONS_VERSION} allaqachon qo‘shilgan`);
  const have = new Set((await prisma.product.findMany({ select: { article: true } })).map((p) => p.article));
  const last = await prisma.product.aggregate({ _max: { sortOrder: true } });
  let order = (last._max.sortOrder ?? -1) + 1;
  let added = 0;
  for (const p of additions) {
    if (have.has(p.article)) continue;
    await prisma.product.create({ data: toData(p, order++) });
    added++;
  }
  await setVersion('additionsVersion', ADDITIONS_VERSION);
  console.log(`✅ Seed: ${added} ta yangi mahsulot qo‘shildi`);
}

// Bir marta: avval bitta aksiya 🇰🇷 va 🇺🇿 donaga birga ishlardi — endi har davlat/tur alohida,
// shuning uchun eski aksiya 🇺🇿 donaga ham ko'chiriladi (🇰🇷 dona o'zida qoladi)
async function splitPromos() {
  const done = await prisma.setting.findUnique({ where: { key: 'promoSplit' } });
  if (done) return;
  const list = await prisma.product.findMany({ where: { promo: { not: null }, promoUz: null }, select: { id: true, promo: true } });
  for (const p of list) await prisma.product.update({ where: { id: p.id }, data: { promoUz: p.promo } });
  await setVersion('promoSplit', '1');
  console.log(`✅ Seed: ${list.length} ta mahsulot aksiyasi 🇺🇿 donaga ham ko‘chirildi`);
}

// Bir marta: aksiya endi faqat donaga — optomga qo'yilgan eski aksiyalar o'chiriladi
async function dropOptomPromos() {
  const done = await prisma.setting.findUnique({ where: { key: 'promoOptomDropped' } });
  if (done) return;
  const r = await prisma.product.updateMany({
    where: { OR: [{ promoOptom: { not: null } }, { promoUzOptom: { not: null } }] },
    data: { promoOptom: null, promoUzOptom: null },
  });
  await setVersion('promoOptomDropped', '1');
  console.log(`✅ Seed: ${r.count} ta mahsulotning optom aksiyasi o‘chirildi`);
}

async function main() {
  await fillTestCards();
  await replaceCatalog();
  await addNewProducts();
  await splitPromos();
  await dropOptomPromos();
  const n = await warmThumbs();
  console.log(`✅ Seed: ${n} ta rasmning kichik nusxalari tayyor`);
}

async function replaceCatalog() {
  const current = await prisma.setting.findUnique({ where: { key: 'catalogVersion' } });
  const replace = FORCE || current?.value !== CATALOG_VERSION;

  if (!replace) {
    console.log(`✅ Seed: katalog ${CATALOG_VERSION} allaqachon bazada — tegilmadi`);
    return;
  }

  // Eski katalogni o'chiramiz (buyurtmalar o'z nusxasini saqlaydi — ularga ta'sir qilmaydi)
  await prisma.story.deleteMany();
  const removed = await prisma.product.deleteMany();

  for (let i = 0; i < products.length; i++) await prisma.product.create({ data: toData(products[i], i) });

  for (let i = 0; i < stories.length; i++) {
    const { article, ...s } = stories[i];
    const prod = await prisma.product.findUnique({ where: { article } });
    await prisma.story.create({ data: { ...s, image: prod.images[0], productId: prod.id, sortOrder: i } });
  }

  await setVersion('catalogVersion', CATALOG_VERSION);

  console.log(`✅ Seed: ${removed.count} ta eski mahsulot o‘chirildi, ${products.length} ta yangi yozildi, ${stories.length} ta story`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
