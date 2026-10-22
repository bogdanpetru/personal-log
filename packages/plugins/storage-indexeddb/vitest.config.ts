/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Node environment: the plugin only uses IndexedDB (provided by
// fake-indexeddb in tests) — no DOM is involved.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});