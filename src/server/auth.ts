import { verifyInitData, type TelegramUser } from "@/lib/telegram";
import { ApiError, upsertUser, type Db } from "./attempts";
import { accessMode, adminIds } from "./access";

export const NO_ACCESS_MESSAGE =
  "DARAJA hozir yopiq pilot rejimida. Kirish uchun botga taklif havolasi orqali kiring yoki taklif kodini yuboring.";

/**
 * So'rovni autentifikatsiya qiladi: `Authorization: tma <initData>`.
 * Faqat lokal ishlab chiqishda (NODE_ENV !== production) DEV_TELEGRAM_ID orqali kirish mumkin (ruxsat tekshirilmaydi).
 * invite rejimida taklif kodi bilan kirmagan foydalanuvchi 403 oladi.
 */
export async function authenticate(db: Db, req: Request) {
  const header = req.headers.get("authorization") ?? "";
  let tg: TelegramUser | null = null;
  let dev = false;

  if (header.startsWith("tma ")) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new ApiError(500, "Server sozlanmagan");
    tg = verifyInitData(header.slice(4), token);
  } else if (process.env.NODE_ENV !== "production" && process.env.DEV_TELEGRAM_ID) {
    tg = { id: Number(process.env.DEV_TELEGRAM_ID), first_name: "Dev" };
    dev = true;
  }
  if (!tg) throw new ApiError(401, "Avtorizatsiya talab qilinadi");

  const user = await upsertUser(db, tg);
  if (!dev && accessMode() === "invite" && !user.accessGrantedAt && !adminIds().has(tg.id)) {
    throw new ApiError(403, NO_ACCESS_MESSAGE);
  }
  return user;
}
