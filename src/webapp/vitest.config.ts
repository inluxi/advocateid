import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { environment: "node", include: ["{app,components,db,jobs,lib,messages,repo,test}/**/*.test.ts"], testTimeout: 30000, hookTimeout: 60000 },
});
