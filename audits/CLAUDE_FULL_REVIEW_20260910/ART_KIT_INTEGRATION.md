# Art Kit v3 integration — how the kit maps onto the codebase and the review

Date: 2026-09-11. Author: Claude (Anthropic), read-only review role. The kit itself is Nick's; this note changes nothing in it.

## Provenance

`ART_KIT.md` at the repository root is Nick's "Celestial Frontier Art Kit, version 3, 2026-09-11", stored byte-for-byte as supplied: 35,728 bytes, SHA-256 `2266febc5937b447572358cee6bde66b4a710a87cff1a841e2aabe0c989204a3`. Per its own section 8, it is never reworded at send time; corrections go into a new version of the kit, not into this note.

The kit supersedes the review's earlier recommendation to "write one canonical style paragraph": section 2 (Frozen style) is that paragraph, and sections 1 and 6 are the fixed companions to it. The direction lock in the review stands: the kit is the direction; everything below is how the codebase serves it.

## What the kit gives the codebase

- **Two kinds of image with opposite rules.** Cut-outs (orbital planets, flora, fauna, people, ships, landmarks, items, emblems) on a magenta key; scenes (universe, stars, biome plates) full-bleed. The game already composites sprites over scenes; the kit makes that a designed pipeline instead of an accident.
- **The system card.** Star decides light, light decides palette, palette decides plants, plants decide animals. This is exactly the shared-light-and-atmosphere cohesion Nick approved in the Living Worlds triptych, expressed as data a generator can consume.
- **The one interpreter (section 8).** Prompts generated from game data by one tool, sent verbatim, hashed with the image. That is the genome-to-conditioning compiler the review said did not exist; the kit specifies its output format.
- **A finite library plus an infinite game.** The eleven classes cover everything with a document key: named Earth residents, guardians, people, ships, landmarks, items, emblems, and one star, orbital and biome plate per system card. Procedural fauna and flora variants (the millions of seeded organisms) are not library rows; they are produced on demand by the deterministic painter and finished by the model in the same hand.

## How the landfall painting is built under the kit

Section 4C says the biome plate leaves its lower third quiet "so that cut-out flora, landmarks and creatures can be composited onto it". The direction decision of 2026-09-08 says a cut-out placed over a background does not meet the direction. Both are true, and the review's architecture reconciles them: the plate plus composited cut-outs is the composition (exact species, counts, placement, identity), and the finisher pass (low-strength image-to-image in the frozen style, with the system card's light) is what turns "composited" into one painting with contact shadows, overlap and shared atmosphere. The painter's composite is an intermediate the player never sees.

## Reconciliations that need a decision from Nick

None of these changes the direction. Each is a place where the kit and the existing binding data or tooling meet, and one sentence settles it.

**R1. Earth profile.** The anchor says alien life is "chitin, membrane, mineral growth and bioluminescent pigment rather than fur and feather", and the fauna and flora negatives ban Earth-identifiable species and mammalian fur "unless named". The canonical Earth roster (nineteen genomes, six named residents, the fox in the approved plate) keeps real anatomy by the direction decision. Proposed: the Earth system card carries one line, "EARTH PROFILE: named Earth species keep their real anatomy, fur, feather and botany; the anchor's material clause applies to alien worlds." Decide whether that line is added to section 3 or lives only in the Earth card.

**R2. Star table versus the game's star classes.** `worldgen` derives systems from `starClass(seed)` with kinds M, K, G, A, B plus NS, BH and MAG, binary and trinary flags, and protostar nurseries. Determinism forbids changing that generator, so the kit's closed table must be a mapping over it. Proposed mapping: M to EMBER, K to AMBER, G to WHITE, A and B to AZURE; CINDER only if the star catalogue exposes a giant phase (to verify); `binary` to TWIN with the companion pigment taken from the actual companion colour rather than a fixed white dwarf. Missing rows the kit must add before those systems can be painted: NS (neutron star), BH (black hole), MAG (magnetar), protostar nursery, and a rule for trinaries. Section 3 says a class is added only by adding a row; these rows are Nick's to write.

**R3. Magenta rule versus seeded palettes.** Genome colours are seeded and can fall in the violet-magenta band (for example an iridescence of `[125,77,201]`). The generator cannot change. Proposed: apply the exclusion at prompt-compile time only, mapping any seeded hue in the reserved band to the nearest permitted pigment word for the painted rendition; genome data and identity are untouched. For the local model's per-organism passes, test whether it holds a flat `#FF00FF` field; if not, keep the existing matte plus the token library's keyer, which the kit already reuses.

**R4. Negatives and the local model.** The pinned local model has no negative-prompt input. Sections 6 and the per-class negative additions apply to the library generator. The compiled local prompt folds bans into positive statements, following section 7 rules 1 and 3.

**R5. Reference lock.** `frontier-sheet-01.png` and `frontier-plate-01.png` do not exist yet (section 9 b and c). The approved Living Worlds triptych and Earth landfall remain approved references. By the kit's own rule the frozen anchor wins if they differ. Proposed: paint plate-01 from the anchor using the Living Worlds composition strategy, place it beside the triptych, and accept one lock; record its SHA-256 in the kit's next version. Until then the triptych's fox panel is the interim scene anchor for local experiments.

**R6. Token budget.** Frozen style is about 170 tokens, a system card about 80, one subject about 60, one layout about 50. That fits the local model's 512-token limit for one subject per pass and cannot fit six. This confirms the per-organism passes recommended in the review; the six-subject single pass cannot carry the anchor.

**R7. Companion clause.** Section 9 a must be settled before any volume generation. Recommendation, since this is a creature-collecting game with breeding and a Compendium: keep "wondrous in tone" without "never cute" and use the companion rule in section 4E. Nick decides.

**R8. Sizes and budgets.** Cut-outs at 1024 square (about 150 KB WebP) and plates at 2560 by 1440 (about 600 KB) sit inside the existing art cache cap and the 500 MB to 1 GB scene budgets, because the library is finite. The on-demand tiers are unchanged. Guardians and canopies at 1536 square should be lazy-loaded on battle entry on phones.

**R9. Production discipline.** The kit's rules already match the project's laws: hash every prompt is recipe hashing; keep every capture is the originals store; never overwrite is the archive law; review everything is the fidelity contract, which should record bounding boxes as the review recommended. "Filenames are the wiring" applies to library classes with document keys; procedural variants keep recipe identity.

**R10. One interpreter is the compiler.** The conditioning compiler is rebuilt to assemble prompts strictly in the kit's order (reference lock, frozen style, system card, subject, accuracy, layout, technical output, negative) from game data: the system card from star and planet data via R2, the subject from genome and descriptor data, accuracy counts from the body plan, the layout from the class. Its output is hashed into every recipe. Hand-authored anatomy prose is retired except for named Earth species, which the kit already treats as named subjects.

## Updated program (version 3)

1. **Adopt the kit.** Settle R1, R2 rows, R7; paint `frontier-sheet-01.png` and `frontier-plate-01.png`; calibrate eleven images from one system card; freeze; record both SHA-256 values in the kit's next version.
2. **Local model on the kit.** Rebuild the compiled prompt in the kit's order; repaint the six Earth references as kit-compliant fauna and flora cut-outs on the key; compose them on the Earth biome plate; per-organism passes and one finisher pass; unfreeze steps, seed and size; one measured run judged at native size against plate-01.
3. **iPhone probe.**
4. **Defect register** (Part K of the full review).
5. **Artwork durability** (Part I5a).
6. **Prune and split**; admit the production tier on its exact head.
7. **Tier 1 finisher on the real phone**; tier policy, quality setting, crossfade, precomputed embeddings, warm sessions, start on orbit arrival.
8. **Library rollout by class**: guardians, ships, items and emblems through the kit; Compendium plates through the finisher; battle staging; living-plate layer effects; the listening session.
9. **View-envelope sharing.**
