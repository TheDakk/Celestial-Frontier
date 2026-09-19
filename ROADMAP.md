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

## SESSION HANDOFF — September 19, 2026 (evening) · R1c DIAGNOSTIC DIRECTION ISSUED; R9 ADDENDUM WRITTEN; CODEX'S TURN

Self-contained. Either lane can resume from this block alone. The morning handoff is archived verbatim
at the top of `ROADMAP_ARCHIVE.md`.

### Lane state (local only; nothing pushed, no remote state inferred)

| Lane | HEAD | Tree |
|---|---|---|
| `openai/mac` (Codex) | `d0437436` evidence on signed producer `6a58e40e` | two untracked leftovers (stale signing-blocker JSON, `review-diagnosis-01/`) |
| `anthropic/mac` (Claude) | this commit (review + R9 addendum + ROADMAP) | clean apart from `.DS_Store` files |

PR42 parked, no GitHub write, no push, no merge, no release. Lanes read each other by absolute path,
read-only; never sync to fetch a document.

### What Claude decided today (all in `audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md`)

1. **N3 is withdrawn.** The Mud/Vent drift is not diffusion; for a rigid vertex the gate equals the
   nearest painted vertex's rest offset rotated by the lower-leg's stance rotation. Two repair
   candidates exist (foot landmark onto the painted contact pixel; solver plants the painted vertex);
   **neither is chosen** until R1c (a) proves or disproves the closed form to ≤ 1e-9 px. The 0.25 px
   gate is unchanged; it is not noise; pinning is not re-proposed.
2. **R1c** is the one bounded next direction: measurements only on unchanged `6a58e40e`, two
   diagnostic-only harness switches, new evidence folders, stop for review. (a) drift closed-form proof
   + o=0 / |o|×2 / diffused-mutant controls; (b) Civet adapter hash + compat-solver reproduction, then
   family-vs-compat A/B with reach bounds and compression at the first failing samples — the
   distinction is a diagnosis aid, never a clearance; (c) variance floor, 2×2 {rows-first |
   presentation-first} × {declared | legacy scale}, persimmon fold ownership + amplitude sweep, and
   readability numbers (foot displacement / carapace dy) added to native crab reports.
3. **Visual findings for Nick:** V2 faint recovers instead of ending down; V3 pinch static (R3 scope);
   V5 fringes at 1× on Crab. Visual acceptance of the three films remains Nick's.
4. **R9 addendum** (`R9_ADDENDUM_FINISHED_TEXTURES.md`): finished PNG is a new retained original;
   alpha copied byte-for-byte; parts/paintSkin must rebuild byte-identical (masks transfer); count
   preservation by label components + boundary-gradient ratio; rebind must reproduce every geometry
   number; retention keyed by recipe/cutout/settings/model hashes; phone tier refuses (D1); Nick's
   sheet is the gate. Two open questions for Nick at its end.

### Amendment (same evening) — Codex's `review-diagnosis-01` (`4cb5f7a3`) landed in parallel
It proves R1c (a) to Float32 precision (2.5e-5 px), locates the persimmon fold in branch-3/4 foliage
pins, and finds **T1: a 42–57 px one-frame snap at approach → pinch** (gait travel has no owner across
transitions — the R3 `travel` contract). Amended order, in §5 of `CLAUDE_R1BR2B_REVIEW.md`:
**R1c-b/c (Civet A/B, CPU 2×2) → R2c (painted-support contact, offset-aware, landmarks untouched) →
R3 (+ T1 continuity gate) → one re-capture → Nick's look → R4 → R9.** Persimmon foliage rigidity is
Nick's decision before any collar design. **Copy-ready block for Codex: review §6; chunked minimal-stop program (Nick's request) in §7 — Chunk 1 runs R1c-b/c → R2c → R2d → R3 → R4 → re-capture → R9 → sheet with only S1/S2/S3 stops.**

### Who owes what

**Codex (openai lane):** R1c per the copy-ready block in §4 of the review. No solver, clip, record,
threshold, clamp, kit or binding change; no R3/R4/R9; no unchanged retry; no push. Stop for review.
R3 still carries `ContactPhase.travel?: 'solver' | 'stage'` and `contactJoint` on `compileAnatomyAttack`.

**Nick:** (1) authorize R1c or amend it; (2) visual verdict on the three films with V2/V3 in view;
(3) read the R9 addendum and answer its two questions; Q1 crab gape still a candidate only.

**Claude (anthropic lane):** idle until R1c evidence lands; then review it and choose the Mud/Vent
repair item. Track B E1 code does not start until R3 is on develop; its design is written.

### Still open, unchanged
N5/S5 phone tier (D1); N7–N10 not closed; I5 stale Compendium producer certificate (fresh measured
certificate only, never a pin edit); 53 of 58 bodies unbound; 12 observed; nothing visually qualified.

### Where to read
`audits/ANATOMY_REVIEW_20260917/` (anthropic lane): `CLAUDE_REVIEW_RESPONSE.md` (S1–S5),
`CLAUDE_R1R2_REVIEW.md` (N1–N12), `CLAUDE_R1BR2B_REVIEW.md` (V1–V6, N3 correction, R1c),
`R9_ADDENDUM_FINISHED_TEXTURES.md`, `MASTER_PROGRAM_20260917.md` (D1–D4 approved),
`E1_BATTLE2_INTEGRATION_DESIGN.md`, `r1b-r2b-look/` (contact sheets). `audits/ANATOMY_COMPLETION_20260917/`
(openai lane): plan, static checkpoints, all native evidence, `NEW_SESSION_PROMPT_20260919.md`.
