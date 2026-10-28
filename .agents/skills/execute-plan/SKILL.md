---
name: execute-plan
description: Execute a plan (features/PL-N-<name>/plan.md) step by step — dispatched by the orchestrator to the executor subagent (glm-5.3-flash), which marks each step's checkbox, stops on failure with the exact error and fix options, and reports back. Use when asked to run, carry out, or execute a plan.
---

# execute-plan

Run a plan exactly as written. Never freelance.

## Role: orchestrator — dispatch and verify

Do not execute the plan yourself. Dispatch the `executor` subagent with a task prompt like:

```text
Execute the plan for PL-<number>.

Repo root: /Users/b/dev/personal-log
Plan: features/PL-<number>-<name>/plan.md
Skill: .agents/skills/execute-plan/SKILL.md — read it and follow it exactly.

Execute all steps in order, marking each checkbox [x] in the plan before moving on. Stop before any commit step — never run git commit.

Report back: steps done, verification results (commands and outcomes), deviations with reasons, the browser checklist for the user, and the prepared commit (exact command + message) if the plan has a commit step.
```

While it runs: do not duplicate its work.

After it reports, verify independently — never report ticket results from the subagent's claims alone:

1. Run the plan's own verification commands yourself (`pnpm build`, `pnpm test`, and anything else the plan requires).
2. Review the working-tree diff — nothing has been committed yet.
3. If verification fails: re-dispatch the executor with the exact failure, or fix directly if trivial — tell the user either way.
4. Hand the browser/manual checklist to the user yourself — subagents cannot reach the user.
5. Report the result to the user from your own verification.
6. Commit only with the user's approval (repo rule, see `AGENTS.md`): propose the plan's exact commit (what + message), wait for the OK, then run the exact commit command yourself. Never commit unilaterally.

## Role: executor subagent — workflow

1. Read the plan file. Find the first unchecked step (`[ ]`) — checked (`[x]`) steps are done; don't repeat them. This makes the plan resumable after any interruption.
2. Execute steps in order. For each step:
   1. Read the existing code the step touches before changing it.
   2. Implement the change as the step describes — the plan names the files, the components/props/functions, the behavior and the conventions; the actual code is yours to write (follow `AGENTS.md`: one file per named thing, barrels only re-export, no comments, `Text` for visible text).
   3. Verify the step's **Done when** check actually passes.
   4. Mark the step's checkbox `[x]` in the plan file.
3. If a command fails:
   - Stop immediately. Do not continue, do not skip.
   - Report: the exact error output, which steps are done, which edits were already applied.
   - Propose fix options (running the tool's `--help` to understand flags is allowed).
   - Wait for the orchestrator (report back with the failure instead of retrying).
4. If a command fails from toolchain drift (a flag or option no longer exists, a version changed), you may read the tool's `--help` and use the tool's own suggested alternative, then add a short note to that plan step recording the deviation. Anything beyond that: stop and report.
5. If a step is too vague to implement without inventing a product or design decision, stop and report the open question instead of choosing.
6. For user-verification steps (preview/browser checks): start the server in the background (`nohup ... &`), verify what is verifiable via curl and HTTP status codes, and put the browser checklist in your report back to the orchestrator — you cannot reach the user.
7. Never run `git commit` — commits require the user's explicit approval (repo rule, see `AGENTS.md`). When you reach the plan's commit step, stop before executing it, leave its checkbox unchecked, and put the exact commit command and message in your report; the orchestrator asks the user and runs it after approval.
8. Finish with the report described in the orchestrator's task prompt.

## Rules

- Ground rules written in the plan override these defaults where they differ.
- The plan describes what and how; the implementation is yours. Match the plan's named identifiers exactly (file paths, export/prop names, commands) — those are the contract.
- Substitute the plan's commands only on toolchain drift (rule 4).
