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

Execute all steps in order, marking each checkbox [x] in the plan before moving on.

Report back: steps done, verification results (commands and outcomes), deviations with reasons, the browser checklist for the user, and the commit hash if the plan has a commit step.
```

While it runs: do not duplicate its work.

After it reports, verify independently — never report ticket results from the subagent's claims alone:

1. Run the plan's own verification commands yourself (`pnpm build`, `pnpm test`, and anything else the plan requires).
2. Check `git log --oneline -3` and review the diff if a commit step ran.
3. If verification fails: re-dispatch the executor with the exact failure, or fix directly if trivial — tell the user either way.
4. Hand the browser/manual checklist to the user yourself — subagents cannot reach the user.
5. Report the result to the user from your own verification.

## Role: executor subagent — workflow

1. Read the plan file. Find the first unchecked step (`[ ]`) — checked (`[x]`) steps are done; don't repeat them. This makes the plan resumable after any interruption.
2. Execute steps in order. For each step:
   1. Run the commands / write the files exactly as the plan specifies.
   2. Verify the step's **Done when** check actually passes.
   3. Mark the step's checkbox `[x]` in the plan file.
3. If a command fails:
   - Stop immediately. Do not continue, do not skip.
   - Report: the exact error output, which steps are done, which edits were already applied.
   - Propose fix options (running the tool's `--help` to understand flags is allowed).
   - Wait for the orchestrator (report back with the failure instead of retrying).
4. If a command fails from toolchain drift (a flag or option no longer exists, a version changed), you may read the tool's `--help` and use the tool's own suggested alternative, then add a short note to that plan step recording the deviation. Anything beyond that: stop and report.
5. For user-verification steps (preview/browser checks): start the server in the background (`nohup ... &`), verify what is verifiable via curl and HTTP status codes, and put the browser checklist in your report back to the orchestrator — you cannot reach the user.
6. Commit only in the plan's exact commit step, with the plan's exact message.
7. Finish with the report described in the orchestrator's task prompt.

## Rules

- Ground rules written in the plan override these defaults where they differ.
- File contents from the plan are written as-is, as plain text.
- Substitute the plan's commands only on toolchain drift (rule 4).
