import { handle, parseId } from "@/server/http";
import { ApiError, saveAnswer } from "@/server/attempts";

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/attempts/:id/answer  { "key": "36a", "value": "Venetsiya" } — javobni saqlaydi (bo'sh qiymat = tozalash). */
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.clone().json().catch(() => null)) as { key?: unknown; value?: unknown } | null;
  return handle(req, async ({ db, userId }) => {
    if (!body || typeof body.key !== "string" || typeof body.value !== "string") throw new ApiError(400, "key va value kerak");
    return saveAnswer(db, userId, parseId(id), body.key, body.value);
  });
}
