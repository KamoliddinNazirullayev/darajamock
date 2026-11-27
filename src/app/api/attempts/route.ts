import { handle } from "@/server/http";
import { startAttempt } from "@/server/attempts";

/** POST /api/attempts  { "variantId": "v07" } — imtihonni boshlaydi yoki davom ettiradi. */
export async function POST(req: Request) {
  const body = (await req.clone().json().catch(() => ({}))) as { variantId?: string };
  return handle(req, ({ db, userId }) => startAttempt(db, userId, body.variantId ?? "v07"));
}
