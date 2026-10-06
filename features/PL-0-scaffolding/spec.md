# PL-0 — Scaffolding

## Goal

Create the project structure: a working shell of the app with the chosen technologies.

Open the app → see "Hello World" → it is installable as a PWA. Simple.

## Tech stack

- **Runtime:** Node
- **Package manager:** pnpm
- **Monorepo:** pnpm workspaces (`apps/*`, `packages/*`)
- **Platform:** PWA — installable, offline-capable web app
- **Build:** Vite
- **UI:** React + Tailwind CSS
- **State:** zustand
- **Tests:** Vitest
- **UI library:** shadcn/ui

> shadcn/ui is built on Radix UI primitives, so adopting shadcn means Radix comes along underneath. We do not use Radix directly.

## Scope

For now there is only the web app; `packages/*` are created by later work items.

- Monorepo skeleton: `pnpm-workspace.yaml`, root scripts
- `apps/web` shell:
  - Vite + React + TypeScript
  - Tailwind CSS
  - zustand
  - shadcn/ui initialized, with `button` as the first component
  - PWA: manifest + service worker (installable, offline)
  - A "Hello World" screen using the above
  - One smoke test (app renders)

## References

- `features/braindump/product.md`
- `features/braindump/arhitecture.md` (§2 proposed technology, §15 repository structure)
