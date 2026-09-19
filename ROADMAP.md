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

## 2026-09-19 · Claude review of R1b/R2b re-capture; N3 withdrawn; R1c direction; R9 addendum

Read-only review of `openai/mac` evidence `d0437436` on producer `6a58e40e`, committed as
`audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md` with the contact sheets Claude looked at in
`r1b-r2b-look/`. Integrity verified (README ↔ JSON, producer diff scope, zero pin deltas). Visual: scuttle
is readable for the first time (V1); **faint recovers to rest by 75 %** (V2) and **pinch is static** (V3);
N8 fringes persist (V5). **N3 withdrawn and owned:** the vertex was already rigid; the gate reduces to
`2·|o|·sin(θ/2)` (rest offset × stance rotation) and the pin receipts' |o| (1.3–3.1 px) are consistent with
every pass/fail — a derivation, not a proof, so R1c (a) measures it with three negative controls. R1c (b)
discriminates a Civet adapter artifact from a family-solver gap (hypothesis: no root accommodation) without
clearance; R1c (c) is a variance floor + 2×2 {harness order × scale reference} attribution, plus the
persimmon fold ownership dump (the fold pre-exists on `6b11407d`; `normalPasses` unchanged). Gate stays
0.25 px; no repair chosen. `R9_ADDENDUM_FINISHED_TEXTURES.md` written in the plan's format (desktop only,
D1). No sync, no push, PR42 parked.

## 2026-09-19 (night) · openai/mac merged locally; E1 battle2 integration coded on the real fits

Nick relaxed D4 ("go"): E1 codes against Codex's signed producer by local merge. `openai/mac` `4cb5f7a3` merged into
`anthropic/mac` as `e86a66ab` (Codex's nine motion files win; lane docs kept; four merge repairs recorded in the commit —
Codex's absolute-path pose probe re-pinned, its stale blender span repointed, the battle2 keyer made a static import per the
Arc 4 law, my motion tests retargeted to Codex's contracts, synthetic fixtures given source habitats). Then E1.1–E1.4:
`battle2/parts-rig.ts` (Codex's paint-skin rig through its owner + contact solver, refusal policy, joint read-out),
`TurnAttack` on the turn plan with `impactAtMs` on the effect schedule, `battle2/habitat-arena.ts`, reduced-motion rule,
`RigPoseContext` hand-over, wiring of the six fits + per-turn `compileAnatomyAttack` + `status().arena/attacks/refusals`.
Outcome tests run on the REAL fits in vitest: Civet bite pays; no refusal in play (Civet both roles, five crabs as targets);
habitat refusal visible; reduced motion holds. Three `it.fails` pins flip when R3 lands (travel:'stage', crab attack, pinch).
Battery: typecheck ×3, 210 tool tests, evidence build, vitest 4,736 pass / 3 expected-fail / 1 red = I5 stale certificate.

## SESSION HANDOFF — September 19, 2026 (night) · E1 CODED ON THE MERGED LANE; CODEX RUNNING THE SINGLE-RUN PROGRAM

Self-contained. Either lane can resume from this block alone. Earlier handoffs of the day are archived verbatim at the top of
`ROADMAP_ARCHIVE.md`.

### Lane state (local only; nothing pushed, no remote state inferred)

| Lane | HEAD | Note |
|---|---|---|
| `openai/mac` (Codex) | `18496278` (three commits past the merge point: Node 26.9.0 receipt, Civet solver-gap measurement, 69 R1c CPU trials) | running the single-run program from review §8 |
| `anthropic/mac` (Claude) | this commit, on merge `e86a66ab` of `openai/mac@4cb5f7a3` | E1.1–E1.4 coded; tree clean apart from `.DS_Store` |

PR42 parked, no GitHub write, no push, no merge to develop, no release. Lanes read each other by absolute path.

### The program in flight (Nick, 2026-09-19: "most work possible before a stop")

`audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md` §8: ONE Codex run — toolchain → R1c-b/c → R2c → R2d → R3 → R4 →
re-capture → R9 → R5–R8 → roster by family → PR42 split prepared → ONE stop with an accumulated review packet. S2 (a
shared-path red: Civet sentinel or any of the five crabs regressing after a solver change) is the only halt. Claude runs E1 in
parallel on local merges of Codex's signed producers.

### Codex's run stopped at S2 in R2c (its packet `audits/ANATOMY_SINGLE_RUN_20260919/`)
R2c closes Mud/Vent (five crabs ≤ 0.0094 px) and adds the root accommodation R1c-b proved missing, but the Civet
sentinel fails idle at 0.2608 px: its support is unpinned and ~85 % paw-weighted, so R2c's rigid-to-endpoint
correction over-corrects (Claude's derivation in review §9). Direction issued: **R2c′** — model the support by its
actual skin weights, crabs must reproduce bit-for-bit, Civet must pass unchanged, then resume §8. Codex's R2c
packet is staged UNSIGNED (1Password refused both lanes tonight; now unlocked) — sign it first. R1c-c attributed
most cold flora CPU to the declared scale (per-pass cost, `normalPasses` 4 everywhere): leaf red for R8/Q4.

### What Claude owes next
1. **Re-merge at Codex's signed R2c′/R3 producers**; pass `observedContactSupports(record, binding)` to the parts rig's family solver; then flip the three pins: `ContactPhase.travel:'stage'` in the parts-rig
   context (drop the interim stride double-count note), crab attacks through the stage, pinch selection; re-run
   `parts-rig.test.ts` + `e1-outcomes.test.ts`; move crabs from target-only to attacker in outcome 2.
2. **E1.5**: the `?battle2=1` study with the six fits in a real browser (films at 25/50/75 + one full turn per fit) for the
   single stop's packet; needs the dev asset server (`assets.bytes` is now a dev-source method).
3. Guardian design (D2) as a document; Chronicle cadence sync stays open.
4. Merge findings to hand Codex at the stop (recorded in `e86a66ab`): its pose probe hard-codes an absolute path into this
   worktree and pinned my old adapter bytes (make it repo-relative, re-pin); `creature-blender-export.mjs` must span
   `paintOverrideCanvas` (one-token edit, identical text applied here); `resolvePhysicalHabitat` never reads `genome.realm`
   (a habitat-gene-less "drifters" jelly resolves aerial); the I5 stale certificate is the one red on both lanes.

### Codex (openai lane)
Continues §8 unattended. Interfaces E1 consumes from R3, unchanged: `ContactPhase.travel?: 'solver' | 'stage'` (zero solver root
dx in stage mode, stance targets unchanged) and `contactJoint` on `compileAnatomyAttack` (already on the attack rows). Nothing
in Claude's E1 changed a Codex-owned file except the two merge repairs above, both recorded for re-application in its lane.

### Nick
Nothing to decide until the stop. R9 addendum's two answers (finisher model = the accepted one; arena-scale crab on the sheet)
are already in the pre-answered set (§7).

### Still open, unchanged
N5/S5 phone tier (D1); N7–N10; I5 stale Compendium producer certificate (fresh measured certificate only); 53 of 58 bodies
unbound; nothing visually qualified; Q1 crab gape candidate only.

### Where to read
`audits/ANATOMY_REVIEW_20260917/` (this lane): `CLAUDE_R1BR2B_REVIEW.md` (§1–§8), `R9_ADDENDUM_FINISHED_TEXTURES.md`,
`E1_BATTLE2_INTEGRATION_DESIGN.md` (§5 status), `MASTER_PROGRAM_20260917.md`, `r1b-r2b-look/`. Code: `port/v2/apps/game/src/battle2/`
(`README.md` E1 section, `parts-rig.ts`, `habitat-arena.ts`, `e1-outcomes.test.ts`, `parts-rig.test.ts`). Codex lane:
`audits/ANATOMY_COMPLETION_20260917/` (its evidence folders as the run produces them).
