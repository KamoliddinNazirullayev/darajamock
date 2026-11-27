import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { prepareExam } from "@/lib/exam-import";
import { importExam } from "@/db/import";
import { signInitData } from "@/lib/telegram";
import type { Db } from "@/server/attempts";
import { createInvite, redeemInvite } from "@/server/access";

let db: Db;
vi.mock("@/db/client", () => ({ getDb: () => db }));

const TOKEN = "123456:TEST";
process.env.TELEGRAM_BOT_TOKEN = TOKEN;
const auth = (id: number) => ({ authorization: `tma ${signInitData({ id, first_name: "T" }, TOKEN)}`, "content-type": "application/json" });

beforeAll(async () => {
  db = drizzle(new PGlite()) as unknown as Db;
  await migrate(db as never, { migrationsFolder: path.join(__dirname, "../../../drizzle") });
  const json = JSON.parse(readFileSync(path.join(__dirname, "../../../data/exams/v07.json"), "utf-8"));
  await importExam(db, prepareExam(json));
  // yopiq pilot: test foydalanuvchilariga taklif kodi orqali kirish beramiz
  const inv = await createInvite(db, { maxUses: 10 });
  for (const id of [555, 777]) await redeemInvite(db, { id, first_name: "T" }, inv.code);
});

describe("HTTP API (to'liq oqim)", () => {
  it("avtorizatsiyasiz so'rov 401 qaytaradi", async () => {
    const { POST } = await import("./attempts/route");
    const res = await POST(new Request("http://x/api/attempts", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });

  it("taklif kodisiz foydalanuvchi 403 oladi, kod bilan kiradi", async () => {
    const { POST } = await import("./attempts/route");
    const req = () => new Request("http://x/api/attempts", { method: "POST", headers: auth(999), body: "{}" });
    const denied = await POST(req());
    expect(denied.status).toBe(403);
    expect((await denied.json()).error).toContain("yopiq pilot");

    const inv = await createInvite(db, { maxUses: 1 });
    expect(await redeemInvite(db, { id: 999 }, inv.code.toLowerCase())).toBe("granted");
    expect((await POST(req())).status).toBe(200);
  });

  it("ADMIN_TELEGRAM_IDS dagi foydalanuvchi kodsiz kiradi", async () => {
    const { POST } = await import("./attempts/route");
    process.env.ADMIN_TELEGRAM_IDS = "4242";
    try {
      const res = await POST(new Request("http://x/api/attempts", { method: "POST", headers: auth(4242), body: "{}" }));
      expect(res.status).toBe(200);
    } finally {
      delete process.env.ADMIN_TELEGRAM_IDS;
    }
  });

  it("boshlash -> javob -> tugatish -> natija", async () => {
    const { POST: start } = await import("./attempts/route");
    const { GET: state } = await import("./attempts/[id]/route");
    const { PUT: answer } = await import("./attempts/[id]/answer/route");
    const { POST: submit } = await import("./attempts/[id]/submit/route");
    const { GET: result } = await import("./attempts/[id]/result/route");
    const h = auth(555);

    const s = await (await start(new Request("http://x", { method: "POST", headers: h, body: JSON.stringify({ variantId: "v07" }) }))).json();
    expect(s.resumed).toBe(false);
    const ctx = { params: Promise.resolve({ id: String(s.attemptId) }) };

    const st = await (await state(new Request("http://x", { headers: h }), ctx)).json();
    expect(st.questions).toHaveLength(43);
    expect(JSON.stringify(st)).not.toContain('"correct"');

    const put = (key: unknown, value: unknown) => answer(new Request("http://x", { method: "PUT", headers: h, body: JSON.stringify({ key, value }) }), ctx);
    expect((await put("4", "C")).status).toBe(200);
    expect((await put("4", "Z")).status).toBe(400);
    expect((await put(4, "C")).status).toBe(400);

    expect((await result(new Request("http://x", { headers: h }), ctx)).status).toBe(409);
    const done = await (await submit(new Request("http://x", { method: "POST", headers: h }), ctx)).json();
    expect(done.rawScore).toBe(3.2);

    // boshqa foydalanuvchi ko'ra olmaydi
    const other = await state(new Request("http://x", { headers: auth(777) }), ctx);
    expect(other.status).toBe(404);
  });
});
