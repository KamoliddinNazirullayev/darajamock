import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { exams, questions } from "./schema";
import type { PreparedExam } from "@/lib/exam-import";

/** Variantni bazaga yozadi (qayta ishga tushirilsa yangilaydi: idempotent). */
export async function importExam(db: PgDatabase<PgQueryResultHKT>, prepared: PreparedExam, status = "pilot") {
  return db.transaction(async (tx) => {
    const values = {
      variantId: prepared.variantId,
      title: prepared.title,
      status,
      source: prepared.source,
      maxRaw: prepared.maxRaw.toFixed(2),
    };
    const [exam] = await tx
      .insert(exams)
      .values(values)
      .onConflictDoUpdate({ target: exams.variantId, set: values })
      .returning({ id: exams.id });

    await tx.delete(questions).where(eq(questions.examId, exam.id));
    await tx.insert(questions).values(
      prepared.questions.map((q) => ({
        examId: exam.id,
        position: q.position,
        label: q.label,
        type: q.type,
        payload: q.payload,
        answerKey: q.answerKey,
        flags: q.flags,
        verified: q.verified,
      })),
    );
    return { examId: exam.id, questions: prepared.questions.length };
  });
}
