# D2 — the first guardian: design (Claude, 2026-09-21)

Decision D2 (MASTER_PROGRAM_20260917 §"Decisions", approved by Nick): **one Earth-temperate apex at 1536 square
through the existing pipeline, before any guardian-specific system.** "It proves P5 is 'same pipeline, bigger'."
This document is the design; nothing here is built. Owners follow the lane law (painting tool and IC-3 writers are
Codex's; compiler, battle2 scale/fill, sheets are Claude's).

## 1. What a guardian already is (source of truth)
- v1 rules (`main.js`): `guardianFor(pseed)` makes a source-owned apex with a forced summit grade
  (`g.apex`, raw 12–14, `colorGrade` force ≥ 12, epithet from `GUARDIAN_EPITHETS`); apex/paragon are keys in the art
  cache (`_A`/`_P`). All three raw grades DISPLAY as Transcendent. Deterministic from the planet seed — no clock.
- Kit rule (ART_KIT v4.3, THE GUARDIAN RULE): painted at **1536 square**, fills the battle screen, carries the
  system's **One signature** on its body (black glass, ring shadow, mineral shards); focal detail more ornate than any
  other creature in the system; its face named part by part with a temper the player should fear.
- E1 §1.5: a guardian is an apex record at 1536; `combatantScale` gains a `massClass 'titanic'` mapping and a
  frame-fill rule as an OPTION of the existing scale, not a special rig. Boss choreography is a Motion Kit §4 item,
  explicitly not in the first slice.

## 2. The choice: species and template
Recommendation: **Brown Bear** (`fauna.json`: quadruped, aspect 1.5, headFrac 0.22, Earth-temperate apex).
Why: the quadruped template is the one proven on two subjects through the intake compiler (Civet and Wolf both
ADMIT; the Civet passes PROGRAM §6's landmark bound at 31 px); a bear's mass class is the first honest test of
`titanic`; its side-on painter guide exists in the same smoke set the Wolf's came from. Alternatives if Nick
prefers a predator silhouette: Tiger (aspect 2.1) or Cougar (2.2) — both quadruped, both temperate, both longer
bodies that stress the frame-fill rule more.
Not recommended for the first guardian: a biped (Eagle) or any family without a second compiler subject.

## 3. The pipeline, step by step, with owners and gates
| Step | Owner | What | Gate |
|---|---|---|---|
| G1 prompt + paint | Codex | the retained P1 compiled prompt with the GUARDIAN RULE block: 1536 square, One signature (which system: the home system's, `Sol`, seed 424242 — its signature is already defined by the kit's system plates), temper line for the face; guide = the side-on painter guide at 1536 | master format check (1536², magenta key or alpha), Nick's art acceptance |
| G2 declaration | Codex (data) | `presence.json` with `hidden`/`absent`/`folded` from the painting (the folded class exists since 2026-09-21) | schema check |
| G3 compile | Claude | `score.mjs`-style run under the quadruped template: verdict, landmarks (root/knee/ankle/paw at the reference fractions, tail by the tuft rule), labels, sheet | verdict ADMIT; wrong-template mutant refused |
| G4 hand fit (comparison only) | Codex | one hand record as truth, as for the five crabs | compiler landmarks within the §6 bound (60 px at 1254; scale to 74 px at 1536 or keep 60 — Nick's call) |
| G5 rig + film | Codex (IC-3 writers, frozen — needs Nick's one-guardian release) | binding, static rows, native film on the stage | static rows green; the painted-tier CPU gate (see §5) |
| G6 battle2 | Claude | `massClass 'titanic'` + frame-fill option in `combatantScale`; the guardian as attacker/target in `e1-outcomes.test.ts` | outcome tests pass; the film shows the fill |
| G7 sheet | Claude | one review sheet: the master, the compiler's reading, the fit, the film row | Nick's eye |

## 4. What changes in code (all small, all additive)
- `combatantScale`: `massClass 'titanic'` → scale so the body box fills the arena height minus the HUD band; a
  `frameFill` option (0–1) rather than a species branch. Two outcome tests: a titanic combatant's drawn height is
  within 2 % of the fill target on both viewports; a non-titanic combatant is unchanged (byte-identical geometry).
- Intake compiler: nothing family-specific — the quadruped template already carries the tail and contact terminals;
  `templateRest` ratios are body-relative, so 1536 needs no constant change. One expected finding: the painting's
  working scale (512 px longest side) halves detail for a 1536 master; if candidate counts drop, `detectTips`'s
  `longest` becomes a template-tier setting (painted 1254 vs guardian 1536), measured, not assumed.
- Art cache: the `_A` key already separates apex art; a 1536 texture must respect the cache cap (1,200 entries) and
  the phone tier (phones never load painted masters — D1); the guardian is desktop-only until D1 says otherwise.

## 5. CPU — the one number that needs a decision before G5
The painted tier's gate is 3.5 ms full-film p95 on desktop at boundary 24 / interior 56 (PROGRAM §6). The five
crabs read 3.6–4.0 ms at 1254². Vertex count scales with the boundary length, so a 1536 master with the same steps
carries ≈ 1.22× the boundary vertices and a larger interior: expect ≈ 4.5–5 ms on the same rig. **A guardian
cannot meet the painted-tier gate as written**; the options are (a) a guardian tier with its own gate (recommend:
5 ms, desktop only, one on screen at a time), or (b) boundary step 32 for guardians (Codex's table showed step 48
breaks contact on the vent crab; 32 is unmeasured). This is Nick's decision; the design assumes (a).

## 6. Determinism and seeds
The guardian's species and grade come from `guardianFor(pseed)`; its master and record are keyed by the species
visual key exactly like the crabs; the One signature is the system's, fixed by seed. No new randomness anywhere; the
painting step is the only non-deterministic act and is retained as an accepted original (the vision program's
trust contract), never regenerated at runtime.

## 7. Out of scope for D2 (recorded so nobody builds them by accident)
Boss choreography and phase changes; a lair scene; guardian loot/cache changes (reserved product decisions in the
archive); people/sapient guardians; any second guardian before the first has a film Nick has looked at.

## 8. Open decisions for Nick
1. Species: Brown Bear (recommended) / Tiger / Cougar.
2. CPU: a guardian tier at 5 ms desktop-only (recommended) or boundary 32.
3. The §6 bound at 1536: 60 px (as for the crabs) or scaled (74 px).
4. Release of Codex's IC-3 writers for this one guardian (G5), as PROGRAM §6 released one quadruped.

## 9. Paired next steps
Nick: the four decisions above. Codex: nothing until the decisions, then G1–G2. Claude: G6's `combatantScale`
option and its two outcome tests can be written now against a synthetic titanic record (no painting needed) — that
is the next Claude item on this track.
