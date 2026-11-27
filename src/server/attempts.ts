import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { answers, attempts, exams, questions, users } from "@/db/schema";
import { gradeUnits, type AnswerMap } from "@/lib/scoring";
import { unitsFromRows } from "./units";
import type { Unit } from "@/lib/exam-schema";

export type Db = PgDatabase<PgQueryResultHKT>;

/** Deadline dan keyin javob qabul qilishda tarmoq kechikishi uchun imkon (soniya). */
export const GRACE_SEC = 5;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function upsertUser(db: Db, tg: { id: number; username?: string; first_name?: string; language_code?: string }) {
  const [u] = await db
    .insert(users)
    .values({ telegramId: tg.id, username: tg.username ?? null, firstName: tg.first_name ?? null })
    .onConflictDoUpdate({ target: users.telegramId, set: { username: tg.username ?? null, firstName: tg.first_name ?? null } })
    .returning();
  return u;
}

async function loadExamRows(db: Db, examId: number) {
  return db.select().from(questions).where(eq(questions.examId, examId)).orderBy(asc(questions.position));
}

async function loadAttempt(db: Db, attemptId: number, userId: number) {
  const [a] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!a || a.userId !== userId) throw new ApiError(404, "Urinish topilmadi");
  return a;
}

/** Muddati o'tgan urinishni avtomatik yakunlaydi (lazy expiry). */
async function expireIfNeeded<T extends { id: number; userId: number; status: string; deadlineAt: Date }>(
  db: Db,
  a: T,
  now: Date,
): Promise<boolean> {
  if (a.status === "in_progress" && now.getTime() > a.deadlineAt.getTime() + GRACE_SEC * 1000) {
    await finalize(db, a.id, "expired", a.deadlineAt);
    return true;
  }
  return false;
}

export async function startAttempt(db: Db, userId: number, variantId: string, now = new Date()) {
  const [exam] = await db.select().from(exams).where(eq(exams.variantId, variantId));
  if (!exam || exam.status === "draft") throw new ApiError(404, "Imtihon topilmadi");

  const open = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.examId, exam.id), eq(attempts.status, "in_progress")));
  for (const a of open) {
    if (!(await expireIfNeeded(db, a, now))) return { attemptId: a.id, resumed: true, deadlineAt: a.deadlineAt };
  }

  const deadlineAt = new Date(now.getTime() + exam.durationMin * 60_000);
  const [created] = await db
    .insert(attempts)
    .values({ userId, examId: exam.id, startedAt: now, deadlineAt })
    .returning();
  return { attemptId: created.id, resumed: false, deadlineAt };
}

/** Imtihon holati: talabaga ko'rinadigan savollar (kalitsiz), saqlangan javoblar, qolgan vaqt. */
export async function getAttemptState(db: Db, userId: number, attemptId: number, now = new Date()) {
  let a = await loadAttempt(db, attemptId, userId);
  if (await expireIfNeeded(db, a, now)) a = await loadAttempt(db, attemptId, userId);

  const [exam] = await db.select().from(exams).where(eq(exams.id, a.examId));
  const rows = await loadExamRows(db, a.examId);
  const saved = await db.select().from(answers).where(eq(answers.attemptId, a.id));
  return {
    attemptId: a.id,
    status: a.status,
    title: exam.title,
    durationMin: exam.durationMin,
    deadlineAt: a.deadlineAt,
    serverNow: now,
    secondsLeft: Math.max(0, Math.floor((a.deadlineAt.getTime() - now.getTime()) / 1000)),
    questions: rows.map((r) => ({ position: r.position, label: r.label, type: r.type, payload: r.payload })),
    answers: Object.fromEntries(saved.map((s) => [s.unitKey, s.value])) as AnswerMap,
  };
}

function validateValue(unit: Unit, value: string): string {
  if (unit.kind === "choice") {
    const v = value.trim().toUpperCase();
    if (v && !unit.choices.includes(v)) throw new ApiError(400, "Noto'g'ri variant");
    return v;
  }
  const v = value.trim();
  if (v.length > 200) throw new ApiError(400, "Javob juda uzun");
  return v;
}

export async function saveAnswer(db: Db, userId: number, attemptId: number, unitKey: string, value: string, now = new Date()) {
  const a = await loadAttempt(db, attemptId, userId);
  if (a.status !== "in_progress") throw new ApiError(409, "Imtihon yakunlangan");
  if (await expireIfNeeded(db, a, now)) throw new ApiError(409, "Vaqt tugadi");

  const unit = unitsFromRows(await loadExamRows(db, a.examId)).find((u) => u.key === unitKey);
  if (!unit) throw new ApiError(400, "Noma'lum topshiriq");
  const clean = validateValue(unit, value);

  if (clean === "") {
    await db.delete(answers).where(and(eq(answers.attemptId, a.id), eq(answers.unitKey, unitKey)));
  } else {
    await db
      .insert(answers)
      .values({ attemptId: a.id, unitKey, value: clean, updatedAt: now })
      .onConflictDoUpdate({ target: [answers.attemptId, answers.unitKey], set: { value: clean, updatedAt: now } });
  }
  return { ok: true };
}

async function finalize(db: Db, attemptId: number, status: "submitted" | "expired", at: Date) {
  const [a] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  const units = unitsFromRows(await loadExamRows(db, a.examId));
  const saved = await db.select().from(answers).where(eq(answers.attemptId, attemptId));
  const map: AnswerMap = Object.fromEntries(saved.map((s) => [s.unitKey, s.value]));
  const grade = gradeUnits(units, map);

  await db.transaction(async (tx) => {
    for (const r of grade.units) {
      if (r.given === null) continue;
      await tx
        .update(answers)
        .set({ isCorrect: r.correct, pointsAwarded: r.awarded.toFixed(2) })
        .where(and(eq(answers.attemptId, attemptId), eq(answers.unitKey, r.key)));
    }
    await tx
      .update(attempts)
      .set({
        status,
        submittedAt: at,
        rawScore: grade.raw.toFixed(2),
        scaledScore: grade.scaled.toFixed(1),
        level: grade.level,
      })
      .where(and(eq(attempts.id, attemptId), eq(attempts.status, "in_progress")));
  });
}

export async function submitAttempt(db: Db, userId: number, attemptId: number, now = new Date()) {
  const a = await loadAttempt(db, attemptId, userId);
  if (a.status === "in_progress") {
    const late = now.getTime() > a.deadlineAt.getTime() + GRACE_SEC * 1000;
    await finalize(db, a.id, late ? "expired" : "submitted", late ? a.deadlineAt : now);
  }
  return getResult(db, userId, attemptId);
}

/** Natija: faqat yakunlangan urinish uchun, to'g'ri javoblar bilan. */
export async function getResult(db: Db, userId: number, attemptId: number, now = new Date()) {
  let a = await loadAttempt(db, attemptId, userId);
  if (await expireIfNeeded(db, a, now)) a = await loadAttempt(db, attemptId, userId);
  if (a.status === "in_progress") throw new ApiError(409, "Imtihon hali yakunlanmagan");

  const units = unitsFromRows(await loadExamRows(db, a.examId));
  const saved = await db.select().from(answers).where(eq(answers.attemptId, a.id));
  const byKey = new Map(saved.map((s) => [s.unitKey, s]));
  return {
    attemptId: a.id,
    status: a.status,
    rawScore: Number(a.rawScore),
    maxRaw: Math.round(units.reduce((s, u) => s + u.points, 0) * 100) / 100,
    scaledScore: Number(a.scaledScore),
    level: a.level,
    disclaimer: "Taxminiy natija: rasmiy Rasch hisobi emas.",
    units: units.map((u) => {
      const s = byKey.get(u.key);
      return {
        key: u.key,
        no: u.no,
        points: u.points,
        given: s?.value ?? null,
        correct: s?.isCorrect ?? false,
        awarded: Number(s?.pointsAwarded ?? 0),
        expected: u.kind === "choice" ? u.correct : u.part.accepted[0],
      };
    }),
  };
}
