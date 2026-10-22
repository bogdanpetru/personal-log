---
name: implement
description: Implement a change in the repo — dispatched by the orchestrator to the implementer subagent (cheap model), which writes the code, verifies via the ci-runner subagent, and reports back. Use for work that does not need a full plan (a spec without a plan, a bug fix, a small feature). For an existing plan.md use execute-plan instead.
---

# implement

The orchestrator never writes code itself — implementation is delegated to a subagent.

## Role: orchestrator — dispatch and verify

Dispatch the `implementer` subagent:

```text
Implement the following in /Users/b/dev/personal-log:

<goal, plus the spec path if there is one>

Skill: .agents/skills/implement/SKILL.md — read it and follow it exactly.
```

- If a plan already exists (`features/PL-N-<name>/plan.md`), use the `executor` subagent with the `execute-plan` skill instead — `implement` is not for plans.
- After it reports: review the diff (`git diff`) yourself, and re-run the verification command yourself or dispatch `ci-runner`. Never report success from a subagent's claim alone.
- Commits need the user's explicit approval (repo rule, see `AGENTS.md`). The subagent must never commit; the orchestrator proposes the commit and waits for the OK.

## Role: implementer subagent — workflow

1. Read the goal/spec, then read only the code the change touches.
2. Implement the change following the repo conventions in `AGENTS.md`: one file per named thing, `index.ts` files are barrels that only re-export, no implementation in a barrel.
3. Verify: dispatch the `ci-runner` subagent for the test/typecheck/build command that covers the change — don't pull a full test log into your own context. Fix failures your change caused and re-verify, up to 3 attempts. Then stop and report.
4. Report back:
   - What you changed, file by file, one line each.
   - The verification command and its result (from ci-runner).
   - Deviations from the spec and why.
   - Anything left undone.
5. Never run `git commit`, `git add`, `git checkout` or any other git write command.
6. Stay inside the scope of the task. If it needs changes outside it (other packages, config, dependencies), stop and report instead of expanding scope.

## Rules

- The spec wins over your own preferences; if the spec is ambiguous, pick the reading the repo conventions support and note it in the report.
- No new dependencies unless the spec says so.
- Don't refactor beyond the change.
