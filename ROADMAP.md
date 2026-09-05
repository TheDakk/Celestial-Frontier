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

## SESSION HANDOFF — 2026-09-04 · BATCHES 1–3 RECONCILED WITH PR36

### Exact source and authority

OpenAI/Codex on macOS in `/Users/nick/Projects/celestial-frontier-openai-mac`.
Nick explicitly named `openai/review-batches-1-3-20260904` for this merge/push/PR; that instruction
is the bounded exception to the usual `openai/mac` branch row. The clean audiovisual branch is
preserved separately at `fbb484b01fbacbcd242e61783e5142d6de32c02b` and will be restored after this
handoff. No other agent's worktree is used.

- Source branch began at signed `8bf9c45d4aae74a6924bcdc201424db0af4770e6`, containing only
  Batches 1–3 (`e0acfab…`, `13d24af…`, `8bf9c45…`) above PR35's `7bf3e847…`.
- `origin/develop` is verified at PR36 merge `0cad14dea80b4f2d5052210fa19d583bd0ada085`.
  It is merged here with a real merge commit; the three existing signed commits are not rebased,
  cherry-picked or rewritten. Exact merge/result/PR identifiers are emitted in the Git handoff.
- Original local/origin parked backup remains `cf1b9a7843200ecc281c5113b4139909dc0e3a29`.
  Batch 4 (`5377069…` and checkpoint `5e45a90…`) awaits Nick's real save export and its own PR;
  WIP remains parked. None is an ancestor added by this review branch.
- SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`, previous authentication TheDakk;
  fresh repository fetch passed. Budget UNFROZEN, last verified PUBLIC, private fallback 3,000.
  Nick authorizes this reconciliation, exact-source checks, branch push and PR opening.
  No approval label, hosted attempt, main merge, purchase or release is performed by this task.

### What the merged candidate contains

Queued save admission and semantic panel focus, portable npm invocation, shared targeted Glass
verdict verification, explicit distributable/evidence-build isolation, finite audio voice cleanup,
and the corresponding reference/dependency corrections. Those are the existing Batches 1–3;
this merge adds PR36's two-lane CI without importing Batch 4 or audiovisual prototype assets.

`test.yml` uses PR36's lane selector, two-label owner guard, agent/full canary condition, and all
five exact `if: steps.lane.outputs.lane == 'full'` guards. Every workflow byte outside the two
phone-verdict bodies equals develop. Those bodies call the existing targeted Node verifier
immediately after the small-phone and large-phone runs. Policy code remains byte-identical to
develop; the lane selector's sealed non-comment bytes are unchanged. No new timeout, retry,
label, job, ruler, pin or policy allowance is added. Tests compose the new lane conditions with
retained Node-verifier/corruption coverage. Parent handoffs and both archive additions are retained
verbatim in ROADMAP_ARCHIVE.md.

### Validation and pending boundaries

The requested exact-source browser-free develop profile and
`node tools/actions-budget-policy.js --selftest` must run once after the final merge commit.
Earlier `8bf9c45…` static PASS is historical evidence, not a result for this merged source.
Results are recorded in the PR description and handoff against the full merge SHA. No browser
chain or hosted run is implied by local static validation. The two phone rows run under the
separately owner-approved agent lane; the full chain runs on develop-to-main or the separate full
label. Native iPhone/save/listening, production SceneMemory activation and human gates stay open.

A concrete CI boundary remains: the sealed branch-flow shell currently admits only the four
fixed agent branches into develop, not this named review branch. Opening the PR is allowed, but
applying a label now would fail authorization before the battery. Nick was informed; resolving
that branch-policy mismatch belongs to an explicit decision/Claude policy follow-up, not a silent
change in this verifier merge. Keep the approval labels absent until that is resolved.

### Paired next steps

Codex: finish exact-source checks; on green, push this named branch and open its draft PR into
`develop`, recording exact base/head, checks and the branch-gate limitation. Then return the Mac
checkout to the preserved `openai/mac` audiovisual branch. No merge or label action is authorized
by this local preparation. Copy-ready PR title:
`fix(v2): harden save admission, isolate evidence builds, and bound audio lifetime`.
PR body must cover the merged final diff, fresh evidence, pending phone/hosted acceptance and
retained PR36 lane seals; the final Git handoff carries its URL.

Claude on `anthropic/windows`: PR36 is landed; fetch/merge current develop only from its clean
owned branch before new coding. Review the PR's shared Node verifier and lane-test composition.
Do not merge parked gameplay or copy files across worktrees. This candidate reaches Claude only
after an authorized develop merge and normal synchronization. Nick need not open another app now;
the approval-label/branch-gate issue is separate from this requested PR opening.
Main, the production v1.8.9 site, protected portraits, audiovisual source archives and deployment
remain untouched. Continue the audiovisual pilot on its own branch after returning to it.
