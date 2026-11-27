import { beforeEach, describe, expect, it, vi } from "vitest";
import { appUrlFromEnv, createBot, TEXTS, type AccessPort } from "./bot";
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

describe("bot: yopiq pilot (taklif kodlari)", () => {
  const ADMIN = 900;
  function setupWithAccess() {
    const granted = new Set<number>();
    const codes = new Map<string, number>([["DRJ-AAAA22", 1]]); // kod -> qolgan joy
    const created: Array<{ adminId: number; maxUses: number; note: string | null }> = [];
    const access: AccessPort = {
      has: async (u) => granted.has(u.id) || u.id === ADMIN,
      redeem: async (u, code) => {
        if (granted.has(u.id)) return "already";
        const left = codes.get(code.toUpperCase());
        if (!left) return "invalid";
        codes.set(code.toUpperCase(), left - 1);
        granted.add(u.id);
        return "granted";
      },
      isAdmin: (id) => id === ADMIN,
      createInvite: async (adminId, maxUses, note) => {
        created.push({ adminId, maxUses, note });
        return { code: "DRJ-NEW222", maxUses, usedCount: 0, disabled: false, note };
      },
      listInvites: async () => [
        { code: "DRJ-AAAA22", maxUses: 30, usedCount: 4, disabled: false, note: "11-A" },
        { code: "DRJ-OFF222", maxUses: 5, usedCount: 5, disabled: true, note: null },
      ],
      disableInvite: async (code) => code.toUpperCase() === "DRJ-AAAA22",
    };
    const bot = createBot({ token: "123:TEST", webAppUrl: URL, access, botInfo: BOT_INFO as never });
    const calls: Call[] = [];
    bot.api.config.use(async (_prev, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: { message_id: 1, date: 0, chat: { id: 1, type: "private" } } } as never;
    });
    const send = (text: string, fromId = 7) => {
      const u = messageUpdate(text) as any;
      u.message.from.id = fromId;
      u.message.chat.id = fromId;
      return bot.handleUpdate(u);
    };
    return { bot, calls, send, created, granted };
  }

  const hasButton = (c: Call) => !!c.payload.reply_markup?.inline_keyboard;

  it("kodsiz /start yopiq xabarini beradi, tugmasiz", async () => {
    const t = setupWithAccess();
    await t.send("/start");
    expect(t.calls[0].payload.text).toBe(TEXTS.closed);
    expect(hasButton(t.calls[0])).toBe(false);
  });

  it("/start KOD (deep link) kirishni ochadi va tugma beradi", async () => {
    const t = setupWithAccess();
    await t.send("/start DRJ-AAAA22");
    expect(t.calls[0].payload.text).toContain(TEXTS.granted);
    expect(webAppUrlOf(t.calls[0])).toBe(URL);
    await t.send("/start");
    expect(t.calls[1].payload.text).toBe(TEXTS.start);
  });

  it("kodni oddiy xabar sifatida yuborish ham ishlaydi (kichik harf bilan)", async () => {
    const t = setupWithAccess();
    await t.send("drj-aaaa22");
    expect(t.calls[0].payload.text).toContain(TEXTS.granted);
  });

  it("noto'g'ri kod va oddiy so'z", async () => {
    const t = setupWithAccess();
    await t.send("/start DRJ-XXXX99");
    expect(t.calls[0].payload.text).toBe(TEXTS.invalid);
    expect(hasButton(t.calls[0])).toBe(false);
    await t.send("salom"); // kodga o'xshamaydi: redeem chaqirilmaydi
    expect(t.calls[1].payload.text).toBe(TEXTS.closed);
  });

  it("/help kirishsiz yopiq xabari", async () => {
    const t = setupWithAccess();
    await t.send("/help");
    expect(t.calls[0].payload.text).toBe(TEXTS.closed);
  });

  it("/id hammaga ID ni aytadi", async () => {
    const t = setupWithAccess();
    await t.send("/id", 12345);
    expect(t.calls[0].payload.text).toContain("12345");
  });

  it("admin /invite joylar soni va izoh bilan kod yaratadi va deep link beradi", async () => {
    const t = setupWithAccess();
    await t.send("/invite 30 11-A sinf", ADMIN);
    expect(t.created).toEqual([{ adminId: ADMIN, maxUses: 30, note: "11-A sinf" }]);
    expect(t.calls[0].payload.text).toContain("https://t.me/daraja_bot?start=DRJ-NEW222");
    await t.send("/invite", ADMIN);
    expect(t.created[1]).toEqual({ adminId: ADMIN, maxUses: 1, note: null });
    await t.send("/invite guruh", ADMIN);
    expect(t.created[2]).toEqual({ adminId: ADMIN, maxUses: 1, note: "guruh" });
  });

  it("admin /invites va /disable", async () => {
    const t = setupWithAccess();
    await t.send("/invites", ADMIN);
    expect(t.calls[0].payload.text).toContain("DRJ-AAAA22 — 4/30 — 11-A");
    expect(t.calls[0].payload.text).toContain("⛔ DRJ-OFF222");
    await t.send("/disable drj-aaaa22", ADMIN);
    expect(t.calls[1].payload.text).toContain("o'chirildi");
  });

  it("admin bo'lmagan /invite ishlata olmaydi", async () => {
    const t = setupWithAccess();
    await t.send("/invite 100");
    expect(t.created).toHaveLength(0);
    expect(t.calls[0].payload.text).toBe(TEXTS.closed);
  });
});
