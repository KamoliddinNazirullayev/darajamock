import type { Unit } from "@/lib/exam-schema";

type QuestionRow = { label: string; type: string; payload: unknown; answerKey: unknown };

/**
 * DB qatorlaridan (payload + answerKey) baholanadigan birliklarni tiklaydi.
 * Natija flattenUnits(exam) bilan bir xil bo'lishi shart (testda tekshiriladi).
 */
export function unitsFromRows(rows: QuestionRow[]): Unit[] {
  const units: Unit[] = [];
  for (const r of rows) {
    const payload = r.payload as Record<string, any>;
    const key = r.answerKey as Record<string, any>;
    if (r.type === "open") {
      const accepted = new Map<string, string[]>(key.parts.map((p: any) => [p.label, p.accepted]));
      for (const p of payload.parts) {
        units.push({
          key: `${r.label}${p.label}`,
          no: Number(r.label),
          kind: "open",
          points: p.points,
          part: { label: p.label, prompt: p.prompt, points: p.points, kind: p.kind, accepted: accepted.get(p.label) ?? [] },
        });
      }
    } else if (r.type === "block_matching") {
      const choices = Object.keys(payload.shared_options);
      for (const sub of payload.questions) {
        units.push({ key: String(sub.no), no: sub.no, kind: "choice", points: sub.points, correct: key.correct[String(sub.no)], choices });
      }
    } else {
      units.push({ key: r.label, no: Number(r.label), kind: "choice", points: payload.points, correct: key.correct, choices: ["A", "B", "C", "D"] });
    }
  }
  return units;
}
