import { bigint, boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  variantId: text("variant_id").notNull().unique(), // masalan "v07"
  title: text("title").notNull(),
  durationMin: integer("duration_min").notNull().default(90),
  status: text("status").notNull().default("draft"), // draft | pilot | published
  source: jsonb("source").notNull(),
  maxRaw: numeric("max_raw", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Har bir topshiriq (33-35 blok savollari alohida qatorga ajratilmaydi, payload ichida). */
export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
    position: integer("position").notNull(), // 1..43 (blok 1 ta element)
    label: text("label").notNull(), // "1".."32", "33-35", "36".."45"
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(), // talabaga ko'rinadigan qism (kalitsiz)
    answerKey: jsonb("answer_key").notNull(), // kalit — hech qachon klientga yuborilmaydi
    flags: jsonb("flags").notNull().default([]),
    verified: boolean("verified").notNull().default(false),
  },
  (t) => [uniqueIndex("questions_exam_position").on(t.examId, t.position)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  language: text("language").notNull().default("uz"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  status: text("status").notNull().default("in_progress"), // in_progress | submitted | expired
  rawScore: numeric("raw_score", { precision: 6, scale: 2 }),
  scaledScore: numeric("scaled_score", { precision: 5, scale: 1 }),
  level: text("level"),
});

/** Bitta birlik (key) uchun bitta javob: "1".."35", "36a", "36b"... */
export const answers = pgTable(
  "answers",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    unitKey: text("unit_key").notNull(),
    value: text("value").notNull(),
    isCorrect: boolean("is_correct"),
    pointsAwarded: numeric("points_awarded", { precision: 5, scale: 2 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("answers_attempt_unit").on(t.attemptId, t.unitKey)],
);
