import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
  language_code?: string;
};

/**
 * Telegram Mini App `initData` ni tekshiradi:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * secret = HMAC_SHA256(key="WebAppData", msg=botToken); hash = HMAC_SHA256(key=secret, msg=data_check_string)
 */
export function verifyInitData(
  initData: string,
  botToken: string,
  opts: { maxAgeSec?: number; now?: number } = {},
): TelegramUser | null {
  const { maxAgeSec = 24 * 3600, now = Math.floor(Date.now() / 1000) } = opts;
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || now - authDate > maxAgeSec || authDate - now > 60) return null;

  try {
    const user = JSON.parse(params.get("user") ?? "null") as TelegramUser | null;
    return user && typeof user.id === "number" ? user : null;
  } catch {
    return null;
  }
}

/** Test va lokal ishlab chiqish uchun imzolangan initData yasaydi. */
export function signInitData(user: TelegramUser, botToken: string, authDate = Math.floor(Date.now() / 1000)): string {
  const params = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify(user), query_id: "test" });
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  params.set("hash", createHmac("sha256", secret).update(dataCheckString).digest("hex"));
  return params.toString();
}
