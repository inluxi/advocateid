import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  await migrate(drizzle(pool), { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
  await pool.end();
  console.log("migrations applied");
}

main().catch((e) => {
  console.error("migration failed:", e instanceof Error ? e.message : "unknown error");
  process.exit(1);
});
