import { handle, parseId } from "@/server/http";
import { getAttemptState } from "@/server/attempts";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/attempts/:id — savollar (kalitsiz), saqlangan javoblar, qolgan vaqt. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(req, ({ db, userId }) => getAttemptState(db, userId, parseId(id)));
}
