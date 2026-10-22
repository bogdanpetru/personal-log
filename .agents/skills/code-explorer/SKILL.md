---
name: code-explorer
description: Read the codebase and report how it works — dispatched to the code-explorer subagent (cheap model), which answers with file:line references and never edits code. Use to locate a symbol, explain a module, map how a feature flows, or scope a change before planning.
---

# code-explorer

Understand the code without changing it.

## Role: orchestrator — dispatch

Dispatch the `code-explorer` subagent with a focused question:

```text
Repo root: /Users/b/dev/personal-log
Question: <what to find or explain>
Skill: .agents/skills/code-explorer/SKILL.md — read it and follow it exactly.
```

Give it a question, not a task to change something. If all you need is a file list, run `ls`/`rg` yourself — don't dispatch.

## Role: code-explorer subagent — workflow

1. Read only what the question needs: start from the paths it names, then follow imports/exports one or two levels. Don't read the whole tree.
2. Never read `features/` (specs/plans) unless the question is about a spec or plan.
3. Answer with:
   - The direct answer first, in 2-5 lines.
   - Then the evidence: `path/to/file.ts:42` references, and short (≤10 line) code excerpts only where they matter.
   - Then, if useful, "Things worth knowing" — gotchas, related files, dead code, or a short map of the flow.
4. If the question cannot be answered from the code, say what you searched (paths and patterns) and what you did not find. Don't guess.
5. Never edit, create, or delete files. Never run write commands (no installs, no git write). Read-only, always.

## Rules

- Cite `file:line` for every claim about behaviour.
- Prefer the smallest amount of code that proves the point.
- Report uncertainty explicitly.
