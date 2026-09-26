# Architecture recommendation — creature charm and playable animation

2026-09-08. Read-only source assessment by OpenAI/Codex on macOS, with this document as the only edit. This is a recommendation for Nick and Claude, not an accepted art direction, runtime selection or implementation claim. No build, test, browser, render, dependency or Git operation was run for this assessment. Source anchors refer to the current local V2 work; line numbers can move.

## Recommendation

**Continue V2. Preserve its proven rules and persistence, extract its oversized app coordinator, and use one complete, high-quality creature encounter to choose the animation delivery path. Do not restart the project for “clean code.”**

The requested improvements—more appealing creatures, coherent anatomy, procedural variety, richer worlds, better UI and readable animated battles—do not by themselves conflict with the current architecture. They reveal unfinished presentation and integration work. A rewrite would recreate existing identity, save, transaction, mobile and cancellation problems before demonstrating better creatures.

A freely orbitable 3D world with close-up creatures viewed from arbitrary angles, geometric terrain traversal and dynamic lighting could justify a different renderer. That is a concrete product decision to prove. Even then, replace the presentation adapter rather than regenerate the universe or redesign working combat and persistence as a side effect.

## What is already separated, and worth keeping

| Existing authority | Source evidence | Preserve during visual work |
|---|---|---|
| Seeded worlds, genomes and breeding | [worldgen](../../port/v2/packages/domain/worldgen/src/worldgen.verbatim.js), [genome](../../port/v2/packages/domain/genome/src/genome.verbatim.js), [genetics facade](../../port/v2/packages/domain/genetics/src/index.ts) | RNG streams, catalog identities, complete inherited genomes and lineage rules. The facade already handles same-name cross-kingdom lineage without rewriting the lifted generator. |
| Combat rules and exact committed outcomes | [CombatCore](../../port/v2/packages/domain/combatcore/src/combatcore.verbatim.js), [combat settlement](../../port/v2/packages/domain/combatcore/src/combat-settlement.ts), [Arc 6 action](../../port/v2/apps/game/src/arc6-combat-action.ts) | The action plans and verifies one source-bound duel; it owns no DOM, art or audio. Animation must consume its result, never rerun combat or decide damage. |
| Save, lease and runtime authority | [F4 app join](../../port/v2/apps/game/src/f4-runtime-authority.ts), [exact-outcome transaction](../../port/v2/packages/persistence/src/outcome-transaction.ts), [revisioned repository](../../port/v2/packages/persistence/src/revisioned.ts) | Atomic state/RNG/receipt/revision publication, lease fencing, stale/failure handling and existing migration protections. These are not rendering concerns. |
| Environment-neutral scene descriptions | [system composition](../../port/v2/packages/scene/src/system.ts), [scene exports](../../port/v2/packages/scene/src/index.ts) | What exists and its canonical identity. System composition returns nodes without creating Pixi objects; rendering and occlusion remain separate. This boundary is useful but does not yet contain every scene concern. |
| Exact species identity and static production | [species identity](../../port/v2/packages/art/src/speciesidentity.ts), [species painter](../../port/v2/packages/art/src/speciespainter.ts), [worker loader](../../port/v2/apps/game/src/species-art-loader.ts) | Detached complete-genome keys, named/procedural/lineage routing, lazy work, bounded leases and the correct 132/440 static fallback. Seed or name alone is insufficient. |
| Presentation events and resource ownership | [Chronicle](../../port/v2/apps/game/src/combat-chronicle.ts), [combat cue projection](../../port/v2/packages/audio/src/combat-cues.ts), [scene texture owner](../../port/v2/apps/game/src/scene-texture-owner.ts) | One current generation and settled event, caption/HP authority, explicit cancellation, scene-owned textures and measurable disposal. |

The original master plan's engine-independent rules support this approach ([§2.3–2.5](../../port/PORT_MASTER_PLAN_v4.0.md)). Its stack table is a plan, not proof that every listed technology is installed. The actual [game dependency manifest](../../port/v2/apps/game/package.json) declares Pixi 8.19.0 and the project packages; it declares no skeletal or real-time 3D renderer dependency. Its old “Phase 3 / dumb renderer” description understates today's app coordination.

## The real coupling to reduce

`apps/game/src/main.ts` currently has 18,710 lines, including UI wiring, evidence hooks and transaction orchestration as well as rendering. Its size is evidence of concentrated responsibility, not proof that the game rules must be discarded.

Concrete joins are visible at `installCaptureHooks` (around 614), mutable `save`/`nav` (1902/2030), `world` (2129), scene caches/orbiters, `clearWorld` (6086), `drawUniverse`/`drawGalaxy`/`drawSystem`, `buildCurrentSceneTransaction` (7014), `rerender`, `drawSurface` (8889), committed Chronicle publication (15754) and the shared ticker (18377). For example, `rerender` synchronizes audio route, invalidates Survey, changes DOM mode, rebuilds graphics, refreshes HUD and may persist the view. `drawSurface` creates Pixi resources while joining the exact roster and DOM surface lifecycle. The legacy capture hooks also show that package separation is not yet complete.

Extract through these boundaries in small, behavior-preserving steps:

1. **Scene rendering and lifetime owner.** Move one scene's containers, camera presentation, texture scope, animation update and teardown together. Give it detached scene/route identity, viewport and resolved effect policy; return picks/intents and an exact rendered-scene receipt. Keep navigation permission, save publication and route repair in the app coordinator. Do not move a renderer's implicit reads of `save`/`nav` into another file and call that decoupling.
2. **Creature presentation adapter.** Accept the complete visual identity, current morphology owner, asset/recipe version and supported animation capabilities. Own model/atlas acquisition, bounds, attachments, playback, resource budget and fallback. Reuse the existing broker's ownership principles without pretending its static-image protocol already supplies rigs.
3. **Encounter presentation owner.** Build around the existing Chronicle and `CombatBattleSceneController`. Consume registered cue IDs, sides, impact facts and current-generation counterparts. Keep one timeline; cancel on Skip, Close, hide and replacement. This boundary can host either a frame actor, a 2D deforming actor or a future 3D actor without changing HP, rewards or the log.
4. **Keep publication joins explicit.** Main should progressively become composition and native-event wiring. Existing action controllers still verify and publish outcomes before presentation starts. Preserve visible-scene receipts and rollback; a partially loaded model cannot become evidence of a successful landing or committed battle.

Do not begin a whole-main extraction before the encounter. Extract the seams that encounter actually needs, prove unchanged surrounding behavior, then continue by owner. There is no need to replace the current DOM UI framework merely to animate creatures.

## Animation delivery choices

| Route | What it can demonstrate | Cost or limitation that needs proof |
|---|---|---|
| **Pixi + bounded Blender-rendered frames/layers** | High-quality fixed-view silhouettes, materials and authored finite motion using the existing compositor. Good for a first encounter and selected views. | Frames × views × unique phenotypes can explode texture memory. Fixed views limit free camera and dynamic lighting. A rendered pose sequence is not a live skeleton. |
| **Pixi + compatible 2D mesh/skeletal or 2.5D presentation** | Reusable joint motion, deterministic proportions/materials and layered depth within current scene/UI ownership. | A qualified authoring/export/runtime path is still missing. Test deformation, clipping, limb overlap, hybrid compatibility and actual phone cost. “2.5D” must name the representation; it is not a free 3D camera. No library purchase or dependency choice follows automatically from the plan's mention of Spine. |
| **A real-time 3D scene adapter** | A candidate if arbitrary camera angles, depth interaction, terrain traversal and changing light are essential product requirements. | Model/rig import, skinning, materials, lighting, camera/picking, LOD, animation blending, shader warm-up, loss/recovery and GPU ownership all need implementation and device proof. Maintaining two renderers can duplicate these costs. A full native/Unreal edition also replaces platform UI/input/audio/storage adapters. |

The [campaign §14.2–14.4](../../port/AAA_AUDIOVISUAL_CAMPAIGN.md) already requires this bounded comparison and explicitly distinguishes offline Blender authoring from browser runtime. The current [Wolf recipe](../../port/v2/tools/blender/creature_canid.py) proves an offline connected skin, armature and finite idle/inspection candidate. It does not prove an accepted creature, a browser skeletal importer, walking, or all combat attacks. The current [battle scene](../../port/v2/apps/game/src/combat-battle-scene.ts) only moves whole portraits over 200 ms.

## Procedural breadth cannot become a shipped movie for every genome

The practically open-ended generation and breeding space cannot be represented by a finite shipped image pack containing every phenotype, view and action. Even a mathematically finite seed space is vastly larger than such a pack. As an illustration—not a budget—24 RGBA frames at 440×440 from eight views occupy about 142 MiB for one unique creature before other resources and overhead. Download compression does not remove decoded texture cost.

Use bounded authored anatomy/material/animation resources plus deterministic phenotype assembly or deformation, and/or generate only requested appearances with a bounded cache and correct fallback. The current [procedural plan](../../port/v2/packages/art/src/proceduraloverrides.ts) and [named/lineage routing](../../port/v2/packages/art/src/speciesoverrides.ts) must select compatible structure. Preserve connected shoulder/hip/neck anatomy and gene-derived proportions; do not replace variety with interchangeable floating parts or eight generic recolored animals. Whole-form topology exceptions need their own capability route. Unsupported hybrids and body plans retain their canonical static rendering until supported.

A real-time 3D renderer does not solve those anatomy, variation or asset-authoring problems automatically. Likewise, generating cached runtime images does not imply that Blender will run on a player's phone. Any runtime assembly/rasterization path needs its own compatible producer, deterministic inputs, cost limits and fallback.

## The decision proof: one complete creature encounter

Choose one exact source-bound creature after Nick's charm/anatomy study, with a real generated environment and canonical opponent. Make the playable encounter convincing from arrival through interaction and battle to its correct settled outcome. Include coherent idle and locomotion appropriate to the chosen presentation, an attack, hit reaction, evade/stun and finished victory/defeat poses, plus restrained ability accents. Demonstrate the real native controls, readable identity, contact/occlusion and sound—not only isolated Blender frames.

The attack adapter must follow every existing outcome class: initiative; damage with critical/first-strike/execute/stun modifiers; dodge; skipped strike; thorns/lifesteal; burn/regen; defeat; resolution and Guardian motifs where applicable. Extra strikes come from separate transcript events. Do not invent a projectile or elemental breath from an ability name, or play a death pose merely because a still-living opponent lost at the round cap. One Wolf demo establishes one supported anatomy, not all species or all attacks.

Use the same specimen, framing and outcome for a bounded frame-versus-deformation comparison if both are viable. If arbitrary-view 3D is essential, make a small alternative-renderer encounter prototype at this same boundary; do not migrate the whole universe first. Record native phone/desktop load and responsiveness, decoded/GPU resources, concurrent actor cost, frame behavior, repeated-entry cleanup, reduced/off presentation and asset-failure fallback. Existing checks remain regression protection; screenshots, motion and physical-device evidence decide whether the experience is good enough. No new universal ceilings are proposed here.

Choose the runtime from that evidence. A charming, performant encounter in the current compositor supports continuing extraction. A demonstrated requirement that its representation cannot satisfy supports a scoped renderer migration with the existing game core retained. Neither result currently justifies restarting all code, generation, saves or content.

## Can production be clean?

**Yes: a deliberate production candidate can have clear ownership, accepted content and reproducible verification. That does not mean zero bugs, and it does not require starting over.** The studies are inputs to a decision; they do not automatically ship.

- Select the accepted runtime and art. Exclude abandoned comparisons, unaccepted creatures and development-only controls from the ordinary product path. Preserve historical evidence and editable sources in their appropriate storage instead of confusing them with runtime content.
- Finish the extraction needed by that runtime, document one owner for each scene, actor, clock and resource, and remove superseded implementations only after their callers and compatibility obligations have moved. Do not delete protected deterministic fixtures or useful fallbacks as cosmetic “cleanup.”
- Preserve generated identities and live-save compatibility. Any intentional schema change needs its explicit versioned migration and round-trip evidence; a renderer swap alone does not justify rewriting saves or genomes.
- Verify the actual production assets and native routes, including phone/Safari/PWA behavior, frame/input responsiveness, bounded memory and teardown, reduced/off modes, asset failures and accessible controls. Human visual, motion and listening acceptance remains distinct from automated correctness.
- Freeze the candidate at **one clean, signed exact commit**, then run the required battery and named evidence chain for that candidate under the [current V2 runbook](../../port/v2/README.md). Keep the production SceneMemory activation decision and unchanged-source predecessor requirements explicit; do not substitute scoped study checks for production admission. Stop at a failed stage and correct a new candidate rather than combining incompatible green reports.
- Promote through the authorized agent → `develop` → `main` and release process. Signing restoration, full applicable verification, physical-device evidence and human acceptance remain pending where recorded in ROADMAP; none is waived by this recommendation. Hosted attempts, version bumps and deployment still require their exact existing authority.

This produces a maintainable release boundary with known, recorded limitations. It avoids shipping the whole experiment history while retaining the work needed to understand and safely improve the game afterward.

## Handoff

Only this recommendation was authored. Root owns the separate visual studies, implementation choices, verification and live handoff documents. OpenAI/Codex stays on its local `openai/mac` worktree; no GitHub write or new PR is requested. Claude need not open/sync now; use this committed review packet once root's local signing/handoff conditions allow it, then follow the normal authorized integration protocol. No human acceptance or renderer migration is claimed.
