# Review of the Art Kit v4.2 proposal (Arena profile, Effects class)

Date: 2026-09-12. Reviewer: Claude, read-only. Source: openai/mac d2b8d8cd, `audits/ARENA_EFFECTS_V42_PROPOSAL_20260912/`.

## Verdict: approve, with three amendments before it is applied

The two blocks are in the kit's own format, additive, and leave the frozen paragraph, reference locks, shared negatives, sizes and 4E untouched. The compiler and staging contract matches Nick's direction (procedural arenas from biome-family template plus system card plus a battle-context seed, home-versus-visitor rule, side-view staging, tempo, 60 fps tweened parts rig). Three things must change before painting, or the first batch will produce plates that cannot be layered.

### Amendment 1: mid and near plates must be painted on the key, not extracted afterwards

The proposal paints all three arena plates as opaque full-bleed scenes and says mid and near "extraction masks are retained as separate intake data". An opaque painting has no key to extract; a mask would have to come from segmentation, which is unreliable and would put a soft, guessed edge exactly where parallax reveals gaps. The kit already has the deterministic answer: the key. Rule for the Arena profile:

- FAR: full-bleed opaque scene (sky, distant landforms, atmosphere).
- MID: painted content (fighting ground, horizon band, restrained landmarks) with the flat magenta key above its skyline, so the far plate shows through; keyed at intake like a cut-out.
- NEAR: the quiet ground edge on the key, keyed at intake.
- The cut-out technical block applies to MID and NEAR (crisp opaque edges, no halo, nothing magenta in the subject); the scene block applies to FAR.

### Amendment 2: register the fighting ground explicitly

State a normalized fighting-ground line (for example 0.78 of frame height) that all three plates share and that the recipe records, so combatant stands, paws, shadows and effect impact anchors register to one line across every arena. The proposal says "shared ground registration" without a number the compiler can check.

### Amendment 3: update the class enumerations, not only the blocks

Section 0's cut-out and scene lists, section 1's reference-lock routing (scene classes attach the triptych, cut-out classes the atlas), section 5's cut-out and scene block lists, and section 6's cut-out clause must name Arena (FAR as scene; MID and NEAR as key-painted) and Effects (cut-out). The kit's discipline is that a class exists only where the lists say it does; a block without list entries is the copy-paste mistake section 0 warns about.

### Minor

- Effects: deliver an anchor JSON per sequence (canvas size, origin and contact anchors, phase order) so runtime sequencing does not read positions from pixels. The proposal implies it; state it in OUTPUT.
- Effects: allow two to four travel frames under the same registration for looping travel; the proposal's "any extra key images" sentence covers it, keep it.

## Bounded proof after approval

As proposed: the Earth temperate arena's three plates (FAR opaque, MID and NEAR on the key), one Wild sequence (launch, travel, impact) with its anchor JSON, then Civet versus Platypus staged in that arena with the parts rig at the specified tempo. Nick reviews the three plates and the sequence as images before the staged turn is built.

## Tooling

The four pinned npm packages and the two Homebrew CLIs in `TOOLING_ADDITIONS_20260912.md` apply to this proof. Nick's instruction: pngquant and oxipng join the approved idle tools under the existing auto-update policy in `UI_TOOLCHAIN.md` and `development-toolchain.mjs`.
