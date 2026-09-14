import path from "node:path";
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the connection URL out of schema.prisma. `datasource.url`
// here is used by CLI commands (db push / studio / migrate); the app's own
// PrismaClient (lib/db.ts) separately builds a driver adapter from the same
// DATABASE_URL env var, since PrismaClient itself always requires an adapter now.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
});
