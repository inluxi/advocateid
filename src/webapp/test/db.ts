import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { setDb, schema, type Db } from "@/db/client";

/** In-process Postgres (PGlite) with the real migrations applied. Replaces the app database for tests. */
export async function useTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "db/migrations") });
  const typed = db as unknown as Db;
  setDb(typed);
  return typed;
}
