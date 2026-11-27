import { createHmac } from "node:crypto";

/**
 * Webhook maxfiy kaliti. TELEGRAM_WEBHOOK_SECRET berilsa o'sha, aks holda bot tokenidan hosil qilinadi
 * (HMAC, 64 hex belgi). Shunda deploy uchun alohida kalit yaratish shart emas, token almashsa kalit ham almashadi.
 */
export function webhookSecret(env: Record<string, string | undefined> = process.env): string | null {
  if (env.TELEGRAM_WEBHOOK_SECRET) return env.TELEGRAM_WEBHOOK_SECRET;
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  return createHmac("sha256", "daraja-telegram-webhook").update(env.TELEGRAM_BOT_TOKEN).digest("hex");
}
