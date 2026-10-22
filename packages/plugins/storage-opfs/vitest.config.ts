/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Node environment: the plugin only uses the OPFS/FileSystem APIs (faked in
// tests) — no DOM is involved.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});