import { randomInt } from "node:crypto";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { invites, users } from "@/db/schema";
import { upsertUser, type Db } from "./attempts";

/**
 * Yopiq pilot: ACCESS_MODE=invite (sukut) — faqat taklif kodi bilan kirgan yoki admin foydalanuvchilar.
 * ACCESS_MODE=open — hamma uchun ochiq (mualliflar ruxsatisiz ishlatmang, CLAUDE.md 5-qoida).
 */
export type AccessMode = "invite" | "open";
export function accessMode(env: Record<string, string | undefined> = process.env): AccessMode {
  return env.ACCESS_MODE === "open" ? "open" : "invite";
}

/** ADMIN_TELEGRAM_IDS="123,456" */
export function adminIds(env: Record<string, string | undefined> = process.env): Set<number> {
  return new Set((env.ADMIN_TELEGRAM_IDS ?? "").split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isSafeInteger));
}

type TgUser = { id: number; username?: string; first_name?: string };

/** Kodni bir xil ko'rinishga keltiradi: " pilot-ab12 " -> "PILOT-AB12". Yaroqsiz bo'lsa null. */
export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{4,32}$/.test(code) ? code : null;
}

// Chalkash belgilarsiz (0/O, 1/I/L): odam qo'lda yozganda adashmasin
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generateCode(prefix = "", length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return prefix ? `${prefix}-${s}` : s;
}

export async function createInvite(db: Db, opts: { maxUses: number; note?: string | null; createdBy?: number }) {
  if (!Number.isInteger(opts.maxUses) || opts.maxUses < 1 || opts.maxUses > 1000) throw new Error("maxUses 1..1000 bo'lishi kerak");
  for (let i = 0; i < 5; i++) {
    const code = generateCode("DRJ");
    const rows = await db
      .insert(invites)
      .values({ code, maxUses: opts.maxUses, note: opts.note ?? null, createdBy: opts.createdBy ?? null })
      .onConflictDoNothing()
      .returning();
    if (rows.length) return rows[0];
  }
  throw new Error("Kod yaratib bo'lmadi");
}

export async function listInvites(db: Db, limit = 20) {
  return db.select().from(invites).orderBy(desc(invites.createdAt)).limit(limit);
}

export async function disableInvite(db: Db, rawCode: string) {
  const code = normalizeCode(rawCode);
  if (!code) return false;
  const rows = await db.update(invites).set({ disabled: true }).where(eq(invites.code, code)).returning();
  return rows.length > 0;
}

export async function hasAccess(db: Db, tg: TgUser, env: Record<string, string | undefined> = process.env): Promise<boolean> {
  if (accessMode(env) === "open" || adminIds(env).has(tg.id)) return true;
  const [u] = await db.select({ at: users.accessGrantedAt }).from(users).where(eq(users.telegramId, tg.id));
  return !!u?.at;
}

export type RedeemResult = "granted" | "already" | "invalid";

/**
 * Taklif kodini ishlatadi. Bitta foydalanuvchi faqat bir marta joy egallaydi;
 * used_count < max_uses sharti UPDATE ichida: bir vaqtda ko'p odam bossa ham limitdan oshmaydi.
 */
export async function redeemInvite(db: Db, tg: TgUser, rawCode: string, now = new Date()): Promise<RedeemResult> {
  const user = await upsertUser(db, tg);
  if (user.accessGrantedAt) return "already";
  const code = normalizeCode(rawCode);
  if (!code) return "invalid";

  return db.transaction(async (tx) => {
    const taken = await tx
      .update(invites)
      .set({ usedCount: sql`${invites.usedCount} + 1` })
      .where(and(eq(invites.code, code), eq(invites.disabled, false), lt(invites.usedCount, invites.maxUses)))
      .returning({ code: invites.code });
    if (!taken.length) return "invalid";
    await tx.update(users).set({ accessGrantedAt: now, inviteCode: code }).where(eq(users.id, user.id));
    return "granted";
  });
}
