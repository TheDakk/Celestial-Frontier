# The morph system — design (Claude, 2026-09-22; Nick: "critical path, I need that to work")

PROGRAM §1 (Nick, 2026-09-20): *variety is combinatorial from a finite painted library; a feature nobody painted
does not appear; morph-tier creatures never enter intake.* A **morph** turns one accepted archetype (painted master +
record + binding + atlas, admitted through the intake chain once) into a genome-specific individual at runtime —
deterministically, on every device identically, without new anatomy. This document is the design and build order.
Owners follow the lane law: painting (archetype masters, marking masks) is Codex's; parameters, assembler, gates,
sheets and the stage are Claude's. Everything below is additive; nothing changes an accepted archetype's bytes.

## 1. Channels (what a genome can change on a painted archetype)
| Channel | Genome genes (v1 `makeGenome`, already carried to v2 as `MotionGenomeFields` + the plain genome object) | What moves | Where it is applied |
|---|---|---|---|
| **M1 proportion** | `size` (via massClass — exists), `head`, `tail`, `limbs`, `eyes` | bone-axis SCALE of non-contact sub-trees (head / jaw / ears / tail / eye stalks / antennae) within a per-family envelope; **legs and contact chains are NOT scaled in this slice** (the contact solver plants on record landmarks — leg morphs land after the solver reads a morphed skeleton, a Codex item) | the pose program's per-joint local affine (a scale along the bone from its pivot), composed before the parent — the paint skin follows through the compiled skin field, rigid parts through `setFromMatrix` |
| **M2 palette** | `color`, `accent`, `lumin` | hue/chroma remap of the atlas per part group (body vs accent groups: head, claws/paws, tail tip, markings) with **luminance preserved** so the painted finish survives; lumin adds an emissive lift on the accent set | once per individual at rig load: pure RGBA function over the decoded atlas (browser: OffscreenCanvas → `Texture.from`); cached by (archetype recipe hash, genome hash) under the 1,200 art-cache cap |
| **M3 markings** | `pattern` | one of the archetype's PAINTED marking masks (stripes / spots / bands / mottled / marbled / eye-spotted, painted once per archetype by the kit hand as alpha masks in atlas space) blended with the accent colour; a pattern with no painted mask renders plain (the law) | same pass as M2 |
| **M4 emissive** | `lumin` | glow on the marking mask or accent set | same pass (stage bloom is out of scope) |

Not channels: anatomy (limb count, head shape, tail kind) — those select an ARCHETYPE from the library (P3/P4:
archetype masters per template); they never morph.

## 2. Determinism (rule 1)
`morphParamsV1(genome, archetype)` is a pure function of the genome's integers and the archetype's recipe hash
through `hashInt`; no clock, no `Math.random`, no device state. Golden fixture: 64 seeds × two archetypes → params
byte-identical across runs and devices (a `goldenseeds`-style sealed JSON in `port/baseline-…`).

## 3. Gates (each with both-way negative controls, per PROCESS_LAWS)
- **M-A morph envelope** (per archetype, measured once, retained): the proportion extremes (every M1 gene at min and
  max, and the pairwise corners) pass the rig's static rows — exact rest, contact, limits, seams — on the family
  solver; a morph outside the envelope is clamped to it and the clamp is recorded (`ClampedBound`, exists).
- **M-B palette conservation**: alpha plane byte-identical; per-part luminance structure preserved (SSIM against the
  finished/painter atlas above a recorded bound); chroma inside the kit's palette; a marking mask never paints
  outside the archetype's alpha.
- **M-C determinism**: golden params + golden remapped-atlas hashes for the fixture seeds.
- **M-D cost**: the M2/M3 pass runs once per load, desktop: < 20 ms for a 1254² atlas (measured, recorded); no per-tick
  cost — the stage CPU gates are untouched by construction. Phone tier: painter tier only until D1 says otherwise.
- **M-E the eye**: one sheet per archetype — 12 morphed individuals from 12 seeds beside the archetype (Nick).

## 4. Build order (Claude, each step scored before the next; the crabs and the Civet are the subjects)
1. `morph-params.ts` — genome → `MorphParamsV1` (M1 scales per sub-tree, M2 hue/chroma per group, M3 mask id, M4
   lumin) with the envelope clamp; golden test (§2).
2. `morph-palette.ts` — pure RGBA remap over the atlas by part group with luminance preserved; conservation test
   (M-B) on the five crab atlases; a 12-seed sheet of the crab (M-E) for Nick.
3. M1 on the pose program — a `boneScale` map consumed by `createSkeletonPoseProgram` (local scale along the bone,
   non-contact sub-trees only); envelope test (M-A) on the six rigs through the real stage (zero refusals at the
   extremes); the head/tail/ear morphs filmed on the Civet.
4. Wiring: `battle2-wiring.ts` builds the individual from (archetype, genome) — the atlas remap before
   `loadCreatureRigV1`, the bone scales into the rig; the same individual on the Compendium card (portrait) so the
   creature the player bred looks the same in the codex and the arena.
5. M3/M4 once Codex has painted the first marking-mask set for one archetype (the prompt block is a P4 item).
Leg-length morphs and archetype selection (P3/P4) follow; both are recorded here so nobody builds them by accident.

## 5. Decisions for Nick (none block step 1–3)
1. M3's marking-mask set: paint for the crab first (the accepted archetype with five variants) or the Civet?
2. The palette law: does `color` recolour the WHOLE body or only the kit's designated "base" group per archetype,
   with `accent` on the rest? (Design assumes base + accent groups declared per archetype in a small JSON beside the
   record — an archetype-side declaration, written by the painting side like presence.)
