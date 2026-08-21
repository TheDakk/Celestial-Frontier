# GitHub Actions Budget Protocol

**Current mode: `UNFROZEN` — no hosted attempt authorized**

**Repository billing state: public as of 2026-08-20.** Standard GitHub-hosted runners are free while
the repository remains public; larger runners and storage are separate billable surfaces. Nick
initially set this mode after exhausting the private-repository monthly allowance of **3,000**.
Treat 3,000 as the hard cap whenever the repository is private or billing status is ambiguous.
Nick lifted `FROZEN` on 2026-08-20 for the bounded PR #32 integration preparation. Hosted work is
still batched and owner-authorized rather than fired on every edit; lifting the freeze does not by
itself authorize a hosted attempt. Only Nick may change this mode, visibility assumption,
private-repository cap, or authorize one exact hosted run.

## What `FROZEN` means

- Do not dispatch, rerun, cancel-and-restart, or otherwise cause a GitHub Actions workflow to run.
- Do not push to an open pull-request branch, merge to `develop` or `main`, apply the battery label,
  publish a preview/site, or make an empty “CI kick” commit. Those operations may create hosted work.
- Continue implementation, review, tests, exact-head browser evidence, and commits locally. Batch
  finished work into one frozen head instead of publishing every intermediate commit.
- Missing hosted checks remain blockers. Exhausted budget is never permission to bypass branch
  protection, reuse stale evidence, merge a red/unfinished PR, or call local evidence “CI.”
- A monthly reset is never inferred from the calendar. The mode remains `FROZEN` until Nick says
  otherwise in the current task; Nick lifted it on 2026-08-20, without yet authorizing a run.
- A locally activated ruler or terminal-green exact-head local battery does not change `FROZEN` or
  authorize a push, label, hosted run, merge, publication, or deployment.

Git fetches and read-only GitHub metadata do not consume runner minutes, but agents should not poll
GitHub repeatedly while frozen. No GitHub write is allowed merely because it is cheap.

## Agent token conservation

This efficiency rule applies equally to OpenAI/Codex and Anthropic/Claude Code:

- use the shortest update that preserves decisions, evidence, blockers, and the exact next action;
- read only the live handoff and references needed for the scoped change; do not replay archived
  history or repeat unchanged audits/status;
- batch independent reads and checks, delegate only concrete bounded work, and avoid parallel agents
  when coordination would cost more than the task;
- stop when the stated acceptance checks pass; do not open another diagnostic, rewrite, or polish
  loop without a new finding;
- ask Nick before a broad exploratory or rework loop whose token cost is materially larger than the
  scoped implementation.

## Hosted workflows are fail-closed

The following **local and not-yet-pushed guarded design** makes ordinary pushes, PR synchronization
events, branch merges, and successful batteries start **zero hosted runners by default** once it is
committed to GitHub:

- `.github/workflows/test.yml` has one tiny, two-minute owner/branch authorization job followed by
  one fail-fast serial battery. The battery is eligible only when the repository owner adds exact
  label `actions-budget-approved` to a PR and the branch/fork authorization succeeds. Only that
  successful dependency may emit the required `battery` check name; rejected/skipped events use
  `budget-not-authorized`. Static/root checks run before Edge/Chrome work, each dependency tree
  installs once, and the first red stops later work. The separate authorization job preserves the
  sealed Compendium owner's no-`if` workflow contract.
- `branch-flow-guard.yml`, `sync-agent-branches.yml`, and `dev-preview-package.yml` are manual-only
  and default to `DO_NOT_RUN`. Their runner-owning authorization also requires the repository owner;
  preview uses the same tiny authorize→sealed-owner dependency as the main battery.
- `publish-branch-sites.yml` is manual-only and additionally hard parked. Neither production nor
  development publication can run until a later reviewed exact-SHA promotion contract removes its
  explicit false guard.
- Every workflow partitions concurrency by authorization and actor. An unrelated/default/non-owner
  event cannot cancel an owner-authorized run. A genuine duplicate authorization cancels the older
  run instead of allowing two hosted batteries to continue; protocol still treats that cancellation
  as a consumed attempt and forbids replacement without a changed head and fresh authorization.

The local gate is:

```text
node tools/actions-budget-policy.js --selftest
```

It inventories every workflow, parses direct YAML ownership by indentation, rejects unknown/quoted
workflow keys and automatic triggers, requires false-default owner-only manual authorization, binds
the authorize result to the required battery name, seals standard runners/time ceilings/no-matrix
execution, proves publication remains parked, and mutation-tests every job guard. `node
tools/validate.js` also runs the real policy check before the normal validation battery.

## One-run authorization after the freeze

Nick lifted `FROZEN` on 2026-08-20. The exact one-run authorization record below remains required
before any PR #32 push, approval label, hosted run, or merge.

When Nick explicitly lifts `FROZEN`, he may authorize exactly one hosted attempt. Before any GitHub write, the
handoff must record:

1. current budget mode, repository visibility/billing assumption, and standing private cap;
2. workflow name, PR number/ref, full head SHA, base SHA, and the exact approval label or manual token;
3. configured worst-case runner ceiling and why hosted evidence is still needed after local gates;
4. proof that no run for that exact authorization is queued or in progress;
5. one-attempt/no-retry stopping rule and the owner who will remove the approval label afterward.

`test-battery` currently has a two-minute authorization runner plus one battery capped at 90 minutes,
with the Compendium certification step independently capped at 40 minutes. The old parallel form
could start seven runners with 175 combined
configured job-minutes on every PR update, then repeat on `develop` and fan out into sync/publication.
That automatic fanout is retired. Parallel wall-clock speed is not worth multiplying finite hosted
minutes or letting unrelated jobs continue after the first deterministic red.

## Safe rollout of this local guard

These protections do not affect GitHub until their commit reaches the repository. The remote branch
still contains the old automatic triggers, so do not push this transition without Nick's explicit Git
handoff authorization. Because the repository is now public, standard hosted-runner minutes are free;
repository-wide Actions disablement is no longer needed merely to protect the private 3,000-minute
allowance. Only after Nick explicitly lifts `FROZEN` and authorizes that exact Git write, land the
guard in one intentional push, verify the remote workflow bytes without dispatching them, and
leave the approval label absent. If the repository becomes
private again before rollout, stop and re-evaluate the remaining private allowance first. Disabling
Actions remains a broad persistent setting change and still requires explicit approval of that exact
consequence.
