import { appUrlFromEnv, createBot } from "./bot";

let cached: ReturnType<typeof createBot> | null = null;

/** Serverless muhitda bitta bot nusxasi; getMe faqat birinchi update'da bir marta chaqiriladi. */
export function getBot() {
  if (cached) return cached;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = appUrlFromEnv();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  if (!appUrl) throw new Error("APP_URL o'rnatilmagan");
  cached = createBot({ token, webAppUrl: `${appUrl}/exam` });
  return cached;
}
