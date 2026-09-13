# Codex handoff — resume from the review packet, not from the pause checkpoint

Prepared 2026-09-11, revised 2026-09-12 by Claude for Nick to hand to OpenAI/Codex. This revision supersedes every earlier copy of this file and of the packet; overwrite on receipt.

## Read first, in this order

1. `ART_KIT.md` at the repository root. This is Art Kit **version 3**, retained verbatim as the retired version. Its structure is kept; its section 2 anchor is NOT the direction (see "Kit version 3 outcome" below). Do not paint from it.
2. `audits/CLAUDE_FULL_REVIEW_20260910/GAME_VOCABULARY_COVERAGE.md`: the game's real generation vocabulary with source citations. The kit must be built over it.
3. `audits/CLAUDE_FULL_REVIEW_20260910/ART_KIT_INTEGRATION.md`: the kit mapped onto the codebase, reconciliations, version 4 requirements, program version 4.
4. `audits/CLAUDE_FULL_REVIEW_20260910/README.md`: executive summary.
5. `audits/CLAUDE_FULL_REVIEW_20260910/FULL_REVIEW.md`: Parts A to L; Part K is the defect register (47 confirmed, 4 plausible) and the optimization register.
6. Then the usual: ROADMAP, PROCESS_LAWS, PARALLEL_GIT_PROTOCOL, UI_TOOLCHAIN startup.

## Direction lock

Nick's art direction is unchanged and is defined by four images in `audits/MIDGAME_ART_DIRECTION_20260908/`: `02-inhabited-worlds.png` (Living Worlds triptych, the scene reference), `01-discovery-atlas.png` (the sheet reference), `03-earth-full-landfall.png` and `04-alien-full-landfall.png`. The riverbank painting the game's local model currently produces is the gap to close, not a reference.

## Kit version 3 outcome

`frontier-sheet-01` and `frontier-plate-01` painted from version 3 came out as fantasy token-library art, because version 3's section 2 names the TSR illustrators and bans fur and feather. Nick rejected both images. They are not references. Version 3 is retired under its date; its structure survives into version 4.

## Where things stand

- `openai/mac` signed HEAD f6eed9b4 plus an uncommitted, unverified working copy (block32 OPFS variant storage, Prepare/Verify/Stop controls, first-step diagnostic, ten untracked files). `origin/develop` unchanged at c1791e21. PR42 parked Draft.
- The pause checkpoint's restart sequence continues the variant-storage path. Do not resume it; the review replaces that layer with in-worker expansion (FULL_REVIEW Part C1).

## First actions

1. **Overwrite.** Unzip Nick's packet at the top of the worktree. It contains `ART_KIT.md` (version 3, verbatim, SHA-256 `2266febc5937b447572358cee6bde66b4a710a87cff1a841e2aabe0c989204a3`) and six files under `audits/CLAUDE_FULL_REVIEW_20260910/`. Replace any earlier copies of these files completely; keep no earlier version of the packet anywhere else in the tree.
2. **Commit the dirty working copy** as a signed checkpoint first, including the ten untracked files. No integrated chain, no pack build, no native inference to do this.
3. **Retire version 3.** Move `ART_KIT.md` to `audits/ART_KIT_RETIRED/ART_KIT_v3_20260911.md` unchanged, with a one-line README stating the rejection and the two rejected images' paths.
4. **Write Art Kit version 4** at `ART_KIT.md` and show Nick the diff before painting anything:
   - Section 2 replaced by the frozen-style paragraph Nick supplied (lifted from the approved 02 and 03 prompts): rich natural-history fantasy painting, one hand across every subject, tactile directional brushwork, believable connected anatomy, weathered rock, individual but grouped foliage, deep atmospheric layers, readable silhouettes, selective high detail, soft natural light shared by every subject, honest ground and water contact, subtle foreground occlusion, premium painted science-fiction with discovery and character; Earth species keep real anatomy, fur, feather and botany; alien life keeps its data-driven form and palette in the same hand; not plastic CGI, not photography, not cartoon, not oversharpened, no glowing outlines. No illustrator or franchise names anywhere in the kit.
   - Section 1 reference lock: scene plate is `audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png`, sheet is `01-discovery-atlas.png`; record both SHA-256 values from that packet's README. Do not paint new reference images.
   - Section 3 star table: thirteen rows keyed by the game's `starClass.kind` (BD, M, K, G, A, B, PROTO, RG, SG, WD, NS, MAG, BH) with binary and trinary as Light-line modifiers, pigment and light words derived from each class's colour hex. The system card is filled by the compiler from star, planet, vista and biome data; nobody types it.
   - Fauna and flora negatives: remove "no mammalian fur or feathers" and "no Earth-identifiable species". Class 4F people: mark not applicable until the game has people. Rarity: map the five-step material ladder onto the game's ten display tiers.
   - Keep everything else: cut-out and scene split, class layouts, sizes, magenta key (applied at prompt-compile time only, seeded colours untouched), shared negative, section 7 rules, section 8 discipline.
5. **Update the references** in the same batch: `ART_DIRECTION.md` pointer to `ART_KIT.md` version 4 as the canonical style statement; `LOCAL_AI_GENERATION.md` records the compiled prompt rebuilt in the kit's order; `ROADMAP.md` handoff replaces the checkpoint restart sequence with program version 4 below.

## Program version 4 (do in order; each painting stop is Nick looking at the picture beside the triptych)

1. **Kit version 4 and the family library.** After Nick approves the v4 diff, paint the first library rows in the frozen style from the game vocabulary: the 25 creature family references (each family in its land, flying or aquatic form), the 48 flora, fungi and microbe form references, and the 43 biome plates. Twelve at a time; Nick reviews every sheet.
2. **The AI engine on the kit, the main deliverable.** Rebuild `landfall-conditioning.ts` as the kit's one interpreter, assembling prompts in the kit's order from game data. Repaint the six Earth references as kit-compliant cut-outs on the magenta key and the Earth temperate biome plate as the scene anchor. Unfreeze `steps`, `seed` and size. Implement per-organism passes composed on the plate and one low-strength finisher pass in `stage-worker.mjs`. Keep sessions warm across landings; build the VAE encoder once. One measured run at native size, judged against the triptych with bounding boxes per organism. Show Nick the painting.
3. **Defects that block that path**: FULL_REVIEW Part K items 1 to 10, 11, 17, 33 to 35. Every fix gets a negative control.
4. **iPhone probe**: `maxBufferSize`, `shader-f16`, storage quota, memory at transformer load. Gates all delivery work.
5. **Artwork durability** (FULL_REVIEW Part I5a).
6. **Prune and split**; admit the production tier on its exact head.
7. **Tier 1 finisher on the real phone**; tier policy, quality setting, crossfade, precomputed embeddings, start on orbit arrival.
8. **Library rollout by class** (stars, galaxies, planet templates, Earth priority plates, ships, items, emblems), Compendium through the finisher, battle staging, living-plate effects, one listening session.
9. **View-envelope sharing.**

## Do not

- Do not paint anything further from kit version 3.
- Do not resume the checkpoint's `--landfall --variant` native run or build a pack for the variant layer.
- Do not run prompt sweeps on the six-reference scene generator.
- Do not add storage or delivery engineering before the iPhone probe.
- Do not name a class in the kit that the generator does not produce; do not type a system card by hand.
- Do not take the checkout lock inside unit tests.
- Do not push, label, dispatch, merge, release or deploy without Nick's exact authorization.

## Paired Git handoff

- **Claude (`anthropic/mac`):** docs-only commits ahead of origin containing these files; not pushed; Codex's copies on `openai/mac` are the working copies. No push is needed; identical files merge cleanly later.
- **Codex (`openai/mac`):** overwrite, checkpoint, retire v3, write v4, update the three references, then program step 1. GitHub step now: none. PR42 stays parked.
- **Nick:** open the Codex app to hand over the zip and the prompt. Claude does not need to be opened until the v4 diff or the first painting is ready for review.

## 2026-09-12 addendum: Art Kit v4 draft review and the animation and battle track

**Verdict on Codex's v4 draft (openai/mac 6f5c396e): approve, with three watch items.** Reference lock hashes match the MIDGAME packet; the star table carries the thirteen source kinds with source hexes; binary and trinary are Light modifiers; the magenta rule is compile-time only; the system card is a compiler schema; people are inactive; rarity maps ten tiers onto five treatments; the fur and Earth bans are gone; section 9 stops for Nick before painting. Watch items:

1. The Discovery Atlas is the cut-out reference but shows framed plates with backgrounds. The text says the frame and background are not the output layout; check the first cut-out batch for inherited frames or dark plate backgrounds, and if they appear, add the sentence "the reference's frame and backdrop are not part of the subject" to the cut-out block in a v4.1.
2. Reorder section 9 c to g so the engine comes before the full library: paint only what the first painting needs (the Earth temperate biome plate, the six Earth cut-outs, and the five most common family references: mammal quadruped, bird, fish, insect, reptile), then build and show the engine painting, then roll out the remaining families, forms and plates twelve at a time.
3. The turnaround layout (4E) becomes the input to the animation track below; keep it.

**Animation and battle track (Nick, 2026-09-12: creatures inside the biome, Final Fantasy-style turn battles with attacks).** Runs after the first engine painting is accepted and before the full library rollout.

- Chain per creature: genome → family rig (one Blender master per painter family, the existing canid master first; proportions driven by genes within per-family bounds) → kit 4E turnaround as the reference → the finisher paints the creature's texture atlas ONCE in the frozen style → Blender renders the token pose and the clip set with that texture → exported to Pixi as skeleton plus texture (or sprite sheets where cheaper). The AI touches the texture once and never a frame, so animation is deterministic and flicker-free, and the same asset serves landfall composition, Compendium plate and battle.
- Clip set per family: idle, melee attack, ranged or cast, hit, faint, victory, with land, flying and aquatic variants where the painter routing demands them. Stage families in this order: mammal quadruped, bird, fish, insect, reptile, then the rest.
- Battle staging in the browser: the landfall plate is the backdrop, depth by scale and overlap, turn choreography of camera push-in, ability banner, strike, hit flash, short shake, damage number, recoil and return; existing audio cues and combat math drive it.
- Ability effects: the 11 themes (Fire, Frost, Storm, Tide, Stone, Venom, Void, Sand, Chem, Psionic, Wild) as painted effect sheets, crisp-edged shapes on the key, in the frozen style. This needs a kit revision (v4.1) adding an Effects cut-out class; Nick approves the row before any effect is painted.
- Guards: per-family gene bounds with a review sheet at the extremes of each family; separate hover and waterline rules for flying and aquatic battles.
- Proof before scale: one creature end to end, the Civet, from Blender master to finished texture to idle, attack and hit clips to one staged turn in the browser, shown beside its own landfall painting. Only after that holds does family-by-family repetition begin.
