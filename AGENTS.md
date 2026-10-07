# Personal Log — agent rules

## Git commits

- Never run `git commit` without the user's explicit approval — this applies to the orchestrator and to every subagent.
- To commit: propose the commit (what to commit + the exact message) and wait for the user's OK.
- Plans may include a commit step with an exact message, but it is **held**: the executor stops before it and reports back; the orchestrator asks the user, and only after approval runs the exact commit command.
