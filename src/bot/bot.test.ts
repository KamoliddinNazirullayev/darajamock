import { beforeEach, describe, expect, it, vi } from "vitest";
import { appUrlFromEnv, createBot, TEXTS } from "./bot";
import { messageUpdate } from "./test-utils";

const BOT_INFO = {
  id: 42, is_bot: true as const, first_name: "Daraja", username: "daraja_bot",
  can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false,
  can_connect_to_business: false, has_main_web_app: false,
};
const URL = "https://daraja.example/exam";

type Call = { method: string; payload: any };

/** Telegram API'ga hech narsa yubormasdan chaqiruvlarni yozib oladi. */
function setup() {
  const bot = createBot({ token: "123:TEST", webAppUrl: URL, botInfo: BOT_INFO as never });
  const calls: Call[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload });
    return { ok: true, result: { message_id: 1, date: 0, chat: { id: 1, type: "private" } } } as never;
  });
  return { bot, calls };
}

const webAppUrlOf = (c: Call) => c.payload.reply_markup.inline_keyboard[0][0].web_app.url;

describe("bot", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => { ctx = setup(); });

  it("/start salomlashadi va Mini App tugmasini beradi", async () => {
    await ctx.bot.handleUpdate(messageUpdate("/start"));
    expect(ctx.calls).toHaveLength(1);
    expect(ctx.calls[0].method).toBe("sendMessage");
    expect(ctx.calls[0].payload.text).toBe(TEXTS.start);
    expect(ctx.calls[0].payload.text).toContain("taxminiy");
    expect(webAppUrlOf(ctx.calls[0])).toBe(URL);
  });

  it("/help va oddiy xabar ham tugma bilan javob oladi", async () => {
    await ctx.bot.handleUpdate(messageUpdate("/help"));
    await ctx.bot.handleUpdate(messageUpdate("salom"));
    expect(ctx.calls.map((c) => c.payload.text)).toEqual([TEXTS.help, TEXTS.fallback]);
    expect(ctx.calls.every((c) => webAppUrlOf(c) === URL)).toBe(true);
  });

  it("guruhdagi xabarlarga javob bermaydi (web_app tugmasi u yerda ishlamaydi)", async () => {
    await ctx.bot.handleUpdate(messageUpdate("/start", "group"));
    expect(ctx.calls).toHaveLength(0);
  });

  it("https bo'lmagan manzilni rad etadi", () => {
    expect(() => createBot({ token: "1:T", webAppUrl: "http://x/exam", botInfo: BOT_INFO as never })).toThrow(/https/);
  });

  it("API xatosi update ishlovini yiqitmaydi", async () => {
    const bot = createBot({ token: "1:T", webAppUrl: URL, botInfo: BOT_INFO as never });
    bot.api.config.use(async () => { throw new Error("tarmoq"); });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(bot.handleUpdate(messageUpdate("/start"))).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("appUrlFromEnv", () => {
  it("APP_URL ni oladi va oxiridagi / ni olib tashlaydi", () => {
    expect(appUrlFromEnv({ APP_URL: "https://a.example/" })).toBe("https://a.example");
  });
  it("Vercel production domeniga qaytadi", () => {
    expect(appUrlFromEnv({ VERCEL_PROJECT_PRODUCTION_URL: "daraja.vercel.app" })).toBe("https://daraja.vercel.app");
  });
  it("hech biri bo'lmasa null", () => {
    expect(appUrlFromEnv({})).toBeNull();
  });
});
