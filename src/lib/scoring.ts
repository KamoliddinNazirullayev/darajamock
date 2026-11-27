import { flattenUnits, type ExamFile, type Unit } from "./exam-schema";
import { isOpenAnswerCorrect } from "./normalize";

export type AnswerMap = Record<string, string>;

export type UnitResult = {
  key: string;
  no: number;
  points: number;
  awarded: number;
  correct: boolean;
  given: string | null;
};

export type Level = "A+" | "A" | "B+" | "B" | "C+" | "C" | "—";

/**
 * Daraja chegaralari (infoedu.uz manbasi bo'yicha, rasmiy tasdiq kutilmoqda).
 * Hisob TAXMINIY: rasmiy Rasch modeli emas.
 */
export const LEVEL_THRESHOLDS: Array<[number, Level]> = [
  [70, "A+"],
  [65, "A"],
  [60, "B+"],
  [55, "B"],
  [50, "C+"],
  [46, "C"],
];

export const SCALE_MAX = 75;

export function levelFor(scaled: number): Level {
  for (const [min, level] of LEVEL_THRESHOLDS) if (scaled >= min) return level;
  return "—";
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type GradeResult = {
  units: UnitResult[];
  raw: number;
  max: number;
  scaled: number;
  level: Level;
};

export function gradeUnits(units: Unit[], answers: AnswerMap): GradeResult {
  const results: UnitResult[] = units.map((u) => {
    const given = answers[u.key] ?? null;
    let correct = false;
    if (given !== null) {
      correct =
        u.kind === "choice"
          ? given.trim().toUpperCase() === u.correct
          : isOpenAnswerCorrect(given, u.part.accepted, u.part.kind);
    }
    return { key: u.key, no: u.no, points: u.points, awarded: correct ? u.points : 0, correct, given };
  });
  const raw = Math.round(results.reduce((s, r) => s + r.awarded, 0) * 100) / 100;
  const max = Math.round(units.reduce((s, u) => s + u.points, 0) * 100) / 100;
  const scaled = round1((raw / max) * SCALE_MAX);
  return { units: results, raw, max, scaled, level: levelFor(scaled) };
}

export function gradeAttempt(exam: ExamFile, answers: AnswerMap): GradeResult {
  return gradeUnits(flattenUnits(exam), answers);
}
