# Time, planetary conditions and shareable paintings

Read-only current-code review, September 8, 2026 Eastern. Nick approved the full
rendering direction and requested it throughout procedural worlds, with time of
day, rotation, unusual orbits/seasons and shareable discoveries considered. This
records dependencies and a proposed visual contract; it implements no planetary
physics, clock, sharing format, save change or runtime artwork replacement.

## Current implementation

| Concern | Source evidence | Current behavior and limit |
|---|---|---|
| Landfall time of day | [biome-vista-surface.ts:141](../../port/v2/apps/game/src/biome-vista-surface.ts#L141), request at :177 | `mulberry32(seed ^ 0xD4A7)` chooses day below .62, twilight below .82, otherwise night. It is a fixed per-seed choice, not a running rotation/day clock. |
| Landfall weather and water | [biome-vista-surface.ts:96](../../port/v2/apps/game/src/biome-vista-surface.ts#L96), :119, :224 | Type, climate band and seed choose liquid/frozen/no water, deterministic static weather and scene palette. Night/dusk flags are presentation inputs; they do not simulate changing weather or seasons. |
| Climate | [surveyphrases.verbatim.js:59](../../port/v2/packages/domain/surveyphrases/src/surveyphrases.verbatim.js#L59) | Earth's band is fixed temperate; other bands use static orbital radius versus the star's habitable zone, star class and planet type. There is no seasonal temperature evolution here. |
| Planet record | [planetgen.verbatim.js:10](../../port/v2/packages/domain/planetgen/src/planetgen.verbatim.js#L10), [system.ts:8](../../port/v2/packages/scene/src/system.ts#L8) | Current generated fields include type, seed, rings, moons, palette and size; system nodes add scalar orbit radius and stable ordinal. These owners do not generate planetary axial tilt, rotation period, eccentricity, season phase or physical year length. Galaxy `tilt` is not planetary obliquity. |
| System orbit animation | [main.ts:7230](../../port/v2/apps/game/src/main.ts#L7230), :18721, :18779 | Planets use `orb * .13 + time * .05 / (orb * .012)` on circular XY positions. `time` is `performance.now() * .001`, or zero under Reduced Motion. This is presentation motion, not a portable ephemeris, physical year, N-body system or landfall sunlight authority. |
| Comets and multiple stars | [worldgen.verbatim.js:244](../../port/v2/packages/domain/worldgen/src/worldgen.verbatim.js#L244), :257, :293 | Binary/trinary companions and comet eccentricity/period/tilt exist. Comet orbit fields do not imply eccentric planetary seasons or physically integrated multi-star planetary climate. |
| Painted Earth turn | [planet-surface-turn-view.ts:171](../../port/v2/apps/game/src/planet-surface-turn-view.ts#L171), [math](../../port/v2/apps/game/src/planet-surface-turn-math.ts) | A bounded visible/effect/motion-governed turn samples the painted surface; lighting remains in view space. This finite authoring result is not a full physical rotation/day-night simulation. |
| Gameplay/ecology time | [f4-runtime-authority.ts:1](../../port/v2/apps/game/src/f4-runtime-authority.ts#L1), [ecology-epoch-edge.ts:1](../../port/v2/apps/game/src/ecology-epoch-edge.ts#L1), [active-play.ts:23](../../port/v2/packages/persistence/src/active-play.ts#L23) | Visible, answerable, lease-owned active play is persisted with the existing F4 authority. Ecology candidates are private until their exact commit publishes them. Wall time, render cadence and Reduced Motion must not advance or reveal an uncommitted ecology state. |
| Location sharing | [search-travel.ts:202](../../port/v2/apps/game/src/search-travel.ts#L202), :342; [cf1-code.ts:9](../../port/v2/packages/scene/src/cf1-code.ts#L9) | Native Share/Follow encodes CF1 and verifies the deterministic address hierarchy and recipient reach authority. CF1 accepts only `t,g,s,p,n`; it has no clock, ecological snapshot, camera, art recipe or catalogue version. A location code does not preserve the exact scene at the sender's moment. |
| Creature sharing | [lineage-codec.ts:1](../../port/v2/packages/domain/combatcore/src/lineage-codec.ts#L1), [combatcore.verbatim.js:704](../../port/v2/packages/domain/combatcore/src/combatcore.verbatim.js#L704) | CFB and CFB2 codecs exist in the domain, but current V2 player Search routes CF1 or Compendium text; native creature/Champion import/share wiring remains absent. CFB strips parents; CFB2 preserves one ordered uint32 pair with a version witness after normalization and omits mutable care state. Neither proves ownership or carries a painted recipe. |

Some retained Guide/release text describes legacy CFB UI and shared live cosmic
events. That text is not proof that a current V2 creature-code control or a
shared landfall ephemeris exists. Current source and the dated overlays in
[BREEDING_AND_SHARING.md](../../BREEDING_AND_SHARING.md),
[WORLD_GENERATION.md](../../WORLD_GENERATION.md),
[DETERMINISM.md](../../DETERMINISM.md) and
[SPECIES_AND_GENOME.md](../../SPECIES_AND_GENOME.md) take precedence.

## Keep identity stable while the view changes

[canonicalGenomeIdentityV1](../../port/v2/packages/domain/acquisition/src/model.ts#L412)
hashes the complete immutable genome, excluding XP, injury, feeding, brood,
assignment and bond. [speciesVisualKey](../../port/v2/packages/art/src/speciesidentity.ts#L1)
preserves the complete supplied portrait input and ordered lineage. A creature
seen at sunset must keep its anatomy, markings, lineage and species identity;
only scene light, pose/view and eligible environmental state may differ. Flora
properties, category, collection rules and acquisition authority remain data-owned.

A world share locates the same underlying world. It does not guarantee the same
ecology epoch: existing rosters can depend on the receiving expedition's committed
epoch. Nor does it guarantee the same presentation time. These differences must
be explicit rather than resolved by rewriting the recipient's save or silently
substituting the sender's organisms.

## Proposed versioned visual recipe — not implemented

Use a separate bounded recipe layered over the existing full canonical world and
organism identities. A possible future recipe must explicitly carry or resolve:

- **Version and content:** recipe schema, generator/art catalogue versions and
  immutable asset IDs/content hashes, with supported older recipes preserved.
- **Stable world and place:** full CF1 hierarchy, environment/profile digest,
  committed ecology epoch, a deterministic landing location and camera composition.
  Latitude/longitude or an equivalent surface frame is needed before local sun
  height and seasonal lighting can be meaningful; a planet seed alone is not a place.
- **Conditions:** explicit clock coordinate and units, reference epoch, rotation
  phase/period, axis orientation, orbital phase/period and any supported eccentricity,
  star-light inputs, atmosphere and bounded weather/season presentation state.
- **Organisms:** exact ordered source identities, final drawing owners, approved
  family anatomy/material variants and composition anchors. Derive presentation
  choices with separate versioned hash domains; spend no gameplay RNG and change no
  existing generator's draw chronology. Unknown versions refuse or use a clearly
  identified supported fallback, never silently reinterpreting old discoveries.

The clock is an explicit input to a pure conditions projection. It must not be
read from `Date.now()` or `performance.now()` inside generation. For an initial
local implementation, an injected coordinate derived from already-authoritative
active play is compatible with existing gameplay timing, but users would then
have expedition-relative skies. A globally synchronized visual clock would be a
separate product/authority decision; it cannot be inferred from the current
render ticker. Neither approach should let advancing a device clock award yield,
advance breeding recovery or mutate species/ecology.

For a fixed recipe and clock coordinate, conditions should reproduce the same
supported scene decisions. Reduced Motion should freeze or simplify visual
transitions while leaving those underlying decisions unchanged. Cache reusable
art/materials and bounded lighting variants; do not request an image-generation
job for every seed or every clock tick. A still landing can choose its conditions
once at arrival; gradual changes can be a later scoped presentation feature.

## Seasons and unusual systems need an explicit approximation

Seasons are not just a palette change based on distance from a star. A useful
model must account for axial tilt, latitude and orbital phase, with eccentricity
changing incident energy and the time spent in orbital regions. Atmosphere and
water/thermal inertia determine how quickly those changes are reflected in the
scene. Rotation gives local day/night; a tidal-lock or retrograde case needs its
own supported phase rule. Multi-star illumination needs an explicit bounded
light-source policy rather than assuming one universal sun direction.

These can be authored deterministic approximations suited to the game. They are
not current physical simulation, and this request does not authorize silently
changing today's biome, organisms, hazards or rewards. A visual-only first step
could share a light vector, sky tint, cast/contact shadows and material response
across the same environment, fauna and flora. Any seasonal ecology or gameplay
change needs its own versioned design and outcome checks.

## Share a place versus preserve a view

Keep existing CF1 bytes unchanged for **visit this place**. To support **see this
discovery as I saw it**, design a separate versioned snapshot/recipe envelope
containing the source world identity, supported art catalogue, exact relevant
organism identities, ecology/presentation coordinates and camera. It should be
view-only by default and confer no creature ownership, rewards or travel bypass.
This new envelope is a proposal, not an existing CF1/CFB feature. An exported
image can preserve exact pixels; recipe replay can reproduce supported visual
decisions but cannot promise identical GPU, DPR, font or antialiasing bytes.

This read-only audit ran no tests or browser, generated no new art and changed no
runtime, save, codec, clock, seed or RNG. The prior source-world contradictions,
art/identity limits and all verification blockers in the packet and ROADMAP remain
binding. The current batch should record this architecture without expanding into
all-world climate, all-family art or an engine replacement.
