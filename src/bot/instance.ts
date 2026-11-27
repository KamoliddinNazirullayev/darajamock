import { getDb } from "@/db/client";
import { accessMode, adminIds, createInvite, disableInvite, hasAccess, listInvites, redeemInvite } from "@/server/access";
import { appUrlFromEnv, createBot, type AccessPort } from "./bot";

let cached: ReturnType<typeof createBot> | null = null;

/** Ruxsat funksiyalarini bazaga ulaydi. ACCESS_MODE=open bo'lsa ham admin buyruqlari ishlaydi. */
function dbAccess(): AccessPort {
  const admins = adminIds();
  return {
    has: async (u) => accessMode() === "open" || admins.has(u.id) || hasAccess(getDb(), u),
    redeem: (u, code) => (accessMode() === "open" ? Promise.resolve("already") : redeemInvite(getDb(), u, code)),
    isAdmin: (id) => admins.has(id),
    createInvite: (adminId, maxUses, note) => createInvite(getDb(), { maxUses, note, createdBy: adminId }),
    listInvites: () => listInvites(getDb()),
    disableInvite: (code) => disableInvite(getDb(), code),
  };
}

/** Serverless muhitda bitta bot nusxasi; getMe faqat birinchi update'da bir marta chaqiriladi. */
export function getBot() {
  if (cached) return cached;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = appUrlFromEnv();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  if (!appUrl) throw new Error("APP_URL o'rnatilmagan");
  cached = createBot({ token, webAppUrl: `${appUrl}/exam`, access: dbAccess() });
  return cached;
}
