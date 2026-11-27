import { describe, expect, it } from "vitest";
import { webhookSecret } from "./secret";

describe("webhookSecret", () => {
  it("TELEGRAM_WEBHOOK_SECRET berilsa o'shani qaytaradi", () => {
    expect(webhookSecret({ TELEGRAM_WEBHOOK_SECRET: "abc_123", TELEGRAM_BOT_TOKEN: "1:T" })).toBe("abc_123");
  });

  it("aks holda tokendan barqaror, Telegram qabul qiladigan kalit hosil qiladi", () => {
    const a = webhookSecret({ TELEGRAM_BOT_TOKEN: "1:T" });
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(webhookSecret({ TELEGRAM_BOT_TOKEN: "1:T" })).toBe(a);
    expect(webhookSecret({ TELEGRAM_BOT_TOKEN: "2:T" })).not.toBe(a);
    expect(a).not.toContain("1:T");
  });

  it("token ham, kalit ham bo'lmasa null", () => {
    expect(webhookSecret({})).toBeNull();
  });
});
