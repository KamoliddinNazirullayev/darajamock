import { webhookCallback } from "grammy";
import { getBot } from "@/bot/instance";

/**
 * POST /api/bot — Telegram webhook.
 * Faqat X-Telegram-Bot-Api-Secret-Token sarlavhasi TELEGRAM_WEBHOOK_SECRET ga teng bo'lsa qabul qilinadi (aks holda 401).
 * Webhook'ni o'rnatish: npm run bot:webhook
 */
export async function POST(req: Request) {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  let bot;
  try {
    if (!secretToken) throw new Error("TELEGRAM_WEBHOOK_SECRET o'rnatilmagan");
    bot = getBot();
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server sozlanmagan" }, { status: 500 });
  }
  return webhookCallback(bot, "std/http", { secretToken })(req);
}
