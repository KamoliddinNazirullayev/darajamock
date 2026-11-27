import { beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { invites } from "@/db/schema";
import type { Db } from "./attempts";
import {
  accessMode, adminIds, createInvite, disableInvite, generateCode, hasAccess, listInvites, normalizeCode, redeemInvite,
} from "./access";

let db: Db;
beforeEach(async () => {
  db = drizzle(new PGlite()) as unknown as Db;
  await migrate(db as never, { migrationsFolder: path.join(__dirname, "../../drizzle") });
});

const INVITE = {} as Record<string, string | undefined>;

describe("yordamchi funksiyalar", () => {
  it("accessMode sukut bo'yicha invite", () => {
    expect(accessMode({})).toBe("invite");
    expect(accessMode({ ACCESS_MODE: "open" })).toBe("open");
    expect(accessMode({ ACCESS_MODE: "boshqa" })).toBe("invite");
  });

  it("adminIds vergul va bo'shliqni tushunadi, yaroqsizini tashlaydi", () => {
    expect([...adminIds({ ADMIN_TELEGRAM_IDS: "1, 2 x 3" })]).toEqual([1, 2, 3]);
    expect(adminIds({}).size).toBe(0);
  });

  it("normalizeCode", () => {
    expect(normalizeCode(" drj-ab12 ")).toBe("DRJ-AB12");
    expect(normalizeCode("ab")).toBeNull();
    expect(normalizeCode("a b c d")).toBeNull();
  });

  it("generateCode chalkash belgilarni ishlatmaydi", () => {
    for (let i = 0; i < 200; i++) expect(generateCode("DRJ")).toMatch(/^DRJ-[A-HJKMNP-Z2-9]{6}$/);
  });
});

describe("taklif kodlari", () => {
  it("kod ishlatilgach kirish ochiladi, qayta ishlatish joy egallamaydi", async () => {
    const inv = await createInvite(db, { maxUses: 2, note: "11-A" });
    expect(await hasAccess(db, { id: 1 }, INVITE)).toBe(false);
    expect(await redeemInvite(db, { id: 1 }, inv.code)).toBe("granted");
    expect(await hasAccess(db, { id: 1 }, INVITE)).toBe(true);
    expect(await redeemInvite(db, { id: 1 }, inv.code)).toBe("already");
    const [row] = await db.select().from(invites).where(eq(invites.code, inv.code));
    expect(row.usedCount).toBe(1);
  });

  it("joylar tugagach kod rad etiladi", async () => {
    const inv = await createInvite(db, { maxUses: 1 });
    expect(await redeemInvite(db, { id: 1 }, inv.code)).toBe("granted");
    expect(await redeemInvite(db, { id: 2 }, inv.code)).toBe("invalid");
    expect(await hasAccess(db, { id: 2 }, INVITE)).toBe(false);
  });

  it("bir vaqtda ko'p so'rov kelsa ham limitdan oshmaydi", async () => {
    const inv = await createInvite(db, { maxUses: 3 });
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => redeemInvite(db, { id: 100 + i }, inv.code)));
    expect(results.filter((r) => r === "granted")).toHaveLength(3);
    const [row] = await db.select().from(invites).where(eq(invites.code, inv.code));
    expect(row.usedCount).toBe(3);
  });

  it("o'chirilgan va mavjud bo'lmagan kodlar rad etiladi", async () => {
    const inv = await createInvite(db, { maxUses: 5 });
    expect(await disableInvite(db, inv.code.toLowerCase())).toBe(true);
    expect(await redeemInvite(db, { id: 1 }, inv.code)).toBe("invalid");
    expect(await redeemInvite(db, { id: 1 }, "YOQ-KOD1")).toBe("invalid");
    expect(await redeemInvite(db, { id: 1 }, "!!")).toBe("invalid");
    expect(await disableInvite(db, "YOQ-KOD1")).toBe(false);
  });

  it("open rejimi va adminlar kodsiz kiradi", async () => {
    expect(await hasAccess(db, { id: 5 }, { ACCESS_MODE: "open" })).toBe(true);
    expect(await hasAccess(db, { id: 5 }, { ADMIN_TELEGRAM_IDS: "5" })).toBe(true);
    expect(await hasAccess(db, { id: 6 }, { ADMIN_TELEGRAM_IDS: "5" })).toBe(false);
  });

  it("listInvites eng yangilarini qaytaradi; maxUses chegaralari", async () => {
    await createInvite(db, { maxUses: 1, note: "a" });
    await createInvite(db, { maxUses: 2, note: "b" });
    expect((await listInvites(db)).map((r) => r.note).sort()).toEqual(["a", "b"]);
    await expect(createInvite(db, { maxUses: 0 })).rejects.toThrow();
    await expect(createInvite(db, { maxUses: 1001 })).rejects.toThrow();
  });
});
