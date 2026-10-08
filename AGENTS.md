# Personal Log — agent rules

## File layout

- `index.ts` files are barrels — they only re-export the package's public things. Never put an implementation in an `index.ts`.
- Every named thing (class, component, interface, hook, type) gets its own file: `Thing.ts`, or `Thing/index.ts` plus sibling part-files when it needs multiple files.
- This applies across the whole repo: apps, packages, components, classes, hooks.
- Code inside the same package imports specific files directly; only external consumers go through the package's `index.ts`.

## Git commits

- Never run `git commit` without the user's explicit approval — this applies to the orchestrator and to every subagent.
- To commit: propose the commit (what to commit + the exact message) and wait for the user's OK.
- Plans may include a commit step with an exact message, but it is **held**: the executor stops before it and reports back; the orchestrator asks the user, and only after approval runs the exact commit command.
