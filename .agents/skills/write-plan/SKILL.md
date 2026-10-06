---
name: write-plan
description: Write an execution plan (features/PL-N-<name>/plan.md) from an agreed spec — goal, ground rules, ordered bite-size steps (max 5 min each) with exact commands, exact file contents, "Done when" checks, and checkboxes to mark during execution. Explicit enough for a lesser model to execute. Use after write-spec once the spec is agreed.
---

# write-plan

Turns a spec into a step-by-step plan that a lesser model (e.g. glm-5.3-flash) can execute without judgment calls. Steps must be so explicit that failure can only come from toolchain drift, never from ambiguity.

## Plan structure

1. `## Goal` — the observable done state, plus the commands that must pass.
2. `## Ground rules` — the executor contract (copy the block below).
3. `## Steps` — each step is `### N. [ ] <title>` + body + a `Done when:` check.

## Ground rules (include verbatim)

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.

## Step rules

- Each step ≤ 5 minutes, one purpose.
- Give exact commands with non-interactive flags, and exact file contents in fenced code blocks — the executor writes content as plain text.
- Every step ends with a `Done when:` check that is objectively verifiable (a passing command, an existing file, a passing test).
- Prefer generators for binary assets (e.g. `@vite-pwa/assets-generator` for PWA icons) — never expect the executor to author images.
- Order steps so code under test is written before (or in the same step as) its test.
- End with: full verification (`pnpm install && pnpm build && pnpm test`, preview server started in background, curl status checks) + a browser checklist the **user** performs, then a commit step with the exact `git add -A && git commit -m "PL-N: ..."` message, then a final step to mark remaining checkboxes.

## Toolchain drift (verified 2026-10 in this repo)

Write plan snippets against the actual versions in the repo, and record version-specific notes in the step:

- **TypeScript 6** (Vite react-ts template): `baseUrl` is deprecated — use `paths` with relative entries only.
- **Tailwind v4**: installing `@tailwindcss/vite` is not enough — the step must also add `tailwindcss()` to vite plugins, or CSS is silently not processed.
- **Vitest 5**: exits 1 with no test files (`--passWithNoTests` until the first test exists); `globals: true` requires `"types": ["vitest/globals"]` in tsconfig.
- **shadcn 4.x**: `-b` is the component library (`radix`/`base`/`aria`), not a base color; `init` needs a preset (e.g. `-p nova`); it may write to a literal `@/` directory — add a check that components landed in `src/`.

## Known failure modes to design against

- Lesser models pass raw JSON objects where a string is expected — keep file contents fenced and small.
- Lesser models occasionally drop an argument in edit calls — keep each step's edits small and uniquely identifiable.
- Toolchain drift (flags renamed, options deprecated) is expected — that's what the ground rules' stop-and-report path is for.
