// Boshlang'ich mahsulotlar va storylar.
// Bazada bor mahsulotga TEGMAYDI (admin o'zgarishlari saqlanadi), faqat yangilarini qo'shadi.
// SEED_FORCE=1 — hammasini qayta yozadi.
require('dotenv').config();
const prisma = require('../src/database/connection');

const img = (f) => `/uploads/products/${f}`;
const FORCE = process.env.SEED_FORCE === '1';

// Narx ₩ da. 0 = narx hali kiritilmagan ("Narxini so'rang") — admin paneldan kiriting.
const products = [
  {
    article: 'IP-001', category: 'jenshen', tag: 'hit', brand: 'Punggi', isFeatured: true, price: 165000,
    name: 'Punggi Red Ginseng Extract Gold (6 yillik)',
    nameRu: 'Punggi Red Ginseng Extract Gold (6-летний)',
    image: '01_punggi_red_ginseng_extract_gold_6_yillik.jpg',
    description:
      'Punggi 6 yillik qizil jenshen ekstrakti. Asosiy faol komponent — ginsenosidlar.\n\n🛡️ Immunitetni qo‘llab-quvvatlaydi\n💪 Charchoqni kamaytirishga yordam beradi\n🧠 Xotira va diqqatni qo‘llab-quvvatlaydi\n🩸 Qon aylanishini qo‘llab-quvvatlaydi\n✨ Antioksidant himoya\n⚡ Umumiy tetiklik va quvvat',
    descriptionRu:
      'Экстракт 6-летнего красного женьшеня Punggi. Главный активный компонент — гинзенозиды.\n\n🛡️ Поддерживает иммунитет\n💪 Помогает уменьшить усталость\n🧠 Поддерживает память и внимание\n🩸 Поддерживает кровообращение\n✨ Антиоксидантная защита\n⚡ Общий тонус и энергия',
  },
  {
    article: 'IP-002', category: 'jenshen', brand: 'Punggi', price: 0,
    name: 'Punggi 100% jenshen ekstrakti',
    nameRu: 'Экстракт женьшеня Punggi 100%',
    image: '02_punggi_100_jenshen_ekstrakti.jpg',
    description:
      'Koreyaning Punggi hududida yetishtirilgan haqiqiy Koreya jensheni (Panax ginseng). Punggi — Koreyaning eng mashhur jenshen yetishtiriladigan joyi.\n\n💯 Tarkibida aralashma yo‘q — faqat haqiqiy jenshen ekstrakti.',
    descriptionRu:
      'Настоящий корейский женьшень (Panax ginseng), выращенный в регионе Пунги — самом известном месте выращивания женьшеня в Корее.\n\n💯 Без примесей — только натуральный экстракт женьшеня.',
  },
  {
    article: 'IP-003', category: 'jenshen', tag: 'set', isFeatured: true, price: 65000, volume: '4 dona',
    name: 'Qora jenshen Royal Gold seti',
    nameRu: 'Набор чёрного женьшеня Royal Gold',
    image: '03_qora_jenshen_royal_gold_seti_4_dona.jpg',
    description: 'Qora jenshen Royal Gold — 4 donalik sovg‘abop set. Koreyadan original.',
    descriptionRu: 'Чёрный женьшень Royal Gold — подарочный набор из 4 штук. Оригинал из Кореи.',
  },
  {
    article: 'IP-004', category: 'jenshen', price: 0,
    name: 'Qizil jenshen stiklari',
    nameRu: 'Красный женьшень в стиках',
    image: '04_qizil_jenshen_stiklari.jpg',
    description: 'Qizil jenshen ekstrakti qulay stiklarda — ishda, yo‘lda, har kuni.',
    descriptionRu: 'Экстракт красного женьшеня в удобных стиках — на работе, в дороге, каждый день.',
  },
  {
    article: 'IP-005', category: 'kollagen', tag: 'hit', isFeatured: true, price: 40000, volume: '30 stik',
    name: 'Red Apple Collagen (qizil olma)',
    nameRu: 'Red Apple Collagen (красное яблоко)',
    image: '05_red_apple_collagen_qizil_olma_kollageni.jpg',
    description:
      'Qizil olma ekstraktli baliq kollageni, jelly stik ko‘rinishida. Sun’iy rang va kimyoviy qo‘shimchalarsiz.\n\n🍎 Metabolizmni qo‘llab-quvvatlaydi\n💅 Soch, tirnoq va teri salomatligi uchun\n📦 Qutida 30 ta stik — kuniga 1 ta, ertalab och qoringa.',
    descriptionRu:
      'Рыбный коллаген с экстрактом красного яблока в виде желе-стиков. Без искусственных красителей и химических добавок.\n\n🍎 Поддерживает метаболизм\n💅 Для здоровья волос, ногтей и кожи\n📦 В упаковке 30 стиков — 1 в день, утром натощак.',
  },
  {
    article: 'IP-006', category: 'kollagen', tag: 'new', price: 0,
    name: 'Green Apple Collagen (yashil olma)',
    nameRu: 'Green Apple Collagen (зелёное яблоко)',
    image: '06_green_apple_collagen_yashil_olma_kollage.jpg',
    description:
      'Kollagen peptidlari + yashil olma ekstrakti asosidagi go‘zallik qo‘shimchasi.\n\n🍏 Teri namligini saqlashga yordam beradi\n✨ Elastiklik va taranglikni qo‘llab-quvvatlaydi\n💅 Soch va tirnoqlarni mustahkamlaydi',
    descriptionRu:
      'Бьюти-добавка на основе коллагеновых пептидов и экстракта зелёного яблока.\n\n🍏 Помогает сохранять увлажнённость кожи\n✨ Поддерживает эластичность и упругость\n💅 Укрепляет волосы и ногти',
  },
  {
    article: 'IP-007', category: 'kollagen', tag: 'new', price: 0,
    name: 'Anorli kollagen (Pomegranate)',
    nameRu: 'Коллаген с гранатом (Pomegranate)',
    image: '07_anorli_kollagen_pomegranate_collagen.jpg',
    description:
      'Kollagen peptidlari va anor ekstrakti.\n\n✨ Terining elastikligini qo‘llab-quvvatlaydi\n💧 Namlikni saqlashga ko‘maklashadi\n🌺 Anor — antioksidantlarga boy',
    descriptionRu:
      'Коллагеновые пептиды и экстракт граната.\n\n✨ Поддерживает эластичность кожи\n💧 Помогает сохранять влагу\n🌺 Гранат богат антиоксидантами',
  },
  {
    article: 'IP-008', category: 'vitaminlar', tag: 'sale', price: 0,
    name: 'Kalsiy + Magniy + Vitamin D + Sink',
    nameRu: 'Кальций + Магний + Витамин D + Цинк',
    image: '08_kalsiy_magniy_vitamin_d_sink_kompleksi.jpg',
    description:
      '🎉 3+1 AKSIYA: 3 ta oling — 1 tasi BEPUL!\n\nSuyaklar, tishlar, mushaklar va immunitetni qo‘llab-quvvatlash uchun kompleks.',
    descriptionRu:
      '🎉 АКЦИЯ 3+1: купите 3 — 1 в подарок!\n\nКомплекс для поддержки костей, зубов, мышц и иммунитета.',
  },
  {
    article: 'IP-009', category: 'vitaminlar', price: 0,
    name: 'Zinc (Sink) vitaminlari',
    nameRu: 'Витамины Zinc (Цинк)',
    image: '09_zinc_sink_vitaminlari.jpg',
    description: 'Sink — immunitet, teri va soch salomatligi uchun muhim mineral.',
    descriptionRu: 'Цинк — важный минерал для иммунитета, здоровья кожи и волос.',
  },
  {
    article: 'IP-010', category: 'vitaminlar', price: 0, variants: ['Sariq', 'Pushti'],
    name: 'Lacto-Fit probiotik',
    nameRu: 'Пробиотик Lacto-Fit',
    image: '10_lacto_fit_probiotik.jpg',
    description: 'Koreyaning mashhur Lacto-Fit probiotigi. Sariq va pushti turlari mavjud.',
    descriptionRu: 'Популярный корейский пробиотик Lacto-Fit. В наличии жёлтый и розовый.',
  },
  {
    article: 'IP-011', category: 'soch', price: 0,
    name: 'K-Ginseng jenshen shampuni',
    nameRu: 'Шампунь с женьшенем K-Ginseng',
    image: '11_k_ginseng_jenshen_shampuni.jpg',
    description: 'Shikastlangan sochlar va soch to‘kilishida samarali parvarish.',
    descriptionRu: 'Эффективный уход для повреждённых волос и при выпадении волос.',
  },
  {
    article: 'IP-012', category: 'soch', tag: 'new', price: 0,
    name: 'Jenshenli shampun',
    nameRu: 'Шампунь с женьшенем',
    image: '12_jenshenli_shampun_yangi.jpg',
    description: 'Yangi jenshenli shampun — soch ildizlarini oziqlantiradi va mustahkamlaydi.',
    descriptionRu: 'Новый шампунь с женьшенем — питает и укрепляет корни волос.',
  },
  {
    article: 'IP-013', category: 'soch', brand: 'Aromatica', price: 0,
    name: 'Aromatica Rosemary soch spreyi',
    nameRu: 'Спрей для волос Aromatica Rosemary',
    image: '13_aromatica_rosemary_soch_spreyi.jpg',
    description: 'Rozmarin spreyi soch ildizlarini mustahkamlaydi va sochga sog‘lom jilo beradi. 🌿',
    descriptionRu: 'Спрей с розмарином укрепляет корни и придаёт волосам здоровый блеск. 🌿',
  },
  {
    article: 'IP-014', category: 'yuz', price: 0,
    name: '345 Krem',
    nameRu: 'Крем 345',
    image: '14_345_krem.jpg',
    description:
      '💧 Terini namlantiradi\n✨ Teri ko‘rinishini silliq va parvarishlangan qiladi\n🌸 Quruq va charchagan teriga yoqimli parvarish',
    descriptionRu:
      '💧 Увлажняет кожу\n✨ Делает кожу более гладкой и ухоженной\n🌸 Приятный уход для сухой и уставшей кожи',
  },
  {
    article: 'IP-015', category: 'yuz', tag: 'set', brand: 'Dr.IPPO', isFeatured: true, price: 0,
    name: 'Dr.IPPO yuz parvarish seti',
    nameRu: 'Набор для ухода за лицом Dr.IPPO',
    image: '15_dr_ippo_yuz_parvarish_seti.jpg',
    description:
      'Yuz uchun kompleks kundalik parvarish.\n\n🤍 Chuqur tozalash\n💧 Namlik bilan ta’minlash\n✨ Silliq va yorqin ko‘rinish\n\n💎 Teringizga mos set tanlashda yordam beramiz — yuz diagnostikasi BEPUL!',
    descriptionRu:
      'Комплексный ежедневный уход за лицом.\n\n🤍 Глубокое очищение\n💧 Увлажнение\n✨ Гладкая и сияющая кожа\n\n💎 Поможем подобрать набор под ваш тип кожи — диагностика БЕСПЛАТНО!',
  },
  {
    article: 'IP-016', category: 'yuz', tag: 'new', brand: 'ANUA', isFeatured: true, price: 0,
    name: 'ANUA PDRN Hyaluronic Acid Mist',
    nameRu: 'ANUA PDRN Hyaluronic Acid Mist',
    image: '16_anua_pdrn_hyaluronic_acid_mist.jpg',
    description:
      'Yuz uchun namlovchi mist — terini tez namlantiradi va tinchlantiradi.\n\n🧬 PDRN — teri tiklanishini qo‘llab-quvvatlaydi\n💧 Gialuron kislotasi — namlikni ushlab turadi',
    descriptionRu:
      'Увлажняющий мист для лица — быстро увлажняет и успокаивает кожу.\n\n🧬 PDRN — поддерживает восстановление кожи\n💧 Гиалуроновая кислота — удерживает влагу',
  },
  {
    article: 'IP-017', category: 'yuz', price: 0,
    name: 'Royal Glow Eye Cream',
    nameRu: 'Крем для глаз Royal Glow',
    image: '17_royal_glow_eye_cream_ko_z_atrofi_kremi.jpg',
    description: 'Ko‘z atrofi uchun parvarish kremi. Koreyadan original.',
    descriptionRu: 'Уходовый крем для кожи вокруг глаз. Оригинал из Кореи.',
  },
  {
    article: 'IP-018', category: 'yuz', tag: 'sale', isFeatured: true, price: 25000, volume: '8 dona',
    name: '24K Gold kosmetika seti',
    nameRu: 'Косметический набор 24K Gold',
    image: '18_24k_gold_kosmetika_seti.jpg',
    description: 'Original 24K Gold — 8 talik parvarish to‘plami. Made in Korea 🇰🇷. Maxsus narxda!',
    descriptionRu: 'Оригинальный набор 24K Gold из 8 средств. Made in Korea 🇰🇷. По специальной цене!',
  },
  {
    article: 'IP-019', category: 'parfyum', brand: 'Chanel', price: 0,
    name: 'Chanel Allure Homme',
    nameRu: 'Chanel Allure Homme',
    image: '19_chanel_allure_homme.jpg',
    description:
      'Kuchli xarakter, nafislik va jozibani birlashtirgan erkaklar ifori.\n\n🔥 Erkakona va jozibali\n💎 Nafis va klassik\n🌿 Har kun va maxsus uchrashuvlar uchun',
    descriptionRu:
      'Мужской аромат, сочетающий сильный характер, элегантность и притягательность.\n\n🔥 Мужественный и притягательный\n💎 Элегантный и классический\n🌿 На каждый день и для особых случаев',
  },
  {
    article: 'IP-020', category: 'parfyum', price: 0,
    name: 'Hamyonbop atirchalar',
    nameRu: 'Доступные ароматы',
    image: '20_hamyonbop_atirchalar.jpg',
    description: 'Nafis, xushbo‘y iforga ega hamyonbop atirchalar.',
    descriptionRu: 'Доступные ароматы с нежным, приятным шлейфом.',
  },
];

const stories = [
  { title: 'Kollagenlar', titleRu: 'Коллаген', image: img('05_red_apple_collagen_qizil_olma_kollageni.jpg'), article: 'IP-005' },
  { title: 'Jenshen', titleRu: 'Женьшень', image: img('01_punggi_red_ginseng_extract_gold_6_yillik.jpg'), article: 'IP-001' },
  { title: 'Dr.IPPO', titleRu: 'Dr.IPPO', image: img('15_dr_ippo_yuz_parvarish_seti.jpg'), article: 'IP-015' },
  { title: '24K Gold', titleRu: '24K Gold', image: img('18_24k_gold_kosmetika_seti.jpg'), article: 'IP-018' },
  { title: 'ANUA', titleRu: 'ANUA', image: img('16_anua_pdrn_hyaluronic_acid_mist.jpg'), article: 'IP-016' },
];

async function main() {
  let created = 0;
  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const { image, ...p } = products[i];
    const data = {
      ...p,
      variants: p.variants || [],
      images: [img(image)],
      imageFrames: [{ z: 1, x: 50, y: 50 }],
      sortOrder: i,
    };
    const exists = await prisma.product.findUnique({ where: { article: p.article } });
    if (!exists) {
      await prisma.product.create({ data });
      created++;
    } else if (FORCE) {
      await prisma.product.update({ where: { article: p.article }, data });
      updated++;
    }
  }

  const storyCount = await prisma.story.count();
  if (storyCount === 0 || FORCE) {
    if (FORCE) await prisma.story.deleteMany();
    for (let i = 0; i < stories.length; i++) {
      const { article, ...s } = stories[i];
      const prod = await prisma.product.findUnique({ where: { article } });
      await prisma.story.create({ data: { ...s, productId: prod?.id ?? null, sortOrder: i } });
    }
  }

  console.log(`✅ Seed: ${created} ta yangi, ${updated} ta yangilandi, storylar: ${storyCount === 0 || FORCE ? stories.length + ' ta qo‘shildi' : 'bor'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
