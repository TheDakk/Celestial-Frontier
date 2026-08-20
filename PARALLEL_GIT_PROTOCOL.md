# Parallel Git Protocol

This protocol governs coordinated work by OpenAI/Codex and Anthropic/Claude
Code on Celestial Frontier. It is deliberately conservative: agents can
prepare their own work and publish it only through the budget-authorized path,
with the standing green-PR authorization defined below; no release authority is
implied.

## Ownership

| Agent environment | Allowed branch | Allowed folder |
| --- | --- | --- |
| OpenAI/Codex on Windows | `openai/windows` | `C:\Projects\celestial-frontier-openai-windows` |
| Anthropic/Claude Code on Windows | `anthropic/windows` | `C:\Projects\celestial-frontier-anthropic-windows` |
| OpenAI/Codex on macOS | `openai/mac` | local path ending in `/celestial-frontier-openai-mac` |
| Anthropic/Claude Code on macOS | `anthropic/mac` | local path ending in `/celestial-frontier-anthropic-mac` |

`develop` is the integration branch. `main` is the production branch.
Neither agent may commit directly to either one.

## GitHub Actions budget gate

`GITHUB_ACTIONS_BUDGET.md` is part of this protocol and overrides every generic
push, merge, dispatch, publication, and standing-proceed instruction below when
its mode is `FROZEN`. Nick confirmed on 2026-08-20 that the repository is public,
so standard GitHub-hosted runners are free while that visibility remains public.
The reported private-repository allowance of 3,000 remains a fail-closed cap if
visibility changes or billing state is ambiguous. `FROZEN` remains an efficiency
and explicit-intent gate until Nick lifts it; agents never infer a reset or
visibility change.

While frozen:

1. Work, review, test, create exact-head evidence, and commit locally. Do not
   push an open-PR branch, apply the battery label, dispatch/rerun a workflow,
   merge, publish, or create an empty CI-kick commit.
2. Batch completed local commits into one reviewed head. Hosted Actions is a
   terminal milestone, not the default development loop.
3. Missing hosted checks block integration. Budget exhaustion never authorizes
   bypassing branch protection, reusing stale evidence, or calling local proof CI.
4. Agent branches synchronize locally from a clean worktree; the hosted sync
   workflow is manual-only. Branch-site publication is parked.
5. Every preflight and handoff states the budget mode, Nick's last reported
   remaining allowance, the exact workflows/jobs the next GitHub write could
   trigger, and whether one-run authorization exists.

After Nick lifts the freeze, each hosted attempt still needs exact one-run
authorization: workflow, PR/ref, full head/base SHA, configured maximum runner
minutes, and one-attempt/no-retry stopping rule. Only Nick applies the exact
`actions-budget-approved` PR label or authorizes the manual workflow token. Never
rerun an unchanged red or canceled head. The standing green-PR merge authority is
not standing authority to spend Actions capacity.

## Agent token conservation

This rule applies equally to OpenAI/Codex and Anthropic/Claude Code:

1. Keep updates concise while preserving decisions, evidence, blockers, and the
   exact next action.
2. Read only the live handoff and references relevant to the bounded task. Do
   not replay archives or repeat unchanged status and audits.
3. Batch independent reads and checks. Delegate only concrete bounded work, and
   skip delegation when its coordination cost exceeds the task.
4. Stop when the stated acceptance checks pass. Do not start another diagnostic,
   rewrite, or polish loop without a new finding.
5. Obtain Nick's explicit approval before a broad exploratory or rework loop
   whose token cost is materially larger than the scoped implementation.

## Required startup procedure

Before every new coding batch:

1. Verify the repository root and current branch. Stop if they do not match
   the agent's ownership row above.
2. Read `GITHUB_ACTIONS_BUDGET.md`, record its current mode, then read
   `ROADMAP.md`, including its live session handoff, then
   `PROCESS_LAWS.md` and the agent's normal instructions (`AGENTS.md` for
   Codex; `CLAUDE.md` for Claude Code). Follow the roadmap's pointers to the
   system/reference Markdown relevant to the assigned task. Do not load every
   historical Markdown file indiscriminately.
3. Run `git fetch origin` only when a current remote comparison is needed and
   inspect `git status --short --branch`. Fetch/read-only metadata does not use
   runner minutes, but do not poll GitHub repeatedly while frozen.
4. Only if the worktree is clean, safely bring the current branch up to date
   with its remote and merge the latest `origin/develop` into the current
   agent branch when needed. `.github/workflows/sync-agent-branches.yml` is
   manual-only under the budget gate; do not expect GitHub to move an agent
   branch. A branch carrying unmerged agent work is synchronized only by this
   explicit local merge step.
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
6. The Actions budget mode, repository visibility/billing assumption, standing
   private cap, whether the next GitHub write can trigger a workflow, and whether
   exact one-run authority exists.

The agent must wait until this preflight is complete before editing. It does
not need a second confirmation unless it finds a mismatch, uncommitted work,
a conflict, or an unclear assignment.

## Required completion procedure

When a coding batch is complete:

1. Run the project checks required for the changed files.
2. Update required Markdown documentation in the same batch.
3. Review the diff and commit only the completed task's files with a clear
   commit message.
4. If and only if the budget gate permits this exact GitHub write, enumerate
   the workflows it can trigger and push the current agent branch to its
   matching `origin/<branch>`. While frozen, stop at the local commit.
5. Verify that `git status --short --branch` has no changed-file lines. If a
   push was authorized, also verify synchronization with upstream; otherwise
   report the exact local-ahead state without treating it as a defect.
6. Report the commit hash, files changed, checks run, budget mode, estimated
   hosted cost, authorization state, and push result or explicit no-push result.
7. Remind the user that the next integration step is a reviewed pull request
   from the current agent branch into `develop`, never directly into `main`.
8. End with the paired OpenAI/Anthropic handoff reminder defined below. Do
   this even when the user does not ask for Git instructions.

The agent may create or update a **draft** pull request from its own branch
to `develop` when instructed. Under Nick's standing authorization (2026-08-13),
once that scoped PR is clean, mergeable, and has a completed successful required
battery, an agent may complete its normal merge to `develop` without asking again,
provided the Actions budget gate is not frozen and Nick authorized that exact
hosted attempt. There is no automatic post-merge battery or branch publication
under the conservation policy.
That standing approval is the proceed instruction: do not request repeated generic
confirmation after the same exact preconditions are met.
This permission is limited to the reviewed PR's exact head and its normal
integration path; it does not authorize merging `develop` to `main`, resolving
conflicts by discarding work, bypassing a red/unfinished check, force pushes,
manual Pages writes, new external targets/secrets, version changes, releases,
or production deployment decisions.

## Required paired handoff reminder

After every completed batch, push, pull-request update, merge check, or
conflict report, both OpenAI/Codex and Anthropic/Claude Code must tell Nick
what happens on **both** sides. Use this short format in plain language:

```text
Current side: <OpenAI/Codex or Anthropic/Claude Code> — <what was committed,
pushed, or is still pending>.
GitHub step: <the exact action Nick must take now, or "none">.
PR details: <base branch, source branch, exact copy-ready title, and exact
copy-ready description; or "not needed">.
Other side: <the exact safe synchronization step and when to do it>.
Release status: <develop/main/live-site status; normally "no release or
deployment performed">.
Actions budget: <mode, repository visibility/billing assumption, standing private
cap, exact authorized run count and attempts, or "FROZEN — no GitHub
write/workflow authorized">.
```

The reminder must apply these rules:

1. Name both environments explicitly; never say only "the other branch."
2. If the current change has not been merged into `develop`, say that the
   other environment does not have it yet. It may continue unrelated work,
   but must not expect the new change or copy files manually.
3. If a pull request is ready, tell Nick to review and merge that pull request
   into `develop`. Always provide all four copy-ready PR fields: base branch,
   source branch, title, and description. The description must summarize the
   change, list verification performed, state the cross-agent synchronization
   effect, and state that no release or deployment is included. Do not imply
   that saving, committing, or pushing merged it.
4. Only after the pull request is merged may the other agent bring in the
   change. At its next coding batch, that agent must fetch and merge the latest
   `origin/develop` into its own clean agent branch under the startup procedure.
5. If the other worktree has uncommitted changes, tell Nick not to pull,
   switch, or merge there. The other agent must inspect and safely finish or
   commit its own work first.
6. State clearly whether Nick needs to open the other application now. In the
   normal case, synchronization can wait until that agent's next coding batch.
7. Never describe `develop`, `main`, or the live site as updated unless that
   specific merge or deployment has been verified.
8. Provide the PR fields every time a new PR is needed, including in follow-up
   status messages. If a PR already exists, provide its number or link and say
   whether its existing title or description needs to change.

## How changes move between agents

```text
agent branch → budget-authorized push → pull request → develop
                                              ↓
                         other clean agent branch merges origin/develop
```

Do not copy files manually between worktrees. If the two agents change the
same lines, Git stops with a conflict rather than silently losing either
change. Resolve that conflict on the agent branch, test, push, and let the
pull request update.

## Resumable batch and human-preview record

Every coding batch must leave enough committed context for either OpenAI/Codex
or Anthropic/Claude Code to resume without reconstructing decisions from chat.
Before the Git handoff, the current agent must record:

1. the exact branch, full commit, draft PR, upstream/develop relationship, and
   whether any scoped working-copy changes remain;
2. player-visible behavior changed, affected source files, and every in-game
   Guide/Training/release-note surface updated (or an explicit reason a surface
   does not yet exist in the port);
3. refreshed current-state system references and codebase map, plus the lean
   `ROADMAP.md` handoff; chronological history is appended/archived under the
   standing doc-hygiene law rather than deleted;
4. every check run, its result, and the deliberate failing control for each new
   instrument; a rerun is never used to erase or conceal a red result. For the
   current v2 UI contract, retain the exact-run slice-smoke report/log/screenshots,
   the 12-viewport glass report including 8K, and the matching-provenance automated-
   persona JSON/Markdown; automated personas never count as a human playtest;
5. open findings, the exact next implementation/retest step, and its owner;
6. for a human preview, the separate origin, full source commit, `preview.json`
   content hash, tester/device lens, and the committed report under
   `port/playtests/`.

The development preview is evidence and a play surface, not a Git transport or
source of truth. Never copy code back from a hosted preview. Build it from a
clean exact commit using `port/v2/tools/devpreview.mjs`; the clean path builds
from an isolated `git archive` snapshot of exact HEAD rather than mutable
working-tree bytes. Automatic branch-site publication is parked. A future
publisher may update only one mapped origin after separate authorization for an
exact tested SHA; candidate publication still follows `port/DEVELOPMENT_PREVIEW.md`,
and the production
`celestialfrontier.github.io` origin remains isolated. A preview URL,
artifact name, or mutable “latest” label never replaces the full commit and
content hash. Development identity is **v2.0 development** plus the full source
commit inside the in-game Guide only; no floating corner badge is allowed. The
runtime origin refusal, noindex/robots policy, exact-input manifest, byte inventory,
shared version record and generated site `version.json` remain mandatory.

`npm run overridecontrol` is an **exclusive, transient source-mutating gate**.
It must never overlap Vite, a browser run, screenshots, packaging, or any other
evidence producer in the same worktree. Compliant mutators/builders acquire the
shared `port/v2/tools/workspacelock.mjs` lock and fail with the current owner
instead of waiting or retrying. `smokereport` owns one lock for its full evidence
lifetime, passes a validated single-child inherited lease to `slicesmoke`, and
retains that same ownership through the exact run, screenshot hashing and report
finalization. The child must not acquire an unrelated second lock, and the lease
must not be reusable by another process or child. If an older/unintegrated tool
does not yet use the shared lock, sequence it explicitly; a clean status on both
sides cannot detect a temporary edit that was built and then restored.

## Releases

`develop` reaches `main` only at a user-approved release. Agents never write either
Pages repository directly. Automatic branch publication is parked under the Actions
budget gate. A future promotion workflow must be separately reviewed, explicitly
authorized for one exact tested SHA and one isolated target:
`main` → `CelestialFrontier/celestialfrontier.github.io` or `develop` →
`Dev-CelestialFrontier/dev-celestialfrontier.github.io`. The development site is a
public, noindex play surface—not human-play, Ready, merge, release, or production-
deployment authority. The 2026-08-13 standing approval does not spend Actions budget,
permit manual Pages writes, or expand the release boundary. `main` continues
to publish the immutable root v1.8.9 HTML. `develop` publishes the browser-smoked exact
`port/v2` package with a v2.0 development identity; v2.0 is not a shipped version,
`V2_CURRENT_RELEASE_VERSION` remains `null`, and no update popup may result.
