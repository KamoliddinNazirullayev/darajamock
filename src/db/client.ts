import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Db } from "@/server/attempts";

let cached: Db | null = null;

/** Serverless muhitda ulanishni qayta ishlatadi; DATABASE_URL faqat birinchi so'rovda kerak. */
export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL o'rnatilmagan");
  cached = drizzle(postgres(url, { max: 3, prepare: false })) as unknown as Db;
  return cached;
}
