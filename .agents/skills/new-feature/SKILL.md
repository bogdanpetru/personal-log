---
name: new-feature
description: Start new work in the Personal Log repo — the entry point of the ticket workflow (spec → plan → execute → verify). Use when the user starts a ticket ("let's do this", "new ticket PL-N", "implement X", "we go with..."). Context economy: never load previous features' files unless the user refers to them.
---

# new-feature

Every piece of work in this repo is a numbered ticket `PL-N-<short-name>` in `features/`, and every ticket follows the same fixed workflow:

1. **Spec** — the orchestrator writes `features/PL-N-<name>/spec.md` (skill: `write-spec`).
2. **Plan** — the orchestrator dispatches the `planner` subagent, which writes `features/PL-N-<name>/plan.md` (skill: `write-plan`).
3. **Execute** — the orchestrator dispatches the `executor` subagent, which runs the plan step by step (skill: `execute-plan`).
4. **Verify & report** — the orchestrator re-runs the verification commands itself and reports the ticket result to the user.

This skill is the **first skill in the workflow**: when the user starts new work, run this, then continue with `write-spec`. The orchestrator session never plans or executes itself — both are delegated to subagents on the lesser model.

## Starting a ticket

1. Find the next ticket number with `ls features/` — a directory listing only; do not open previous tickets' files.
2. Derive the short name from the user's request (kebab-case).
3. Continue with the `write-spec` skill.

## Context economy

When the user starts new work ("let's do this", "new ticket", a fresh `PL-N`):

- Do **not** read previous tickets' specs or plans under `features/` unless the user explicitly refers to them.
- Do **not** read `features/braindump/*` unless the user points to it or the new spec needs it as a reference.
- `ls features/` to find the next number is fine; loading file contents is not.

Prior work enters context only through:

1. An explicit reference from the user ("look at how PL-1 did X").
2. A `## References` entry in the current spec.
