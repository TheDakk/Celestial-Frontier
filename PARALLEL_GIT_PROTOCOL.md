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
| OpenAI/Codex on macOS | `openai/mac` | `/Users/nick/Projects/celestial-frontier-openai-mac` |
| Anthropic/Claude Code on macOS | `anthropic/mac` | `/Users/nick/Projects/celestial-frontier-anthropic-mac` |

`develop` is the integration branch. `main` is the production branch.
Neither agent may commit directly to either one.

## Fail-closed workspace identity

The app, operating system, physical Git root, and branch form one identity.
Before any read that informs work, edit, test, commit, fetch, or GitHub write,
the agent must identify itself as OpenAI/Codex or Anthropic/Claude Code,
identify the host OS, and match exactly one ownership row above.

1. Resolve the physical current directory and `git rev-parse --show-toplevel`.
   Both must be the row's exact folder after normalizing Windows slash direction
   and drive-letter case. A similarly named folder, symlink to another
   worktree, parent directory, or another agent/OS worktree is not accepted.
2. Require `git branch --show-current` to equal the row's exact branch and
   confirm that branch tracks its matching `origin/<branch>` before syncing or
   publishing.
3. If any element mismatches, stop before fetching or changing files. Report
   the actual app, OS, physical root, branch, and expected row to Nick.
4. Do not work around a mismatch with `cd`, branch switching, editor workspace
   switching inside the task, copying files, or by retargeting another
   worktree. Close or leave the incorrectly opened task and reopen the app on
   its owned folder. This is especially important when Codex was launched in
   an `anthropic/*` folder or Claude Code was launched in an `openai/*` folder.
5. The preflight and final handoff record the verified row verbatim. “Correct
   repository” without the app/OS-qualified folder and branch is insufficient.

## GitHub SSH authentication

All four agent worktrees use the SSH origin
`git@github.com:TheDakk/Celestial-Frontier.git`. The private key stays in the
local 1Password SSH Agent; never export it into a worktree, copy it between
machines, print its public-key blob in a handoff, or silently fall back to an
HTTPS credential or personal access token.

Each Mac and Windows environment must pass this fail-closed preflight before
its first GitHub write, and repeat it after an OS, OpenSSH, 1Password, SSH-key,
or Git remote change:

1. Confirm `git remote get-url origin` is the exact SSH URL above.
2. Verify GitHub's presented host-key fingerprint against
   <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints>
   before accepting a new or changed host key. A changed unverified key stops
   the batch.
3. Run `ssh -T -o BatchMode=yes git@github.com`. Success is GitHub's exact
   authenticated-account message followed by its intentional exit status `1`
   because GitHub provides no shell; an authentication, agent, account, or
   host-key error is red.
4. Run `git ls-remote origin HEAD`. It must return one full commit and exit
   zero, proving that the same SSH path can read this repository.
5. A normal `git fetch origin` then serves as the batch's repository-level SSH
   read check. Before an authorized push, re-run the two explicit probes only
   when the agent/socket/config changed or the fetch exposed an SSH error.

`ssh-add -l` is diagnostic, not the decisive test: on macOS it can query
Apple's default `SSH_AUTH_SOCK` even while OpenSSH correctly follows a
per-host `IdentityAgent` entry for 1Password. Inspect the effective
`ssh -G git@github.com` configuration or query the explicit 1Password socket
when diagnosing that mismatch. On Windows, use the 1Password/OpenSSH agent
integration configured on that machine; do not assume the Mac socket path.
Record only the account name, pass/fail result, remote URL, and repository SHA
in the handoff—never private-key material.

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

1. Pass the exact app × OS × physical-root × branch check in the fail-closed
   workspace identity section. Stop and reopen the correct workspace if any
   element does not match; never continue from another agent's folder.
2. Verify the worktree's SSH origin and authentication under the GitHub SSH
   section above when this environment has not yet established that proof.
3. Read `GITHUB_ACTIONS_BUDGET.md`, record its current mode, then read
   `ROADMAP.md`, including its live session handoff, then
   `PROCESS_LAWS.md` and the agent's normal instructions (`AGENTS.md` for
   Codex; `CLAUDE.md` for Claude Code). Follow the roadmap's pointers to the
   system/reference Markdown relevant to the assigned task. Do not load every
   historical Markdown file indiscriminately.
4. Run `git fetch origin` only when a current remote comparison is needed and
   inspect `git status --short --branch`. Fetch/read-only metadata does not use
   runner minutes, but do not poll GitHub repeatedly while frozen.
5. Only if the worktree is clean, safely bring the current branch up to date
   with its remote and merge the latest `origin/develop` into the current
   agent branch when needed. `.github/workflows/sync-agent-branches.yml` is
   manual-only under the budget gate; do not expect GitHub to move an agent
   branch. A branch carrying unmerged agent work is synchronized only by this
   explicit local merge step.
6. Never use `git reset --hard`, `git clean -fd`, rebase, force-push, or any
   operation that discards work. If Git reports a conflict, stop and report
   it unless the user explicitly asks for conflict resolution.

## Required preflight reminder to the user

Before editing, the agent must give the user a short preflight report that
states:

1. The exact verified ownership row: app, OS, physical folder, branch, and
   matching upstream branch.
2. The exact SSH origin plus the last Mac/Windows authentication and repository
   read result for the environment performing the work.
3. Whether the worktree is clean and synchronized with its upstream and the
   latest `origin/develop`.
4. Which core and task-relevant Markdown files it read.
5. The current roadmap/handoff objective it intends to work on.
6. The integration path: current agent branch → draft pull request →
   `develop`; later `develop` → `main` only with user approval.
7. The Actions budget mode, repository visibility/billing assumption, standing
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
6. Report the commit hash, files changed, checks run, SSH account/remote/read
   result, budget mode, estimated hosted cost, authorization state, and push
   result or explicit no-push result.
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
As of 2026-08-23, the active `develop` ruleset names `battery` as its only required
status context; `branch-flow-guard` is a manual diagnostic, not a merge prerequisite.
That context is profile-aware but never weaker than its destination: agent → `develop`
runs the final-head V2 static admission plus Compendium and the immutable Slice → Glass
chain, adding the legacy root gate when those tracked inputs changed. SceneMemory live native-heap
work is production-only/quarantined and requires a later explicit activation decision; its
deterministic mutation controls remain universal. `develop` → `main` is a separate production
authorization and adds the strict live selftest, SceneMemory certification, exhaustive instrument
controls, Recovery and package smoke. A manual development preview is not another battery
and cannot supply this context. Do not manually repeat an aggregate command or instrument
selftest that the selected profile already owns.
Do not request or wait for a second review/guard/merge approval after that exact
battery is terminal-green. A new changed head still needs Nick's separate exact
Actions-attempt authorization.
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
   Before a PR receives its one-run label or is marked Ready, its title and
   description must be refreshed to cover the accumulated exact head: player or
   technical purpose, root cause when repairing a defect, bounded scope,
   completed and pending verification, retained evidence/authority where
   relevant, base/head, cross-agent synchronization, and release boundary.
   After terminal merge, update that same description with the exact run result
   and merge commit. A stale description from an earlier partial batch is not a
   complete PR description.
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

Every Arc update is incomplete until all affected current Markdown/reference docs are synchronized
and the lean `ROADMAP.md` contains a self-contained fresh-session handoff usable interchangeably by
OpenAI/Codex or Anthropic/Claude without chat or app-private context.

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
4. every check actually run, its result, and the deliberate failing control for each new
   instrument; a rerun is never used to erase or conceal a red result. Ordinary coding batches do
   not pay a browser tax. When a final develop admission runs, retain the exact-run Slice report/
   log/screenshots and the 12-viewport Glass report including 8K. If an on-demand automated-persona
   review runs, retain its matching-provenance JSON/Markdown separately; personas are not required
   for `battery` and never count as a human playtest;
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
