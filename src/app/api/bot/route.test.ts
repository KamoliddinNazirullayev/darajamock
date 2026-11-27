import { beforeAll, describe, expect, it, vi } from "vitest";
import { messageUpdate } from "@/bot/test-utils";
import { getBot } from "@/bot/instance";
import { POST } from "./route";

const SECRET = "test_secret_0123456789";
const calls: string[] = [];
let failNext = false;

beforeAll(() => {
  process.env.TELEGRAM_BOT_TOKEN = "123:TEST";
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  process.env.APP_URL = "https://daraja.example";
  process.env.ACCESS_MODE = "open"; // bu test faqat webhook qatlamini tekshiradi; ruxsat oqimi bot.test.ts da
  // Telegram API o'rniga: getMe va sendMessage ni soxtalashtiramiz
  getBot().api.config.use(async (_prev, method) => {
    if (failNext && method === "sendMessage") { failNext = false; throw new Error("tarmoq"); }
    calls.push(method);
    const result = method === "getMe"
      ? { id: 42, is_bot: true, first_name: "Daraja", username: "daraja_bot" }
      : { message_id: 1, date: 0, chat: { id: 7, type: "private" } };
    return { ok: true, result } as never;
  });
});

const post = (body: unknown, secret?: string) =>
  POST(new Request("http://x/api/bot", {
    method: "POST",
    headers: { "content-type": "application/json", ...(secret ? { "x-telegram-bot-api-secret-token": secret } : {}) },
    body: JSON.stringify(body),
  }));

describe("POST /api/bot (webhook)", () => {
  it("maxfiy kalitsiz so'rovni 401 bilan rad etadi", async () => {
    const res = await post(messageUpdate("/start"));
    expect(res.status).toBe(401);
    expect(calls).not.toContain("sendMessage"); // getMe (bot.init) bo'lishi mumkin, javob yuborilmaydi
  });

  it("noto'g'ri maxfiy kalitni rad etadi", async () => {
    const res = await post(messageUpdate("/start"), "wrong_secret_000000000");
    expect(res.status).toBe(401);
    expect(calls).not.toContain("sendMessage");
  });

  it("Telegram API xatosida ham 200 qaytaradi (qayta yuborish bo'lmasin)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    failNext = true;
    const res = await post(messageUpdate("/start"), SECRET);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("to'g'ri kalit bilan /start ga javob yuboradi", async () => {
    const res = await post(messageUpdate("/start"), SECRET);
    expect(res.status).toBe(200);
    expect(calls).toContain("sendMessage");
  });
});
