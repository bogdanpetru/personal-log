# Personal Log — agent rules

## File layout

- `index.ts` files are barrels — they only re-export the package's public things. Never put an implementation in an `index.ts`.
- Every named thing (class, component, interface, hook, type) gets its own file: `Thing.ts`, or `Thing/index.ts` plus sibling part-files when it needs multiple files.
- This applies across the whole repo: apps, packages, components, classes, hooks.
- Code inside the same package imports specific files directly; only external consumers go through the package's `index.ts`.

## Subagents (all on the cheap model, `opencode-go/glm-5.3-flash`)

The orchestrator session never plans, implements, explores or runs heavy commands itself — it delegates:

| Subagent | Skill | Use it for |
| --- | --- | --- |
| `planner` | `write-plan` | writing `plan.md` from `spec.md` |
| `executor` | `execute-plan` | running an existing `plan.md` step by step |
| `implementer` | `implement` | implementing a change that has no plan (spec without a plan, bug fix, small feature) |
| `ci-runner` | `ci-runner` | any test / typecheck / lint / build command whose output is large — it runs the command and returns a trimmed PASS/FAIL summary |
| `code-explorer` | `code-explorer` | reading the codebase and reporting how it works (read-only) |

Rules:

- `ci-runner` and `code-explorer` are read-only (`edit: deny`); they never fix code.
- `ci-runner` is the only way heavy command output enters a session — dispatch it instead of running vitest/tsc/vite build in the orchestrator.
- `implementer` and `executor` may write files (their task's scope only) and must never commit.

## Git commits

- Never run `git commit` without the user's explicit approval — this applies to the orchestrator and to every subagent.
- To commit: propose the commit (what to commit + the exact message) and wait for the user's OK.
- Plans may include a commit step with an exact message, but it is **held**: the executor stops before it and reports back; the orchestrator asks the user, and only after approval runs the exact commit command.
