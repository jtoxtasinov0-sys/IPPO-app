# Internetga joylash (bepul): GitHub → Render → Vercel

Tartib: **1) GitHub** → **2) Render (backend)** → **3) Vercel (Mini App + Admin)** → **4) Render'ga manzillarni yozish** → **5) Tekshirish**.

Baza (Neon) allaqachon tayyor — jadvallar va 20 ta mahsulot bor.

---

## 1. GitHub'ga yuklash

1. [github.com](https://github.com) → **New repository** → nom: `ippo-shop` → **Private** → Create.
2. Loyiha papkasida terminal oching va yozing (har birini alohida):

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "IPPO do'kon"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/SIZNING_LOGIN/ippo-shop.git
```

```bash
git push -u origin main
```

> `backend/.env` GitHub'ga **yuklanmaydi** (maxfiy). Undagi qiymatlarni Render'ga qo'lda yozasiz.

---

## 2. Render — backend + bot

1. [render.com](https://render.com) → GitHub bilan kiring → **New → Web Service** → `ippo-shop` repo.
2. Sozlamalar:

| Maydon | Qiymat |
|---|---|
| Name | `ippo-backend` |
| Region | **Ohio (US East)** — Neon baza shu yerda, tez ishlaydi |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install --include=dev && npx prisma db push && npm run db:seed` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/api/health` (Advanced bo'limida) |

3. **Environment Variables** (`backend/.env` dan ko'chiring):

| Kalit | Qiymat |
|---|---|
| `DATABASE_URL` | `.env` dagi (pooler **siz**, `?sslmode=require` bilan) |
| `BOT_TOKEN` | `.env` dagi |
| `ADMIN_PASSWORD` | **yangi kuchli parol** |
| `JWT_SECRET` | 32+ belgili tasodifiy matn |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_CHAT_IDS` | sizning chat ID (botga `/id` yozing) — ixtiyoriy |
| `MINIAPP_URL` | hozircha bo'sh — 4-qadamda yoziladi |
| `ADMIN_URL` | hozircha bo'sh — 4-qadamda yoziladi |
| `COMPANY_PHONE` | ixtiyoriy, masalan `+82 10 1234 5678` |
| `NODE_VERSION` | `20` |

`PORT` va `PUBLIC_URL` **qo'ymang** — Render o'zi beradi.

4. **Create Web Service**. 3–5 daqiqada manzil chiqadi, masalan: `https://ippo-backend.onrender.com`.
   Tekshirish: `https://ippo-backend.onrender.com/api/health` → `{"ok":true}`.

---

## 3. Vercel — Mini App va Admin panel (ikkita loyiha)

Avval **manzilni yozing**: `miniapp/.env.production` va `admin/.env.production` faylida
`VITE_API_URL=` ga Render manzilini qo'ying (agar `ippo-backend.onrender.com` dan boshqa bo'lsa),
`miniapp/src/lib/api.js` va `admin/src/lib/api.js` dagi `PROD_API_URL` ni ham. Keyin GitHub'ga push qiling.

### Mini App
1. [vercel.com](https://vercel.com) → GitHub bilan kiring → **Add New → Project** → `ippo-shop`.
2. **Project Name**: `ippo-miniapp`, **Root Directory**: `miniapp` (Edit bosib tanlang), Framework: Vite.
3. Environment Variables: `VITE_API_URL` = Render manzili.
4. **Deploy** → manzil: `https://ippo-miniapp.vercel.app`.

### Admin panel
Xuddi shunday, lekin **Project Name**: `ippo-admin`, **Root Directory**: `admin`.
Manzil: `https://ippo-admin-six.vercel.app`.

---

## 4. Render'ga manzillarni yozish

Render → `ippo-backend` → **Environment**:

- `MINIAPP_URL` = `https://ippo-miniapp.vercel.app`
- `ADMIN_URL` = `https://ippo-admin-six.vercel.app`

**Save** → server qayta ishga tushadi. Bot o'zi: webhook ulaydi, pastki **Menu** tugmasini do'konga qo'yadi.

---

## 5. Tekshirish

1. Telegramda **@IPPO_by_fotimazuhrabot** → `/start` → **🛍 Do'konni ochish**.
2. Botga `/admin PAROL` (Render'dagi `ADMIN_PASSWORD`) → siz admin bo'lasiz, Menu tugmasi admin panelni ochadi.
3. Admin panel → **⚙️ Sozlamalar** → karta raqamini kiriting.
4. Do'konda sinov buyurtma bering → botga xabar kelishi kerak.
5. Sinovdan keyin: Admin → Buyurtmalar → **🗑 Hammasini tozalash** (raqamlash #1 dan boshlanadi).

## 6. Render uxlamasligi uchun

Bepul rejada server 15 daqiqa so'rovsiz qolsa uxlaydi (birinchi ochilish ~30–50 s).
Himoya allaqachon bor: webhook (Telegram xabari uyg'otadi) + server o'zini ping qiladi + GitHub Actions.
GitHub → repo → **Settings → Secrets and variables → Actions → Variables** → `BACKEND_URL` = Render manzili.

---

## Xatolar jadvali

| Muammo | Sabab / yechim |
|---|---|
| `prisma db push` xato beradi | `DATABASE_URL` da `-pooler` bo'lmasin |
| Bot javob bermaydi | Render → Logs: `[bot] Webhook rejimi` bormi? `BOT_TOKEN` to'g'rimi? |
| Kompyuterda `2-BACKEND.bat` ochgandan keyin Render'dagi bot jim | Lokal ishga tushganda webhook o'chadi. Render → **Manual Deploy → Deploy latest commit** |
| "Do'konni ochish" tugmasi yo'q | Render'da `MINIAPP_URL` `https://` bilan yozilmagan |
| Mini App "Server uyg'onmoqda..." | Render uxlagan — 30–50 soniya kuting |
| Mini App'da mahsulotlar chiqmaydi | Vercel'da `VITE_API_URL` noto'g'ri → to'g'rilab **Redeploy** |
| Vercel build yiqiladi | Root Directory `miniapp` / `admin` qilib tanlanmagan |
| Admin'ga buyurtma xabari kelmaydi | Admin avval botga `/start` bosishi kerak; `/admin PAROL` qiling |
| Admin yuklagan rasmlar yo'qoldi | Render diski vaqtinchalik — rasmlar bazada zaxiralanadi va avtomatik tiklanadi |
| Admin panelga kira olmayapman | Render'dagi `ADMIN_PASSWORD` bilan kiring (lokal `.env` dagi emas) |
