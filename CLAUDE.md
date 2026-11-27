# DARAJA — tarix fanidan milliy sertifikat mock imtihoni

Telegram Mini App (bot kirish eshigi) + Next.js. Stek: TypeScript, Next.js (App Router), Drizzle ORM, PostgreSQL, grammY, Vitest, zod.
Pilot: yopiq, ~20–50 foydalanuvchi, bepul. Kontent: faqat v07 (data/exams/v07.json), qolgan variantlar keyin JSON import bilan.

## Buyruqlar
- `npm test` — barcha testlar (PGlite xotirada, DB shart emas)
- `npm run typecheck`, `npm run build`
- `DATABASE_URL=... npm run import:exam -- data/exams/v07.json` — variantni bazaga yozish (idempotent)
- `npx drizzle-kit generate` / `migrate` — migratsiyalar (drizzle/)

## Arxitektura
- `src/lib/exam-schema.ts` — imtihon JSON sxemasi (zod) va `flattenUnits` (55 baholanadigan birlik: 32 yopiq + 3 blok(33–35) + 20 ochiq qism)
- `src/lib/normalize.ts`, `scoring.ts` — ochiq javob tekshiruvi, xom ball → taxminiy 75 ballik → daraja
- `src/lib/telegram.ts` — initData HMAC tekshiruvi
- `src/db/schema.ts` — exams, questions (payload=talabaga ko'rinadi; answer_key=kalit), users, attempts, answers
- `src/server/attempts.ts` — start/state/saveAnswer/submit/result; deadline faqat serverda, 5 s grace
- `src/app/api/attempts/**` — HTTP route'lar. Auth: `Authorization: tma <initData>`; lokal devda `DEV_TELEGRAM_ID`

## Qoidalar (buzmang)
1. Kalit (`answerKey`, `correct`, `accepted`, yillar, `key_note`) hech qachon API javobiga/klientga chiqmaydi. Testlar tekshiradi.
2. Vaqt faqat serverda hisoblanadi; klient taymeri faqat ko'rsatish uchun.
3. Ball/daraja TAXMINIY (Rasch emas): natijada doim "Taxminiy natija" yozuvi.
4. Yangi variant = JSON (sxemaga mos) + import; kodga tegilmaydi. Barcha savollar `verified=false` dan boshlanadi.
5. Mualliflik: yozma ruxsatsiz ochiq/pullik ishga tushirmaymiz (Alijonov, Usmonov; Tilavaddinov).

## Keyingi ish (3-kun): Mini App UI
Savol komponentlari: yopiq, xronologiya, moslashtirish (I–IV/a–f), jadval (fill/select), rasm/Venn, blok 33–35 (umumiy A–F), ochiq a/b; savol xaritasi, taymer, avtosaqlash (yopiq: darhol, ochiq: debounce), natija ekrani. Keyin bot webhook (grammY) va deploy (Vercel + Neon).
Savol turlari uchun `data/exams/v07.json` ga qarang. O'zbek lotin interfeys.

## Ochiq muammolar
- v07 da 14 ta `flags` (Q33 faktik xato, Q25 noaniq, Q41b javob 1868 tekshirilsin, ...) — o'qituvchi tekshiruvi kerak
- Q17 xaritasida "@tarixplaton" suv belgisi — almashtirish kerak
- Daraja chegaralari va maks. ball qoidasi rasmiy tasdiqlanmagan
Qo'shimcha hujjatlar: claude.ai "Daraja" Project (01–06 hujjatlar).
