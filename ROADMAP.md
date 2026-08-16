# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## ▶▶▶ SESSION HANDOFF — 2026-08-16 · D-TRAIN-1 LEGACY CHECKPOINT TRANSACTION ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows
  uses the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · `SAVE_SYSTEM.md` · `QUESTS_AND_CHAPTERS.md` ·
  `celestial-frontier-codebase-reference.md` ·
  [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve Git, PR, checks and publication live. Historical run IDs and ignored reports below bind
  only their named inputs; never reuse them as authority for a newer tip. Never copy files manually
  between agent worktrees.

### Synchronized foundation through F2

- PR [#30](https://github.com/TheDakk/Celestial-Frontier/pull/30) finished at head
  `24bcc3cbf4e76f7bb65a00e810e0eeeeb8d7c837` and merged normally into `develop` at
  `b091f010011fa16bec457599b41274b7f92bb5e6`. At the start of this batch `HEAD`,
  `origin/openai/mac`, `origin/develop`, and the other synchronized agent refs all resolved to that
  merge. The superseded F2 candidate handoff is archived byte-verbatim; its historical dirty-tree
  reports remain evidence for the inputs they named, not for D-TRAIN-1.
- F2's bounded canonical-ingress seam is integrated. This does not close Arc 0, Gate D, any human
  gate, a release, or the planned F3/F4 transaction/time work.

### Active D-TRAIN-1 boundary — local working-tree candidate [PARTIAL]

- The genuine v1.8.9 Field Training `tsnap` is an exact eleven-key checkpoint
  `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}`, not a whole save or whole expedition. The new
  action-derived fixture captures that real Settings → Restart Training outcome; the old synthetic
  `{codex, essence, marker}` object remains an unknown/refusal-only control.
- Persistence classifies `none`, current one-key `{view}`, exact `legacy-v1`, and bounded
  `legacy-or-unknown` evidence. It rescues a genuine checkpoint paired with legacy `tut:1` back to
  incomplete, refuses unsafe/oversized evidence, forbids completed-plus-pending export, and keeps
  numeric future `ever.v > 1` under whole-save future-version protection.
- Legacy restoration starts from the surrounding imported v4 expedition and replaces only the
  eleven checkpoint-owned surfaces through established sanitizers. It source-proves Earth instead
  of trusting `e.where`, invents no landing/conquest/achievement/reward, never heals HP, reserves
  Earth inside the Atlas cap, and retains surrounding fields. The optional additive v4-envelope
  carrier `ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}` preserves facts that cannot always
  be re-derived; outer `v` remains 4, but this is an additive schema extension, not “no schema
  change,” v5, or a release bump.
- The legacy checkpoint owns no `view`. Real Skip from Welcome persists/runtime-seats proven Sol;
  real full Finish after Land persists/runtime-seats proven Earth. Only the current-v2 exact
  one-key `{view}` checkpoint restores the pre-Training route.
- Finish/Skip is an async atomic replacement: claim exclusive ownership before the first await,
  keep the lesson busy and focus-locked, stop the ticker, cancel/drain ordinary persistence, build
  and source-prove a detached candidate, perform exactly one direct primary write, then publish
  live state and release the renderer. Pre-durable failure leaves the checkpoint and lesson
  retryable; post-durable publication failure never writes twice and reloads from the committed
  primary. Source failure durably defers at proven Sol with the exact checkpoint.
- Loaded pending checkpoints and loaded `tut:0` saves without a checkpoint are write-held; the
  latter receives only a runtime Sol seat. Fresh empty onboarding remains ordinary. Unknown
  checkpoint or unavailable route opens a persistent nonclosable recovery modal: the background is
  inert/hidden and re-locked after mutation, focus stays trapped, Escape is consumed, release copy
  is suppressed, and only trusted complete import or reload/retry remains available.
- Existing Settings/Saving Guide paragraphs and the existing Field Training development bullet now
  state those bounded legacy/current outcomes. This adds no Guide capability or lesson, keeps the
  development inventory at five categories / 44 bullets, and does not set a current release.

### Exact local evidence and red → repair chronology

- Static evidence was refreshed after implementation: the three focused D-TRAIN files pass
  **26/26**; the complete v2 suite passes **30 files / 366 passed / 1 skipped**; both TypeScript
  programs and `artunused` pass. Root `npm run trainingcheckpoint` passes and binds the
  2,074-byte action-derived checkpoint SHA-256
  `2e2f7c566a27e79398ea18650de9ac6acf236e92235fc293e4815b8bfefa22e3`. The browser reports
  below each rebuilt the production bundle they exercised.
- The first broad D-TRAIN diagnostic smoke was honestly red. Most initial failures were instrument
  expectation/setup drift: fresh unfinished Training now source-seats Sol rather than Cosmos;
  keyboard and phone journeys therefore needed a real target release and real ascent; normalized
  land census expands the fixture's two rows to the established six-row union; and the oracle had
  to distinguish direct atomic-write Atlas false defaults from a later ordinary re-export. Those
  repairs preserved real input, draw-tail receipts, native IndexedDB write counts, exact route
  identity, outer-save sentinels, and deliberate negative controls.
- That red also found one real product defect: while recovery was open, a later DOM mutation could
  clear `inert`/`aria-hidden` from a background root. The repair snapshots exact top-level roots,
  enforces the lock idempotently, and observes body mutations; the browser control deliberately
  removes both attributes, waits an observer turn, and requires re-lock while the modal itself
  remains exposed.
- Further harness reds were classified and repaired without weakening outcomes: canvas focus was
  reset with blur/focus so the real focus event owns keyboard targeting; offscreen Sol was reached
  by bounded real Arrow/Minus camera input; phone ascent used two complete real pinch gestures;
  full-Finish expected Earth route/ordinal 2; queued release publication explained the later
  `rn=2.0.0-test` sample; and the raw oracle records why direct Training writes retain explicit
  Atlas `quasar:false,dwarf:false` while the later exporter omits those false defaults.
- The first full Glass Matrix after Slice went red only in its instrument: it still required
  “preference fixture did not return to the universe after Training Skip,” then could not enter the
  home galaxy or prepare the Charter toast. D-TRAIN correctly ended Skip at proven Sol. Glass now
  drives the real canvas focus law—first Escape releases the selected target, the next two Escapes
  ascend Sol → Milky Way → Cosmos with advancing canonical render receipts—before the unchanged
  universe and Charter checks.
- The first post-copy Slice run was also honestly instrument-red: the legacy Skip contradiction
  regexp allowed a comma inside its clause, crossed the valid “Skip … Sol, while … Earth” sentence,
  and misread Finish's Earth as Skip's destination. The repair makes comma/semicolon a hard clause
  boundary; it does not weaken the contradictory Earth/pre-Training-view control.
- The matching post-copy Glass run was instrument-red because an injected `Completing … Sol`
  contradiction used an initial capital while the forbidden literal was lower-case. Glass now
  compares forbidden rendered copy case-insensitively while keeping required player copy exact.
  Both instrument reds remained visible and were followed by fresh one-attempt runs; no retry
  concealed either result.
- Final ignored Slice report `cf-v2-slice-smoke-ci/v1` is terminal PASS for run
  `20260816195736683-4852-27b5c876410a`: Edge `151.0.4129.86`, 154,788 ms, zero
  findings/retries, ten run-bound screenshots, commit
  `b091f010011fa16bec457599b41274b7f92bb5e6`, and dirty-tree SHA-256
  `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`. Report-file SHA-256:
  `33953319124590ced0cebc16888cfb2b8cbe2879cbcb3c225e061d0d7a817027`; its 4,163-byte raw-log
  SHA-256 is `b060af3aaa8454a5d9813b2e5f8e6eba0ec2b7f5d3090e991154c1664a132670`, its Git-status digest
  is `c195873a910c3bce42db222560c9bc70b8763df330d0454036388e4e398faa6d`, and source-change
  detection remained false.
- Final ignored full-certifying Glass report `cf-v2-glassmatrix/v1` is terminal PASS on the same
  Edge/base commit: 57,476 ms, 12/12 viewports and reload-evidence rows, 57/57 planned negative
  controls with none blocked/omitted, zero findings/instrument failures/retries, and dirty-tree
  SHA-256 `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
  Report-file SHA-256:
  `fe32fe802460a61ec4337c373276de8601196ead530ae8184c36970247545254`; it binds the same
  `c195873a910c3bce42db222560c9bc70b8763df330d0454036388e4e398faa6d` Git-status digest.
- The report snapshots are intentionally different: Glass includes harness repairs made after
  Slice. This handoff/docs refresh postdates both. Neither report claims the exact current working
  diff; a committed exact-head battery and integration evidence remain mandatory. D-TRAIN-1 stays
  **[PARTIAL]**.

### Hard exclusions

- D-TRAIN-1 does not add the other fifteen legacy lessons, claim the complete 21-step curriculum,
  make `tsnap` a whole-save rollback, restore a legacy pre-Training route it never stored, or close
  real-save Gate C/human play.
- It does not add ownership, rewards, inventory, missions, combat, companions, or any Arc 2+
  writer. F3 still owns general CAS/revisions, split stores, receipts/journal, and tab lease; F4
  still owns visibility/active-play time and SessionRNG.
- It does not change deterministic generation/share bytes, reach/Charter balance, outer save
  version 4, development/production version identity, `main`, production release/deploy, or either
  live-site repository.

### Next actions

1. Finish read-only source, harness, documentation, and scope audits on the complete working diff.
2. Commit and push the bounded D-TRAIN-1 candidate, open a draft PR from `openai/mac` into
   `develop`, and require fresh exact-head branch-flow plus the full required battery.
3. Merge only a reviewed-or-explicitly-waived terminal-green exact head, then monitor the resulting
   `develop` battery and mapped development publication. Keep Gate C/human save open.
4. Do not begin F3, F4, or a product Arc inside this batch.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, owned folder
`/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, based on synchronized
`develop` merge `b091f010011fa16bec457599b41274b7f92bb5e6`. The shared worktree contains the
uncommitted bounded D-TRAIN-1 implementation, tests, harness, references, and this later docs-only
handoff. Static checks and two separately bound local browser reports are green as recorded above;
they do not bind this exact post-report documentation state. Exact-head CI/integration is pending.

**GitHub step:** None for Nick now. OpenAI/Codex owns final audit, intentional commit/push, draft PR
creation from `openai/mac` into `develop`, fresh exact-head CI, review/waiver boundary, and normal
integration monitoring under the standing proceed authority. Do not touch `main`.

**PR details:** base `develop`; source `openai/mac`; copy-ready title
**D-TRAIN-1 — Restore genuine legacy Training checkpoints atomically**. Copy-ready description:

> Restores the exact eleven-key v1.8.9 Field Training checkpoint without treating it as a whole
> save. Adds genuine action-derived fixture/provenance, bounded checkpoint classification and
> additive cumulative-record carrier, current-versus-legacy route semantics, source-proven Earth,
> and one-write async replacement with write-hold, rollback, post-durable reload, race controls,
> and persistent modal recovery for unknown/unavailable state. Updates existing Guide/release copy
> without adding a capability or lesson.
>
> Local evidence: 3 focused files / 26 passed; 30 files / 366 passed / 1 skipped; both TypeScript
> programs; `artunused`; action-derived fixture check; one zero-finding/zero-retry Slice report; and
> one full-certifying 12-viewport Glass report with 57/57 negative controls and zero findings,
> instrument failures, or retries. The two ignored reports bind their separately named dirty-tree
> hashes; exact-head PR CI, integration, Gate C, human play, release, and deployment remain open.

**Other side:** Anthropic/Claude Code need not be opened now. It may review the pushed draft later
from a clean synchronized `anthropic/mac`, but must not edit or copy files from this OpenAI
worktree. At its next coding batch it must fetch and verify its own branch against current
`origin/develop`.

**Release status:** F2 is integrated at `b091f010011fa16bec457599b41274b7f92bb5e6`. D-TRAIN-1 is
only a local working-tree candidate. No `develop` → `main` merge, production release, version bump,
manual deployment, or production-site write was performed or authorized.
