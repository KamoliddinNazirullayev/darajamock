# DARAJA — tarix fanidan milliy sertifikat mock imtihoni

Telegram Mini App (bot kirish eshigi) + Next.js. Stek: TypeScript, Next.js (App Router), Drizzle ORM, PostgreSQL, grammY, Vitest, zod.
Pilot: yopiq, ~20–50 foydalanuvchi, bepul. Kontent: faqat v07 (data/exams/v07.json), qolgan variantlar keyin JSON import bilan.

## Buyruqlar
- `npm test` — barcha testlar (PGlite xotirada, DB shart emas)
- `npm run typecheck`, `npm run build`
- `DATABASE_URL=... npm run import:exam -- data/exams/v07.json` — variantni bazaga yozish (idempotent)
- `npx drizzle-kit generate` / `migrate` — migratsiyalar (drizzle/)
- `TELEGRAM_BOT_TOKEN=... APP_URL=https://... npm run bot:webhook` — webhook, menyu tugmasi va buyruqlarni o'rnatadi (`-- --delete` o'chiradi)
- Vercel `vercel-build`: `db:deploy` (migratsiya + v07 import, idempotent; javoblar urinishga bog'langan, o'chmaydi) → `next build` → production'da webhook (xato bo'lsa faqat ogohlantirish)
- Webhook maxfiy kaliti `TELEGRAM_WEBHOOK_SECRET` yoki tokendan HMAC (`src/bot/secret.ts`)
- Muhit o'zgaruvchilari: `.env.example`

## Arxitektura
- `src/lib/exam-schema.ts` — imtihon JSON sxemasi (zod) va `flattenUnits` (55 baholanadigan birlik: 32 yopiq + 3 blok(33–35) + 20 ochiq qism)
- `src/lib/normalize.ts`, `scoring.ts` — ochiq javob tekshiruvi, xom ball → taxminiy 75 ballik → daraja
- `src/lib/telegram.ts` — initData HMAC tekshiruvi
- `src/db/schema.ts` — exams, questions (payload=talabaga ko'rinadi; answer_key=kalit), users, attempts, answers
- `src/server/attempts.ts` — start/state/saveAnswer/submit/result; deadline faqat serverda, 5 s grace
- `src/app/api/attempts/**` — HTTP route'lar. Auth: `Authorization: tma <initData>`; lokal devda `DEV_TELEGRAM_ID`
- `src/app/exam/ExamApp.tsx`, `src/components/QuestionView.tsx` — Mini App UI
- `src/bot/bot.ts` — grammY bot: faqat shaxsiy chatda /start, /help → "Imtihonni ochish" web_app tugmasi. Xatolar `errorBoundary` da (webhook'da `bot.catch` ishlamaydi)
- `src/app/api/bot/route.ts` — webhook; `X-Telegram-Bot-Api-Secret-Token` ≠ `TELEGRAM_WEBHOOK_SECRET` bo'lsa 401

## Qoidalar (buzmang)
1. Kalit (`answerKey`, `correct`, `accepted`, yillar, `key_note`) hech qachon API javobiga/klientga chiqmaydi. Testlar tekshiradi.
2. Vaqt faqat serverda hisoblanadi; klient taymeri faqat ko'rsatish uchun.
3. Ball/daraja TAXMINIY (Rasch emas): natijada doim "Taxminiy natija" yozuvi.
4. Yangi variant = JSON (sxemaga mos) + import; kodga tegilmaydi. Barcha savollar `verified=false` dan boshlanadi.
5. Mualliflik: yozma ruxsatsiz ochiq/pullik ishga tushirmaymiz (Alijonov, Usmonov; Tilavaddinov).

## Holat
- Tayyor: backend, Mini App UI (barcha savol turlari, mobil), bot webhook
- Keyingi ish: deploy (Vercel + Neon) → `import:exam` → `bot:webhook` → haqiqiy Telegram ichida sinash
Savol turlari uchun `data/exams/v07.json` ga qarang. O'zbek lotin interfeys.

## Ochiq muammolar
- v07 da 14 ta `flags` (Q33 faktik xato, Q25 noaniq, Q41b javob 1868 tekshirilsin, ...) — o'qituvchi tekshiruvi kerak
- Q17 xaritasida "@tarixplaton" suv belgisi — almashtirish kerak
- Daraja chegaralari va maks. ball qoidasi rasmiy tasdiqlanmagan
Qo'shimcha hujjatlar: claude.ai "Daraja" Project (01–06 hujjatlar).
