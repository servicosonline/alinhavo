import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests-pglite/**/*.test.ts"],
    testTimeout: 30_000,
    // Cada arquivo sobe um Postgres em WASM. Compilar vários ao mesmo tempo,
    // junto com o build do Next, estourava a memória do V8 ("out of memory: Zone")
    // em máquinas com pouca RAM. Um arquivo por vez resolve, por ~2 s a mais.
    fileParallelism: false,
  },
});
