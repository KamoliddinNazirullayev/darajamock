import { handle, parseId } from "@/server/http";
import { getResult } from "@/server/attempts";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/attempts/:id/result — yakunlangan urinish natijasi, to'g'ri javoblar bilan. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(req, ({ db, userId }) => getResult(db, userId, parseId(id)));
}
