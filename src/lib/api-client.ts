"use client";

export type QuestionDto = { position: number; label: string; type: string; payload: any };
export type AttemptState = {
  attemptId: number;
  status: "in_progress" | "submitted" | "expired";
  title: string;
  durationMin: number;
  secondsLeft: number;
  questions: QuestionDto[];
  answers: Record<string, string>;
};
export type ResultDto = {
  attemptId: number;
  status: string;
  rawScore: number;
  maxRaw: number;
  scaledScore: number;
  level: string;
  disclaimer: string;
  units: Array<{ key: string; no: number; points: number; given: string | null; correct: boolean; awarded: number; expected: string }>;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready(): void; expand(): void; close(): void } };
  }
}

function headers(): HeadersInit {
  const initData = typeof window !== "undefined" ? window.Telegram?.WebApp?.initData : "";
  const h: Record<string, string> = { "content-type": "application/json" };
  if (initData) h.authorization = `tma ${initData}`; // lokal devda server DEV_TELEGRAM_ID dan foydalanadi
  return h;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: headers(), cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? "Xatolik"), { status: res.status });
  return body as T;
}

export const api = {
  start: (variantId = "v07") => call<{ attemptId: number; resumed: boolean }>("/api/attempts", { method: "POST", body: JSON.stringify({ variantId }) }),
  state: (id: number) => call<AttemptState>(`/api/attempts/${id}`),
  save: (id: number, key: string, value: string) => call<{ ok: true }>(`/api/attempts/${id}/answer`, { method: "PUT", body: JSON.stringify({ key, value }) }),
  submit: (id: number) => call<ResultDto>(`/api/attempts/${id}/submit`, { method: "POST" }),
  result: (id: number) => call<ResultDto>(`/api/attempts/${id}/result`),
};

/** Savol tarkibidagi baholanadigan birlik kalitlari (server bilan bir xil: units.ts). */
export function unitKeys(q: QuestionDto): string[] {
  if (q.type === "open") return q.payload.parts.map((p: any) => `${q.label}${p.label}`);
  if (q.type === "block_matching") return q.payload.questions.map((s: any) => String(s.no));
  return [q.label];
}
