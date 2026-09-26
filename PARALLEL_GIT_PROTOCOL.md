# Parallel Git Protocol

This protocol governs coordinated work by OpenAI/Codex and Anthropic/Claude
Code on Celestial Frontier. It is deliberately conservative: agents can
prepare their own work and publish it only through the budget-authorized path,
with the standing green-PR authorization defined below; no release authority is
implied.

## Current operating model — Nick, 2026-09-25 (supersedes older lane handoffs below)

This reference matches the explicitly adopted operating model in Claude's
`audits/OPERATING_MODEL_20260925/README.md`. Each lane writes only its own
worktree. At EVERY run start and batch end, Codex reads the absolute read-only
`/Users/nick/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md`
and replies in its own `audits/MAILBOX/TO_CLAUDE.md`; Claude does the reverse.
State done, blocked, or in-progress delivery truthfully, with evidence paths and
concrete requests. Nick is not the message courier.

The shared Git object store exposes signed commits immediately. Use
`git log HEAD..anthropic/mac` from Codex's lane (Claude uses `HEAD..openai/mac`).
Merge signed lane results `--no-ff`, hand-reconcile, and retain both histories
when the required local battery stays green; do not wait for a push or Nick's
relay. Finish and sign local work before merging. Never edit the other worktree.
Push only the owned branch to its matching origin branch after the required
local battery is green and the budget/workflow-trigger check permits it.
These standing lane merge/push permissions supersede older no-sync/no-push and
PR-before-cross-lane-sync descriptions in this reference for this sprint.

Large batches continue through local work. Questions are batched into the end
report. PRs, labels, hosted attempts, merges to develop/main, releases and
deployments remain explicit gates. Claude's signed mailbox decision records D5
as at most one label cycle per day per PR only with the WHOLE local gate list
green (including overridecontrol); no red, stale, missing or ambiguous evidence
may be bypassed, and the exact budget authorization/attempt record remains
required. D6 keeps battle2 flagged until the iPhone probe and v2 certificate.
D1's later signed decision authorizes the ranked painting order with one sheet
per ten, not per-paint approval; delivered paintings still need their evidence.
A mailbox acknowledgment never claims a pending delivery or certificate passed.

## Disk-space law — Nick, 2026-09-26 (IMPERATIVE; both lanes)

On 2026-09-26 the 460 GB Mac disk reached 100 % (ENOSPC). Claude's shell died, and Codex's running lane was at risk. The causes:
- 16 finished agent worktrees of about 10 GB each, never removed (the harness LOCKS them, so a single `git worktree remove --force` silently fails);
- a 9.5 GB stash an agent parked;
- stale I5 worktrees in `/private/tmp`;
- about 20 GB of old preview packages.

It must never happen again. Every batch, in either lane:
1. **Check at the start AND the end:** `df -h /System/Volumes/Data`. Keep at least **40 GiB free**. Below **60 GiB, clean up before starting anything new**. Below 40 GiB, stop and clean first. Report the free space in every batch packet.
2. **Remove every temporary worktree the moment its work is merged or abandoned.**
   - Verify its HEAD is an ancestor of your lane head first.
   - Then `git worktree remove --force --force <path>` (twice: agent worktrees are locked) and `git worktree prune`.
   - At most **4** live temporary worktrees per lane. Cut new ones from the lane head, not `develop`.
3. **Never park large stashes.** If a stash is unavoidable, tag it, drop it by tag the same batch, and never stash harness-populated files.
4. **Prune ignored build output every batch:** keep only the newest 2 `apps/game/smoke/dev-preview-*` packages, and delete superseded native/film scratch output. Only ignored files: run `git status` afterwards and confirm nothing tracked changed.
5. **Measure before committing heavy evidence.** Keep films/webm in Git only when they are the named acceptance evidence. The branch already carries ~2.9 GiB of films. Prefer a retained hash plus a scratch copy.
6. **Model caches and node_modules copies** (`cp -cR`) count too. Remove a worktree's copy when the worktree goes.

## Long-session decision override — Nick, 2026-09-13

No new branches. Prune on openai/mac first; the three promotion tiers into develop use merge
commits, not squash: production UI, painted landfall engine, research tooling as tools.
Audits LFS migration is approved in principle for Codex to perform on openai/mac only when
Nick says go; no history rewrite is authorized now. GitHub step remains none until C5 and
requires the exact write authorization; PR42 stays parked. Prior squash/pending-decision and
bounded-review-branch directions below are superseded for this session. The remaining clean
promotion and release gates still apply.

Nick reports anthropic/mac now contains Codex history. Claude owns new motion/, effects/,
battle2/, soundkit/, worldlife/ modules and their tests; Codex must not edit those paths.
Any main.ts hunk must be announced in its commit message. WORK_ORDER.md supplies the shared
rig runtime interface and package evidence requirements; it was received verbatim September13
at audits/LONG_SESSION_20260913/WORK_ORDER.md. Nick's direct no-new-branches instruction remains
controlling; the document's temporary-subagent allowance does not require delegation.

## Local motion repair scope — September 16

After the real-family review identified the motion ownership blocker, Nick instructed Codex
to fix all possible defects and build the mixed-habitat battle. This authorizes the narrow
local motion anatomy/habitat repair on openai/mac. A source-hashed motion snapshot is imported
for local compilation; anthropic/mac remains read-only. Other reserved modules remain reserved.
No kit change, branch operation, merge or GitHub write follows from this scope.

## Current clean promotion plan — Nick, 2026-09-12

Prune superseded code and pack assets on `openai/mac` before splitting PR42. The split is
three ordered tiers, each merged with a merge commit into `develop`: production UI; painted
landfall engine; research tools merged as tools (September13 work order supersedes squash). Follow with one `develop` → `main` release PR running the full chain.
Do not make any PR Ready until the Civet 2D proof, the second weather pick and the phone-tier
decision have landed. This records the future order only: PR42 remains parked and no GitHub
write, hosted attempt, merge, release or deployment is currently authorized. Exact hosted
and release authorization requirements below still apply. Audits LFS migration is approved in principle and awaits Nick's explicit go, not a new
separate decision; do not rewrite history without it.

## Standing run authority — Nick, 2026-09-21 ("let's go with your recommendation")

Each lane's NEXT RUN is written in `ROADMAP.md` under `### Codex (openai lane)` and `### Claude` as the canonical
instruction (ordered stages, the halt rule, the report). Nick authorizes it by saying **"go"** in that lane's app;
no relayed prompt is needed. Rules that do not change: S2 (a shared-path red) is the only internal halt; commit
signed at each stage; no push, PR, merge, release or deploy is authorized by "go" (those stay under
`GITHUB_ACTIONS_BUDGET.md` and Nick's explicit words); a run that needs a decision writes it under `### Nick` in
`ROADMAP.md` and stops there. Two laws that shrink the per-creature work: (1) a creature's presence declaration
(`hidden` / `absent` / `folded`) is written by Codex from the painting or by the painting prompt — never by Nick;
(2) the roster goes through the intake compiler in one batch once IC-4 passes, and Nick reviews a sheet, not
creatures one by one.

## Ownership

| Agent environment | Allowed branch | Allowed folder |
| --- | --- | --- |
| OpenAI/Codex on macOS | `openai/mac` | `/Users/nick/Projects/celestial-frontier-openai-mac` |
| Anthropic/Claude Code on macOS | `anthropic/mac` | `/Users/nick/Projects/celestial-frontier-anthropic-mac` |

**Mac-only since 2026-09-26 (Nick).** The Windows lanes (`openai/windows`, `anthropic/windows`) are retired: their branches are deleted on GitHub and on both machines. Never push to, merge from or recreate them. Historical records that mention them stay as history.

`develop` is the integration branch. `main` is the production branch.
Neither agent may commit directly to either one.

**Bounded review branches (policy decision 2026-09-05, Claude under Nick's authority):** when an
agent's machine branch is occupied by unrelated in-flight work, that agent may carry one reviewed
candidate to `develop` on a branch named `openai/review-*` or `anthropic/review-*`. Such a branch
is still owned by the same agent, is pushed only from that agent's own worktree above, is admitted
into `develop` by the sealed branch-flow validator exactly like the four machine branches, and
never flows into `main`. It is not synchronized by the fast-forward workflow and is left dormant
or deleted after its merge. Every other rule here (no direct commits, no force operations, exact
hosted authorization, paired handoff) applies to it unchanged.

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

## Commit signing and GitHub transport

Verified September25 on this Mac: shared REPOSITORY config uses SSH commit
signatures with `user.signingkey=~/.ssh/cf_agents_signing.pub` and
`gpg.ssh.program=~/.local/bin/git-ssh-sign-cf`. The dedicated agent key is loaded
from the macOS login keychain; it no longer depends on 1Password. Nick reports
that GitHub has the public key registered for signing. Global 1Password config
is untouched. Do not recreate keys, modify either signing wrapper, reveal key
material or credentials, or revert the repository to the old wrapper.

Never commit unsigned. No `--no-gpg-sign` or `commit.gpgsign=false`. Verify
configuration with `git config --show-origin --get gpg.ssh.program` and
`git config --show-origin --get user.signingkey`. The one-time throwaway proof is:

```sh
git log -1 --format='%G?' "$(git commit-tree -S -m check "$(git rev-parse 'HEAD^{tree}')")"
```

It must print G; quote the format for zsh. The completed Codex proof is recorded
in audits/OPERATING_MODEL_CODEX_20260925/verification.json; do not repeat it every
message. Signed commits still require approved execution outside Codex's
read-only .git sandbox. If signing fails, diagnose the keychain/macOS-agent
path and exact error; do not ask Nick to unlock 1Password or silently fall back
to unsigned commits. Do not enable sandbox network access just for signing.

`origin` is `https://github.com/TheDakk/Celestial-Frontier.git`, using the
already-logged-in GitHub CLI credential helper and macOS keychain. No SSH
1Password authentication probe is needed for this transport. Verify the remote
and read access as needed before an authorized write; never print/export tokens
or silently switch transport/credentials. The canonical setup instructions are
Claude's audits/OPERATING_MODEL_20260925/setup-agent-signing.sh; setup has already
been completed and is not a recurring task. Do not reinstall it on every run.

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
`actions-budget-approved` PR label (bounded agent lane on `develop`, full chain on
`main`) or `actions-full-chain-approved` PR label (full chain on `develop`), or
authorizes the manual workflow token. Never
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
2. Verify the repository signing wrapper and HTTPS origin under Commit signing
   and GitHub transport above; reuse the completed one-time signature proof.
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
7. On the first coding batch of a new game-development session, complete
   `UI_TOOLCHAIN.md`'s coding-session startup runbook before code/build/render work:
   check official stable availability, apply eligible approved authoring-tool updates
   under the shared lock while tools are idle, verify changed capabilities, and record
   the result or explicit deferrals. Reuse that receipt within the uninterrupted session;
   do not repeat updates on every message or attach them to a chat/timer. Each machine
   needs its own verified inventory. Game/runtime/test locks, sealed inputs and GitHub
   authority remain unchanged. This instruction does not interrupt existing jobs.

## Required preflight reminder to the user

Before editing, the agent must give the user a short preflight report that
states:

1. The exact verified ownership row: app, OS, physical folder, branch, and
   matching upstream branch.
2. The configured origin/transport, active signing wrapper and relevant repository
   read result; never expose credential or key material.
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
That context is lane-aware but never weaker than its destination: under
`actions-budget-approved`, agent → `develop` runs the bounded agent lane (the final-head V2
static admission plus the two immutable phone Glass canaries, adding the legacy root gate when
those tracked inputs changed); under `actions-full-chain-approved` it also runs Compendium and
the immutable Slice → Glass chain. SceneMemory live native-heap
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

## Required paired handoff through mailboxes

At batch end, reread the opposite mailbox by its absolute read-only path and
reply in the current lane's mailbox with item status, evidence paths, signed
commits and precise next requests. New decisions can arrive during the batch;
reconcile them before signing the handoff. Each lane consumes the other's signed
commits directly from the shared store, under the current green-battery merge
rule. Nick need not open the other app or relay the packet.

The end report states the current lane result, what the other lane needs next,
any true user-only gate, and whether a GitHub write occurred. Never claim that
another lane, develop/main or the live site contains a change merely because it
was committed locally. For an actual proposed PR, include exact base/source,
copy-ready title/description and tested source identity. Update stale PR text
before any approved hosted attempt. No new PR is implied by a mailbox exchange.

## How changes move between agents

Machine lanes merge signed commits from the shared local object store directly,
with --no-ff and hand reconciliation, after local validation. A remote push is
not a prerequisite for local visibility. The owned branch can then be pushed
under standing green-battery authority. Integration into develop/main and any
release still follow their separate explicit gates. Each agent remains solely
responsible for edits and merges in its own worktree.

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
