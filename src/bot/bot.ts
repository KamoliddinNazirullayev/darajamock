import { Bot, InlineKeyboard, type Context } from "grammy";
import type { BotFullInfo } from "grammy/types";

/**
 * Telegram bot: Mini App ga kirish eshigi va yopiq pilot uchun taklif kodlari.
 * Imtihon mantig'i botda emas, /exam sahifasida.
 * web_app tugmalari faqat shaxsiy chatda ishlaydi, shuning uchun guruhlardagi xabarlar e'tiborsiz qoldiriladi.
 */

type TgUser = { id: number; username?: string; first_name?: string };
type InviteRow = { code: string; maxUses: number; usedCount: number; disabled: boolean; note: string | null };

/** Ruxsat bilan ishlash (bazaga bog'liq qism tashqaridan beriladi). Berilmasa bot hamma uchun ochiq. */
export type AccessPort = {
  has(user: TgUser): Promise<boolean>;
  redeem(user: TgUser, code: string): Promise<"granted" | "already" | "invalid">;
  isAdmin(telegramId: number): boolean;
  createInvite(adminId: number, maxUses: number, note: string | null): Promise<InviteRow>;
  listInvites(): Promise<InviteRow[]>;
  disableInvite(code: string): Promise<boolean>;
};

export type BotConfig = {
  token: string;
  /** Mini App manzili, masalan https://daraja.example/exam (faqat https) */
  webAppUrl: string;
  access?: AccessPort;
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
  closed:
    "DARAJA hozir yopiq pilot rejimida.\n\n" +
    "Kirish uchun sizga berilgan taklif havolasini oching yoki taklif kodini shu yerga yuboring (masalan: DRJ-7K3Q9X).",
  granted: "✅ Taklif kodi qabul qilindi, sizga kirish ochildi.",
  invalid: "Bu taklif kodi topilmadi, o'chirilgan yoki joylar tugagan. Kodni tekshirib, qayta yuboring.",
} as const;

/** Oddiy xabar taklif kodiga o'xshaydimi (oddiy so'zlarni kod deb hisoblamaslik uchun raqam yoki "-" shart). */
const looksLikeCode = (s: string) => /^(?=.*[0-9-])[A-Za-z0-9-]{4,32}$/.test(s.trim());

export function createBot({ token, webAppUrl, access, botInfo }: BotConfig) {
  if (!/^https:\/\//.test(webAppUrl)) throw new Error("Mini App manzili https:// bilan boshlanishi kerak");

  const bot = new Bot(token, botInfo ? { botInfo } : undefined);
  const keyboard = () => new InlineKeyboard().webApp(TEXTS.button, webAppUrl);
  const has = (u: TgUser) => (access ? access.has(u) : Promise.resolve(true));

  /** Kodni ishlatib, natijaga qarab javob beradi. */
  async function redeemAndReply(ctx: Context & { from: TgUser }, code: string) {
    const result = access ? await access.redeem(ctx.from, code) : "already";
    if (result === "invalid") {
      return (await has(ctx.from))
        ? ctx.reply(`${TEXTS.invalid}\n\nSizda kirish allaqachon bor.`, { reply_markup: keyboard() })
        : ctx.reply(TEXTS.invalid);
    }
    const text = result === "granted" ? `${TEXTS.granted}\n\n${TEXTS.start}` : TEXTS.start;
    return ctx.reply(text, { reply_markup: keyboard() });
  }

  // Webhook rejimida bot.catch ishlamaydi: xato tashqariga chiqsa route 500 qaytaradi va Telegram
  // o'sha update'ni qayta-qayta yuboradi. errorBoundary xatoni shu yerda yozib, 200 qaytarishga imkon beradi.
  const pm = bot.errorBoundary((err) => console.error("Bot xatosi:", err.error)).chatType("private");

  pm.command("start", async (ctx) => {
    const payload = ctx.match.trim(); // t.me/<bot>?start=KOD
    if (payload) return redeemAndReply(ctx, payload);
    if (await has(ctx.from)) return ctx.reply(TEXTS.start, { reply_markup: keyboard() });
    return ctx.reply(TEXTS.closed);
  });

  pm.command("help", async (ctx) =>
    (await has(ctx.from)) ? ctx.reply(TEXTS.help, { reply_markup: keyboard() }) : ctx.reply(TEXTS.closed),
  );

  // ADMIN_TELEGRAM_IDS ga qo'shish uchun o'z ID'ingizni bilish
  pm.command("id", (ctx) => ctx.reply(`Sizning Telegram ID: ${ctx.from.id}`));

  if (access) {
    const admin = pm.filter((ctx) => access.isAdmin(ctx.from.id));

    // /invite [joylar soni] [izoh]  →  /invite 30 11-A sinf
    admin.command("invite", async (ctx) => {
      const [first, ...rest] = ctx.match.trim().split(/\s+/).filter(Boolean);
      const maxUses = first && /^\d+$/.test(first) ? Number(first) : 1;
      const note = (first && !/^\d+$/.test(first) ? [first, ...rest] : rest).join(" ") || null;
      if (maxUses < 1 || maxUses > 1000) return ctx.reply("Joylar soni 1 dan 1000 gacha bo'lishi kerak.");
      const inv = await access.createInvite(ctx.from.id, maxUses, note);
      const link = `https://t.me/${ctx.me.username}?start=${inv.code}`;
      return ctx.reply(
        `Yangi taklif kodi: ${inv.code}\nJoylar: ${inv.maxUses}${inv.note ? `\nIzoh: ${inv.note}` : ""}\n\nHavola (shuni yuboring):\n${link}`,
        { link_preview_options: { is_disabled: true } },
      );
    });

    admin.command("invites", async (ctx) => {
      const rows = await access.listInvites();
      if (!rows.length) return ctx.reply("Hali taklif kodlari yo'q. Yaratish: /invite 30 izoh");
      const lines = rows.map((r) => `${r.disabled ? "⛔" : "•"} ${r.code} — ${r.usedCount}/${r.maxUses}${r.note ? ` — ${r.note}` : ""}`);
      return ctx.reply(`Oxirgi taklif kodlari:\n${lines.join("\n")}`);
    });

    admin.command("disable", async (ctx) => {
      const code = ctx.match.trim();
      if (!code) return ctx.reply("Foydalanish: /disable KOD");
      return ctx.reply((await access.disableInvite(code)) ? `${code.toUpperCase()} o'chirildi.` : "Bunday kod topilmadi.");
    });
  }

  pm.on("message", async (ctx) => {
    if (await has(ctx.from)) return ctx.reply(TEXTS.fallback, { reply_markup: keyboard() });
    const text = ctx.message.text ?? "";
    if (looksLikeCode(text)) return redeemAndReply(ctx, text.trim());
    return ctx.reply(TEXTS.closed);
  });

  return bot;
}

/** APP_URL (yoki Vercel'da VERCEL_PROJECT_PRODUCTION_URL) dan ilova manzilini oladi, oxiridagi / siz. */
export function appUrlFromEnv(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.APP_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return raw ? raw.replace(/\/+$/, "") : null;
}
