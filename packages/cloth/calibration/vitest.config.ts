import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Só para `npm run calibrate`: roda o ajuste (src/calibration/ajustar.ts), não os testes.
export default defineConfig({
  test: { root: fileURLToPath(new URL("..", import.meta.url)), include: ["src/calibration/ajustar.ts"], testTimeout: 3_600_000 },
});
