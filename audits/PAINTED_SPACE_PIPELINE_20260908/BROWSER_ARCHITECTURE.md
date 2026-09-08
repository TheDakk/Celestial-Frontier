# Painted space: browser architecture proposal

Current decision update: Nick subsequently approved the supplied space and creature references;
see [approval.json](approval.json) and [the rotation/performance plan](PERFORMANCE_AND_ANIMATION.md).
Earlier conditional approval wording below describes the proposal before that decision. Biome/UI
references and individual profile/animation/device acceptance remain open.

2026-09-08 · OpenAI/Codex on macOS · local `openai/mac` worktree. Documentation only: no runtime selection, dependency installation, code change, build, test or render accompanies this proposal. The external review snapshot remains unchanged.

## Recommendation and instruction authority

Continue Celestial Frontier V2 with its existing Pixi scene compositor and accessible browser UI. Develop painted 2D assets, restrained effects and an authored, compatible deformation path around the current navigation and a fixed-view creature encounter. Preserve generation, complete genomes, combat and persistence. Do not restart those systems to adopt richer paint.

The current [user brief](USER_PROMPT.md) supplies the proposed `frontier-oil-01` direction: believable mass, visible oil brushwork, weathered surfaces, selective detail and dramatic warm/cool lighting; serious and adventurous, never cute, cartoonish or glossy product CGI. The earlier Pokémon reference is useful for creature attachment, memorable silhouettes, readable actions and turn-based rhythm. It does not require cute proportions, anime treatment or franchise copies. Expressive, recognizable creatures can meet the mature brief.

The anchor and reference candidate still require style approval before bulk generation, as the user explicitly requests. Local candidates are review material, not accepted product art. Existing protected portraits and named-species identity remain the fallback while a replacement is evaluated.

Treat the attached materials according to their role:

- **User instructions:** the current space brief, including original designs, profile separation, preserved captures, review states and style approval before bulk work.
- **Reviewed examples:** the copied queue, importer, keyer and ledger implementations illustrate a workflow. Their Foundry dependencies, provider adapter and fantasy appearance rules are not installed CF capabilities. The [pipeline review](PIPELINE_REVIEW.md) identifies those limits and the opaque-banner alpha-gate bug; do not modify the external source snapshot to repair it.
- **Historical context:** old source comments, the Dakk contract, its fantasy exclusions and older file inventory do not override the new brief. Preserve licenses and provenance. The demo's fictional IDs, seed selector and overhead ship descriptions are examples, not CF identities, a replacement RNG or a gameplay mandate. Its metadata demonstration does not prove art, alpha extraction or browser performance.

## Cameras and scene profiles

The actual navigation authority is [ZoomMode/NavState](../../port/v2/packages/scene/src/zoommode.ts): universe → galaxy → system → surface with proven parent addresses. Existing rendering lives in [main.ts](../../port/v2/apps/game/src/main.ts), at `drawUniverse` (6136), `drawGalaxy` (6334), `drawSystem` (6690) and `drawSurface` (8889); line numbers may move.

| CF surface | Proposed painted treatment and camera contract |
| --- | --- |
| Universe and galaxy navigation | Preserve the current map framing, selectable identities and zoom transitions. Compose painted background fields and approved object silhouettes around those positions; maintain readable picks and labels. This is navigation, not freely piloted overhead flight. |
| System navigation | Preserve the orbital diagram, generated star/planet identity and current camera. Specify body, cloud, atmosphere, rings and effects separately where needed. Match the canonical light direction: a baked shadow cannot rotate independently of illumination. Keep star classes and generated companions distinct. |
| Surface exploration | Retain the native globe/vista/Survey relationship and real controls. Paint a biome background for its actual phone/desktop crop; place compatible foreground layers only where they preserve content visibility. A background is opaque composition, not a magenta-keyed cutout. |
| Creature encounter | Propose a side or shallow three-quarter view with a visible ground plane and two readable actors. Freeze camera, feet, pivots, scale and light before commissioning animation layers. Preserve Chronicle HP, captions and turn order. No overhead flight or terrain-control game is implied. |
| Ship, creature and item inspection | Use approved view-specific illustrations. A ship inspection image or finite landing overlay does not establish a flight sprite profile. Keep generated text out of art; labels and actions remain browser text. |

A painted background can support restrained parallax; compatible layers can supply clouds, dust or emissive effects. Do not mirror, recolor or rotate asymmetrical paintings indiscriminately. Use explicit view, pivot, forward axis, attachment sockets, margins, lighting family and permitted combinations. Projection and connector compatibility must be authored, not guessed after generation.

## Finite catalogue and procedural phenotype assembly

The catalogue holds finite, individually reviewed paintings and reusable resources: authored hulls, stations, materials, backgrounds, anatomy layers and selected rare discoveries. It does not replace CF's seeded world or promise one shipped painting for every possible genome.

The existing [complete-genome visual key](../../port/v2/packages/art/src/speciesidentity.ts), [named and lineage routes](../../port/v2/packages/art/src/speciesoverrides.ts) and [procedural body-plan owner](../../port/v2/packages/art/src/proceduraloverrides.ts) remain authorities. Seed or species name alone is insufficient. The practically open-ended generation and breeding space cannot all be pre-rendered into a finite shipped image pack. Reusable authored anatomy/material/animation resources therefore need deterministic, compatible phenotype assembly or deformation, and possibly a bounded cache of requested appearances. Unsupported topologies and hybrids keep their correct canonical static producer. Eight review families are not permission to collapse the existing diversity into eight recolored models.

A future asset registry should distinguish stable `asset_id`, immutable asset revision, style/profile, approved status, compatible morphology/view/light, dimensions/pivot/sockets, prompt/reference/master/derivative hashes and permitted combinations. Release manifests can map those identities to content-hashed derivative URLs. Asset approval, technical validity and runtime capability are separate fields.

The brief's proposal to retain discovered asset IDs and catalogue/generator versions is a **persistence change**, not a harmless renderer field addition. Design a versioned save migration and portable import/export treatment before integrating it; cover older saves, missing/retired assets, future versions and fallback behavior across every reader and writer. [The current migration owner](../../port/v2/packages/persistence/src/migration-v5.ts) and [revisioned outcome publication](../../port/v2/packages/persistence/src/outcome-transaction.ts) already guard exact stored authority. Preserve those protections and existing RNG streams. A new catalogue must not silently repaint a discovery or regenerate its genome.

No exploration-time image-generation calls or browser credentials are proposed. Prompt hashes protect exact instructions and provenance; they cannot make model image output deterministic. Any future live generation service is a separate product and infrastructure decision.

## The missing cutout-to-animation technology

The current [battle presentation](../../port/v2/apps/game/src/combat-battle-scene.ts) translates two whole portraits over a short finite interval. The [species worker loader](../../port/v2/apps/game/src/species-art-loader.ts) produces static portraits; the offline [Blender Wolf recipe](../../port/v2/tools/blender/creature_canid.py) is an authored candidate, not a browser rig importer or proof of every attack.

A keyed RGBA painting supplies neither hidden-limb artwork nor a skeleton. The missing work includes deliberate layer separation and occlusion, connected body/neck/hip/shoulder construction, mesh topology, weights or deformation controls, joint limits, sockets, ground contact and clips with defined start/impact/end poses. Gene-derived proportions need compatible limits and topology routing. Each export must declare its representation, version, supported actions, bounds and fallback, and the browser must acquire, validate, play and dispose it.

Compare a bounded frame sequence with compatible layered/deforming paint for one creature at the existing presentation boundary. Do not select or install a skeletal runtime, introduce a second renderer or promise automatic painting-to-rig conversion from this document. Arbitrary-angle 3D would require a separately demonstrated camera/gameplay requirement and device proof; it would still not solve anatomy or procedural compatibility automatically.

## Map every existing combat outcome

Animation consumes the registered, replay-verified settlement and [combat cue projection](../../port/v2/packages/audio/src/combat-cues.ts); [Chronicle](../../port/v2/apps/game/src/combat-chronicle.ts) remains the event/HP/caption timeline. It never rerolls an attack or chooses damage. The complete current cue-family coverage is:

| Canonical facts | Presentation obligation |
| --- | --- |
| `guardian-entrance`, `initiative` | Ready/entrance and turn attention; no invented hit. |
| `damage`, with `critical`, `first-strike`, `execute`, `stun-applied` | One actor attack and target response for the real event, with compatible accents for combined flags. An extra strike is a separate transcript event, not an animation-side roll. |
| `dodge` | The attempted attack and target evade, with unchanged HP. |
| `stun-skipped` | A disabled/skipped actor beat; do not play a successful attack. |
| `thorns`, `lifesteal` | Reflected actor damage and actor recovery associated with the recorded event; do not add another independent strike. |
| `burn`, `regen` | Targeted damage/recovery ticks; no invented attacking actor. |
| `defeat` | Downed transition for actual defeated participants, including a tick-caused defeat. |
| `guardian-phase` | Threshold/phase motif on the same event, not an additional hit. |
| `resolution`, `guardian-victory`, `guardian-defeat` | The recorded result. A loser at the round cap can retain HP; defeat in the result does not alone justify a physical death animation. |

Ability themes are fire, frost, storm, tide, stone, venom, void, sand, chem, psionic and wild. Existing ability facts do not supply an authoritative bite/claw/projectile taxonomy. Author compatible visual action and effect mappings explicitly; do not infer anatomy or breath weapons from damage, rarity or names. One Wolf encounter can demonstrate the adapter and supported clips; it cannot certify every anatomy or every ability combination.

## Browser lifetime and the bounded decision proof

Keep simulation/publication in the existing domain and [runtime authority](../../port/v2/apps/game/src/f4-runtime-authority.ts). Let a creature presentation owner accept detached visual identity, approved asset revision, current cue and resolved effect policy. It owns only acquisition, presentation and teardown. Main's native action joins remain explicit; incomplete art loading is not evidence that an action committed.

Reuse [scene texture scopes](../../port/v2/apps/game/src/scene-texture-owner.ts), generation fencing and [effect policy](../../port/v2/apps/game/src/visual-effect-policy.ts). Load only needed resources; reject stale completions; cancel playback and exact audio ownership on Skip, Close, hide, route replacement and disposal. Reduced Motion needs a readable static/settled presentation, and Effects Off retains the canonical game information. Share the existing event timing rather than adding a competing perpetual animation clock.

Measure actual phone and desktop decode/upload cost, peak and retained texture resources, responsiveness, concurrent actors, repeat-entry cleanup, context interruption and missing-asset fallback. Check alpha over light/dark backdrops, atlas gutters if used, clipping and actual display size. Preserve touch targets, forced colors and accessible text. Existing resource limits remain authoritative; new figures are hypotheses until measured on target devices.

First obtain the style/reference decision, then qualify a small set of assets in the actual CF camera. Adapt the brief's sector/ship/encounters/station/planet/debris/crew/items/background sample to current navigation. For creature animation, use one complete, high-quality grounded encounter with exact phenotype, canonical opponent, native controls, coherent attack/reaction and correct outcome. This establishes a useful decision proof before expanding the catalogue. Technical checks, visual/motion/listening approval and production admission remain separate.

Root owns the current image candidate, demo checks, implementation decisions and broader handoff. OpenAI/Codex should retain this proposal with that review packet; no new PR, hosted attempt or release is requested here. Claude does not need to open the other app now; Thursday's review should assess the retained proposal and actual candidate evidence under the normal parallel protocol. No art acceptance or production readiness is claimed.
