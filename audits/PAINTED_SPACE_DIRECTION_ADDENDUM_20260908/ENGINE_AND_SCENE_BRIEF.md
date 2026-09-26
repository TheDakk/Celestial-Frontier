# Scene staging, current tools and eventual engine portability

Nick confirmed on September8 that the intended presentation has correctly scaled creatures
within their biomes, rich close Compendium portraits, articulated battles matched to attacks,
and a living universe. He authorized beginning the art direction and asked to retain a possible
future Unity/Unreal port. This is the current target, not a claim that those features are complete.

## Tool and engine conclusion

End-user requirement confirmed: the planned browser version runs in a supported modern browser
and loads its assets automatically. No Blender, Unity, Unreal, plugin or separate installer is
required on the player's device. Authoring tools stay on the development side. Normal asset
downloads, compatible GPU/browser support and measured memory/thermal limits still apply.
A future native engine edition would have its own distribution requirements.

The installed authoring tools are sufficient to begin the painted2D/2.5D browser experience.
Blender supplies coherent models, materials, bones, weights and animation authoring; built-in
image generation supplies original concepts and approved paint references; Inkscape supplies
vector/material UI artwork; ImageMagick/FFmpeg handle asset processing and bounded motion export.
Approved audio authoring tools and existing WebAudio owners cover source/playback work, with
their actual qualification/listening limits retained. No software purchase, plugin installation
or engine replacement is established as necessary by the requested visual style alone.

Pixi is a2D renderer with GPU mesh/shader capabilities. Painted layers, skeletal/deformation
controllers, frame sequences, particles and surface projection can produce a rich staged game.
It is not a ready-made3D character, terrain, lighting and physics engine. No current CF component
automatically converts a flat painting or arbitrary Blender rig into a complete playable actor.
A browser-native3D renderer/adapter or full engine becomes a separate decision if free camera,
arbitrary-angle creatures or traversable3D terrain becomes the gameplay requirement. Do not
describe the present engine as already supporting every possible future3D design.

## One creature identity, three views

In a biome, use the exact canonical creature identity and size category with an explicit scene
scale, ground/pivot and perspective rule. Root feet or body contact to terrain, place near/far
layers in correct order, and match shadow/light direction, atmosphere and palette. Foliage/rocks
may partially occlude an actor; readable composition still matters. Do not resize all animals to
the same box or rewrite their genes for convenience. Author units and family bounds explicitly
before claiming literal metre-accurate scale. Existing vistas already use bounded relative size.

Compendium uses the same appearance at an independently framed close viewing scale, with larger
resolved textures only when needed. Battle keeps the same identity and combines supported anatomy
clips with the actual recorded ability/event: approach/anticipation, impact or dodge, reaction,
status/recovery and settle. Bite, claw, wing, tentacle and projectile movements need compatible
authored mappings; the current ability themes do not by themselves define an attack rig. Preserve
canonical outcomes, HP, narration, Skip/Close and reduced-motion alternatives. Quality and all
family/ability coverage must be proven progressively rather than inferred from one Wolf.

## What the universe already does

Source inspection of `port/v2/apps/game/src/main.ts` found rotating galaxy discs/beams/wormholes,
pulsing stars, planet/dwarf orbits, radius-dependent moon paths, seeded binary/trinary/rock motion,
eccentric comet paths with outward tails and visiting fly-throughs. These are direct time/radius
position formulas, with Kepler-inspired moon speeds. Reduced Motion freezes ambient time.
`packages/domain/worldgen/src/worldgen.verbatim.js` supplies deterministic companions/orbits.
The inspected path does not implement mutual mass/force integration, barycentric binaries or an
N-body gravity solver. Survey gravity descriptions derive from size bands. Preserve these actual
rules while upgrading visual presentation; full physical simulation is not required or claimed.

Current planets use `getPlanetSprite` from `packages/art/src/thumbart.verbatim.js`. It bakes
geography, clouds, lighting, lights and haze together. System sprites turn to aim baked lighting;
the420px surface globe is fixed while clouds drift. Neither is actual axial surface rotation.
The canonical `packages/domain/planetgen/src/planetgen.verbatim.js` surfaceColor samples a
non-periodic2D field. There is no existing full360 seamless globe map to simply activate.

The first bounded coding proof should therefore use a separate unlit canonical surface sampled
from the actual detached planet and effective facts, a Pixi spherical projector, fixed illumination
and a small finite turn/settle. Do not spin the baked sprite or rebake all pixels per frame.
Continuous revolutions need an explicit versioned backside/seam mapping contract. Keep separate
cloud/emission channels, shared ticker, texture scopes and exact route identity; stop on hidden,
reduced/off or stale owners. Prove landmark motion, stationary light, fallback and cleanup. This
source inspection began the concrete implementation preparation; no such new renderer is yet built.

## Future Unity or Unreal

Preserve `.blend` masters, meshes, UVs, source textures, skeletons, rest poses, clips, sockets,
units and versioned procedural recipes. Export validated interchange derivatives without losing
the masters. Both [Unity model import](https://docs.unity3d.com/Manual/ImportingModelFiles.html)
and [Unreal's animation pipeline](https://dev.epicgames.com/documentation/en-us/unreal-engine/fbx-animation-pipeline-in-unreal-engine)
support importing model/animation data from authoring tools. Material graphs, constraints and
procedural scripts do not all transfer unchanged; bake/export only deliberately supported data.
If eventual arbitrary-angle3D creatures matter, keep3D authoring masters rather than only cutouts
or movies. The current browser derivative can still use a bounded painted representation.

Keep canonical seed/genome/combat/save contracts and their golden vectors separate from Pixi/UI.
A future C#/C++ implementation must reproduce RNG integer/number behavior, serialization, legacy
versions and exact outcomes against those fixtures. Rendering, UI, input, shaders, audio ownership
and platform integration still need new adapters. This is a substantial port, not a one-click
conversion; it does not require throwing away the art or world data. No new engine was installed
or selected, and no engine migration has begun.

Primary browser capability/performance references are linked in the preceding packet's
[performance plan](../PAINTED_SPACE_PIPELINE_20260908/PERFORMANCE_AND_ANIMATION.md).
Actual phone memory, heat, responsiveness and complete-encounter quality remain qualification
work. A premium visual target is appropriate; AAA production scope and performance are not a
guarantee. All findings are source inspection and current tool evidence, not a new live test run.
