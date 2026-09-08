# Biome/UI references and reproducible creature codes — September 8, 2026

This addendum follows the sealed [painted pipeline packet](../PAINTED_SPACE_PIPELINE_20260908/README.md).
Its original captures, decisions and 647-file staged recovery remain unchanged. Nick subsequently
provided the two images below and reaffirmed the original goal: practically unbounded seeded
exploration and codes that let other players see the same generated creature. No runtime code or
schema changed in this addendum. [Exact source paths, hashes and scope](intake.json).

## Reference scope

[Biome reference](biome-reference.png): nine painted studies, read across: eroded canyon,
volcanic basalt, pale dunes; ice plateau, tidal flats, cave pool; fungal forest, mineral columns,
alien pod field. These enrich the material/light/composition reference, but do not create new
biome IDs, change climate or grant life/civilization to a world whose generated data lacks it.

[UI material reference](ui-material-reference.png): dark textured panels, restrained metallic
edges, mineral-blue controls, warm neutral ornament and rich embedded illustrations. Nick's
explicit instruction is **“I don't want to copy this UI at all.”** Preserve CF's existing layout,
control positions, navigation, terminology, font preferences, colorful emoji direction and touch
targets. The reference supplies appearance cues only. Do not import its invented currencies,
travel times, left rail, panel placements, text or icon system. Real UI text and controls remain
semantic HTML/CSS; generated text in this image is not an implementation specification.

The two earlier supplied space/creature sheets remain the approved visual direction, bound in
[approval.json](../PAINTED_SPACE_PIPELINE_20260908/approval.json). No repeat approval is needed.
Individual production assets, profile geometry, procedural coverage and device acceptance remain
separate. The initial pipeline packet's “biome/UI forthcoming” wording describes its earlier
checkpoint and is superseded by this received-reference addendum.

## Reproducible creatures are compatible with richer art

Keep the creature's canonical biological data separate from how it is drawn. For a naturally
generated creature, a seed plus the exact generator may reconstruct its original genome. For a
bred or otherwise authored phenotype, a seed alone is insufficient: preserve the complete
immutable traits and ordered lineage needed by the generation/art owners. A versioned visual
recipe maps that identity to compatible anatomy, proportions, materials, patterns and movement.

Proposed reproducibility contract:

`canonical immutable genome + lineage + generation/art recipe versions + exact catalogue revisions`

Every compatible CF client resolves those inputs using the same canonical rules and approved
resources. That preserves recognizable shape, colors, markings and compatible animation; small
GPU/browser antialiasing differences are not a different creature. A prompt hash or model seed is
not an equivalent contract. Do not ask a live image model to repaint each shared creature. If an
individual approved painting is used, share its immutable asset identity/content hash, not a
request to regenerate it. Preserve older supported recipes/resources or use an explicit migration;
a missing/unknown version must not silently substitute a different organism.

There can still be a vast deterministic exploration space. Generate coordinates, world facts and
genomes on demand, then compose compatible authored resources. Clients need only the active
scene's art and a bounded cache, not a stored picture for every possible planet or genome.
Authored families must support coherent combinations, rare forms and the existing lineage
system;12 reference creatures are examples, not permission to reduce the universe to12 models.
Quality across the supported combinations remains substantial work and needs an actual sample.

## What V2 currently implements

- **World sharing is live.** `apps/game/src/search-travel.ts` and `packages/scene/src/address.ts`
  accept strict CF1 addresses, regenerate the hierarchy and enforce source/reach checks. CF1
  carries galaxy/star coordinates/seeds and optional planet seed/name; it has no explicit visual
  catalogue/generator version. This is an address, not a creature payload or ownership grant.
- **Creature codec foundations exist, but the native V2 share/import UI is still open.**
  `apps/game/src/guide-content.ts` explicitly says CFB challenge imports are unavailable in this
  slice; no current app caller invokes the creature encoders/decoders. Legacy CFB in
  `packages/domain/combatcore/src/combatcore.verbatim.js` sends genome/name and optional champion
  XP; decoding normalizes traits and removes parents, injuries and progression/modifier fields.
  Champion XP is clamped and exhibit-only. It is not a lossless archive of arbitrary input.
- **CFB2 adds bounded ordered parent continuity.** `packages/domain/combatcore/src/lineage-codec.ts`
  has explicit body version2 and an8192-character bound. It checks matching ordered parent tuples,
  normalizes the genome, then restores the permitted parent pair and removes care fields. Its
  tests compare normalized values; it is not a completed art-versioned sharing protocol.
- **Current identity already goes beyond seed.** `packages/domain/acquisition/src/model.ts`
  creates `species-v1` and `genome-v1` hashes from the complete canonical immutable genome after
  excluding only listed mutable care/progression/assignment/bond fields. The separate
  `packages/art/src/speciesidentity.ts` keys every supplied genome field for portrait caches.
  Neither cache identity nor a share code establishes owned inventory, bond or rewards.

All source paths above are under `port/v2/`. The known seed-only/byte-identical wording in the
current sharing reference is corrected in this batch; no codec normalization or domain rule was
silently changed. Source inspection, not a fresh integration test, establishes this boundary.

## Transfer between games and the next work

Nick subsequently confirmed biome scaling, rich Compendium framing, articulated attack-specific
battles and a future Unity/Unreal portability goal. He authorized beginning the art direction.
[Current tooling, source findings and scene implementation brief](ENGINE_AND_SCENE_BRIEF.md).

Between players, saves and devices running compatible **Celestial Frontier** versions: this is
the intended supported direction. Between unrelated games: a common portable phenotype schema,
compatible assets/animation and an importer are necessary; a CF code cannot make an arbitrary
game understand CF anatomy or grant ownership automatically. Preserve data portability while
making each adapter explicit.

Keep the next bounded rotating-planet proof from
[PERFORMANCE_AND_ANIMATION.md](../PAINTED_SPACE_PIPELINE_20260908/PERFORMANCE_AND_ANIMATION.md).
In parallel planning, define the versioned art-recipe/canonical-identity contract before expanding
creature assets. Then qualify one shared bred creature across two isolated clients, including
matching shape/material/lineage, unknown-version handling, static fallback and preserved ownership
rules. No new codec version, external service, unbounded catalogue, hosted action or unrelated-game
integration is implemented or promised by this reference decision.

Codex/macOS/openai/mac owns the local work. Existing signing and full-chain verification blockers
remain. Claude need not open/sync now; the current ROADMAP handoff and recovery contain this
addendum for review. The approved24-hour local campaign is not extended.
