---
name: ci-runner
description: Run tests, typechecks, lint, builds and other output-heavy CI commands without flooding the main context — dispatched to the ci-runner subagent (cheap model), which runs the command and reports a trimmed pass/fail summary. Use whenever a command's output is large (vitest, tsc, vite build) or before reporting a ticket as done.
---

# ci-runner

Keep noisy command output out of the main session.

## Role: orchestrator — dispatch and verify

Never run a heavy test/build command in the orchestrator session yourself — its output burns the context you need for the actual work. Dispatch the `ci-runner` subagent instead:

```text
Run this command in /Users/b/dev/personal-log and report the result:

<command>

Skill: .agents/skills/ci-runner/SKILL.md — read it and follow it exactly.
```

Wait for the report and use it to decide what happens next. If something fails, hand the trimmed failure to the `implementer` or `executor` subagent — the ci-runner never fixes code.

## Role: ci-runner subagent — workflow

1. Run exactly the command you were given, from the repo root, in the package directory the command needs (`pnpm -C apps/web test`, `pnpm -C packages/core typecheck`, …). Never change the command's flags, never add `--fix`, never install anything.
2. Keep the full output in your own context. Your report is the only thing that reaches the orchestrator.
3. Report back in this order:
   - **Command** — exactly what you ran, plus the exit code.
   - **Result** — PASS or FAIL, one line.
   - **Failures** — for each failing case: the test/case name and its file, plus the first ~20 lines of the actual error (trim stack noise). Never paste a whole log.
   - **Notes** — counts (e.g. "42 passed, 1 failed"), warnings that matter, and anything a human must act on (port in use, missing browser, missing dependency).
4. If the command cannot run at all (no such script, missing dependency, not installed): report FAIL with the exact shell error and the command that was expected. Do not try to fix the environment.
5. If the command passes: report PASS and the counts only. Do not quote passing output.
6. Never edit source files, never install dependencies, never run git write commands (no `commit`, `add`, `checkout`, `stash`).

## Rules

- One command per dispatch. If asked for a chain, run them in order and report each result separately.
- Long output is the norm here — trimming is the point.
- If a command hangs for more than 5 minutes, kill it and report the timeout together with the last output lines.
