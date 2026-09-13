# LOG — A6 part 2: flag-gated wiring and docs sync (Claude, anthropic/mac, 2026-09-13)

Scope: WORK_ORDER A6 part 2. One adapter file per module plus one guarded call in `main.ts` per the shared
contract; the material-owner flip of CONTRACTS §5; MOTION_KIT/SOUND_KIT "matches code as of" markers.
No git write command was run (Nick commits after review). Nothing under `combat-battle-scene.ts`,
`local-ai-*`, `kit-*`, `landfall-*`, Codex's tools, `ART_KIT.md`, or `battle2/README.md` was edited.

## main.ts hunks (announced; every line listed)

| Line | Change |
|---|---|
| 20 | pixi import extended with the two names the effect host needs: `…, RendererType, MeshPipe, Particle, ParticleContainer } from 'pixi.js';` (was `…, RendererType, MeshPipe } from 'pixi.js';`). No other import line changed. |
| 6181 | comment: `// A6 study flag (?worldlife=1): the A5 world-life layer over the vista sprite of this landfall; dynamic import only under the flag, never on the default path.` |
| 6182 | guarded call inside `requestSurfaceVista`, directly after `audiovisualPilotVistaBinding = JSON.stringify(request);`: `if (new URLSearchParams(location.search).get('worldlife') === '1') void import('./worldlife-wiring.js').then(m => m.mountWorldLifeStudy({ request, roster, stage: app.stage, vistaSprite: () => surfaceVistaSprite, ticker: app.ticker, clock: () => performance.now(), reducedMotion: () => !motionOK(), tier: TOUCH_DPR ? 'phone' : 'desktop', pixi: { Container, Graphics } })).catch(() => { /* the flagged study never blocks the vista */ });` |
| 16353 | comment: `// A6 study flag (?battle2=1): the A3 battle stage v2 over the same Chronicle mount; dynamic import only under the flag, never on the default path.` |
| 16354 | guarded call inside `presentCommittedCombatChronicle`, directly after the `combatBattleScene?.start(...)` try/catch: `if (new URLSearchParams(location.search).get('battle2') === '1') void import('./battle2-wiring.js').then(m => m.mountBattle2Study({ mount: combatChronicleMount, settlement, chronicle, generation, ticker: app.ticker, clock: () => performance.now(), reducedMotion: !motionOK(), deviceTier: visualPolicyDeviceTier(), artLoader: speciesArtLoader, pixi: { Application, Container, Sprite, Text, Graphics, Texture, Particle, ParticleContainer } })).catch(() => { /* the flagged study never blocks the Chronicle */ });` |

Both calls follow the existing study pattern (`avpilot`, `localai`): the flag test and the dynamic
import share one line, nothing under `battle2/` or `worldlife/` is imported statically, and
`tests/battle2-wiring.test.ts` / `tests/worldlife-wiring.test.ts` assert exactly that in source text
with mutation controls (a static import, an ungated `import()`, or a loosened gate each fail the check).
`combatBattleScene` (v1) still runs on the default path; with the flag on, both scenes coexist over the
Chronicle mount (the v2 stage is prepended in its own `aria-hidden` section) so the accessible log and
the v1 figures are never removed by the study.

## Files

| File | Owns |
|---|---|
| `port/v2/apps/game/src/battle2-wiring.ts` (new, 302 lines) | `battle2Enabled`, `mountBattle2StudyIfEnabled`, `mountBattle2Study`. Builds the `BattleStageFactory` from main.ts's pixi classes (structural bindings; no `pixi.js` import in the file so the root strict tsconfig still typechecks it through the tests), `createPixiEffectHost` over Particle/ParticleContainer, the CONTRACTS §3 world-life factory, `composeArena` over the accepted plates, one `BattleRigV1` per combatant (`createFixtureRig` from a landmark record + keyed alpha when `matchRecord` finds one by visual key or `_earthName`; `createPortraitRig` over the species-art 132 px thumb otherwise; a labelled flat placeholder for a player champion), then `turnPlanInputFromTranscriptEvent` over every `settlement.transcript.log` row → `stage.play` → `stage.tick` on the injected ticker; a second pixi `Application` (autoStart false) renders into the section on each tick. Dispose: pagehide (stop on persisted, dispose otherwise), Chronicle generation attribute change (MutationObserver), mount leaving the document (checked per tick), a superseding study, and `handle.dispose()`. |
| `port/v2/apps/game/src/worldlife-wiring.ts` (new, 114 lines) | `worldLifeEnabled`, `currentLandfallSystemCard` (the accessor: `buildCanonicalLandfallConditioningV1(request, roster)` → `compileEarthArtKitV4(sourceSnapshot, ART_KIT)` → `.systemCard`, exactly the card the kit runtime compiles; seed = FNV-1a of the card text), `mountWorldLifeStudyIfEnabled`, `mountWorldLifeStudy`. Compiles `compileWorldLife(card, seed, 'landfall', { tier })` (phone cap 200 streaks vs 400), polls the vista sprite accessor per tick, binds a `WorldLifePixiAdapter` container right above the sprite sized to its centre-anchored bounds, rebinds on sprite replacement (AI crossfade successor), disposes the adapter when the sprite is destroyed or unparented, re-reads reduced motion every tick, disposes on pagehide and on a superseding study. |
| `port/v2/apps/game/src/motion/body-card.ts` | Material owner flipped to record-first (CONTRACTS §5): `record.materials.surface` wins; genome FA_SKIN only when the record omits it (`materials: record omits surface; genome skin "<x>" used as fallback`); a disagreement is noted as `materials: record surface "<a>" wins over genome skin "<b>" (observer disagreement)`. The old `genome skin … overrides record surface` note no longer exists. `soundkit/voice-card.ts` was already record-first and is unchanged. |
| `port/v2/tests/motion-body-card.test.ts` | The genome-first assertion replaced by record-first (procedural record `fur` → `furred`, disagreement note present, override note absent) plus controls both ways: record without materials + genome → `translucent` with the fallback note; without record surface and without genome → `unsupported-materials` refusal (never a silent fur); agreeing record and genome → no `materials:` note; the Civet record's fur beats a supplied translucent genome skin. 13 tests. |
| `port/v2/tests/battle2-wiring.test.ts` | 11 tests: gate contract + three mutation controls; wall-clock/Math.random source control over both wiring files; flag off → no pixi construction, no asset call, no ticker, no DOM; flag on → Civet fixture rig left (label `fixture rig (landmark-derived parts)`), portrait fallback right, 2 turns from a 3-row log (tick row skipped with reason), assets requested by their audit paths incl. the three keyed Wild phases, one Application at 1024×576 with its canvas inside the study section, ticker attached, turn 2 starts when turn 1 ends on the injected clock, `finished` releases the ticker, zero `performance.now`/`Date.now`/`Math.random` across the synchronous ticks, dispose destroys the renderer and removes the section and listeners; player placeholder + `_earthName` match; reduced motion builds with no particle container; empty transcript fails closed; dispose during load, bfcache pagehide/pageshow, non-persisted pagehide, Chronicle generation change, superseding study, mount removal; pure helpers; dev-only asset source fails closed on a data: URL and resolves sibling audit directories. |
| `port/v2/tests/worldlife-wiring.test.ts` | 10 tests: gate contract + mutation controls + the call line carries the sprite accessor, `performance.now` clock, phone tier and reduced-motion accessor; `currentLandfallSystemCard` on the real accepted Earth landfall (Sol 424242 / Earth 133) parses to a temperate landfall spec, deterministic, and fails closed with the compiler's reason for a bad roster or a retired kit; flag off → nothing; flag on → idle until the sprite exists, bound container index = sprite index + 1 at (x − w/2, y − h/2), follows move/resize, reduced-motion re-read, rebinding on sprite swap (old container destroyed), disposal when the sprite is destroyed/unparented, total dispose; phone cap vs desktop; no wall clock across binding and ticking while the injected clock advances the layer; refused card → failed with no ticker; pagehide/pageshow. |
| `MOTION_KIT.md`, `SOUND_KIT.md` | One "Matches code as of 2026-09-13" line after the intro and one `## Implementation` section at the end naming the modules and what is not yet implemented. Sections 1, 2, 5, 6 untouched. |
| `audits/LONG_SESSION_20260913/LOG.md` | A6 part 1 and part 2 rows filled. |

## Decisions taken (for Nick)

- **Assets are a dev-only fetch, not the asset closure.** The accepted plates, the keyed Wild phases and the Civet master total ~15 MB; bundling them through `?url`/`new URL(…, import.meta.url)` would put proof evidence into every production build. Instead the wiring imports only `arena-recipe.json?url` (3.4 KB) to locate the audit directory (`/@fs/<repo>/audits/ARENA_EFFECTS_V42_PROOF_20260912/` on the Vite dev server, which already allows the repo root) and fetches siblings by their audit paths. A production build inlines that JSON as a `data:` URL, so the study fails closed with "battle2 assets unavailable: … dev-only fetch" instead of shipping plates. Codex's keyer (`kit-contact-math.mjs`) is loaded at runtime from the kit runtime route `/__local_ai/`, the same mechanism the landfall painter uses for its workers.
- **The v2 stage does not replace v1 under the flag.** The README recipe suggested a `battleScene: 'v1' | 'v2'` switch; that would be a second `main.ts` hunk on the default path. The study prepends its own section, the v1 scene keeps running, and the Chronicle log stays the accessible owner.
- **Replacement/reload teardown needs no extra hunk.** `releaseRendererForReload` ends in `location.reload()`, which fires `pagehide` (non-persisted) → both studies dispose there, like the v1 scene's pagehide branch; the battle study also disposes when the Chronicle mount's generation attribute changes or the mount leaves the document.
- **Themes and arena.** Every turn stages the accepted Wild sequence (the only accepted anchors set) over the one accepted temperate arena; `selectArena` and per-ability themes are not wired. Turns play through the transcript at the stage's own pace; synchronising to the Chronicle cue cadence would need the `onCue` seam (a further hunk) and is left open.
- **`battle2/README.md`** still says the wiring "was NOT done here"; that file is outside this batch's allowed paths and should be refreshed by whoever next touches `battle2/`.

## Gates (final run on this tree)

- `cd port/v2 && npm run typecheck` — 0 errors (root strict, app, worker configs).
- `npx vitest run tests/battle2- tests/worldlife- tests/motion-` — 12 files, 101 tests pass.
- Root `node tools/validate.js` — PASS (render audit 1010 clean, boot errors 0, FINGERPRINT MATCH 50/50).
- Root `node tools/smoke.js` — 553 PASS / 0 FAIL.

## Not done

- No live capture of either study (Nick's eye): open the dev server with `?battle2=1` and fight, or land on Earth with `?worldlife=1`; both studies write `data-battle2-status` / handle `status()` for inspection.
- No sound wiring into the battle2 turn (SOUND_KIT Implementation lists it).
- The C2 parts rig wrapper (`cutout`/`foot`/`label` over `CreatureRigV1`) is not added until C2 lands; the fixture rig is used for the Civet and the labelled portrait for everyone else.
