# IPPO — "Ilovadan qanday buyurtma beriladi?" videosi

Tayyor video: **`ippo-buyurtma.mp4`** (1080×1920, 30 fps, 46 soniya — Reels/Stories/Telegram uchun).

Ssenariy:

| Vaqt | Sahna |
|---|---|
| 0–4 s | Intro: IPPO ikonkasi, logo, "Ilovadan qanday buyurtma beriladi? · 5 ta oson qadam" |
| 4–10 s | 1-qadam: Telegram'da bot → «Do‘konni ochish» → ilova ochiladi (splash) |
| 10–16 s | 2-qadam: bosh sahifa, kategoriyalar, mahsulotni tanlash |
| 16–22 s | 3-qadam: «Savatchaga» → rasm savatchaga uchadi → savatcha |
| 22–30 s | 4-qadam: ism, telefon, hudud, manzil + «Kartaga o‘tkazma» tanlanadi |
| 30–41 s | 5-qadam: karta raqamini nusxalash → bank ilovasida o‘tkazma → chek yuklash → «Chek yuborildi!» |
| 41–46 s | Yakun: logo, "Tayyor! Buyurtma qabul qilindi", @IPPO_by_fotimazuhrabot |

Ranglar faqat logodan: espresso `#1E1006`, oltin `#D1A955` / `#EAC87A` / `#9D804C`, krem fon.

## Tahrirlash va qayta render

- `index.html` — butun animatsiya. Brauzerda ochsangiz, pastdagi slayder bilan ko'rish mumkin.
  Matnlar `STEPS` massivida, karta raqami `#cardNum` va bank sahnasida (`9400 •••• •••• 2026` — namuna).
- Render (Node 20+ va ffmpeg kerak):

```bash
cd promo-video
npm install
node render.mjs ippo-buyurtma.mp4            # ffmpeg PATH da bo'lsa
node render.mjs ippo-buyurtma.mp4 --ffmpeg /yo'l/ffmpeg
node render.mjs --stills 5,20,35             # faqat tekshiruv kadrlari (PNG)
```
