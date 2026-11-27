import { webhookCallback } from "grammy";
import { getBot } from "@/bot/instance";
import { webhookSecret } from "@/bot/secret";

/**
 * POST /api/bot — Telegram webhook.
 * Faqat X-Telegram-Bot-Api-Secret-Token sarlavhasi webhookSecret() ga teng bo'lsa qabul qilinadi (aks holda 401).
 * Webhook'ni o'rnatish: npm run bot:webhook (Vercel production deploy'da avtomatik)
 */
export async function POST(req: Request) {
  const secretToken = webhookSecret();
  let bot;
  try {
    if (!secretToken) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
    bot = getBot();
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server sozlanmagan" }, { status: 500 });
  }
  return webhookCallback(bot, "std/http", { secretToken })(req);
}
