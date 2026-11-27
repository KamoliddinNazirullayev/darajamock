import { handle, parseId } from "@/server/http";
import { submitAttempt } from "@/server/attempts";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/attempts/:id/submit — imtihonni yakunlaydi va natijani qaytaradi (qayta chaqirish xavfsiz). */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(req, ({ db, userId }) => submitAttempt(db, userId, parseId(id)));
}
