import { defineConfig } from "vitest/config";
import path from "node:path";

/** End-to-end API flows against a running server: E2E=1 npm run dev, then E2E_BASE_URL=http://localhost:3000 npm run test:e2e */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["e2e/**/*.e2e.test.ts"], testTimeout: 60000, fileParallelism: false },
});
