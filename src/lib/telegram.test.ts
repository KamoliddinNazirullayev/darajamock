import { describe, expect, it } from "vitest";
import { signInitData, verifyInitData } from "./telegram";

const TOKEN = "123456:TEST-TOKEN";
const user = { id: 42, first_name: "Ali", username: "ali" };

describe("verifyInitData", () => {
  it("to'g'ri imzo qabul qilinadi", () => {
    const data = signInitData(user, TOKEN);
    expect(verifyInitData(data, TOKEN)?.id).toBe(42);
  });

  it("boshqa token bilan rad etiladi", () => {
    expect(verifyInitData(signInitData(user, TOKEN), "999:OTHER")).toBeNull();
  });

  it("o'zgartirilgan ma'lumot rad etiladi", () => {
    const data = signInitData(user, TOKEN).replace("%22id%22%3A42", "%22id%22%3A43");
    expect(verifyInitData(data, TOKEN)).toBeNull();
  });

  it("eskirgan auth_date rad etiladi", () => {
    const old = Math.floor(Date.now() / 1000) - 3 * 24 * 3600;
    expect(verifyInitData(signInitData(user, TOKEN, old), TOKEN)).toBeNull();
  });

  it("hash yo'q yoki bo'sh kiritish rad etiladi", () => {
    expect(verifyInitData("", TOKEN)).toBeNull();
    expect(verifyInitData("auth_date=1&user=%7B%7D", TOKEN)).toBeNull();
  });
});
