# Local AI generation — painted landfalls

[Seeded painted biome encounter](audits/PAINTED_BIOME_ENCOUNTER_20260916/README.md),
matches code September 16: three painted quadrupeds now share an 18-second, three-turn
clearing study. The encounter seed selects scenery placement and turn order over the accepted
Earth temperate FAR/MID/NEAR template and compiled Earth card. All three bodies animate;
shared hitstop freezes them together. Native-02 passes 3,243 source-join/body-frame samples,
replay and mouth-contact checks; 60 fps, 0.8/1.0/0.9 ms creature-update p95 on this Mac.
The ground band now describes space above the registered floor, and mirrored contact uses
the same source jaw before screen reflection. Negative controls retain the old failures.
This is seeded painted-template composition, not newly inferred biome art. Damage is scripted
presentation data, not the combat resolver. Automatic fitting, planted-paw contact, sound,
ordinary-game squad wiring, other painted families/biomes and physical-phone qualification
remain separate. No new painting, model run, kit change or original-asset edit.

[Painted variation motion review](audits/PAINTED_VARIATION_MOTION_20260916/README.md) now
animates the approved seed10271 painting, a second10271 painting and crystalline10032.
Independent hash-bound authored observations feed one shared quadruped template; no creature
clip overrides. All three pass exact rest/final rest,484individual and601blended pose samples,
full-motion framing and36connected leg parts. Native captures run about60fps at1.3/1.6/1.7ms
rig-update p95 on this Mac. Alpha-preserving intake, frame clipping and wrong-limb paint islands
are repaired with negative controls;12focused tests and root validation pass. New candidate
art still needs kit intake/visual acceptance. This does not establish automatic fitting,
planted contact, hidden views, other painted families, ordinary gameplay or phone qualification.
Kit, accepted originals and the source genomes remain unchanged. Preview uses one player,
visible still/error fallback and a loopback server with byte-range support.

Matches code as of 2026-09-14. [ROADMAP.md](ROADMAP.md) owns the live work order;
[ART_KIT.md](ART_KIT.md) version 4.3 owns art wording. The four approved MIDGAME images
remain the direction lock. Version 3 and its two rejected images are retired, never inputs.
Historical experiments and their failed receipts remain in audits and Git history.

## Current production path

Ordinary Land commits gameplay first, then shows the supported painter composite. A retained
painting or completed local finisher replaces it with a 400 ms crossfade; reduced motion
replaces it immediately. The accepted rain E painting is the active Earth baseline and is
retained without requiring a model download. Other worlds keep their current painter until
kit assets and adapters exist. This is not universal painted-world coverage.

`port/v2/apps/game/src/local-ai-game.ts` owns the page adapter and canonical sorted recipe JSON.
`ai-landfall-jobs.ts` owns serialized jobs, cancellation and the retention commit point.
`ai-landfall-originals.ts` owns immutable PNG retention in the separate origin-local IndexedDB
store. It resets failed opens and reopens after version changes. A post-retention abort does
not turn a committed original into a canceled painting. Retry replaces the failed job row.
Persistent pagehide handling cancels active page jobs across bfcache cycles.

`landfall-content-hash.ts` verifies PNG bytes with asynchronous native Web Crypto when
available. Without it, a snapshot is hashed in 64 KiB chunks with task yields. A native
hash failure propagates; altered originals still refuse. Each store operation computes its
small identity key once. IDs, schema, integrity policy and the 16 MiB cap are unchanged.
Blob verification now reads one bounded ArrayBuffer instead of streaming JS hashing; the
compatibility path also copies that buffer before yielding. This trades extra temporary
memory for less synchronous hashing. Browser/phone latency and peak memory are not measured
by the unit proof, and this change is not a new storage or delivery architecture.

View never navigates, lands or starts GPU work. Inspect reads retained original bytes at
native size; stale scene intent yields a retry notice. Notification progress is coalesced
per frame and restores the AI control's focus. Recording cannot mutate the notification
overlay during an active checkpoint. Originals remain distinct from model installation.
Browser site-data loss is still possible: protected export, persistence status and labelled
regeneration remain durability work, not completed features.

## Compiler and engine

`landfall-conditioning.ts` is the kit interpreter. It compiles the system card from actual
game data and assembles the approved prompt order. The runtime projection includes only the
frozen style, Light, Mineral palette, Atmosphere/pigment, subject and layout. It excludes
reference locks/hashes, technical and negative blocks, and percentage anchors. The ceiling
is 512 tokens; the accepted proof used 402 prompt tokens and a 416-token tensor.

Composition belongs to `earth-resident-plan`, not kit wording. The first supported scene uses
Civet, Platypus, Frog, Persimmon, Cranberry and Devil's Club. Cranberry is the accepted low mat,
about 16% frame width. Civet is about 30% frame height; Platypus is about 60% of Civet height.
A lower-band grass sample overlaps their lowest feet. Offline-fitted inputs are hashed;
there is no browser-dependent reference resizing. Masters keep their original bytes.

The accepted engine composites the plate and organisms, skips the six organism inference
passes, then runs one masked finisher at strength 0.35. Interior masks protect anatomy while
boundaries, ground and shadows can change. The rejected erosion/runners experiment is retained
but is not the baseline. No further finisher-erosion experiment is authorized.

`tools/local-image-generation/kit-stage-worker.mjs`, `kit-worker-engine.mjs` and the app's warm
client own four retained sessions across successful landings. VAE encoding is constructed
once. Transformer expansion stays in worker memory. The retired game `local-ai-runtime.ts`
and `local-model-variant`/`local-model-variant-storage` owners are absent; the ordinary game has
no OPFS derived-variant layer and no six-reference scene-generator route.

## Weather

`kit-weather-math.mjs` applies deterministic post-finisher wet pigment, edge droplets and
whole-frame rain/snow/dust, using recipe seed and the compiled system card. Rain E is the
accepted default: droplets 3x, specular 3x, rain 2x. Its raw finisher and original are retained.
Current weather/material handling is scoped to the Earth recipe, not every possible organism.

The review-only `kit-weather-details.mjs` adds the authorized soft sky-facing sheen band,
wet-fur value/contrast treatment and an uninterrupted foreground rain layer. Six combinations
are in [WEATHER_DETAILS_REVIEW_20260913](audits/WEATHER_DETAILS_REVIEW_20260913/manifest.json).
They replay the same saved raw finisher with no inference, preserve source/mask/alpha bytes,
and reproduce E exactly when disabled. Foreground stroke density uses E's numerical sky-pass
density; it is not an image-based measurement of painted rain. None replaces E until Nick picks.

## Creature finish (R9, desktop tool only) — matches code as of 2026-09-19

`tools/local-image-generation/kit-worker-engine.mjs#finishCreature` runs the same accepted masked
finisher (strength 0.35, one step, 512-token ceiling) over ONE painted creature master, on the same
sampler and sessions as the landfall. The class block is the opposite polarity of the landfall's:
the solid interior (alpha >= 250, eroded 4 px) is editable and the alpha band + outside are
protected (`kit-contact-math.mjs#latentCreatureMask`, `creatureWorkPlan`, integer-scale resamplers).
The silhouette is cropped and upscaled (<= 4x, <= 1024 px) for inference and box-filtered back;
only pixels inside the eroded solid interior take finisher colour, the alpha plane and every other
pixel stay the painter's byte for byte. Admission is `kit-engine-math.mjs#admitCreatureFinishJob`
(`cf.creature-finish.v1`); the job is compiled by `landfall-conditioning.ts#compileCreatureFinishV1`
on the shared `readArtKitBlocksV4` reader (the Earth kit output is byte-identical before/after that
refactor). Tool-only worker `creature-stage-worker.mjs` and page client `creature-finish-client.mjs`;
the shipped kit worker is untouched. Runner, gates and sheet:

```sh
node port/v2/tools/painted-creature/finish-master.mjs NEW_OUTPUT_DIR [--subjects=crab,mud-crab] [--no-triptych] [--allow-dirty] [--prepare-only]
node port/v2/tools/family-review/prepare-observed-crabs.mjs audits/ANATOMY_COMPLETION_20260917/crab-masks-05 NEW_FITS_DIR --finished=OUTPUT_DIR
node port/v2/tools/painted-creature/finish-sheet.mjs OUTPUT_DIR NEW_SHEET.png
```

Gates in `port/v2/tools/painted-creature/finish-conservation.mjs` (alpha/key conservation, structural
label counts, label-boundary gradient ratio, binding equality; ΔE/SSIM reported). Retention owner
`apps/game/src/creature-originals.ts` (not yet routed). First evidence:
[crab-finish-01](audits/ANATOMY_COMPLETION_20260917/crab-finish-01/README.md) — five crabs PASS, quality
not accepted, findings for Nick recorded there. Phones keep the painter texture (D1).

## Model installation and phone boundary

Model downloads are explicit and resumable. Invalid installations expose Restart. Preparation
abort resolves as paused, without an error notice. Installed parent blobs are read by the warm
worker; expansion does not create a stored variant. App/runtime assets and model weights have
separate inventories. Historical package sizes do not describe the current build.

The physical iPhone is Nick's USB-C iPhone 17 Pro, iOS 26.6.2. The pinned expanded transformer
has 443 initializers, largest 113,246,208 bytes; none exceeds 1 GiB. Its total initializer data
is 4,393,808,634 bytes. A passing per-buffer check does not establish total-memory fitness.
The accepted recipe's precomputed text embedding is retained; it prevents a phone text-encoder
fallback. Latest phone decision: stop Klein probes. The expanded stack and observed 1 GiB
normal-session origin quota exceed the chosen phone budget. Physical RAM is not the browser's
usable GPU/storage budget. No smaller phone finisher is qualified yet.

Next phone work is up to three redistributable approximately 1 GB finisher candidates on Mac,
with the same composite, precomputed embedding and masked 0.35 pass, followed by one phone
attempt with the best candidate. No delivery/storage engineering precedes that result.

## Evidence and checks

- [KIT_NORMAL_LAND_20260912](audits/KIT_NORMAL_LAND_20260912/README.md): ordinary Land,
  retention and Inspect; Part K 1–11, 17, 33–35 repairs with negative controls. The second
  landing in one native session took 21.62 s, with all four session creation counts still one.
- [MAC_INSTALLED_KIT_20260912](audits/MAC_INSTALLED_KIT_20260912): installed-model ordinary-game
  path; 31.33 s Land-to-painting, matching accepted bytes. This is not internet download speed.
- [IPHONE_EMBEDDED_PROBE_20260912](audits/IPHONE_EMBEDDED_PROBE_20260912): initializer audit,
  embedding and retained phone attempts. Earlier failures remain failures.
- [C_LANE_BATCH_REVIEW_20260913](audits/C_LANE_BATCH_REVIEW_20260913/AUDIT.md): current review,
  test repairs, weather ladder and remaining admissions. No full native chain or release claim.

Use the committed proof runner arguments and preparation manifest belonging to the intended
recipe; do not restart `PAUSED_CHECKPOINT.md`, `--landfall --variant`, historical prompt
sweeps or predecessor packages. Native browser jobs require a clean signed source and the
checkout lock outside unit tests. Retain the first failed run; never relabel it after a repair.
