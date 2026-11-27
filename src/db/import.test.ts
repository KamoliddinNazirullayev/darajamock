import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { prepareExam } from "@/lib/exam-import";
import { importExam } from "./import";
import { exams, questions } from "./schema";

const json = JSON.parse(readFileSync(path.join(__dirname, "../../data/exams/v07.json"), "utf-8"));

async function freshDb() {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  return db;
}

describe("importExam (PGlite)", () => {
  it("v07 ni yozadi: 43 element, maks 101.00", async () => {
    const db = await freshDb();
    const res = await importExam(db, prepareExam(json));
    expect(res.questions).toBe(43);
    const [e] = await db.select().from(exams);
    expect(e.variantId).toBe("v07");
    expect(e.maxRaw).toBe("101.00");
  });

  it("qayta import idempotent (dublikat yo'q)", async () => {
    const db = await freshDb();
    await importExam(db, prepareExam(json));
    await importExam(db, prepareExam(json));
    expect(await db.select().from(exams)).toHaveLength(1);
    expect(await db.select().from(questions)).toHaveLength(43);
  });

  it("payload da kalit yo'q: to'g'ri javob, yillar, ochiq javoblar, izoh", async () => {
    const db = await freshDb();
    await importExam(db, prepareExam(json));
    const rows = await db.select().from(questions);
    for (const r of rows) {
      const s = JSON.stringify(r.payload);
      expect(s).not.toContain('"correct"');
      expect(s).not.toContain('"accepted"');
      expect(s).not.toContain('"year":');
      expect(s).not.toContain("key_note");
    }
    const q4 = (await db.select().from(questions).where(eq(questions.label, "4")))[0];
    expect((q4.answerKey as { correct: string }).correct).toBe("C");
    expect((q4.answerKey as { years: number[] }).years).toEqual([1914, 1891, 1881, 1912, 1910, 1882]);
    const q32 = (await db.select().from(questions).where(eq(questions.label, "32")))[0];
    expect(JSON.stringify(q32.payload)).not.toMatch(/XIII-VIII/);
  });
});
