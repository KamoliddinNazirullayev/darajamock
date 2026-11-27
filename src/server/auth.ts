import { verifyInitData, type TelegramUser } from "@/lib/telegram";
import { ApiError, upsertUser, type Db } from "./attempts";

/**
 * So'rovni autentifikatsiya qiladi: `Authorization: tma <initData>`.
 * Faqat lokal ishlab chiqishda (NODE_ENV !== production) DEV_TELEGRAM_ID orqali kirish mumkin.
 */
export async function authenticate(db: Db, req: Request) {
  const header = req.headers.get("authorization") ?? "";
  let tg: TelegramUser | null = null;

  if (header.startsWith("tma ")) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new ApiError(500, "Server sozlanmagan");
    tg = verifyInitData(header.slice(4), token);
  } else if (process.env.NODE_ENV !== "production" && process.env.DEV_TELEGRAM_ID) {
    tg = { id: Number(process.env.DEV_TELEGRAM_ID), first_name: "Dev" };
  }
  if (!tg) throw new ApiError(401, "Avtorizatsiya talab qilinadi");
  return upsertUser(db, tg);
}
