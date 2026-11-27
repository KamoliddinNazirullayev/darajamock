/**
 * Foydalanish: DATABASE_URL=... npm run import:exam -- data/exams/v07.json [status]
 * Faylni sxema bo'yicha tekshiradi va bazaga yozadi (idempotent).
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { prepareExam } from "../src/lib/exam-import";
import { importExam } from "../src/db/import";

async function main() {
  const [file, status = "pilot"] = process.argv.slice(2);
  if (!file) throw new Error("Fayl yo'li kerak: npm run import:exam -- data/exams/v07.json");
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL; // Neon: migratsiya/import pooler'siz
  if (!url) throw new Error("DATABASE_URL o'rnatilmagan");

  const prepared = prepareExam(JSON.parse(readFileSync(file, "utf-8")));
  const unverified = prepared.questions.filter((q) => !q.verified).length;
  const flagged = prepared.questions.filter((q) => q.flags.length).length;
  console.log(`${prepared.variantId}: ${prepared.questions.length} element, maks. xom ball ${prepared.maxRaw}`);
  console.log(`tekshirilmagan: ${unverified}, belgilangan muammolar: ${flagged}`);

  const client = postgres(url, { max: 1 });
  try {
    const res = await importExam(drizzle(client), prepared, status);
    console.log(`Yozildi: exam_id=${res.examId}, savollar=${res.questions}, status=${status}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
