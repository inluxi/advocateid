import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __advocateidDb?: Db; __advocateidPool?: Pool };

/** Lazily-created singleton. Tests replace it with `setDb` (PGlite). */
export function getDb(): Db {
  if (!g.__advocateidDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
    g.__advocateidPool = pool;
    g.__advocateidDb = drizzle(pool, { schema }) as unknown as Db;
  }
  return g.__advocateidDb;
}

export function setDb(db: Db | undefined) {
  g.__advocateidDb = db;
}

export { schema };
