// Mahsulotlar katalogi va storylar.
// CATALOG_VERSION o'zgarsa — bazadagi ESKI mahsulotlar va storylar o'chirilib, shu ro'yxat yoziladi (bir marta).
// Keyingi deploylarda tegmaydi (admin panelda qilingan o'zgarishlar saqlanadi). SEED_FORCE=1 — qayta yozadi.
require('dotenv').config();
const prisma = require('../src/database/connection');

const CATALOG_VERSION = '2026-10-02';
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

async function main() {
  await fillTestCards();
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

  await prisma.setting.upsert({
    where: { key: 'catalogVersion' },
    update: { value: CATALOG_VERSION },
    create: { key: 'catalogVersion', value: CATALOG_VERSION },
  });

  console.log(`✅ Seed: ${removed.count} ta eski mahsulot o‘chirildi, ${products.length} ta yangi yozildi, ${stories.length} ta story`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
