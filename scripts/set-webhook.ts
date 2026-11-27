/**
 * Foydalanish:
 *   TELEGRAM_BOT_TOKEN=... APP_URL=https://daraja.example npm run bot:webhook
 * Qiladi: webhook -> APP_URL/api/bot, chat menyu tugmasi -> APP_URL/exam, /start va /help buyruqlari.
 *   `-- --delete`        webhook'ni o'chiradi
 *   `-- --if-production` Vercel build uchun: faqat VERCEL_ENV=production va token bo'lsa ishlaydi,
 *                        xato bo'lsa ogohlantiradi, lekin deploy'ni to'xtatmaydi
 */
import { Api } from "grammy";
import { appUrlFromEnv } from "../src/bot/bot";
import { webhookSecret } from "../src/bot/secret";

const soft = process.argv.includes("--if-production");

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (soft && (process.env.VERCEL_ENV !== "production" || !token)) {
    console.log(`Webhook o'tkazib yuborildi (VERCEL_ENV=${process.env.VERCEL_ENV ?? "-"}, token ${token ? "bor" : "yo'q"}).`);
    return;
  }
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  const api = new Api(token);

  if (process.argv.includes("--delete")) {
    await api.deleteWebhook();
    console.log("Webhook o'chirildi.");
    return;
  }

  const secret = webhookSecret() ?? "";
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET 16–256 belgi (A-Z, a-z, 0-9, _ -) bo'lishi kerak yoki uni bo'sh qoldiring");
  }
  const appUrl = appUrlFromEnv();
  if (!appUrl?.startsWith("https://")) throw new Error("APP_URL https:// manzil bo'lishi kerak");

  const me = await api.getMe();
  await api.setWebhook(`${appUrl}/api/bot`, { secret_token: secret, allowed_updates: ["message"] });
  await api.setChatMenuButton({ menu_button: { type: "web_app", text: "Imtihon", web_app: { url: `${appUrl}/exam` } } });
  await api.setMyCommands([
    { command: "start", description: "Imtihonni boshlash" },
    { command: "help", description: "Yordam" },
  ]);

  const info = await api.getWebhookInfo();
  console.log(`@${me.username}: webhook ${info.url}`);
  console.log(`kutilayotgan update'lar: ${info.pending_update_count}${info.last_error_message ? `, oxirgi xato: ${info.last_error_message}` : ""}`);
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  if (soft) {
    console.warn(`OGOHLANTIRISH: webhook o'rnatilmadi: ${msg}. Keyin qo'lda: npm run bot:webhook`);
    return;
  }
  console.error(msg);
  process.exit(1);
});
