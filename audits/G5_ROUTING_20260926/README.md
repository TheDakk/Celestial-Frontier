# G5: routing the finisher into the game (Claude), 2026-09-26

This is Stage G5 of the Generated Creature Pipeline (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`).
- **Codex owns the engine:** `apps/game/src/creature-finish-engine.ts` (`audits/G5_FINISHER_ENGINE_20260926/`).
- **Claude owns the routing:** which device finishes, which painting a finish starts from, and how a retained finished original reaches the card and the stage.

## Landed (routing layer v1)

**`port/v2/apps/game/src/creature-finish-route.ts`:**
- **`finishTierV1(capability, deviceClass)`:** a desktop-class device whose `probeLocalModelCapabilitiesV1` reports `supported` finishes on the device. Every other device is `phone`: it reads retained or delivered originals, and the engine never constructs a model there.
- **`finishSourceV1`:** the source is the painting that draws the creature (G4 `paintedArtV2`). It uses that fit's admitted master (its hash must equal the record's `cutoutAssetHash`), its `labels.png` and its `binding.json`, supplied by the caller's trusted (G3-pinned) asset source.
  - Settings use `compileCreatureFinishV1` exactly as Codex's native proof does.
  - The identity is the Compendium identity (species visual key and its seed): PROGRAM.md G5, "a discovered creature's texture gets the masked finisher once". Two creatures drawn by one painting therefore finish independently.
- **`createCreatureFinishRouteV1`:**
  - **`lookup(genome)`** reads the retained store ONLY. It runs through a phone-tier engine over the same store, so there is never inference and never a model. The result is memoised per identity (definitive answers only; a busy queue is retried).
  - **`enqueue(genome)`** (desktop only) goes onto Codex's bounded, deduplicated, serial queue. A retained result invalidates the memo.
- **`finishedCardMasterV1`:** a retained finished original is box-downscaled into the archetype's card-master space with the card builder's own kernel (`boxDownscaleV1`, `cardDimsV1`). The morph (palette, accent, markings, proportion) then applies on top exactly as today.
- **`cardEligibleV1`:** conservation keeps the source master's alpha. A card made from a finished original therefore matches the shipped card only when the master's own alpha IS the keyed cut-out alpha. An opaque keyed painting (the Civet) is not card-eligible until it has an alpha master.

**`morph/painted-card-source.ts`, option `finished`** (absent = today's path, byte for byte):
- When the hook returns the finished card master of the DRAWN painting (same record recipe, same size), the card renders those pixels and is tagged `finishedSha256`.
- Anything else (null, another painting's finish, a library fallback) draws the unfinished painting.
- The lease/cache key stays the species visual key, so the I5 ownership report stays truthful. A cache hit must match the finished sha.

## Tests: `creature-finish-route.test.ts` (5; real fits)

- **Tier policy.**
- **CARD KERNEL:** box(master RGB + keyed alpha) reproduces the SHIPPED card masters byte for byte (Crab, Salmon, Wolf, Civet). Eligibility is true for the alpha masters and false for the opaque Civet.
- **END TO END on the real Crab fit,** through Codex's engine and a memory store with an identity finish:
  - a lookup miss constructs no model;
  - one enqueue gives one inference and one retention;
  - the lookup returns EXACTLY the shipped Crab card master;
  - a second enqueue is served from the cache;
  - another creature is its own finish;
  - a creature with no painting is `no-source`.
- **PHONE:** never constructs a model and never enqueues, but reads the original a desktop retained in the same store.
- **CARD HOOK:** the drawn painting's finish changes the card (tagged). Controls: a null finish, or another painting's finish, is byte-identical to the unhooked card. The lease key is unchanged.
- **Negative controls, run this session:**
  - `Math.floor` in the box kernel fails the kernel and end-to-end tests;
  - dropping the record-ownership check in the hook fails the hook test.

## The stage (session 3, on Codex's C45(a) composition, `9cf27be1`)

- The battle2 study input takes an optional `finish` provider. `main.ts` passes it through the existing gated battle2 line only when `?finish=1` built a route.
- For each rig, `stageFinishV1` (creature-finish-app.ts) turns the creature's retained original (`route.retained`, store only) into Codex's `admitCreatureFinishedAtlasV1` token against the rig's own pinned bytes.
- The loader then composes, in Codex's order: finished pixels, then the individual's morph (`atlasPixels`), then the alpha check, then the seam guard. CARD = STAGE: both show the finished texture with the individual's colours.
- Any refusal is recorded in the study's `skipped` list, and the unfinished painting draws.
- Test (`creature-finish-app.test.ts`): on the real pinned Crab, no retained finish gives null. A retained identity finish becomes a token whose projection is EXACTLY the original atlas, and it loads through the pinned loader. Another creature gives null.
- Civet/Eel/Rat/Salamander: derived ownership evidence is ready for Codex's review (`audits/G5_DERIVED_LABELS_20260926`).

## In the game behind `?finish=1` (session 3, after Codex's C43/C41 unblock `bfe76a6b`)

- **Finish sources on the library** (`tools/morph/build-finish-sources.mjs`, called by `build-shipped-battle2.mjs` before the manifest pass):
  - the 34 archetypes that have both a bundled master pin and a supplementary labels pin get `library/creature-finish-source/<creatureId>/{master.png,labels.png}` (26.4 MiB, outside the pack, fetched only by a finishing desktop);
  - both hashes are checked against the bundled pins before copying;
  - Civet, Eel, Rat and Salamander have no pinned source labels and refuse (Codex C41: supply source-derived label assets first).
- **`apps/game/src/creature-finish-app.ts`:**
  - `developerFinishRuntimeV1`: the same-origin developer model transport, with the checks local-ai-game applies (pinned model id and revision, verified developer cache, same-origin file URLs only).
  - `createFinishInferV1`: the desktop adapter, Codex's native client generalised. One worker. The recipe is re-derived and pin-checked (model hash, settings hash, seed). The `creature-finish-v1` job carries fresh copies of the RGBA and labels as TRANSFERRED buffers; the worker pads 1254² sources itself. The result contract is checked.
  - `appFinishFitForV1`: the G4-drawn painting's fit. The record and binding come over the stage's pinned asset source, loaded lazily so battle2 code stays off the boot path; the master and labels come from the pinned library.
  - `createAppFinishRouteV1`: tier from the probe plus device class; desktop inference only when the developer transport exists; delivered originals for every tier via Codex's `createCreatureFinishDeliveryV1`.
- **`main.ts`, one gated line (`?finish=1`):**
  - the Compendium card draws a retained or delivered finished original (with the morph on top);
  - a finishing desktop enqueues a creature's finish when its PORTRAIT opens and finds none;
  - default OFF until Nick's quality review.
  - On the static dev site there is no developer model transport and no finished original has been published, so the flag is inert there. It finishes on a local dev server with the verified model cache.
- **Tests** (`creature-finish-app.test.ts`, 2):
  - the developer transport admits only the pinned model on this origin;
  - END TO END on the real Crab: the pinned library master and labels, then the adapter's job through a worker double that REALLY transfers (the sender's buffers detach), then Codex's engine and the store, give exactly the shipped card master;
  - controls: a worker error, a short result and a wrong model pin all fall back with nothing retained; Civet (no labels) is refused by the library.
  - Mutation control: dropping the transfer list fails the test.
- **Not yet:**
  - The STAGE. Codex's loader takes the finished atlas through `admitCreatureFinishedAtlasV1`, but refuses to compose the morph palette remap over it ("cannot compose an unchecked remap"). A finished creature on the stage would therefore lose its individual colours while its card keeps them: CARD ≠ STAGE. Asked in C45.
  - A real browser run with the model.

## Stage projection (session 3)

`projectFinishedToAtlasV1` is the runtime generalisation of `rebind-finished.mjs` (Codex C40(c)). Every bound part's atlas-frame pixels with alpha > 0 take the finished RGB from the same place in the part's cut-out. Alpha is never touched, nothing outside a frame changes, and a rotated or resized frame refuses.

Test on the real Crab fit:
- projecting the UNFINISHED master reproduces the shipped atlas byte for byte;
- an altered master changes more than 1,000 owned RGB values with 0 alpha changes and 0 changes outside the frames;
- controls: a one-pixel cut-out error on the largest part is detected, and a resized frame refuses.

Not wired: the pinned loader's admission of the projected atlas is C41(a).

## Finding: the worker's admission contract blocks the in-game adapter (asked in C43)

`kit-stage-worker.mjs` → `admitCreatureFinishJob` (`tools/local-image-generation/kit-engine-math.mjs`) has two constraints:
- **Size:** it requires width and height to be multiples of 16. **33 of the 38 archetype masters are 1254×1254 and are refused;** only the five crabs (880×880) can be finished today.
- **Input paths:** it requires the master and labels references at `/inputs/<id>.rgba` paths. That fits the native proof server, but not a game page: blob URLs and in-message buffers are refused.

The route is safe under both constraints, because the engine turns any refusal into a painter fallback. But the desktop adapter is not built until Codex chooses:
- **size:** pad to 16 with conservation on the original region, or cut a work canvas;
- **transport:** transferred buffers, or same-origin object URLs.

## Next (in order)

1. **Desktop adapter (`createInfer`)** over the same developer transport local-ai-game already uses:
   - worker: `/__local_ai/kit-stage-worker.mjs`;
   - message: `{stage: 'creature-finish-v1', requestId, recipe, modelFiles}`;
   - model files: from `/__local_ai/runtime.json`;
   - master and labels as blob URLs of raw RGBA, the shape Codex's `native-client.ts` feeds the worker.

   Then production delivery through `createLocalModelDeliveryV1` (the consented 6.69 GB model).
2. **`main.ts` wiring behind `?finish=1`:**
   - build the route with `finishTierV1`, the IndexedDB `creature-originals` store and a `fitFor` over the stage's pinned asset source;
   - pass `finished: (g) => route.lookup(g)` to `createPaintedCardsForApp`;
   - enqueue on discovery (the landfall job queue) or when a Compendium portrait opens.

   The default stays off until Nick's quality review (a G5 gate).
3. **Stage:** the pinned rig loader (`loadPinnedCreatureRigV1`, Codex's C13 pins) must accept a conservation-verified finished master for an individual in place of the pinned master, without weakening its alpha/binding/atlas checks. That is Codex's loader; asked in mailbox C41.
4. **Phones:** a delivered finished-original source (a G3 manifest entry per identity) passed to the engine as `delivered`.
