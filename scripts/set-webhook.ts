/**
 * Foydalanish (deploy'dan keyin bir marta):
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... APP_URL=https://daraja.example npm run bot:webhook
 * Qiladi: webhook -> APP_URL/api/bot, chat menyu tugmasi -> APP_URL/exam, /start va /help buyruqlari.
 * `npm run bot:webhook -- --delete` webhook'ni o'chiradi.
 */
import { Api } from "grammy";
import { appUrlFromEnv } from "../src/bot/bot";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  const api = new Api(token);

  if (process.argv.includes("--delete")) {
    await api.deleteWebhook();
    console.log("Webhook o'chirildi.");
    return;
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET 16–256 belgi (A-Z, a-z, 0-9, _ -) bo'lishi kerak. Masalan: openssl rand -hex 32");
  }
  const appUrl = appUrlFromEnv();
  if (!appUrl?.startsWith("https://")) throw new Error("APP_URL https:// manzil bo'lishi kerak");

  const me = await api.getMe();
  await api.setWebhook(`${appUrl}/api/bot`, {
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
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
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
