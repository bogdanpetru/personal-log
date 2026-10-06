---
name: execute-plan
description: Execute a plan (features/PL-N-<name>/plan.md) step by step — run each step, verify its "Done when" check, mark its checkbox [x], stop on failure with the exact error and fix options. Use when asked to run, carry out, or execute a plan.
---

# execute-plan

Run a plan exactly as written. Never freelance.

## Workflow

1. Read the plan file. Find the first unchecked step (`[ ]`) — checked (`[x]`) steps are done; don't repeat them. This makes the plan resumable after any interruption.
2. Execute steps in order. For each step:
   1. Run the commands / write the files exactly as the plan specifies.
   2. Verify the step's **Done when** check actually passes.
   3. Mark the step's checkbox `[x]` in the plan file.
3. If a command fails:
   - Stop immediately. Do not continue, do not skip.
   - Report: the exact error output, which steps are done, which edits were already applied.
   - Propose fix options (running the tool's `--help` to understand flags is allowed).
   - Wait for the user.
4. If a command fails from toolchain drift (a flag or option no longer exists, a version changed), you may read the tool's `--help` and use the tool's own suggested alternative, then add a short note to that plan step recording the deviation. Anything beyond that: stop and report.
5. When the plan reaches user verification (preview/browser checks): start the server in the background (`nohup ... &`), verify what is verifiable via curl and HTTP status codes, then hand the browser checklist to the user and wait.
6. Commit only in the plan's exact commit step, with the plan's exact message.
7. Finish with a short report: steps done, verification results, and any deviations you made with reasons.

## Rules

- Ground rules written in the plan override these defaults where they differ.
- File contents from the plan are written as-is, as plain text.
- Substitute the plan's commands only on toolchain drift (rule 4).
