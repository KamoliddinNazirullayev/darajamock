import { Bot, InlineKeyboard } from "grammy";
import type { BotFullInfo } from "grammy/types";

/**
 * Telegram bot: faqat Mini App ga kirish eshigi. Imtihon mantig'i botda emas, /exam sahifasida.
 * web_app tugmalari faqat shaxsiy chatda ishlaydi, shuning uchun guruhlardagi xabarlar e'tiborsiz qoldiriladi.
 */
export type BotConfig = {
  token: string;
  /** Mini App manzili, masalan https://daraja.example/exam (faqat https) */
  webAppUrl: string;
  /** Testlar uchun: berilsa, getMe so'rovi yuborilmaydi */
  botInfo?: BotFullInfo;
};

export const TEXTS = {
  start:
    "Assalomu alaykum! DARAJA — tarix fanidan milliy sertifikat mock imtihoni.\n\n" +
    "• 45 ta topshiriq, 90 daqiqa\n" +
    "• Javoblar avtomatik saqlanadi, chiqib ketsangiz davom ettirasiz\n" +
    "• Natija taxminiy (rasmiy Rasch hisobi emas)\n\n" +
    "Boshlash uchun pastdagi tugmani bosing.",
  help:
    "Imtihonni ochish uchun pastdagi «Imtihonni ochish» tugmasini yoki chat pastidagi menyu tugmasini bosing.\n" +
    "Vaqt serverda hisoblanadi: ilovani yopsangiz ham taymer to'xtamaydi.",
  fallback: "Imtihonni ochish uchun pastdagi tugmani bosing.",
  button: "Imtihonni ochish",
} as const;

export function createBot({ token, webAppUrl, botInfo }: BotConfig) {
  if (!/^https:\/\//.test(webAppUrl)) throw new Error("Mini App manzili https:// bilan boshlanishi kerak");

  const bot = new Bot(token, botInfo ? { botInfo } : undefined);
  const keyboard = () => new InlineKeyboard().webApp(TEXTS.button, webAppUrl);
  // Webhook rejimida bot.catch ishlamaydi: xato tashqariga chiqsa route 500 qaytaradi va Telegram
  // o'sha update'ni qayta-qayta yuboradi. errorBoundary xatoni shu yerda yozib, 200 qaytarishga imkon beradi.
  const pm = bot.errorBoundary((err) => console.error("Bot xatosi:", err.error)).chatType("private");

  pm.command("start", (ctx) => ctx.reply(TEXTS.start, { reply_markup: keyboard() }));
  pm.command("help", (ctx) => ctx.reply(TEXTS.help, { reply_markup: keyboard() }));
  pm.on("message", (ctx) => ctx.reply(TEXTS.fallback, { reply_markup: keyboard() }));
  return bot;
}

/** APP_URL (yoki Vercel'da VERCEL_PROJECT_PRODUCTION_URL) dan ilova manzilini oladi, oxiridagi / siz. */
export function appUrlFromEnv(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.APP_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return raw ? raw.replace(/\/+$/, "") : null;
}
