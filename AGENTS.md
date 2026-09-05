# AGENTS.md — Celestial Frontier

**GitHub Actions budget gate:** read `GITHUB_ACTIONS_BUDGET.md` before any
GitHub write. Its `FROZEN` mode overrides generic push/merge/dispatch/publish
instructions in this file: work and commit locally, but do not push, label,
dispatch, rerun, merge, or publish until Nick explicitly authorizes one exact
hosted attempt. The repository is public as of 2026-08-20, so standard hosted
runners are free while it stays public; `FROZEN` remains an efficiency/intent
gate, and the 3,000 cap applies fail-closed if visibility changes. Never infer a
monthly reset or visibility change.

**Agent token conservation:** OpenAI/Codex and Anthropic/Claude Code both use
concise updates, relevant-only reads, batched checks, and only bounded delegation.
Do not repeat unchanged status/audits or continue after acceptance is met. Ask
Nick before starting a materially larger exploratory or rework loop.

Single-file HTML/Canvas game. **Read `ROADMAP.md` first** (current state,
what's awaiting feedback, what's next — and update it at the end of every
work batch), then **`PROCESS_LAWS.md`** before touching UI or tests — it holds the laws this
project paid for with shipped defects and with checks that went green while the thing they
guarded was broken (multiple documented cases so far). Extracted from the roadmap 2026-07-30; it is a
*reference*, so it is refreshed in place and never archived.
ROADMAP is kept lean: it holds ONLY the live session handoff. Completed
batch logs + superseded handoffs live in `ROADMAP_ARCHIVE.md` (history, newest-first,
nothing deleted) — read it only when you need the *why* behind a past batch. At the
end of each arc (or when ROADMAP.md passes ~400 lines) move aged-out batch blocks to
the archive's top and refresh the handoff — see the ROADMAP HYGIENE pin in ROADMAP.md.
Then consult `celestial-frontier-codebase-reference.md` for deep detail (architecture §3,
combat math §6, save format §10, audio §9 → AUDIO.md), and the per-system docs (see the PINNED list in ROADMAP.md)
for current system behavior. If the source and the reference disagree, the source wins — then
update the reference. (`HANDOFF.md` and `celestial-frontier-feedback.md` are FROZEN v1.0
artifacts kept for history — not current state; don't read them for live truth.)

## Doc hygiene — "logs archive, references refresh" (standing principle)
Two kinds of markdown, two disciplines. **Logs** are chronological/append-only (ROADMAP, any
changelog or dev-history): keep the recent entries live, move aged ones VERBATIM to a sibling
`*_ARCHIVE.md`, newest-first — never delete. **References** describe current system state (the
per-system CAPS docs, codebase-reference): never archive them (that fragments a system's
description); instead carry a `matches code as of <date>` marker and update them IN THE SAME
BATCH as the code (per rule at top of ROADMAP.md). When a doc grows unreadable, first ask which
kind it is — the answer picks the fix.

Every Arc update is incomplete until all affected current Markdown/reference docs agree and
`ROADMAP.md` ends with a self-contained fresh-session handoff. That handoff must let either
OpenAI/Codex or Anthropic/Claude resume without relying on chat or app-private context.

## The v2.0 port — ★ PLAYABLE PHASE-4 SLICE
**`port/`** holds the committed port plan — `PORT_MASTER_PLAN_v4.0.md` (§20 execution phases, §22 Gates A–I, §23 open items, §16 data architecture), the reviewer delta `v1.9-port-update.md`, addenda A–D, **`DECISIONS.md`** (Nick's resolutions to §23 — decided ≠ implemented; they land in the port), **`RUBRICS.md`** (gates A–I as [EXEC]/[EXEC-TODO]/[HUMAN] criteria), and **`baseline-v1.8.9/`** (Gate A evidence: golden seeds, code fixtures, audio profiles, budgets, 28 golden screens).
**Phase 0 is COMPLETE on the automatable side; all 14 planned deterministic domain facades are present, and current development is a playable Phase-4 Pixi/browser slice in `port/v2/`.** That is the current implementation boundary, not a claim that Gates B–D are literally closed. The verbatim port rule, lifter (`port/v2/tools/lift.mjs`) and both fixture sources remain the conversion foundation. The browser-free profiles are owned by `node tools/check-profile.mjs --profile=dev|develop|production`; each selected owner runs once. The `develop` admission browser boundary runs the sealed Compendium certificate, then one immutable **Slice → Glass** chain on the same unchanged clean committed source. An agent → `develop` PR reaches that boundary only under the on-demand `actions-full-chain-approved` label; the default `actions-budget-approved` agent lane stops after the browser-free `develop` profile and the two phone Glass canaries, and every `develop` → `main` run takes the full chain. SceneMemory live native-heap work is production-only/quarantined and never blocks `develop`; its deterministic contract and mutation controls remain universal. Production runs the strict live heap-phase selftest first. A production/release candidate runs **SceneMemory → Compendium → Slice → Glass → Recovery** on unchanged source, passing both exact predecessor IDs to the one uninterrupted recovery run and named-verifying every available report; it requires an explicit future SceneMemory activation decision. Stop after any nonzero, red, or instrument result; do not run the next stage or automatically retry. Instrument selftests run once in the profile that owns them, not again before every unchanged certificate. `port/v2/README.md` owns the copy-ready commands and full current battery tiers. A human-test package follows `port/DEVELOPMENT_PREVIEW.md`, uses a separate origin, and is not a second certification battery. Root-level fixture gates: `npm run preflight` / `goldenseeds` / `codefixtures` / `audioprofiles`.
⚠ The plan was lost once as a session-scoped upload, leaving annotations that cited sections of a document nobody could read. **Anything we reason about gets committed the same day** (the rule `audits/` already encodes for external review bundles).
⚠ Section numbers from the older v3.1 (§26 / §27.3 / §28.5, quoted throughout ROADMAP_ARCHIVE) do **not** map to v4.0.

## Project layout
- `celestial-frontier.html` — the entire game (**~26,750 lines / ~1.93 MB**; **TWO** `<style>` elements — append to the **LAST** — then markup, then one `<script>` from **~line 2,420**). `main.js` is ~24,330 lines. No build step, no runtime dependencies. Run by opening in a browser. *(Counts corrected 2026-07-30: this line still said "~8,000 lines; one `<style>`, one `<script>` from ~line 948", which was off by 3× and contradicted rule 4's own two-`<style>` warning. Re-measure it when it next feels wrong rather than trusting it.)*
- The script is organized on SOLID lines (see the ARCHITECTURE comment at its top): `@module … [domain]` blocks are pure/deterministic revealing-module IIFEs (Rand → WorldGen → Genome → Descriptors → CombatCore, …); `@module … [app]` blocks are art/service modules (ThumbArt, GalaxyArt, SpeciesArt, Fx, SaveSystem, Renderer); `@section` blocks are UI/state/wiring. Put new code in the unit that owns the concern. A module's non-exported names are private; to export one more, extend the banner's `API:` line, the `Object.freeze({...})` return, and the destructuring line beneath it (all three list the same names).
- `celestial-frontier-codebase-reference.md` — full technical reference, keep it in sync with the source.
- `tools/` — verification toolkit (`npm install` once, then see `tools/README.md`). Root and `port/v2` installs both declare/lock the raw-CDP `ws` transport and support Node `^20.19.0 || ^22.13.0 || >=24.0.0`. ⚠ **`npm install` is NOT enough** — `uilayout.js` and `bootperf.js` drive a **real system browser** over CDP (no Playwright/Puppeteer anywhere in `tools/`), so a clean clone silently gets only seven of the nine suites. Root `uilayout.js` uses the shared v2-owned resolver/launcher and writes ignored exact-run/browser evidence; run its fail-closed selftest before the gate. `bootperf` shares the resolver and `ws` but retains its legacy CDP lifecycle. **On macOS, request approved out-of-sandbox execution on the first attempt for every browser-owning command**; Chromium aborts during LaunchServices registration inside Codex Seatbelt, and the shared launch guard now refuses before spawn so it cannot create another Edge crash report. **Run `npm run preflight:selftest` and `npm run preflight` on any new machine**; preflight accepts a canonical Chromium-family product at CDP `1.3` only after exercising the source-derived method inventory used by both root browser gates and recording complete executable/product/version/revision/UA/JS/protocol provenance. Its selftest accepts older/current/synthetic-future Edge plus Chrome/Chromium controls and rejects family, protocol, provenance, capability and executable-non-browser mutants. **Point version is provenance only:** a compatible browser update never triggers a root rebaseline or threshold change. The exact Edge package used by the isolated Compendium workflow is separate deterministic provisioning and does not repin root Gate A.
- **Live site:** https://celestialfrontier.github.io/ — deployed from the sibling repo clone at `..\celestialfrontier.github.io` via `node tools/deploy.js` (run only after validate + smoke pass, and only at user-approved milestones). This repo is the source of truth; never edit the site repo directly.
- **DEPLOY CHECKLIST — push the SOURCE repo too, only inside one explicitly budget/protocol-authorized release.** `tools/deploy.js` pushes the **site** repo, not this source repo. The authorized release sequence is: (1) commit the source release here, (2) `node tools/deploy.js` (pushes the live site), (3) **`git push origin main`** to sync the source repo. Skipping step 3 once a deployment is authorized silently leaves the source remote behind (it once drifted 97 commits). While `FROZEN`, perform neither push nor deployment.
- `original/celestial-frontier-v1.0.html` — pristine pre-refactor build (the determinism baseline was captured from it).

## Hard rules
**Version scope (matches code as of 2026-09-04):** legacy HTML/`main.js`, `HARVEST_CD`,
the v1 save key and consumed-breeding-parent descriptions below refer to production **v1.8.9**.
V2 uses its versioned persistence/active-play owners and **nonlethal individual-parent breeding
with recovery**, per `port/DECISIONS.md` and `BREEDING_AND_SHARING.md`. Do not port a v1 invariant
back over an approved v2 change. Shared determinism, protected-save, exact-outcome, mobile-first,
documentation and authorization rules still apply to both. The original fourteen Phase-0 facades
are a completed milestone, not the current total package count.

1. **Never break determinism.** All world/genome/descriptor content derives from seeds (`mulberry32`, `hashInt`, `cellRng`). No `Math.random()` / `Date.now()` in anything that feeds generation, or share codes and cross-device parity break.
2. **Edit by exact, unique string match only.** Verify match count before writing; a bad match must never silently corrupt the file. Work on a copy, not in place.
3. **Encoding caution:** the source mixes literal `\uXXXX` escape text in JS strings with real UTF-8 chars (—, ·, ❤, emoji). When a match fails, inspect true bytes (`cat -A`) before retrying. Prefer HTML entities in static markup.
4. **`main.js` is the source of truth; `celestial-frontier.html` is a build artifact.** ⚠ **NEVER run `node tools/extract.js` after editing `main.js`** — it regenerates `main.js` *from the html* and silently discards every edit since the last build. It is a one-time bootstrap for a fresh clone. The everyday command is `node tools/build.js`. **CSS lives only in the html** (there is no CSS in main.js) — append new rules to the **LAST** `<style>` element, and remember `build.js` preserves them.
5. **After every batch of edits, run `node tools/validate.js`.** It reassembles the html from `main.js`, then runs: `node --check`, CSS brace balance, duplicate-id check, a no-`Math.random`/`Date.now`-in-domain-modules grep, a headless jsdom boot (zero errors required), and a 50-probe determinism fingerprint that must match the v1.0 baseline byte-for-byte (`tools/baseline.json`). Never regenerate the baseline just to make a failure pass — a mismatch means observable behavior changed. Recreate targeted assertions as you touch each area; never weaken a test's intent to make it pass.
6. **Don't break live saves** (`localStorage['cfcc_save_v2']` since the v1.5 fresh start — the v1 key is read once for the farewell card, then removed; no migration by design, Nick's call). Shape changes require versioning + migration. Preserve the load-time hardening (sanitize/coerce/clamp). New fields must default safely when absent — e.g. `tut` absent ⇒ tutorial treated as done, `tips` absent ⇒ tooltips on.
7. **Run `node tools/smoke.js` after UI changes** — it boots the game in jsdom and drives real flows (the full 21-step Field Training incl. focus lockdown, the Guide, tooltips, release notes, player rename, settings incl. motion/volume, veteran-save and skip paths, plus the v1.7 materials/cosmics/stellar economy sentinels; 550+ checks). ALSO run `npm run layout:selftest` then `node tools/uilayout.js` — a REAL headless browser across 10 viewports (~787 checks) that catches what jsdom structurally cannot: a CSS rule that is present, correct and completely inert. Full PASS must match the sealed v1.8.9 report's exact 787 `viewport/surface/name` outcomes; targeted viewport runs remain scoped diagnostics. The selftest must replace a seeded stale PASS with current red evidence, reject the old run id, and reject a count-consistent PASS missing one sealed outcome before the real gate is trusted. Keep the tutorial's `gameEvent` emissions intact when touching the systems they report from.
   **FIVE more suites exist, run on demand, each closing a blind spot the four gates cannot see by construction** (the fourth is `node tools/sizedrift-check.js` — REGRESSION GUARD: proves an honestly-bred genome survives the save/load round trip unchanged, after a v1.8.6 clamp silently rewrote ~12% of bred creatures into titanic ones; run it after touching `_sanitizeSavedGenome`, `normGenome` or anything that writes a genome field; the fifth is `node tools/harvestclock-check.js` — CLOCK GUARD: winds a simulated device clock forward a day and asserts a settled world grants nothing, after three rounds proved a wall-clock cooldown is indefensible offline): `node tools/bootperf.js --save=none --cpu=4 --cpuprofile --assert` (COLD BOOT — separates *painted* from **answerable**; a gate can be drawn and hit-testable while the main thread is too busy to reply, and enforces the art-hold law) · `node tools/simrun.js dom N` (UI REACHABILITY — drives the real controls and proves the press *landed*, so a button that exists but is wired to nothing fails here; the other simrun tiers call probe hooks and structurally cannot see it) · `node tools/duelxp-check.js` (REWARD OUTCOMES — plays a real duel and then reads the ledger). Run `bootperf --assert` after touching boot, art scheduling or anything on the first-run path; the `dom` tier after adding or rewiring a control; `duelxp-check` after touching XP, awards or the duel path. See `tools/README.md` — it also records the traps that made `bootperf` pass *vacuously* and the one that made the training-card gate pass *by accident*.
   ⚠ **When a new instrument fires — OR PASSES — suspect the instrument first.** All three found bugs in *themselves* before they found any in the build (an observation window that closed at TTI; 141 phantom findings from a stale DOM; a reachability gate that measured a top-pinned lesson card when the reported one had *dodged to the bottom*, so it came back clean on the very case it was written for). **Multiple** checks on this project have passed while the thing they guarded was broken — and round 9 alone added FOUR green-but-wrong states inside a single new gate and its fix (a key collision, a pass measuring EMPTY surfaces, a pass reading a CSS var left at the previous pass value, and a CSS rule placed earlier in the sheet than the one it had to override). Negative-control every new check in **both** directions — break a build on purpose and confirm the check fails — reproduce the REPORTED geometry rather than a convenient one, and make every finding carry its own diagnosis, because "no control for {id}" is a bug report nobody can action.
   ⚠ **Assert the OUTCOME, not the code path.** `smoke.js` had a duel-XP check that called `awardXP()` directly, so it stayed green through every build in which the friendly duel paid nothing at all — the +8 win had never paid in *any* shipped build. A test that calls the reward function proves the reward function works and says nothing about whether the game ever calls it. Only the duel awards have an outcome test today; the other six advertised awards do not.
   ⚠ **In CSS, `min-height` beats `max-height`,** and **an equal-specificity override that appears EARLIER in the sheet loses.** Both produce a rule that is present, correct and completely inert; both cost a release (v1.8.6 and v1.8.7). Release the anchors you are overriding, and prefer one rule with a variable over a second copy of the rule.
   ⚠ **Two correct fixes for one bug can disagree.** v1.8.6 fixed `size` twice — `battleStats` wrapped it, the load path clamped it — and the disagreement silently rewrote ~12% of bred creatures on their next load. Neither line was wrong alone; nobody asked what the other did. **When a change touches a value, grep every reader and writer of that field and make them agree before shipping.** That grep is cheaper than the fix.
8. **Versioning & release notes:** legacy v1 player-visible changes go into `RELEASES[0]` in `main.js`; v2 player-visible work goes into `V2_DRAFT_RELEASE` in `port/v2/apps/game/src/release-content.ts`. Nick authorized `port/v2/version.json` as the shared **v2.0 development identity** on 2026-08-12; it is shown with the full build commit inside Guide and is not a shipped production release. `GAME_VERSION` and `V2_CURRENT_RELEASE_VERSION` bump **only when Dakk separately authorizes a production release**. Use the existing categories (New Features & Systems / UI Enhancements / Gameplay / Balancing / Bug Fixes / Under the Hood). The v2.0 development entry may appear in cumulative history but must never trigger the one-time update popup or mutate `rnSeen` while `V2_CURRENT_RELEASE_VERSION` is null.
9. **Preserve audited invariants:** flora consumed on eat; both breed parents consumed; rare-find stardust only for genuinely new species; conquered worlds can't be re-won; caps (art cache 1,200; DPR 3 desktop / 2 touch — lowered on phones in the v1.2 heat pass, Nick's "phone runs hot" mandate; notifications 60).
10. **Naming:** species catalogue = "Compendium"; "Prime Codex" and "Cosmic Codex" deliberately keep "Codex" — do not rename.
11. **Mobile-first.** Primary device is iPhone; unified topbar layout relies on `--topbar-h`/`--row1-h` via `syncTopbarH`. Test touch + small viewports.

## Key anchors
Home galaxy seed `999` @ `{x:90,y:-60}` · Sol seed `424242` · Earth seed `133` ·
`PLAYER_SEED 0x50A1E5` · `HARVEST_CD 3600e3` · save key `cfcc_save_v2` (v1.5+).

## Parallel development workflow

- **Required coordination:** read `PARALLEL_GIT_PROTOCOL.md` before every
  coding batch and before every handoff. It defines the required safe-sync,
  commit, push, and pull-request protocol for both agents.
- **Required paired reminder:** at every batch completion and Git handoff,
  give Nick the protocol's explicit next steps for both OpenAI/Codex and
  Anthropic/Claude Code, including whether he needs to open the other app now.
  Whenever a PR is needed, include its exact base/source branches and a
  copy-ready title and description.
- `develop` is the integration branch. `main` is the production release branch.
- Anthropic/Claude Code works only from branches under `anthropic/*`.
- OpenAI/Codex works only from branches under `openai/*`.
- Neither agent may commit directly to `develop` or `main`.
- **Standing proceed authority (Nick, 2026-08-13):** once an agent-owned PR into `develop` is scoped, clean, mergeable, and terminal-green on its required battery, Codex or Claude Code may merge that exact head normally without asking Nick for another generic “proceed” only when `GITHUB_ACTIONS_BUDGET.md` is not frozen and Nick authorized that exact hosted attempt. Standing merge authority is not Actions-spend authority. This does not authorize bypassing a red/ambiguous check, force operations, marking a draft Ready, merging into `main`, or a production release/deploy/version bump.
- Before editing, verify the repository with `git rev-parse --show-toplevel` and the branch with `git branch --show-current`.
- Do not edit another agent’s worktree.
- Do not directly edit the sibling `celestialfrontier.github.io` repository.
- Deployments run only through `node tools/deploy.js --release X.Y.Z`, at a user-approved release.
- Never use `git reset --hard`, `git clean -fd`, force-push, force-delete a branch, or force-delete a worktree without explicit approval.
- Commit completed work before handing it to another machine or agent. Push only when the Actions budget protocol authorizes that exact GitHub write; while frozen, report the local commit/ahead state and do not push.
