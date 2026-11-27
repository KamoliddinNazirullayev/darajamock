import { z } from "zod";

/**
 * Imtihon (variant) fayli sxemasi. data/exams/vXX.json shu sxemaga mos bo'lishi shart.
 * Yangi variant qo'shish = shu sxemaga mos JSON + import skripti.
 */

const flags = z.array(z.string()).default([]);
const letter4 = z.enum(["A", "B", "C", "D"]);
const letter6 = z.enum(["A", "B", "C", "D", "E", "F"]);

const closedBase = {
  no: z.number().int().min(1).max(45),
  points: z.number().positive(),
  stem: z.string().min(1),
  items: z.array(z.union([z.string(), z.object({ text: z.string(), year: z.number() })])).nullable().default(null),
  options: z.object({ A: z.string(), B: z.string(), C: z.string(), D: z.string() }),
  correct: letter4,
  flags,
  verified: z.boolean().default(false),
  src_page: z.number().nullable().optional(),
};

const closedTypes = ["single", "chronology", "matching", "table_fill", "table_select", "image", "venn"] as const;

const closedQuestion = z.object({
  ...closedBase,
  type: z.enum(closedTypes),
  // tur bo'yicha qo'shimcha ma'lumotlar (UI uchun)
  left: z.record(z.string(), z.string()).optional(),
  right: z.record(z.string(), z.string()).optional(),
  table: z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }).optional(),
  facts: z.array(z.string()).optional(),
  image: z.string().optional(),
  key_note: z.string().optional(),
});

const blockQuestion = z.object({
  no: z.literal("33-35"),
  type: z.literal("block_matching"),
  stem: z.string(),
  shared_options: z.record(letter6, z.object({ text: z.string(), year: z.number().optional() })),
  questions: z
    .array(z.object({ no: z.number().int(), points: z.number().positive(), stem: z.string(), correct: letter6 }))
    .length(3),
  flags,
  verified: z.boolean().default(false),
  src_page: z.number().nullable().optional(),
});

const openPart = z.object({
  label: z.enum(["a", "b"]),
  prompt: z.string(),
  points: z.number().positive(),
  kind: z.enum(["text", "year", "number"]),
  accepted: z.array(z.string()).min(1),
});

const openQuestion = z.object({
  no: z.number().int().min(36).max(45),
  type: z.literal("open"),
  stem: z.string(),
  parts: z.array(openPart).length(2),
  flags,
  verified: z.boolean().default(false),
  src_page: z.number().nullable().optional(),
});

export const examFileSchema = z
  .object({
    variant_id: z.string().regex(/^v\d{2,}$/),
    source: z.record(z.string(), z.unknown()),
    scoring_note: z.string().optional(),
    questions: z.array(z.union([closedQuestion, blockQuestion, openQuestion])),
  })
  .superRefine((exam, ctx) => {
    const nums: number[] = [];
    for (const q of exam.questions) {
      if (q.type === "block_matching") nums.push(...q.questions.map((x) => x.no));
      else nums.push(q.no as number);
    }
    const expected = Array.from({ length: 45 }, (_, i) => i + 1);
    if (nums.length !== 45 || nums.some((n, i) => n !== expected[i])) {
      ctx.addIssue({ code: "custom", message: `Topshiriq raqamlari 1..45 ketma-ket bo'lishi kerak, topildi: ${nums.join(",")}` });
    }
  });

export type ExamFile = z.infer<typeof examFileSchema>;
export type ExamQuestion = ExamFile["questions"][number];
export type OpenPart = z.infer<typeof openPart>;

/** Baholanadigan eng kichik birlik: yopiq savol, blok savoli yoki ochiq savolning qismi. */
export type Unit =
  | { key: string; no: number; kind: "choice"; points: number; correct: string; choices: string[] }
  | { key: string; no: number; kind: "open"; points: number; part: OpenPart };

export function flattenUnits(exam: ExamFile): Unit[] {
  const units: Unit[] = [];
  for (const q of exam.questions) {
    if (q.type === "open") {
      for (const part of q.parts) {
        units.push({ key: `${q.no}${part.label}`, no: q.no, kind: "open", points: part.points, part });
      }
    } else if (q.type === "block_matching") {
      const choices = Object.keys(q.shared_options);
      for (const sub of q.questions) {
        units.push({ key: String(sub.no), no: sub.no, kind: "choice", points: sub.points, correct: sub.correct, choices });
      }
    } else {
      units.push({ key: String(q.no), no: q.no as number, kind: "choice", points: q.points, correct: q.correct, choices: ["A", "B", "C", "D"] });
    }
  }
  return units;
}

export function maxRawScore(exam: ExamFile): number {
  return Math.round(flattenUnits(exam).reduce((s, u) => s + u.points, 0) * 100) / 100;
}
