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
