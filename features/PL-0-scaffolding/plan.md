# PL-0 — Plan

## Goal

Scaffold the Personal Log project. Done = a user can open the app, see "Hello World", and install it as a PWA; `pnpm build` and `pnpm test` pass.

## Ground rules

- Work from the repo root (`/Users/b/dev/personal-log`).
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, wait. Do not improvise or skip.
- Never edit files outside the repo root.

## Steps

### 1. [x] Init git repo

```bash
git init
```

Create `.gitignore`:

```
node_modules/
dist/
dev-dist/
coverage/
.DS_Store
```

Done when: `git status` runs and shows only existing `features/` files.

### 2. [x] Workspace config

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create root `package.json`:

```json
{
  "name": "personal-log",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm -C apps/web dev",
    "build": "pnpm -C apps/web build",
    "preview": "pnpm -C apps/web preview",
    "test": "pnpm -C apps/web test"
  }
}
```

Done when: `pnpm install` completes with no errors.

### 3. [x] Create apps/web

```bash
pnpm create vite apps/web --template react-ts
```

Done when: `apps/web/src/App.tsx` exists.

### 4. [x] Tailwind CSS v4

```bash
pnpm -C apps/web add tailwindcss @tailwindcss/vite
```

Replace the contents of `apps/web/src/index.css` with:

```css
@import "tailwindcss";
```

Done when: `@tailwindcss/vite` is listed in `apps/web/package.json`.

### 5. [x] Path alias `@/`

> Note: TS 6 deprecates `baseUrl` — use `paths` with relative entries only, and wire `tailwindcss()` into `vite.config.ts` plugins.

In `apps/web/tsconfig.app.json`, inside `compilerOptions`, add:

```json
"paths": { "@/*": ["./src/*"] }
```

In `apps/web/vite.config.ts`, add to the config object:

```ts
resolve: { alias: { "@": "/src" } }
```

and add `tailwindcss()` (from `@tailwindcss/vite`) to `plugins`.

Done when: `pnpm -C apps/web build` still passes.

### 6. [x] zustand

```bash
pnpm -C apps/web add zustand
```

Create `apps/web/src/stores/hello.ts`:

```ts
import { create } from "zustand";

interface HelloState {
  count: number;
  bump: () => void;
}

export const useHello = create<HelloState>((set) => ({
  count: 0,
  bump: () => set((s) => ({ count: s.count + 1 })),
}));
```

Done when: build passes.

### 7. [x] Vitest + Testing Library

```bash
pnpm -C apps/web add -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

(`@vitejs/plugin-react` is likely already present from the template — harmless either way.)

In `apps/web/vite.config.ts` add at the top of the config object:

```ts
/// <reference types="vitest/config" />
```

and inside the config object:

```ts
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: "./src/test-setup.ts",
},
```

Create `apps/web/src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add to `apps/web/package.json` scripts:

```json
"test": "vitest run"
```

Done when: `pnpm -C apps/web test` runs and exits 0 with "no tests found" (tests come next).

### 8. [x] First test

Create `apps/web/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders hello world", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Hello World",
  );
});
```

Done when: `pnpm -C apps/web test` passes with 1 test.

### 9. [x] PWA

```bash
pnpm -C apps/web add -D vite-plugin-pwa
```

Generate placeholder icons from an SVG (create `apps/web/public/logo.svg` — any simple square; ask the user if you cannot draw one):

```bash
pnpm dlx @vite-pwa/assets-generator --preset minimal-2023 apps/web/public/logo.svg
```

In `apps/web/vite.config.ts`:

```ts
import { VitePWA } from "vite-plugin-pwa";
```

add `VitePWA({ ... })` to `plugins` with:

```ts
VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "Personal Log",
    short_name: "Personal Log",
    display: "standalone",
    start_url: "/",
    theme_color: "#0f172a",
    background_color: "#ffffff",
    icons: [
      { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
      { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
}),
```

Done when: `pnpm -C apps/web build` succeeds and `apps/web/dist/manifest.webmanifest` exists.

### 10. [x] shadcn/ui

```bash
pnpm dlx shadcn@latest init -y -b neutral
pnpm dlx shadcn@latest add button -y
```

Run both from `apps/web/`. If init asks anything interactively, use the defaults.

Done when: `apps/web/src/components/ui/button.tsx` exists.

### 11. [x] Hello World screen

Replace `apps/web/src/App.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { useHello } from "@/stores/hello";

export default function App() {
  const { count, bump } = useHello();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Button onClick={bump}>Bump ({count})</Button>
    </main>
  );
}
```

Done when: `pnpm build` and `pnpm test` both pass.

### 12. [ ] Full verification

```bash
pnpm install
pnpm build
pnpm test
pnpm preview
```

Then ask the user to check in the preview browser tab:

- "Hello World" is shown
- `manifest.webmanifest` and the service worker are registered (DevTools → Application)
- The browser offers "Install app" (Chrome/Edge)

### 13. [ ] Commit

```bash
git add -A
git commit -m "PL-0: scaffold PWA shell (Vite, React, Tailwind, zustand, shadcn, Vitest)"
```

Done when: `git log --oneline` shows the commit.
