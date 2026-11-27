import { ApiError } from "./attempts";
import { getDb } from "@/db/client";
import { authenticate } from "./auth";
import type { Db } from "./attempts";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Barcha route'lar uchun umumiy: auth + xatolarni JSON ga o'girish. */
export async function handle(req: Request, fn: (ctx: { db: Db; userId: number }) => Promise<unknown>) {
  try {
    const db = getDb();
    const user = await authenticate(db, req);
    return json(await fn({ db, userId: user.id }));
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Ichki xatolik" }, 500);
  }
}

export function parseId(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, "Noto'g'ri identifikator");
  return n;
}
