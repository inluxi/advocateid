import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

// Reuse a single client across hot-reloads in dev so we don't exhaust the
// MySQL connection pool.
export const db = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

/** Every model in this app is soft-deleted — pass this to `where` on every read. */
export const notDeleted = { deletedAt: null } as const;
