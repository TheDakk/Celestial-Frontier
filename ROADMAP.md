# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## 2026-09-17 · Claude read-only review of openai/mac (docs-only commit on anthropic/mac)

Nick requested a consolidated review of the Codex worktree at `0426ef4d` plus its staged, unsigned
September 17 batch (5 crab fits, 3 flora fits, 7 observations, C1–C5 continuation). Two passes are
committed verbatim in `audits/ANATOMY_REVIEW_20260917/CLAUDE_REVIEW_RESPONSE.md`; the copy-ready
plan-only prompt for Codex is `CODEX_PLANNING_PROMPT.md` beside it. Headline: input manifest verified
(1,271/1,275 + 4 declared pointer diffs); five systemic findings (S1 frame-refusal policy, S2 amplitude
not bone-length-relative, S3 no planted contact outside quadruped, S4 pinch unreachable by resolvers,
S5 phone budget) plus the Pass 1 register. No lane was edited or synced; no push; PR42 parked.
Nothing on anthropic/mac changed except this note and the two audit files.

## SESSION HANDOFF — 2026-09-13 · LONG SESSION BATCHES 1–4 COMPLETE; C2 PARTS RIG IS THE ONLY BLOCKER

Read this with `audits/LONG_SESSION_20260913/LOG.md` (per-package table), `LOG-B.md`
(batches 2–4 in detail) and `CONTRACTS.md` (the cross-lane interfaces). Everything below is
committed on `anthropic/mac` and **never pushed**: 61 commits ahead of `openai/mac`, tree clean.
GITHUB_ACTIONS_BUDGET gate unchanged; PR42 parked; no hosted write authorized.

### What the game can do now (all under the two study flags, default path untouched)

`?battle2=1` stages a real turn over the Chronicle mount: arena plates with parallax, a rigged
attacker and a portrait defender, the choreography beats (timing bar, cursor, run-up, hitstop,
flash, shake, damage number), **per-ability theme effects** (Wild painted; the other ten kit
themes as labelled procedural emitters in their §4K material colour), **sound cues on the beats**
(placeholder synth for all 49 ability/battle ids, per-creature derived voices through the A4
engine, played through the accessible audio owner's `decorativeVoicePort()`), and world life.
`?worldlife=1` puts rain, drift and **resident idle life** (1–3 fauna from the roster, breathing
whole-portrait rigs between the vista and the weather) on the landfall.

Every kit §4 motion family has a template library (13 + quadruped). Phones run half particle
budgets. `MOTION_KIT.md` and `SOUND_KIT.md` are marked matches-code as of 2026-09-13.

### Evidence to look at

- `audits/LONG_SESSION_20260913/b-batch-capture/proof-run-02/` — the current 10 s capture
  (602 frames, p95 0.30 ms, 0 browser errors), beat frames and mp4-cut frames. Civet joints no
  longer open black wedges; Wild painted sweep and Tide procedural splash both read.
- `audits/LONG_SESSION_20260913/b3-family-sheets/`, `a11-family-sheets/` — pose sheets.
- `audits/C2_BOUNDED_REPAIR_20260913/underlap-demo-01/` — underlap proof on the real Civet master.

### Open decisions for Nick (nothing blocked on them)

1. **K22 part 2** — the import `t:0 → now` asymmetry; fixing it broke v1.8.9 fixture tests
   (`LOG-A6-defects.md`). Still unfixed by choice.
2. **Nick's eye** on the B3 family sheets, the proof-run-02 capture and the Wild v4.3 images.
3. Two batch-2 decisions were **delegated to Claude and already taken**: the audio port
   (`decorativeVoicePort()`) and the Motion Kit §5 impact hold (240 ms after the hitstop).

### The one blocker: C2 articulated parts rig (Codex's lane)

Codex's parts rig still FAILS the shape gate; the labelled whole-portrait fallback is the
accepted presentation meanwhile. Four review rounds are recorded, newest last:

| round | audit dir | outcome |
|---|---|---|
| interop | `C2_MOTION_INTEROP_20260913/` | Claude's GSAP producer broadcast root dx/dy to every joint; fixed root-only (64bef82e), probe PASS |
| parts motion | `C2_PARTS_MOTION_20260913/` | civet neck wedge diagnosed; fox refusal = collinear rest chain; fallback clips ACCEPT |
| bounded repair | `C2_BOUNDED_REPAIR_20260913/` | disc patches can't reach the cut ends; **fox corrected record ACCEPT**; seam oracle replaces the vacated-silhouette ruler; band underlap proposed and proven in Claude's own rig |
| band underlaps | `C2_BAND_UNDERLAPS_20260913/` | Codex's bands FAILED: ancestry walk misses pelvis-rooted parts (hips/tail unbanded), depth exceeds the descendant's size (ear ghosts), composite oracle over-counts between parallel legs |

**Codex's next step is authorized** (Nick delegated approvals 2026-09-13):
`audits/C2_BAND_UNDERLAPS_20260913/CLAUDE_REVIEW_RESPONSE.md` §4 plus the amendment in
`audits/C2_BOUNDED_REPAIR_20260913/AUTHORIZATION_20260913.md` — ancestry from pixel ownership,
depth capped at half the descendant's box, pair-isolated seam gate (`--disc=0.06`), then the
civet, fox and procedural captures with no further review stop unless a pair still leaks.
Still NOT authorized: the 8 % compression bound, clip curves, kit wording, GitHub, history.

### Claude-lane tools a new session should know

- `port/v2/tools/motion-proof/seam-oracle.mjs` — joint-seam ruler (transparent pixels inside the
  closed body envelope near a joint pivot). Tests in `port/v2/tests/seam-oracle.test.ts`.
- `port/v2/tools/motion-proof/rig-pose-render.mjs` — browser-free keyed-master cut, pose, render
  and measure. `port/v2/apps/game/src/battle2/rig-render.ts` is the pure renderer.
- `port/v2/tools/battle2-proof/runner.mjs <newDir>` — the 10 s capture (**browser-owning: run
  outside the macOS sandbox**). `tools/motion-proof/pose-sheet.mjs` renders any template.

### Waiting on Codex

C1 Wild v4.3 intake is mechanically complete (three Claude reviews, all accept; Nick owns final
image acceptance). C2 as above. **C3 recorded sound sources have not begun** — every voice today
is derived from the labelled placeholder archetype and is not shippable. C5 pruning/PR split/LFS
is unstarted; the 24 pre-existing full-suite failures belong there (`LOG.md` baseline note).

### Verification commands (all green at handoff)

```
cd port/v2 && npm run -s typecheck && npx vitest run tests/battle2-*.test.ts tests/effects-*.test.ts tests/motion-*.test.ts tests/soundkit-*.test.ts tests/worldlife-*.test.ts tests/seam-oracle.test.ts
node tools/validate.js      # from the repo root: FINGERPRINT MATCH
```

### Protocol reminders

Claude works only on `anthropic/*`, Codex only on `openai/*`; never edit the other worktree, never
copy source across lanes (Nick carries zips). Commit locally, do not push. Read
`PARALLEL_GIT_PROTOCOL.md` before every batch. Nick's standing instruction: **work in large
uninterrupted batches**; stop only for a kit wording change, the first image or sound of a new
class, a GitHub write, a history rewrite, or a genuine scope question.
