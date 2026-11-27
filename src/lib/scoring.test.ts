import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { examFileSchema, flattenUnits, maxRawScore } from "./exam-schema";
import { isOpenAnswerCorrect, normalizeText } from "./normalize";
import { gradeAttempt, levelFor } from "./scoring";

const raw = JSON.parse(readFileSync(path.join(__dirname, "../../data/exams/v07.json"), "utf-8"));
const exam = examFileSchema.parse(raw);

function fullKey(): Record<string, string> {
  const ans: Record<string, string> = {};
  for (const u of flattenUnits(exam)) ans[u.key] = u.kind === "choice" ? u.correct : u.part.accepted[0];
  return ans;
}

describe("v07 imtihon fayli", () => {
  it("sxemaga mos va 45 topshiriq (3+... = 55 baholanadigan birlik)", () => {
    const units = flattenUnits(exam);
    // 32 yopiq + 3 blok + 10 ochiq x 2 qism = 55 birlik
    expect(units).toHaveLength(55);
    expect(units.filter((u) => u.kind === "open")).toHaveLength(20);
  });

  it("maksimal xom ball 101.0", () => {
    expect(maxRawScore(exam)).toBe(101);
  });
});

describe("gradeAttempt", () => {
  it("to'liq to'g'ri javoblar: 101 xom ball, 75 taxminiy, A+", () => {
    const g = gradeAttempt(exam, fullKey());
    expect(g.raw).toBe(101);
    expect(g.scaled).toBe(75);
    expect(g.level).toBe("A+");
    expect(g.units.every((u) => u.correct)).toBe(true);
  });

  it("bo'sh javoblar: 0 ball, daraja yo'q", () => {
    const g = gradeAttempt(exam, {});
    expect(g.raw).toBe(0);
    expect(g.scaled).toBe(0);
    expect(g.level).toBe("—");
  });

  it("faqat bitta yopiq savol (Q4, 3.2 ball) to'g'ri", () => {
    const g = gradeAttempt(exam, { "4": "C" });
    expect(g.raw).toBe(3.2);
  });

  it("noto'g'ri variant ball bermaydi, kichik harf qabul qilinadi", () => {
    expect(gradeAttempt(exam, { "4": "A" }).raw).toBe(0);
    expect(gradeAttempt(exam, { "4": "c" }).raw).toBe(3.2);
  });

  it("blok savollari (33-35) A-F harflari bilan baholanadi", () => {
    const g = gradeAttempt(exam, { "33": "F", "34": "D", "35": "E" });
    expect(g.raw).toBe(6.6);
  });

  it("ochiq javob: imlo variantlari qabul qilinadi", () => {
    const g = gradeAttempt(exam, { "40a": "gana", "40b": "Nelson Mandela", "36a": "Венетсия" });
    expect(g.units.find((u) => u.key === "40a")?.correct).toBe(true);
    expect(g.units.find((u) => u.key === "40b")?.correct).toBe(true);
    expect(g.units.find((u) => u.key === "36a")?.correct).toBe(true); // kirill -> lotin
  });

  it("darajalar chegarasi", () => {
    expect(levelFor(70)).toBe("A+");
    expect(levelFor(69.9)).toBe("A");
    expect(levelFor(46)).toBe("C");
    expect(levelFor(45.9)).toBe("—");
  });
});

describe("normalizeText", () => {
  it("apostrof turlari va kirill", () => {
    expect(normalizeText("Oʻzbekiston")).toBe(normalizeText("O'zbekiston"));
    expect(normalizeText("G‘aznaviy")).toBe(normalizeText("Gʻaznaviy"));
    expect(normalizeText("Ўзбекистон")).toBe("ozbekiston");
  });
});

describe("isOpenAnswerCorrect", () => {
  it("rim raqamlari aniq mos kelishi shart", () => {
    expect(isOpenAnswerCorrect("Aleksandr II", ["Aleksandr II"])).toBe(true);
    expect(isOpenAnswerCorrect("Aleksandr III", ["Aleksandr II"])).toBe(false);
    expect(isOpenAnswerCorrect("Aleksandr 2", ["Aleksandr II"])).toBe(false);
  });

  it("qo'shimcha so'zli javob qabul qilinadi, qisman emas", () => {
    expect(isOpenAnswerCorrect("Gana davlati", ["Gana"])).toBe(true);
    expect(isOpenAnswerCorrect("Sulton Mahmud Gʻaznaviy", ["Mahmud Gʻaznaviy"])).toBe(true);
    expect(isOpenAnswerCorrect("Mahmud", ["Mahmud Gʻaznaviy"])).toBe(false);
  });

  it("uzun so'zda bitta harf xatosi kechiriladi, qisqa so'zda yo'q", () => {
    expect(isOpenAnswerCorrect("Konstantinopl", ["Konstantinopol"])).toBe(true);
    expect(isOpenAnswerCorrect("Gona", ["Gana"])).toBe(false);
  });

  it("yil va raqam: faqat raqamlar solishtiriladi", () => {
    expect(isOpenAnswerCorrect("1868-yil", ["1868"], "year")).toBe(true);
    expect(isOpenAnswerCorrect("1869", ["1868"], "year")).toBe(false);
    expect(isOpenAnswerCorrect("10", ["10 ta"], "number")).toBe(true);
  });

  it("bo'sh javob noto'g'ri", () => {
    expect(isOpenAnswerCorrect("   ", ["Gana"])).toBe(false);
  });
});
