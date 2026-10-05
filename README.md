# IPPO by Fotima Zuhra — Telegram do'kon

Koreya bo'ylab original kosmetika sotish uchun: **Telegram bot + Mini App (do'kon) + Admin panel**.

- Bot: **@IPPO_by_fotimazuhrabot**
- To'lov: **kartaga o'tkazma** (mijoz chek rasmini yuboradi, admin tasdiqlaydi)
- Birinchi xarid: dona bo'limida yangi mijozga chegirma (telefon raqami bo'yicha bir marta; standart 🇺🇿 250 000 so'mdan 10%, 🇰🇷 50 000 ₩ dan 10%)
- Cashback: to'langan xariddan foiz balansga qo'shiladi, keyingi xaridda ishlatiladi (Admin → Sozlamalar, har davlatga alohida)
- Yetkazish: belgilangan summadan oshsa bepul (Admin → Sozlamalar)
- Optom: bitta mahsulotdan 3 / 5 / 10+ dona olinsa narx avtomatik tushadi (foizlar — Admin → Sozlamalar)
- Valyuta: **₩ (KRW)**, yetkazish hududlari — Koreya viloyatlari
- Tillar: o'zbek + rus

| Papka | Nima | Port |
|---|---|---|
| `backend/` | Server, API, Telegram bot, baza (Prisma + Neon) | 5000 |
| `miniapp/` | Mijozlar do'koni (React + Vite) | 5173 |
| `admin/` | Admin panel (React + Vite) | 5174 |

---

## Kompyuterda ishga tushirish (qadam-baqadam)

**Kerak:** [Node.js 20+](https://nodejs.org) o'rnatilgan bo'lsin.

1. **`1-BAZANI-TAYYORLASH.bat`** — ikki marta bosing (faqat birinchi marta).
   Kutubxonalarni o'rnatadi, bazada jadvallar yaratadi, 20 ta mahsulotni qo'shadi.
2. **`2-BACKEND.bat`** — server va bot ishga tushadi. Oynani yopmang.
3. **`3-ADMIN-PANEL.bat`** — brauzerda admin panel ochiladi → login `admin`, parol `backend/.env` faylidagi `ADMIN_PASSWORD`.
4. **`4-MINIAPP.bat`** — brauzerda do'kon ochiladi (Telegramsiz sinov rejimi).

> Lokal rejimda bot javob beradi, lekin "Do'konni ochish" tugmasi chiqmaydi — Telegram faqat `https://` manzilni ochadi. To'liq ishlashi uchun `DEPLOY.md` bo'yicha internetga joylang.

### Admin bo'lish (buyurtma xabarlari keladi)

Telegramda botga yozing:

```
/admin PAROL
```

(PAROL — `backend/.env` dagi `ADMIN_PASSWORD`). Xabar avtomatik o'chiriladi, siz admin bo'lasiz.
Yoki botga `/id` yozib, chiqqan raqamni `.env` dagi `ADMIN_CHAT_IDS` ga yozing (bir nechta bo'lsa vergul bilan).

---

## Birinchi ishlar (admin panelda)

1. **⚙️ Sozlamalar** → karta/hisob raqami, bank, egasi. Shundan keyin do'konda "Kartaga o'tkazma" chiqadi.
2. **🛍 Mahsulotlar** → 16 ta mahsulotning **narxi kiritilmagan** (kanalda narx yo'q edi). Hozir ular "Narxini so'rang" bo'lib ko'rinadi. Narxni kiriting.
   Tezroq: **📦 Ombor** sahifasida narx va qoldiqni bir joyda o'zgartirsa bo'ladi.
3. Kerak bo'lsa: yetkazish narxi, "shu summadan bepul", bosh sahifadagi e'lon.

---

## Qanday ishlaydi

- Mijoz do'konda tanlaydi → savatcha → ism, telefon, hudud, manzil → **Naqd** yoki **Karta**.
- Narx **faqat serverda** hisoblanadi (mijoz o'zgartira olmaydi).
- Adminga **bitta xabar**: mahsulot rasmi + to'liq ma'lumot.
- Karta tanlansa: mijoz karta raqamini ko'radi, **chek rasmini** Mini App'dan yoki botga yuboradi →
  adminga chek + **✅ Tasdiqlash / ❌ Rad etish** tugmalari → mijozga avtomatik xabar.
- Buyurtma holati (Tasdiqlandi / Yo'lda / Yetkazildi / Bekor) o'zgarsa — mijozga botdan xabar.
- Ombor: qoldiq kiritilgan mahsulotda buyurtmada ayriladi, bekor qilinsa qaytariladi (bo'sh = cheklanmagan).

## Brendni o'zgartirish

- Nom, kategoriyalar, teglar, hududlar, aloqa → `backend/src/config/default.js`
- Ranglar → `miniapp/src/styles.css` va `admin/src/styles.css` boshidagi `:root`
- Logo → `miniapp/public/logo.png`, `mark.png`, ikonkalar (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`)

Internetga joylash: **[DEPLOY.md](DEPLOY.md)**
