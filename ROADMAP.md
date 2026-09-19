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

Later the same day: Codex’s approved plan (`9769d299`) and R1/R2 producer (`6b11407d`) were reviewed
against the eight-subject native evidence (`r1-r2-native-01`, commit `57dfe112`). Review committed as
`audits/ANATOMY_REVIEW_20260917/CLAUDE_R1R2_REVIEW.md`: tears and floating legs are gone, but motion
is now unreadable because body-length-relative motion uses a 4 % root→carapace axis (N1); recommended
a bounded R1b/R2b (N1–N4 + one quadruped sentinel) before R3–R8; Q4 kit paragraph recommended for
approval. Still no push; PR42 parked.

## 2026-09-17 (later) · vision program approved; E1 design started

Nick restated the full vision and approved the master program's decisions D1–D4
(`audits/ANATOMY_REVIEW_20260917/MASTER_PROGRAM_20260917.md`): D1 phone tier = delivered finished
originals with painter-only fallback (no on-device inference); D2 first guardian = Earth-temperate apex
at 1536 on the same pipeline; D3 arenas by biome family, Earth temperate first; D4 E1 design now, code
after R3 reaches develop. Track B design is `E1_BATTLE2_INTEGRATION_DESIGN.md` (parts-rig adapter,
attack-driven turn plan, habitat arena selection, five outcome tests; Codex owes `ContactPhase.travel`
and the brachyuran attack row in R3). Codex is mid-R1b/R2b (N1 decision + N11/N12 given). No push.

## SESSION HANDOFF — September 19, 2026 · R1b/R2b RE-CAPTURE IN; 3 PASS / 6 FAIL; CLAUDE OWES THE REVIEW

Self-contained. Either lane can resume from this block alone.

### Lane state (local only; nothing pushed, no remote state inferred)

| Lane | HEAD | Ahead of cached origin | Tree |
|---|---|---|---|
| `openai/mac` (Codex) | `d0437436` evidence, on signed producer `6a58e40e` | 133 | two untracked leftovers: `R1B_R2B_EVIDENCE_SIGNING_BLOCKER_01.json` (stale — the retry succeeded as `d0437436`), `review-diagnosis-01/` (toolchain receipts) |
| `anthropic/mac` (Claude) | `2766db85` | 234 | clean |

Both signing blockers of Sept 17/19 are resolved; every producer and evidence commit named here is
signed. PR42 parked, no GitHub write, no push, no merge, no release. Lanes read each other by
absolute path, read-only; never sync to fetch a document.

### What Codex shipped, and what it costs

`6a58e40e` is the bounded R1b/R2b correction Claude directed: **N1** template-declared motion scale
on the BodyCard (brachyuran independent 0.08–0.9 admission; body-axis bounds and observed pivots
untouched; plants use the longest observed chain), **N2** source-relative stride/lift with
readability floors, **N11** blend weight no longer multiplies world travel or stance targets,
**N12** faint/hit loading moved to the shared specialized action builder, **N3** explicit
endpoint pin/weight declaration at split time, **N4** action rows before framing, **N6** Civet
sentinel, **Q4** the approved Motion Kit §8 paragraph (only that). Static: 102 regression tests /
16 files, 210 tool tests, three TS projects, 1,010 legacy renders, 50 determinism probes.

`d0437436` is the nine-subject native re-capture on that producer — **3 numeric passes, 6 failures**:

| Subject | Outcome | Max clip p95 | Max painted-contact drift |
|---|---|---:|---:|
| crab / coconut-crab / freshwater-crab | PASS (numeric), films exist | 0.600 ms | 0.133 / 0.144 / 0.176 px |
| mud-crab | FAIL hit, dodge, faint, presentation | 0.700 ms | 0.270 px |
| vent-crab | FAIL scuttle, hit, dodge, presentation | 0.500 ms | 0.348 px |
| persimmon | FAIL fold: `disturb` @ 67.17 ms, 84 folds; presentation @ 1200 ms, 209 folds | 5.300 ms | n/a (no ground feet) |
| cranberry | FAIL CPU: disturb 3.3 ms | 3.300 ms | n/a |
| devils-club | FAIL CPU: all four actions | 4.200 ms | n/a |
| **civet sentinel** | **FAIL** — 18 of 20 rows stop early; unreachable targets at 5.8 / 6.25 / 29 ms; idle drift 0.258 px | 4.400 ms | 0.392 px |

### Three things the next reviewer must not miss

1. **Claude's N3 diagnosis was wrong, and Codex proved it read-only.** Old-versus-new binding
   comparison found **zero changed field weights and zero added/removed pins on all five crabs** —
   those endpoint supports were already rigidly weighted and pinned by the earlier shape owner. The
   Mud/Vent painted-contact drift therefore has **no established root cause**. Codex's remaining
   hypothesis (the nearest painted vertex's nonzero rest offset rotating under the endpoint bone) is
   labelled a hypothesis. Do not loosen 0.25 px, do not call it instrument noise, do not re-propose
   pinning. Evidence: `summary.json.contactPinComparison`.
2. **The Civet sentinel failing is the point of having it.** It runs the new family contact resolver
   against an existing accepted quadruped binding; the preserved quadruped compatibility solver is a
   separate path. That distinction is a diagnosis aid, not a clearance for the shared path.
3. **Flora CPU moved the wrong way** (persimmon 2.2 → 5.3, cranberry disturb 1.9 → 3.3, devils-club
   3.4 → 4.2 ms) — but Codex records honestly that clip sampling now precedes presentation warm-up,
   so this is **not a controlled attribution** to the scale change. Any next direction must separate
   the two before blaming either.

### Who owes what

**Claude (anthropic lane) — the open job:** review `audits/ANATOMY_COMPLETION_20260917/r1b-r2b-native-01/`
(README, summary.json, the nine reports, the three films and their stills), own the N3 correction in
writing, and issue one bounded next direction covering (a) the unexplained Mud/Vent drift,
(b) the Civet sentinel failure, (c) flora fold + CPU with a controlled measurement. Then write the
**R9 addendum** (finished textures for procedural creatures — the five crabs through the accepted
masked-0.35 finisher on the painter master, silhouette/alpha conservation so painter-stage masks
transfer unchanged, rebind, seed-bound retention; desktop only per D1), in the approved plan's
format. Track B **E1 code does not start until R3 is on develop**; its design is already written.

**Codex (openai lane):** stopped for this review by its own handoff. No R3/R4/R9 implementation, no
unchanged retry, no threshold relaxation. R3 carries two additions Claude specified for E1:
`ContactPhase.travel?: 'solver' | 'stage'` and `contactJoint` on `compileAnatomyAttack`.

**Nick:** visual acceptance of the three crab films is his and is still open; so are Q1 (crab gape —
authorized as a *candidate*, not adopted) and the R1b/R2b failures' next direction.

### Still open, unchanged by this batch

N5/S5 phone tier (D1: delivered finished originals, no on-device inference); N7–N10 (dead leg keys,
edge fringes, plant clamp constants, other-family contact exclusions) explicitly **not** closed;
I5 stale Compendium producer certificate (fresh measured certificate only, never a pin edit);
53 of 58 bodies unbound; 12 observed; nothing newly visually qualified.

### Where to read

`audits/ANATOMY_REVIEW_20260917/` (anthropic lane) holds `CLAUDE_REVIEW_RESPONSE.md` (S1–S5 + Pass 1
register), `CLAUDE_R1R2_REVIEW.md` (N1–N12), `MASTER_PROGRAM_20260917.md` (vision, pillars P1–P10,
tracks A–E, gates, decisions D1–D4 all approved) and `E1_BATTLE2_INTEGRATION_DESIGN.md`.
`audits/ANATOMY_COMPLETION_20260917/` (openai lane) holds the plan, static checkpoints and all
native evidence, plus Codex's own `NEW_SESSION_PROMPT_20260919.md`.
