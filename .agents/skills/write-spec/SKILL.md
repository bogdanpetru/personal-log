---
name: write-spec
description: Write or revise a work-item spec (features/PL-N-<name>/spec.md) from conversation, braindump docs, and user decisions. Use when starting a new numbered work item (PL-N) or rescoping an existing one, before any plan is written. Runs in the orchestrator session only — never delegated.
---

# write-spec

Turns conversation + reference docs into a concise work-item spec. The spec is the single source of what a work item must achieve; the plan (see `write-plan`) is derived from it and can be deleted/recreated at any time.

## Role

This skill runs in the **orchestrator session only**. It depends on the live conversation, which subagents never see. Everything downstream — `write-plan`, `execute-plan` — is delegated to subagents, so the spec is the *only* context they get: it must be fully readable without the conversation.

## Workflow

1. Locate the work item directory: `features/PL-<number>-<short-name>/`. If rescoping an existing item, edit its `spec.md` and delete any stale `plan.md` — spec first, plan later.
2. Read the reference docs the user points to (e.g. `features/braindump/*`). Do not read prior tickets' specs/plans unless the user explicitly refers to them — see `new-feature`.
3. Extract from the conversation: the goal, the tech stack, decisions, and what the user explicitly wants included.
4. Write `spec.md` using the template below. Keep it short.

## Template

```markdown
# PL-<number> — <title>

## Goal

One or two sentences in user terms. Describe the observable outcome
("open the app, see X, install it as a PWA"), not implementation work.

## Tech stack

- **<area>:** <choice>

Only decisions actually made in this conversation. Don't invent.

## Scope

State what exists now and that later work items create the rest.

- <bullet list of included things>

## References

- <paths to braindump/spec docs this item is based on>
```

## Rules

- Record decisions the user made, including reversals — a later reversal in the conversation replaces the earlier decision ("we go with workspaces" later overrides "I lean to one big app").
- No "Out of scope" section — state scope positively (what is in), never as exclusions.
- Don't add tech the user didn't choose; capture their exact picks (e.g. "shadcn, not Radix directly").
- If the user says "simple", the spec stays minimal.
- The spec must be readable without the conversation.
- After writing the spec, the next step is dispatching the `planner` subagent (see `write-plan`) — never plan or execute in the orchestrator session.
