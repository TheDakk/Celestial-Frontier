# OpenAI / Codex — Start Here

This is the **only folder OpenAI/Codex should edit on this Windows PC**:

```text
C:\Projects\celestial-frontier-openai-windows
```

Its branch is:

```text
openai/windows
```

The other folders are deliberately separate:

| Folder | Purpose | Do not edit from OpenAI/Codex |
| --- | --- | --- |
| `C:\Projects\celestial-frontier-openai-windows` | OpenAI/Codex development | No — this is the correct folder |
| `C:\Projects\celestial-frontier-anthropic-windows` | Anthropic/Claude Code development | Yes |
| `C:\Projects\Celestial-Frontier` | `develop` integration branch | Yes |
| `C:\Projects\celestialfrontier.github.io` | Published live-site repository | Yes — deploy only when Nick approves |

## Every time you start an OpenAI/Codex coding task

1. Open this folder as the local project in Codex.
2. Use **Local** mode — not Codex's extra **Worktree** mode.
3. Ask Codex to verify the folder and branch before editing.
4. Ask Codex to read `AGENTS.md`, `ROADMAP.md`, and `PROCESS_LAWS.md` before work begins.

Paste this at the beginning of a coding task:

```text
Before editing, verify that the repository root is
C:/Projects/celestial-frontier-openai-windows
and that the current branch is openai/windows.

If either is different, stop and report it; do not edit anything.

Then read AGENTS.md, ROADMAP.md, and PROCESS_LAWS.md. Work only in this
OpenAI worktree. Never edit the Anthropic worktree, develop, main, or the
celestialfrontier.github.io repository.
```

The expected verification result is:

```powershell
git rev-parse --show-toplevel   # C:/Projects/celestial-frontier-openai-windows
git branch --show-current       # openai/windows
git status --short --branch     # ## openai/windows...origin/openai/windows
```

If the last command lists changed files, they are unfinished work. Ask Codex
to explain them; do not discard them.

## When a task is complete

Paste this:

```text
Run the required checks for this change. Review the diff, then commit only
the completed task's changes with a descriptive message and push to
origin/openai/windows. Verify that the local branch and GitHub are in sync.
Report the commit hash, tests run, and push result. Do not merge into develop
or main, and do not deploy the live site. End with the required paired handoff
reminder from PARALLEL_GIT_PROTOCOL.md: tell me the exact next steps for this
OpenAI/Codex side, GitHub, and the Anthropic/Claude Code side, including
whether I need to open Claude now. If a pull request is needed, include the
exact base branch, source branch, and copy-ready PR title and description.
```

Success means `git status --short --branch` shows only:

```text
## openai/windows...origin/openai/windows
```

with no changed-file lines below it. The work is then safely stored both on
this computer and on GitHub.

## How work reaches the game

```text
OpenAI/Codex: openai/windows
        ↓ pull request + review
develop: integration and shared testing
        ↓ approved release only
main: production source
        ↓ approved deployment only
celestialfrontier.github.io: live game
```

Do not merge or deploy casually. A completed OpenAI task is normally ready
for a pull request from `openai/windows` into `develop`.

## Important safety rule

Never use `git reset --hard`, `git clean -fd`, force-push, or delete a branch
or worktree unless Nick explicitly approves it.
