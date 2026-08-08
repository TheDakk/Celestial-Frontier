# Parallel Git Protocol

This protocol governs coordinated work by OpenAI/Codex and Anthropic/Claude
Code on Celestial Frontier. It is deliberately conservative: agents can
prepare and publish their own work, but never merge or deploy automatically.

## Ownership

| Agent environment | Allowed branch | Allowed folder |
| --- | --- | --- |
| OpenAI/Codex on Windows | `openai/windows` | `C:\Projects\celestial-frontier-openai-windows` |
| Anthropic/Claude Code on Windows | `anthropic/windows` | `C:\Projects\celestial-frontier-anthropic-windows` |
| OpenAI/Codex on macOS | `openai/mac` | local path ending in `/celestial-frontier-openai-mac` |
| Anthropic/Claude Code on macOS | `anthropic/mac` | local path ending in `/celestial-frontier-anthropic-mac` |

`develop` is the integration branch. `main` is the production branch.
Neither agent may commit directly to either one.

## Required startup procedure

Before every new coding batch:

1. Verify the repository root and current branch. Stop if they do not match
   the agent's ownership row above.
2. Read `ROADMAP.md`, including its live session handoff, then
   `PROCESS_LAWS.md` and the agent's normal instructions (`AGENTS.md` for
   Codex; `CLAUDE.md` for Claude Code). Follow the roadmap's pointers to the
   system/reference Markdown relevant to the assigned task. Do not load every
   historical Markdown file indiscriminately.
3. Run `git fetch origin` and inspect `git status --short --branch`.
4. Only if the worktree is clean, safely bring the current branch up to date
   with its remote and merge the latest `origin/develop` into the current
   agent branch when needed.
5. Never use `git reset --hard`, `git clean -fd`, rebase, force-push, or any
   operation that discards work. If Git reports a conflict, stop and report
   it unless the user explicitly asks for conflict resolution.

## Required preflight reminder to the user

Before editing, the agent must give the user a short preflight report that
states:

1. Which agent it is, the verified folder, and the verified branch.
2. Whether the worktree is clean and synchronized with its upstream and the
   latest `origin/develop`.
3. Which core and task-relevant Markdown files it read.
4. The current roadmap/handoff objective it intends to work on.
5. The integration path: current agent branch → draft pull request →
   `develop`; later `develop` → `main` only with user approval.

The agent must wait until this preflight is complete before editing. It does
not need a second confirmation unless it finds a mismatch, uncommitted work,
a conflict, or an unclear assignment.

## Required completion procedure

When a coding batch is complete:

1. Run the project checks required for the changed files.
2. Update required Markdown documentation in the same batch.
3. Review the diff and commit only the completed task's files with a clear
   commit message.
4. Push the current agent branch to its matching `origin/<branch>` remote.
5. Verify that `git status --short --branch` has no changed-file lines and
   that the local branch is synchronized with its upstream.
6. Report the commit hash, files changed, checks run, and push result.
7. Remind the user that the next integration step is a reviewed pull request
   from the current agent branch into `develop`, never directly into `main`.

The agent may create or update a **draft** pull request from its own branch
to `develop` when instructed, but it must never merge that pull request.

## How changes move between agents

```text
agent branch → push to GitHub → pull request → develop
                                              ↓
                         other clean agent branch merges origin/develop
```

Do not copy files manually between worktrees. If the two agents change the
same lines, Git stops with a conflict rather than silently losing either
change. Resolve that conflict on the agent branch, test, push, and let the
pull request update.

## Releases

`develop` reaches `main`, and `main` reaches the separate
`celestialfrontier.github.io` repository, only at a user-approved release.
Neither agent may deploy during ordinary development.
