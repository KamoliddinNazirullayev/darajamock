import { examFileSchema, maxRawScore, type ExamFile, type ExamQuestion } from "./exam-schema";

/**
 * Savolni talabaga ko'rinadigan qism (payload) va kalit (answerKey) ga ajratadi.
 * Kalit (to'g'ri javob, xronologiya yillari, ochiq javoblar ro'yxati) klientga hech qachon yuborilmaydi.
 */
export function splitQuestion(q: ExamQuestion): { label: string; type: string; payload: unknown; answerKey: unknown } {
  if (q.type === "open") {
    return {
      label: String(q.no),
      type: q.type,
      payload: {
        no: q.no,
        stem: q.stem,
        parts: q.parts.map((p) => ({ label: p.label, prompt: p.prompt, points: p.points, kind: p.kind })),
      },
      answerKey: { parts: q.parts.map((p) => ({ label: p.label, accepted: p.accepted })) },
    };
  }
  if (q.type === "block_matching") {
    return {
      label: q.no,
      type: q.type,
      payload: {
        stem: q.stem,
        // yillar kalit hisoblanadi (savol 33: "qaysi biri keyiroq") — talabaga ko'rsatilmaydi
        shared_options: Object.fromEntries(Object.entries(q.shared_options).map(([k, v]) => [k, { text: v.text }])),
        questions: q.questions.map((s) => ({ no: s.no, points: s.points, stem: s.stem })),
      },
      answerKey: {
        correct: Object.fromEntries(q.questions.map((s) => [String(s.no), s.correct])),
        years: Object.fromEntries(Object.entries(q.shared_options).map(([k, v]) => [k, v.year ?? null])),
      },
    };
  }
  // yopiq turlar: items ichidagi yillar (chronology) va variantlardagi qavs ichidagi kalitlar tozalanadi
  const items = q.items
    ? q.items.map((it) => (typeof it === "string" ? it : { text: it.text }))
    : null;
  const years =
    q.items && q.items.some((it) => typeof it !== "string")
      ? q.items.map((it) => (typeof it === "string" ? null : it.year))
      : null;
  const { correct, key_note, flags: _f, verified: _v, src_page: _s, items: _i, ...rest } = q;
  void _f; void _v; void _s; void _i;
  return {
    label: String(q.no),
    type: q.type,
    payload: { ...rest, items },
    answerKey: { correct, years, note: key_note ?? null },
  };
}

export type PreparedExam = {
  variantId: string;
  title: string;
  maxRaw: number;
  source: Record<string, unknown>;
  questions: Array<ReturnType<typeof splitQuestion> & { position: number; flags: string[]; verified: boolean }>;
};

export function prepareExam(json: unknown): PreparedExam {
  const exam: ExamFile = examFileSchema.parse(json);
  const label = typeof exam.source.label === "string" ? exam.source.label : exam.variant_id;
  return {
    variantId: exam.variant_id,
    title: `Tarix — milliy sertifikat mock (${label})`,
    maxRaw: maxRawScore(exam),
    source: exam.source,
    questions: exam.questions.map((q, i) => ({
      position: i + 1,
      ...splitQuestion(q),
      flags: q.flags,
      verified: q.verified,
    })),
  };
}
