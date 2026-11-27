import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { examFileSchema, flattenUnits } from "@/lib/exam-schema";
import { prepareExam } from "@/lib/exam-import";
import { importExam } from "@/db/import";
import { unitsFromRows } from "./units";
import { questions } from "@/db/schema";
import {
  ApiError, getAttemptState, getResult, saveAnswer, startAttempt, submitAttempt, upsertUser, type Db,
} from "./attempts";

const json = JSON.parse(readFileSync(path.join(__dirname, "../../data/exams/v07.json"), "utf-8"));
const exam = examFileSchema.parse(json);

async function setup() {
  const db = drizzle(new PGlite()) as unknown as Db;
  await migrate(db as never, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  await importExam(db, prepareExam(json));
  const user = await upsertUser(db, { id: 1001, username: "ali", first_name: "Ali" });
  return { db, user };
}

const T0 = new Date("2026-12-01T10:00:00Z");
const at = (min: number, sec = 0) => new Date(T0.getTime() + min * 60_000 + sec * 1000);

describe("unitsFromRows", () => {
  it("DB dan tiklangan birliklar fayldagi birliklar bilan bir xil", async () => {
    const { db } = await setup();
    const rows = await (db as never as ReturnType<typeof drizzle>).select().from(questions);
    rows.sort((a, b) => a.position - b.position);
    expect(unitsFromRows(rows)).toEqual(flattenUnits(exam));
  });
});

describe("imtihon jarayoni", () => {
  it("boshlash: 90 daqiqalik deadline, qayta chaqirilsa davom ettiradi", async () => {
    const { db, user } = await setup();
    const a = await startAttempt(db, user.id, "v07", T0);
    expect(a.resumed).toBe(false);
    expect(a.deadlineAt.getTime()).toBe(at(90).getTime());
    const b = await startAttempt(db, user.id, "v07", at(10));
    expect(b.resumed).toBe(true);
    expect(b.attemptId).toBe(a.attemptId);
  });

  it("holat: kalit yo'q, qolgan vaqt to'g'ri", async () => {
    const { db, user } = await setup();
    const { attemptId } = await startAttempt(db, user.id, "v07", T0);
    const s = await getAttemptState(db, user.id, attemptId, at(30));
    expect(s.secondsLeft).toBe(60 * 60);
    expect(s.questions).toHaveLength(43);
    const dump = JSON.stringify(s);
    expect(dump).not.toContain('"correct"');
    expect(dump).not.toContain('"accepted"');
    expect(dump).not.toContain('"answerKey"');
  });

  it("javob saqlash, o'zgartirish, tozalash va validatsiya", async () => {
    const { db, user } = await setup();
    const { attemptId } = await startAttempt(db, user.id, "v07", T0);
    await saveAnswer(db, user.id, attemptId, "4", "a", at(1));
    await saveAnswer(db, user.id, attemptId, "4", "C", at(2));
    await saveAnswer(db, user.id, attemptId, "40a", "Gana", at(3));
    await saveAnswer(db, user.id, attemptId, "33", "F", at(3));
    let s = await getAttemptState(db, user.id, attemptId, at(4));
    expect(s.answers).toEqual({ "4": "C", "40a": "Gana", "33": "F" });
    await saveAnswer(db, user.id, attemptId, "4", "", at(5));
    s = await getAttemptState(db, user.id, attemptId, at(6));
    expect(s.answers["4"]).toBeUndefined();

    await expect(saveAnswer(db, user.id, attemptId, "4", "E", at(7))).rejects.toMatchObject({ status: 400 }); // E faqat blokda
    await expect(saveAnswer(db, user.id, attemptId, "99", "A", at(7))).rejects.toMatchObject({ status: 400 });
    await expect(saveAnswer(db, user.id, attemptId, "34", "E", at(7))).resolves.toEqual({ ok: true }); // blokda A-F
  });

  it("boshqa foydalanuvchi urinishiga kira olmaydi", async () => {
    const { db, user } = await setup();
    const other = await upsertUser(db, { id: 2002 });
    const { attemptId } = await startAttempt(db, user.id, "v07", T0);
    await expect(getAttemptState(db, other.id, attemptId, at(1))).rejects.toMatchObject({ status: 404 });
    await expect(saveAnswer(db, other.id, attemptId, "4", "C", at(1))).rejects.toMatchObject({ status: 404 });
  });

  it("tugatish: ball hisoblanadi, natijada to'g'ri javoblar bor; qayta tugatish o'zgartirmaydi", async () => {
    const { db, user } = await setup();
    const { attemptId } = await startAttempt(db, user.id, "v07", T0);
    await saveAnswer(db, user.id, attemptId, "4", "C", at(1)); // 3.2
    await saveAnswer(db, user.id, attemptId, "40a", "gana", at(2)); // 1.1
    await saveAnswer(db, user.id, attemptId, "41b", "1869", at(3)); // xato
    await expect(getResult(db, user.id, attemptId, at(4))).rejects.toMatchObject({ status: 409 });

    const r = await submitAttempt(db, user.id, attemptId, at(20));
    expect(r.status).toBe("submitted");
    expect(r.rawScore).toBe(4.3);
    expect(r.maxRaw).toBe(101);
    expect(r.scaledScore).toBe(3.2); // 4.3/101*75
    expect(r.level).toBe("—");
    expect(r.units.find((u) => u.key === "41b")).toMatchObject({ given: "1869", correct: false, expected: "1868" });

    const again = await submitAttempt(db, user.id, attemptId, at(30));
    expect(again.rawScore).toBe(4.3);
    await expect(saveAnswer(db, user.id, attemptId, "5", "C", at(31))).rejects.toMatchObject({ status: 409 });
  });

  it("vaqt tugagach: javob rad etiladi, urinish 'expired' bo'lib avtomatik baholanadi", async () => {
    const { db, user } = await setup();
    const { attemptId } = await startAttempt(db, user.id, "v07", T0);
    await saveAnswer(db, user.id, attemptId, "4", "C", at(89));
    await expect(saveAnswer(db, user.id, attemptId, "5", "C", at(91))).rejects.toMatchObject({ status: 409 });
    const r = await getResult(db, user.id, attemptId, at(92));
    expect(r.status).toBe("expired");
    expect(r.rawScore).toBe(3.2);
  });

  it("deadline dan keyingi 5 soniya imkon ichida javob qabul qilinadi", async () => {
    const { db, user } = await setup();
    const { attemptId } = await startAttempt(db, user.id, "v07", T0);
    await expect(saveAnswer(db, user.id, attemptId, "4", "C", at(90, 3))).resolves.toEqual({ ok: true });
    await expect(saveAnswer(db, user.id, attemptId, "5", "C", at(90, 10))).rejects.toBeInstanceOf(ApiError);
  });

  it("muddati o'tgan urinishdan keyin yangi urinish boshlanadi", async () => {
    const { db, user } = await setup();
    const first = await startAttempt(db, user.id, "v07", T0);
    const second = await startAttempt(db, user.id, "v07", at(100));
    expect(second.resumed).toBe(false);
    expect(second.attemptId).not.toBe(first.attemptId);
  });
});
