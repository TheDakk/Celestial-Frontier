# Claude complete review of openai/mac — 2026-09-10

Reviewer: Claude (Anthropic), from worktree `anthropic/mac` at c860f57f. Read-only throughout: no file in either worktree was edited, no tests, builds, browsers, model runs, fetches or GitHub writes.

## Direction lock

Nick's art direction is not changed by anything in this document. The approved Living Worlds triptych and the Earth full landfall set the finish; the descriptive art-direction text in `ART_DIRECTION.md` is the canonical style statement; landfalls are large cohesive still paintings with multiple canonical organisms sharing light, atmosphere, contact and overlap; Earth species keep named anatomy; universal objects share the painted finish; battles move to articulated 2D rigs later. Every recommendation below is a means of getting as close to that target as the browser allows, and of removing the defects and waste in the way. Where a recommendation says "the painter draws the composition and the AI finishes", the painter's output is an intermediate; the player sees the finished painting in the approved style. Where the document states a ceiling for a model, that is a statement of fact about the model, not a proposal to lower the target.

## Scope and method

**Target:** `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, signed HEAD f6eed9b4 (124 commits ahead of `origin/develop` c1791e21) plus the uncommitted working copy. `origin/develop` is unchanged and already merged into `anthropic/mac`; nothing to sync.

**What "1.86 million lines" actually is:**

| Category | Lines changed |
|---|---|
| Source code (ts/mjs/js/py/html/css) | 21,080 |
| Tests | 17,606 |
| Markdown (non-audit) | 16,624 |
| Audit markdown | 17,627 |
| Audit JSON/logs/other evidence | 1,779,642 |
| package-lock, misc | 6,782 |

Every changed source, test and non-audit markdown file was read in full by one of eleven read-only review passes (four in the first pass on 2026-09-10 morning, seven full-coverage passes after, two of which spawned their own verification sub-checks). Each pass reported a coverage statement; the only partial reads were `tools/blender/creature_canid.py` (about 60% read line by line, the rest by grep), license text bodies (hash-verified only), and the 142 KB single-line `browser-variant-plan.json`. The audit evidence was not read as prose; it was checked mechanically (hash claims, result statuses, pause inventory, archive verbatim law, size).

Findings are labelled CONFIRMED (read end to end) or PLAUSIBLE (reasoned, not fully traced). Nothing was verified by execution.

## Verdict

The construction quality is consistently high: refusal-before-write state machines, exact hash binding of every artifact, negative-controlled tests, honest first-red retention. The direction is right. But the batch spent most of its effort on the perimeter (delivery, storage, transactions, contracts, packs, diagnostics) while the two things that decide whether painted landfalls succeed, finish and per-subject fidelity, moved very little, and one avoidable choice is actively pulling the output away from the target. The batch is also too large and too entangled to admit as one unit, and it carries a set of concrete defects, mostly small, listed below. No merge of the accumulated head as one unit; split it.

---

## Part A. Art direction and generation quality

### A1. The reference finish leaks into the painting (CONFIRMED by inspection)

| Run | Conditioning | Result finish |
|---|---|---|
| Fungal test | one full-scene reference at the target finish | closest to the target |
| Six-reference Earth | six studio specimen plates on a flat gray matte | flat storybook illustration, centered specimen tree, exposed roots copied from the persimmon plate |
| Desert test | text only | smoothest and most toy-like |

Whole-image references condition presentation and style, not just anatomy. The six plates are excellent anatomy references and poor style references, and they dominate a 452-token prompt whose only finish clause says "restrained detail".

Recommendations, by leverage: repaint the six references in situ at the target finish (riverbank ground, overcast light, matching brushwork, no matte, no exposed roots); add one style-anchor scene reference as image 1 "for composition, material detail and shared lighting" as the fungal prompt did; drop the percentage anchors the model demonstrably ignores and spend the tokens on the finish vocabulary from the approved 02/03 prompts; try higher reference resolution for the failing diagnostics (Platypus bill, Persimmon calyx, Devil's Club prickles).

### A2. Model ceiling versus target

The approved 02/03 paintings remain the target. Klein 4B at four steps has a finish ceiling below them, because they came from a far larger model; the fungal result shows that ceiling is well above the six-reference output, so most of today's gap is inputs and is recoverable. The honest statement of distance: composition, light and cohesion can reach the target; fine material detail will remain softer on-device until the engine port runs a larger finisher natively. Nothing here proposes accepting less than the approved finish as the goal; it describes how far each tier gets toward it.

### A3. Fidelity needs a pipeline shape change (CONFIRMED)

The graph has no box, mask or count input (`landfall-fidelity.ts:18-21` declares `perInstanceSpatialControl:false`). Three attempts all fail count or anatomy. Ordered plan: unfreeze `steps`, `seed` and size (hard-coded in `local-ai-game.ts:211`, `landfall-fidelity.ts:124`, `stage-worker.mjs:22`) and run a 4/6/8-step by 3-seed sweep; generate each organism separately (about 512×320, one reference) and composite at the existing plan anchors; run a low-strength integrate pass (start at sigma 0.35 to 0.5) to unify light, contact and overlap; optional latent masking during that pass; use the deterministic species painter as the per-organism reference so the compiler becomes genome-driven. `pipeline-math.mjs`, the stage worker, reference verification, snapshot identity, anchors and fidelity byte-binding all survive.

### A4. Inference math (CONFIRMED correct, with two PLAUSIBLE notes)

Empirical-mu coefficients and branches, sigma schedule, image and text position ids, latent concat and slicing, Euler update all match the pinned Diffusers Flux2 Klein pipeline; independent mu(1024,4) = 2.0307 matches `source-contract.md`. Notes: four steps extrapolate below the 10-to-200-step fit and the last Euler step covers 74% of the trajectory; the timestep is fed as sigma in [0,1] and is correct only if the exported graph kept the internal ×1000 (unverified against the graph). The negative prompt is generated, hashed and never consumed (Klein has no guidance input): pure ceremony, correctly labelled.

### A5. "Compiler" is a six-record Earth template (CONFIRMED)

`earth-layered-recipe.ts:65,74` admits only byte-identical Earth request and roster JSON; `landfall-conditioning.ts:145-158` refuses anything but temperate/rain/liquid; all anatomy prose is hand-authored per Earth name and a test asserts genes are not turned into prose. Reaching a second world needs a Descriptors-to-prose adapter, scene vocabulary, a seed-driven layout, painter-derived references and brand-plus-fingerprint admission.

### A6. Cross-browser determinism hole and payload (CONFIRMED)

References are resampled to 480×320 by the browser's own resampler (`local-ai-runtime.ts:167-174`) while the recipe hashes only the source PNG; the test enshrines `imageSmoothingQuality:'high'`. Pre-fit offline, ship the fitted bytes (about 150 KB instead of 9 MB of 1536×1024 PNGs in the runtime pack), hash them.

### A7. The rest of the game does not share the painted language (CONFIRMED)

Protostar is two baked radial gradients, the magnetar field two vector ellipse strokes, the trinary companion a gradient corona, and the Earth turn samples `PlanetGen.surfaceColor` into an unlit atlas with GLSL hash noise; all verbatim ports of the legacy Canvas renderer. The `?livingvista=1` study composites Compendium vector painters over a painted WebP, exactly the cutout-over-background the direction rejects. Binary and trinary companion coronas use different gradients (`main.ts:5605-5615`). Decide the system-view and globe art language before extending any of these.

### A8. Rig foundation

No multi-family rig exists. Reusable: `tools/creature-animation/kinematics.ts` (family-agnostic two-bone IK and chain wave, edge cases handled) and the mesh-grid plus bone compose/inherit/skin-weight mechanism in `civet-articulated-rig.ts`. Every landmark, weight and pose curve is Civet-specific. `civet-rig.ts`'s deformer is shadowed by the articulated rig and its 290-line test tests superseded code.

---

## Part B. Generation speed (Nick's question)

Measured on the M4 Pro, identity-only 1024×576 with block32: text 12.5 s, reference encode 1.1 s, denoise 51.8 s, decode 4.3 s. Six references: 135.7 s. Portable model without block32: about 3.5× slower on denoise, which explains the in-game 600 s timeout together with GPU contention from the Pixi loop.

1. **Keep sessions warm.** `local-ai-runtime.ts:102` spawns a fresh Worker per stage and terminates it; the VAE encoder session is built six times per painting; every Land re-reads about 7.4 GB from blob URLs and recompiles shaders. Load once, keep the denoiser alive across landings, warm up on system entry.
2. **Precompute text embeddings and stop shipping the text encoder.** With per-organism and scene templates every prompt comes from a finite catalogue; encode offline, ship a few MB of embeddings, and the 2.19 GB text encoder never runs on the player's device. Removes 12.5 s and a third of the download.
3. **Per-organism passes plus a short integrate pass** (A3): attention is quadratic in tokens, so six small passes cost less than one 5,904-token pass and fix count.
4. **Start on orbit arrival.** The world is deterministic; generate the environment before Land, and the organism and integrate passes after the landing commits so the roster binds to the committed ecology epoch.
5. **Throttle the Pixi ticker while drawing.**
6. **Measure a Q4 transformer** (quality experiment, not a free win). Do not go below four steps.

Not worth chasing: the fixed-shape experiment (1.3%, and it cannot be used with more than two references, `denoiser-shapes.mjs:21`).

---

## Part C. Delivery, storage and the phone

### C1. The uncommitted block32 variant storage layer should not exist (CONFIRMED)

`expandVariantOperandsV1` (`local-model-variant.ts:119-125`) repeats each of about 87 MB of parent scale/zero bytes four times to make the 347 MB file. Build it in the denoise worker in about a second and hand it to ORT as in-memory external data, hashed against the pinned digest first. That deletes `local-model-variant-storage.ts`, the transaction half of `local-model-variant.ts`, two test files, 336 MiB of player storage, the Prepare/Verify/Stop controls and an extra verify pass. The current code reads the derived data back three times and hashes it five times. If block32 shows no gain on the target device, delete it entirely.

### C2. Full-model passes (CONFIRMED)

| Scenario | 6.23 GiB parent passes |
|---|---|
| Fresh install | network + write + readback hash; 6,381 `storage.estimate()` calls (one per chunk) |
| Resume at X GiB | the persisted prefix hashed twice (`scan` then `downloadFile`) |
| Every new session | one full read plus pure-JS SHA-256 on the main thread before any Land can queue; 1 to 2 minutes of frozen tab on a phone |
| Every Land | about 7.4 GB re-read by ORT; fresh Worker per stage; VAE encoder built six times |

Fix: persist a per-attempt verified record, re-hash only on load failure or explicit request, hash in a worker with sync access handles, `estimate()` per 64 MiB, hash once on resume.

### C3. Recovery and probing holes (CONFIRMED)

- One flipped bit in a ready install lands in phase `invalid` with the ready marker intact; Download and Verify take the same path; only `install({restart:true})` escapes and the game never passes it. Unrecoverable from the UI.
- The capability probe checks `storage.getDirectory` but not `createWritable`; nothing calls `navigator.storage.persist()`; Safari ITP evicts script-writable storage after seven days for a plain tab.
- Variant readiness is keyed on parent attempt id, not content hash; a restart reinstall discards correct derived data.
- Model Blobs are consumed for minutes with no lock; safe only because nothing deletes attempts yet.
- The service worker materializes every cached response with `arrayBuffer()` to count retained bytes (up to 256 MiB per install) where `Content-Length` would do.

SHA-256 implementation checked by reading: padding, overflow block and 64-bit length split are correct for inputs over 4 GiB. Variant derivation is pin-verified on both outputs before commit; a wrong-but-loadable model is not possible unless the pinned hashes themselves were produced wrong.

### C4. The phone question (PLAUSIBLE, needs one measurement)

ORT Web loads each external-data file into a JS/WASM buffer before GPU upload; the transformer shard set is 4.13 GB and the text encoder 2.19 GB. iOS Safari's per-process memory ceiling and Apple-GPU `maxBufferSize` defaults make that structurally out of reach for this model regardless of delivery quality. One probe run on the actual target iPhone (`maxBufferSize`, `shader-f16`, memory at transformer load) should gate all further delivery work. If it fails, the phone lane needs a smaller model or generation elsewhere, and Nick decides which stated constraint yields.

### C5. Licensing (CONFIRMED)

FLUX.2 Klein 4B ONNX conversion and upstream are Apache-2.0, Qwen3-4B is Apache-2.0, ORT Web is MIT, Tokenizers Apache-2.0. Browser distribution is license-compatible provided the NOTICE/attribution files ship with the pack; `THIRD_PARTY_NOTICES.md` and `licenses/` exist for that. Pilot audio is commissioned original with redistribution rights recorded consistently across `AUDIO_LICENSES.md`, `rights.ts` and the rights proof; all eight WAV hashes match. Inter ships with its OFL text.

---

## Part D. Game integration defects (all CONFIRMED)

1. **View from Notifications can perform a real landing and silently start a new GPU job.** `viewLocalAiOriginal` (`main.ts:8772`) calls `landWithPilotPresentation(true)` when the snapshot digest differs; every committed landing calls `queueCurrentAiLandfall()` (`main.ts:8830`). Make View navigation-free.
2. **Stop model preparation produces an error toast, a fault record and a persisted "Painting unavailable" notification** because the variant path throws `AbortError` while the install path returns `{ready:false,error:'canceled'}`. The test at `local-ai-game.test.ts:517` asserts the rejection, pinning the code path.
3. **IndexedDB originals store poisons itself after one transient open failure.** `ai-landfall-originals.ts:121-148` never resets `opening` on rejection; `onversionchange` sets `closed` permanently. Every later job fails at "Retaining original" with a Retry that cannot succeed.
4. **Full panel rebuild on every progress event.** `notification-history.ts:64-80` restores focus only for read buttons; delivery fires per 1 MiB chunk, so about 6,700 rebuilds of the survey card and notifications panel per install, each stealing focus from Cancel/Pause.
5. **Cancel during retention yields a canceled job whose painting auto-mounts on the next landing** with no notification and no View step; `ai-landfall-jobs.test.ts:104-120` asserts this.
6. **Untrusted clicks on `[data-ai-act]` are swallowed and return true** (`main.ts:8783-8797`), so the `simrun dom` reachability tier cannot exercise Cancel/View/Inspect/Retry; a wired-to-nothing button passes reachability by construction.
7. **Every Survey card click is now deferred one microtask** because `await handleLocalAiAction(e)` precedes the Close and Leave branches (`main.ts:~8862`); Close and focus moves now run after the document-level panel listeners. Make the guard synchronous.
8. Full-PNG pure-JS SHA-256 on the main thread on every find/read (up to four candidate identities per landing) while `crypto.subtle.digest` is used elsewhere; `pagehide {once:true}` stops tracking after one bfcache round-trip; running jobs are never aborted on pagehide.

**Test coverage of these eight:** none would have been caught. `main.ts` local-AI wiring is never loaded by any test; the controller test replaces `view`, `captureView` and `refresh` with stubs; the IDB fixture never rejects open or fires `versionchange`; items 2 and 5 are asserted as intended. The tests that exist are strong for controller invariants and blind to page wiring.

Well built, do not re-litigate: jobs never touch the save; ready is published only after commit plus re-read verification; publication re-checks world key, environment, epoch, snapshot digest and vista generation; Blob URLs revoked in `finally`; the viewer isolates background roots and restores exact attributes; old sprite kept until successor validates; no delete API on originals.

---

## Part E. Game shell, UI, graphics, audio

### E1. HIGH

- **Inert desktop panel-anchor CSS block** (CONFIRMED). `ui-shell-style.ts:98-100` sets `bottom` and `right` for five panels and the toast at (1,0,0) specificity; `UI_SHEET_CSS` is concatenated after it and overrides every `bottom` and every panel `right` at equal specificity. Only `#toast{right}` survives. Same pattern in `NOTIFICATION_HISTORY_CSS:144`. This is the exact "earlier equal-specificity rule loses" law that cost v1.8.6 and v1.8.7. Not user-visible today because the later rule is the intended one; delete the dead block and add one computed-style test.
- **Deferred notices can sit "Awaiting checkpoint" indefinitely with no Mark read** (PLAUSIBLE, logic confirmed). `notification-history.ts:130-131` routes notices to `pendingNotices` while a product action is in flight; the only drain is inside `persistView`, which product actions do not call. After a Tame the bell shows an un-actionable row and the badge stays lit until the player navigates. Any later notice while pending exist is forced pending too.
- **Study assets ship in the installed PWA pack** (CONFIRMED). `pwa-build.ts:589` precaches every bundle output: two 4.6 MB uncompressed WAVs plus other pilot WAVs, pilot and painted webps and the Inter font, about 11 MB of query-gated payload fetched and SHA-256'd on every phone install. The new 128 MiB pack assertion accommodates it instead of pruning.
- **Charters is unreachable whenever any surface is open** (CONFIRMED by CSS). `ui-shell-style.ts:29` hides `#objchip` under `.card-open`/`.panel-open`, and `#objchip` is now the only Charters opener (`main.ts:4256`). With Survey open there is no visible Charters control on any breakpoint.
- **Release notes advertise developer-only query lanes as player features** (CONFIRMED). `release-content.ts:223-228, 237`.

### E2. MEDIUM

- `sheet-layout.ts` observes `childList/characterData/subtree` on every `.panel` including the Compendium virtual scrollport, and each sync does about 15 `getComputedStyle` and 12 `getBoundingClientRect` reads with a mid-measure `--hint-h` write: a full relayout per scroll frame on the one list the phone budget already guards.
- `checkpoint-state.ts:192-206` refuses the whole checkpoint on a malformed notification row; a cosmetic field becomes "no checkpoints ever succeed". Degrade to dropping the overlay instead. `import-v2` rewrites `t:0` to now while `appendNotification` clamps to 0.
- Live save mutated outside a product/checkpoint authority: `main.ts:4325-4335` writes `save.notifications` directly and `mayRecord` lacks the `activePersist` guard.
- `refreshBadge()` rewrites attributes unconditionally on all 25 `updateChips()` call sites; `updateChips` now also forces a layout read via `syncTopbarH`.
- Frontier Resolve fixed by string-matching the ability description and exact numbers (`combat-cues.ts:216-227`); any copy edit re-breaks the Chronicle. Match on identity.
- Decoded pilot audio held twice per play (`pilot-pcm.ts:100-106` copies cached planar arrays into a fresh `AudioBuffer` every `create()`); a Listen click leaves about 37 MB resident. Main-thread PCM decode via per-sample `getInt16` where an `Int16Array` view would do.
- Timer-only 12 s deadlines in `earth-layered-load.ts:65-108` and `planet-surface-turn-view.ts:126-169` admit late results under timer throttling; only `PaintedVistaLoadV1` has the monotonic boundary. `planet-surface-turn-view.ts:132-137` discards the worker's real error reason.
- Static imports of `painted-*`, `earth-layered-*` and `earth-resident-plan` (two multi-KB JSON literals) sit in the main chunk for query-only paths. FOUC: `--ui` was removed from `:root` in `index.html` and is now defined only when `main.ts` evaluates.

### E3. Dead and superseded code (CONFIRMED by importer grep)

`scene-image-cache-plan.ts` plus its 233-line test have zero importers. `civet-rig.ts`'s deformer and its 290-line test are superseded by the articulated rig. `CIVET_SKIN` is exported and never read. `#shelfnotifications`, `#railinventory`, `#railrecords`, `#trail` are hidden but still built and badged. Two font URL constants resolve the same file. `run-offline-runtime.mjs` as a CLI is superseded. `audiovisual-pilot-review.mjs` asserts the pre-U1 dock and fails unconditionally; nothing runs it. The `?livingvista=1` quartet (`earth-resident.worker/layer/protocol/load`, about 350 source plus 700 test lines) is what the static-landing decision left behind.

### E4. Verified clean

Determinism: no random or clock source reaches generation or share codes anywhere in the diff. Save shape: `save.notifications` existed already; bounds are 50 write / 60 load with clamped fields. Worker, bitmap, texture, observer and listener lifecycles in the loaders, battle scene and turn view are disposed on all paths. Blender scripts perform no destructive operations, refuse existing outputs and re-verify the master hash. Hand-written WAV parser is bounds-checked and rejects every unsupported format. IK solver rejects NaN, zero-length and unreachable targets. Atlas and material math match the legacy owner. Server scripts bind loopback, reject traversal, fail Range parsing closed, and send COOP/COEP.

---

## Part F. Instruments and tests

- **Root cause of the "duplicate checkout lock" aggregate FAIL** (CONFIRMED): four unit-test files take the exclusive process-keyed checkout lock in `before()` (`runtime-pack.test.mjs:15`, `mobile-pack-package.test.mjs:14`, `frozen-preview-client.test.mjs:14`, `species-references.test.mjs:24`); `node --test` runs files in parallel and `workspacelock.mjs` refuses nesting. The checkpoint's workaround treats the symptom. Tests should not take the checkout lock.
- **`workspacelock.mjs:55-78` stale-lock recovery can steal a live lock** during the window between `openSync('wx')` and the owner write. Write via temp plus rename.
- **A load-bearing plan file is untracked** (CONFIRMED): `browser-variant-plan.json` is `??` yet pinned by `browser-variant-source.mjs:3-7` and `runtime-pack-source-pins.json:202-207` and read unconditionally at preview-server start. A clean checkout of the committed head cannot start any preview runner. Same for `browser-variant-plan.mjs`, `first-step-harness*.mjs`, `offline-variant-proof*.mjs`, `run-first-step-diagnostic.mjs`.
- Glass phone-dock gate uses `width <= 700` while the product's compact rule is `<=700 || (<=900 && landscape)`; the 844×390 viewport runs the compact dock in the product but Glass never audits it, and the end-of-run sentinel was narrowed the same way.
- `addContrastSubject` in `glassmatrix.mjs` silently drops a dock utility button whose markup drifts, so it can never emit `TEXT_CONTRAST_LOW`; the structural guard runs only at phone-landscape/codex.
- `readU1PhoneShell(training)` restores styles with `removeProperty`, leaving the present-empty `style=""` carrier the process laws forbid; no restoration receipt.
- `ui-shell-review.mjs`, `ui-review-navigation-selftest.mjs`, `audiovisual-pilot-review.mjs`, `run-browser-proof.mjs`, `probe-webgpu.mjs` own a real browser without holding the workspace lock for their lifetime.
- `run-game-integration.mjs:88` and `run-landfall-viewer.mjs:79` throw from inside the CDP event callback on evidence overflow, which converts the whole session to a terminal error so the failure screenshot and target close reject; 300 favicon-404 log rows can destroy an otherwise good run's diagnostics.
- Source-text tests: `biome-vista-surface.test.ts` (+385-458), `arc9-frontier-ending-main-wiring.test.ts`, `notification-history.test.ts:278-308`, `app-chrome-main-wiring.test.ts`, every `proveEachMarkerRequired` block, and several `glass-hidden-opener` and `slicesmoke-inventory-causal-chain` cases assert string presence or ordering in `main.ts` and stay green if the behaviour changes while the text survives.
- Strong: executed-oracle tests (`glass-charts-control-route`, `glass-post-close-geometry`, `glass-sticky-header-scroll`, `ui-rail-boundary-control`, `ui-compact-toast`), the settlement receipts that pin frame id, phase order and viewport, the audio duck observer with wrong-kind and jump-back mutants, the fidelity byte-binding, and the `browser-lifecycle` source-mutant pattern.
- Biggest player-path holes for the AI feature: reload mid-job, quota exceeded mid-write, Safari private mode, background tab and device loss mid-denoise, two tabs.

---

## Part G. Documentation and evidence

- **Archive verbatim law: PASS.** All 52 blocks removed from the live ROADMAP appear verbatim in `ROADMAP_ARCHIVE.md`.
- **Hash claims: PASS.** 53 link-plus-hash lines checked; the 9 heuristic mismatches are recipe keys and content digests, not file-byte claims.
- **Pause inventory drift:** four files changed after the sealed inventory (`LOCAL_AI_GENERATION.md`, `ROADMAP.md`, the closure `HANDOFF.md`, `celestial-frontier-codebase-reference.md`) from the later desert and fungal scoped experiments. The checkpoint's "exact SHA256s" statement is no longer exact.
- **False or stale reference claims (CONFIRMED):** `AUDIO.md:39` and `AAA_AUDIOVISUAL_CAMPAIGN.md:141` cite a 233,094-byte asset set including an atmosphere layer that no longer exists (actual 146,088); `AUDIO.md:85`, `AAA_ASSET_POLICY.md:6` and `AAA_AUDIOVISUAL_CAMPAIGN.md:162` say the 256 MiB retained-update limit is "not runtime enforcement" while `pwa-build.ts:350,367,374` enforce it; `PROCEDURAL_CHARACTERISTICS.md:21` says `landfall-fidelity.ts` is V1-only while V2 exists and `SPECIES_AND_GENOME.md` says so; `DETERMINISM.md:32-33` places the EL/EP controls in the wrong file; `BREEDING_AND_SHARING.md:26-28` claims the legacy `CFB-` codec lives in `lineage-codec.ts` (only CFB2 does); draft-bulletin count is 79, 77 and 81 across three docs versus 83 in code; `source-contract.md:80,187,224,253` cite dimensions and test counts that no longer match; `UI_PARITY_PROGRAM_U1_U4.md:572-573` gate commands point at root-level tool paths that do not exist; `tools/audio-native-mix/README.md` still describes only failures while `AUDIO.md` records a passing native-audio-03.
- **Repository health:** tracked audit evidence grew from 79 MB to 766 MB on this branch; the pack is 667 MB; `test.yml` clones with `fetch-depth: 0`, so every hosted run pulls about 700 MB before a test starts. The two 8.6 MB profile JSONs, 3.9 MB reports, GIFs and tarballs belong in LFS or release assets, with READMEs and handoffs kept in-repo.
- **Policy item for Nick:** the `AGENTS.md` diff instructs agents to automatically install eligible updates to approved idle tools at every session start; `development-toolchain.mjs --check` makes undisclosed network calls to `formulae.brew.sh` and `registry.npmjs.org`. This is a standing network-install authorization that contradicts the tool's own "no install engine" header.
- **Handoff quality:** the checkpoint is self-contained and copy-ready; its weakness is that every packet restates the same twenty caveats with equal weight, so the three things that matter are buried.

---

## Part H. Priorities

1. One real-iPhone probe run; gate all delivery work on it.
2. Repaint references in situ at target finish; add a style-anchor scene reference; rewrite the prompt budget; pre-fit references offline. One run.
3. Unfreeze steps/seed/size; run the sweep.
4. Prototype per-organism generation plus integrate pass; warm sessions; precomputed text embeddings; start on orbit arrival.
5. Fix the eight integration defects (Part D), the inert CSS block, the pending-notice drain, the Charters opener, and the checkpoint refusal; add a page-level test that loads the real Notifications wiring.
6. Replace OPFS variant storage with in-worker expansion or drop block32.
7. Commit the untracked plan and harness files; remove the checkout lock from the four unit tests; fix stale-lock recovery.
8. Prune study assets and WAVs from the pack; delete dead modules; move query-lane sentences out of release notes; correct the stale doc claims; move bulky evidence out of git history.
9. Split PR42 into the production UI tier, the `?localai=1` gated game tier, and the research tools; admit the first on its exact head under one authorized hosted attempt.

Merge stance: no merge of the accumulated head as one unit. The production-facing tier is merge-eligible in principle once split out and admitted on its exact head; the AI tier stays quarantined research behind `?localai=1`.

---

## Part I. Proposed architecture: the game paints, the AI finishes, tiered by device

Added 2026-09-10 after discussion with Nick. This is a proposal, not implemented work.

### I1. Principle

The deterministic species painter is the source of truth for composition: which organisms, how many, where, what anatomy, what identity. The image model never invents the scene. It receives the painter's composition and runs a low-strength image-to-image pass that adds painted light, material response, atmosphere and vegetation overlap without moving structure. Consequences:

- Species, counts, placement and identity are exact by construction, for every world, with no per-world prompt compiler.
- The model's job (texture and light) is the job small models do acceptably, so the model can shrink with the device.
- The same recipe identity applies on every tier; only the finish richness differs.
- Every existing law survives untouched: genomes, lineage, biome mapping, ecology epoch, saves, share codes, accepted control placement.

### I2. Tiers

| Tier | Where | What runs | Output | Target time |
|---|---|---|---|---|
| 0 Painter | every device, always | deterministic painter only | instant, exact | 0 s, shown immediately on landing |
| 1 Quick finish | phones and low-end laptops | small finisher (about 1 GB class, int8/int4) at 512×288 to 768×432, low strength | painterly light and material over the painter's composition | under 30 s, in background |
| 2 Rich finish | desktop with capable WebGPU | Klein 4B (block32) at 1024×576, low strength, optional second pass for foreground subjects | closest to the approved finish available on-device | 30 to 60 s with warm sessions |
| 3 Scene generation | research only | Klein as scene generator with references | not shipped | n/a |

Tier 0 is never skipped. Tier 1 and 2 replace the tier 0 painting with a crossfade when ready. If a tier fails (device lost, out of memory, timeout), the device drops one tier, records that, and the player keeps the painting they already have.

### I3. Detection: capability, not user agent

Do not branch on iOS/Android/PC strings. User-agent detection is unreliable (iPadOS reports as macOS; Android spans flagship to entry level; Safari and Chrome on the same Mac expose different WebGPU limits) and it is a proxy for the thing that actually matters. Gate on measured capability, in this order:

1. `navigator.gpu.requestAdapter()` succeeds with a non-fallback adapter; read `limits.maxBufferSize`, `limits.maxStorageBufferBindingSize`, `features.has('shader-f16')`.
2. `navigator.storage.estimate()` quota headroom versus the tier's model size plus originals headroom; `navigator.storage.persist()` requested for tier 1 and above.
3. A five-second timed micro-benchmark (one small matmul-heavy shader) to rank raw throughput.
4. `navigator.deviceMemory` and `hardwareConcurrency` where available, as hints only.
5. User agent and touch capability only to choose default copy and the initial suggested tier.

Tier 2 requires the adapter to accept buffers at least as large as the transformer's largest shard and `shader-f16`; tier 1 requires the small finisher's shard size. The chosen tier is a player-visible setting ("Painting quality: Off / Quick / Rich") with the detected tier as the default, and a downgrade is remembered per device.

### I4. Flow at landing

1. Player enters orbit: the world is deterministic, so the environment pass for the likely landing can begin now (tier 1 or 2), throttling the Pixi ticker while it runs.
2. Player presses Land: the ordinary durable landing transaction commits first, exactly as today. The painter renders the tier 0 painting immediately and it is shown.
3. After commit, the organism composition is known from the committed ecology epoch; the finisher pass runs on the painter's output. Progress and cancel live in Notifications and the Survey card as they do now.
4. On completion the original is retained (pixels plus recipe, tier, device class and model identity) and the scene crossfades. Never auto-navigates.
5. Reload restores the retained original without inference; if none exists, tier 0 shows instantly and the finisher may run again.

### I5. Storage and sharing per tier

- Tier 1 model download is asset-sized, not installer-sized; deliver through the existing resumable OPFS path with the existing hash binding. Tier 2 keeps the current 6.23 GiB delivery for desktops that opt in.
- Text embeddings for both tiers are precomputed offline from the finite prompt catalogue and shipped as data, so no text encoder runs on any device.
- Originals are pixels; sharing a discovery transports pixels plus provenance. Recipes reproduce the composition on any device (tier 0 is deterministic) but not the finished pixels.

### I5a. Artwork durability (added 2026-09-11 at Nick's request: a priority, not a footnote)

Today finished paintings live only in the origin's IndexedDB. The game never deletes them, but the browser can: Safari evicts a plain tab's script-writable storage after seven days without a visit, "clear website data" removes it, and storage pressure can evict it silently. Nothing requests persistent storage and there is no export. The discovery itself is never lost (seeds and the save reproduce the composition exactly); the exact finished pixels are what can be lost, because GPU output is not bit-identical across devices.

Required, in order:

1. Request `navigator.storage.persist()` on first landing; surface its status; on iOS prompt add-to-home-screen, which is exempt from the seven-day eviction.
2. Export: save or share any painting as PNG through the native share sheet (Photos on iPhone). Pixels outside the origin cannot be evicted.
3. Protected originals: when scene-cache eviction is built, originals are never candidates; only disposable finish variants are. The advisory planner's protected-copy rule becomes the law.
4. Regenerate on loss, labelled as a re-creation, never presented as the original.
5. Account-backed copy: the only true guarantee is a copy outside the device; a product decision requiring a service, on the roadmap.

### I6. What carries to the engine

Painter, identity binding, recipe and originals semantics, fidelity contract, tier policy, retention rules. Only the inference host changes: native inference with memory-mapped weights and Metal/CoreML/NNAPI can run a Klein-class finisher on phones that the browser cannot, so the phone tier rises without touching the game.

### I7. Milestones that prove or disprove it

1. Desktop, repainted in-situ references plus style anchor, one run: does Klein reach fungal-test finish with correct species? Sets the quality bar. One to two days.
2. Desktop finisher: painter output into Klein at sigma 0.35 to 0.5. Measure finish gained and structure preserved. One to two days; small change to the stage worker.
3. iPhone probe: adapter limits, memory at load, micro-benchmark. Half a day. Decides tier 2 on phones (expected no) and informs tier 1 sizing.
4. Phone finisher: one small model candidate at 512×288 on the real iPhone; time, heat over ten consecutive landings, memory. Two to three days including delivery.
5. Tier policy and settings control, capability gate, downgrade memory, crossfade. Then admission on the exact head.

### I8. Decisions for Nick

- The approved finish is the bar on every tier. Confirm that tier 1 may ship a softer rendering of the same painting while it falls short of that bar, or whether tier 1 should stay painter-only until the engine.
- Is a player-visible quality setting acceptable, or should tiers be silent?
- Which small finisher model family to evaluate first (license must permit redistribution; Apache-2.0 or MIT preferred).
- Whether tier 2's 6.23 GiB opt-in download stays a desktop option or is deferred until the engine.

### I9. Risks

- Low-strength image-to-image may soften the painter's crisp anatomy while still not reaching reference detail; milestone 2 measures this before anything is built on it.
- Small finishers vary widely in quality; expect to evaluate two or three candidates.
- WebGPU on iOS Safari is new; limits may change between releases, so the capability gate must be re-run per session rather than cached.
- Thermal behaviour on phones only shows under repeated landings; single-run timings are not evidence.

---

## Part J. Final double check and recommendations against the product vision

Added 2026-09-10 after Nick restated the product: a browser space-exploration RPG with the discovery of No Man's Sky, the creature collecting of Pokémon and the turn-based battles of Final Fantasy, richly painted environments and animated creatures, every planet a discovery worth sharing, no installation, art direction inspired by Dungeons and Dragons. Goal now: the best possible AAA browser game, proven in the browser, ported to an engine later.

### J1. Double check of the highest-weight findings (re-verified in source today)

| Finding | Evidence re-read | Status |
|---|---|---|
| Inert desktop panel-anchor CSS block | `main.ts:620` concatenates shell CSS before sheet CSS; `ui-shell-style.ts:98-100` vs `ui-sheet-style.ts:6,34,50,51` | CONFIRMED |
| Pending notices never drain after a product action | `notification-history.ts:86-91` `flushPending` is called only at `main.ts:9873` inside `persistView` | CONFIRMED |
| Charters opener hidden whenever a surface is open | `ui-shell-style.ts:29`; `main.ts:4256` registers `#objchip` as the sole opener | CONFIRMED |
| Checkout-lock aggregate failure root cause | four unit-test files call `acquireWorkspaceLock` | CONFIRMED |
| Load-bearing plan file untracked | `browser-variant-plan.json` and nine sibling files are `??`; pinned at `browser-variant-source.mjs:4-5` | CONFIRMED |
| D&D inspiration in the documented direction | Deliberately implied by description rather than named (Nick, 2026-09-10): `ART_DIRECTION.md:405` "fantasy richness"; the four prompt families carry that vocabulary unevenly | REFINEMENT |

### J2. The art-direction refinement that matters most

The inspiration is implied through description and the five supplied reference sheets, and Nick has chosen not to name the brand, which is correct: the direction decision rules out copying franchise art, and naming a trademark in a prompt pulls a model toward specific published illustrations. The refinement is that the descriptive vocabulary reaches the model unevenly: the concept prompts say "natural-history fantasy painting", the compiled landfall prompt says "restrained detail", and the reference-authoring prompts describe studio plates. Fix at the source of truth, brand left out:

1. Lift the existing description into one canonical style paragraph in `ART_DIRECTION.md` with its concrete visual attributes: painted realism in the tradition of tabletop monster-manual and natural-history plates; tactile materials; directional natural light with soft bounce; creature personality read through gaze, posture and silhouette; specimen-with-habitat framing; restrained luminous accents; no plastic CGI, no cartoon eyes, no halos.
2. Make that paragraph the literal style preamble of every generation prompt: reference authoring, landfall conditioning, Compendium portraits, universal objects. One string, one owner, hashed into every recipe. Today four different prompt families carry four different style vocabularies.
3. Author the references in that style, in situ (Part A1). The reference finish is the strongest style signal the model receives.

### J3. Pillar-by-pillar assessment

**Discovery (No Man's Sky).** Strongest pillar. Deterministic worlds, galaxies, systems, biomes, survey and landing all exist and are guarded by golden seeds. Gap: the landing moment is the emotional peak and it currently shows a procedural vista or a thumbnail. The painted landfall is the right investment; deliver it as painter-first with an AI finisher (Part I) so every planet gets a painting on every device, instantly, and a richer one seconds later.

**Collecting and breeding (Pokémon).** Systems are complete and audited (nonlethal individual-parent breeding, lineage codecs, Compendium). Gap: presentation. Compendium portraits are the vector painter at 132/300/440 while landfalls move to painted finish; the two will clash on the same screen. Route Compendium portraits through the same finisher tier so identity and finish match across surfaces. Creature personality (gaze, posture, silhouette) is documented as the goal and is where the D&D inspiration should land first.

**Turn-based battles (Final Fantasy).** Weakest pillar against the vision. Combat math is deterministic and tested; presentation is whole-portrait translation on a div, explicitly "not anatomical animation". The articulated family rigs (land, flying, aquatic) are unstarted apart from a reusable IK solver and a Civet-only mesh. Recommendation: do not build rigs in the browser beyond one proof per family; the engine will own skeletal 2D animation. In the browser, invest in battle staging instead: painted backdrops from the landfall painting, scale and overlap for depth, camera push-ins, hit flashes, and audio cues. That reaches "feels like Final Fantasy" faster than rigs and all of it ports.

**Painted environments.** Direction approved and partly proven. Gaps: the system view, stars and globes are procedural vector (Part A7); the finisher tiers are unbuilt; references leak studio finish. Order: references, finisher on desktop, Compendium through the finisher, then decide the system-view language (painted skyboxes and planet discs are cheap wins once the finisher exists).

**Animated creatures.** See battles. In the browser: idle breathing, blink, weight shift and a settle on landing via the existing kinematics module, one view per family, no full rigs. The twelve-second desert living-painting clip should become a real-time layer effect (rain, dust, haze, parallax) rather than an MP4; that is browser-feasible today.

**Sound.** Runtime is solid: ducking contract, rights recorded, 268 focused checks, six DSP renders. Gaps: HUMAN listening has never happened; pilot music is opt-in behind a query flag; two 4.6 MB uncompressed WAVs ship in the pack. Recommendation: one listening session on real headphones and a real phone speaker, decide the pilot, convert to Opus or AAC, exclude study assets from the precache.

**Sharing.** CF1 shares a place; nothing shares a discovery as seen. Recommendation: a versioned view envelope (world identity, ecology epoch, recipe, tier, original pixels) that renders view-only for the recipient and grants nothing. Pixels, not recipes, because GPU outputs are not bit-reproducible.

**No installation.** The browser slice honours it today. The 6.23 GiB optional model does not; a browser tab that downloads six gigabytes is an installer. The tiered design keeps "no install" true: tier 0 needs nothing, tier 1 is an asset-sized download, tier 2 is an explicit desktop opt-in.

### J4. The AAA bar in a browser

AAA in a browser is not polygon count; it is the absence of rough edges. The things that currently read as rough:

- Study lanes reachable only by query string, and their assets in every install.
- A minute of "Landing" with a progress bar, instead of an instant painting that gets richer.
- Vector system view next to painted landfall.
- Whole-portrait slides in battle.
- Notifications that can sit un-actionable, a Charters opener that vanishes when a card is open, a dead CSS block waiting to bite.
- Docs and evidence that restate twenty caveats with equal weight, so the three things that matter get lost.

### J5. Ordered program

1. **Canon the style.** One style paragraph in `ART_DIRECTION.md`, lifted from the existing description, brand unnamed, used verbatim as every prompt preamble. Half a day.
2. **References and finisher on desktop.** Repaint the six references in situ in that style; style-anchor scene reference; unfreeze steps and seed; one sweep; then the painter-to-finisher pass. Two to four days. This sets the quality bar and proves the architecture.
3. **iPhone probe.** Half a day. Decides tier sizing.
4. **Fix the shipped-defect class now.** The eight integration defects, the inert CSS block, the pending-notice drain, the Charters opener, the checkpoint refusal, the four unit tests holding the lock, the untracked plan files. One to two days, all small.
5. **Artwork durability.** Persistent-storage request and status, add-to-home-screen prompt on iOS, PNG export via the share sheet, protected originals in any eviction, labelled regeneration on loss (Part I5a). One to two days.
6. **Prune and split.** Study assets and WAVs out of the pack; dead modules deleted; query-lane sentences out of release notes; bulky evidence out of git history; PR42 split into production UI, gated AI, research tools. Admit the production tier on its exact head.
7. **Tier 1 finisher on the real phone.** Two to three days. Then the tier policy, quality setting, crossfade, precomputed embeddings, warm sessions, start-on-orbit.
8. **Compendium through the finisher; battle staging; living-painting layer effects; one listening session.** These are the pillars becoming visible.
9. **View-envelope sharing.** After originals retention is stable.

Everything in this program transfers to the engine: the style canon, the recipes, the tier policy, the painted assets, the identity contracts and the fixtures that prove parity.

### J6. Merge stance, final

Unchanged: no merge of the accumulated head as one unit. Split it, admit the production-facing tier on its exact head under one authorized hosted attempt, keep the AI tier quarantined behind its flag until tier 0 plus finisher replaces the scene-generator path.


---

## Part K. Consolidated registers (all eleven passes)

Every item was read in source by at least one pass; items marked P were reasoned but not traced end to end. File references are in the openai/mac working tree.

### K1. Defect register

| # | Area | Defect | Where | Fix |
|---|---|---|---|---|
| 1 | AI game | View from Notifications performs a real landing and starts a new GPU job when the snapshot digest differs | `main.ts:8772-8781`, `:8830` | View never lands; show the notice and let the player land |
| 2 | AI game | Stop model preparation rethrows AbortError, producing an error toast, a fault record and a persisted "Painting unavailable" notice | `local-ai-game.ts:318-346` | Treat abort as a non-error status like the install path does |
| 3 | AI game | Originals store caches a rejected open promise forever; `versionchange` closes it permanently | `ai-landfall-originals.ts:121-148` | Reset `opening` on rejection; reopen after versionchange |
| 4 | AI game | Full survey-card and notifications rebuild per progress event (about 6,700 per install); focus lost on AI buttons | `notification-history.ts:64-80`, `local-model-delivery.ts:8` | Throttle refresh to one rAF; preserve `[data-ai-act]` focus |
| 5 | AI game | Job canceled after retention commits is marked canceled yet auto-mounts on the next landing | `ai-landfall-jobs.ts:149-151`, `main.ts:6181,8764` | Treat post-commit abort as ready, or never auto-mount canceled |
| 6 | AI game | Untrusted clicks on AI controls are swallowed, so the DOM reachability suite cannot exercise them | `main.ts:8783-8797` | Honour synthetic clicks under the smoke tier |
| 7 | AI game | Every Survey card click is deferred one microtask by an awaited async guard ahead of Close and Leave | `main.ts:~8862` | Synchronous `closest('[data-ai-act]')` check; await only on the AI branch |
| 8 | AI game | Retry leaves the old failed row with its own Retry visible | `ai-landfall-jobs.ts:55` | Replace the failed row on retry |
| 9 | AI game | `pagehide {once:true}` stops tracking after one bfcache round trip; running jobs never aborted on pagehide | `local-ai-game.ts:352` | Persistent listener; abort or checkpoint the job |
| 10 | AI game | Inspect silently drops if the scene serial moves during the storage read | `local-ai-game.ts:282` | Surface a "try again" notice |
| 11 | Delivery | Corrupt ready install lands in phase `invalid` with no UI recovery; only `restart:true` escapes and the game never passes it | `local-model-delivery.ts:236-277`, `local-ai-game.ts:553` | Offer a restart action from `invalid` |
| 12 | Delivery | Probe checks `getDirectory` but not `createWritable`; never requests `persist()` | `local-model-delivery.ts:320-322` | Probe both; request persistence for tier 1 and above |
| 13 | Delivery | Variant readiness keyed on parent attempt id, not content hash; reinstall discards correct derived data | `local-model-variant-storage.ts:290` | Key on parent content hash |
| 14 | Delivery | Model Blobs consumed for minutes with no lock; safe only while nothing deletes attempts | `local-model-delivery.ts:284-295` | Hold a shared lock for the job lifetime, or delete the variant layer |
| 15 | Delivery | Service worker materializes every cached response to count retained bytes | `pwa-build.ts` install handler | Use `Content-Length` or `blob().size` |
| 16 | Pipeline | Fixed-shape path throws for more than two references, so it cannot be used with the V2 recipe | `denoiser-shapes.mjs:21` | Remove the option or extend it |
| 17 | Pipeline | References resampled in-browser (engine-dependent pixels) while the recipe hashes only the source PNG | `local-ai-runtime.ts:167-174` | Pre-fit offline; hash the fitted bytes |
| 18 | Pipeline | Recipe key is `JSON.stringify` of an object literal; any field reorder orphans retained originals | `local-ai-game.ts:222-246` | Canonical key ordering |
| 19 | Shell UI | Desktop panel-anchor block overridden by equal-specificity sheet rules later in the sheet; only `#toast{right}` survives; same for notification panel `top`/`max-height` | `ui-shell-style.ts:98-100`, `NOTIFICATION_HISTORY_CSS:144` | Delete the dead declarations; add a computed-style test |
| 20 | Shell UI | Notices deferred during a product action are drained only inside `persistView`, which product actions do not call; rows stay "Awaiting checkpoint" with no Mark read | `notification-history.ts:86-91,130-131`, `main.ts:9873` | Flush when the product action settles |
| 21 | Shell UI | Charters opener hidden whenever any card or panel is open, on every breakpoint | `ui-shell-style.ts:29`, `main.ts:4256` | Keep an opener reachable, or auto-close on open |
| 22 | Shell UI | Checkpoint projection refuses the whole checkpoint on one malformed notification row; import rewrites `t:0` to now while append clamps to 0 | `checkpoint-state.ts:192-206`, `import-v2.ts:750-753` | Drop the overlay instead of refusing; align the clamp |
| 23 | Shell UI | Live save mutated outside a product or checkpoint authority; `mayRecord` lacks the `activePersist` guard | `main.ts:4325-4335` | Add the guard; document the overlay invariant |
| 24 | Shell UI | `--ui` removed from `:root`, defined only when `main.ts` evaluates: serif flash during boot | `index.html`, `ui-presentation-tokens.ts:49` | Restore the token in the inline root style |
| 25 | Combat | Frontier Resolve admitted by matching the ability description text and exact numbers; any copy edit re-breaks the Chronicle | `combat-cues.ts:216-227` | Match on identity; emit theme from the source |
| 26 | Graphics | Binary and trinary companions use different corona gradients | `main.ts:5605-5615` | Align to the legacy 3-stop |
| 27 | Graphics | Timer-only 12 s deadlines admit late results under timer throttling; only the painted-vista loader has the monotonic check | `earth-layered-load.ts:65-108`, `planet-surface-turn-view.ts:126-169` | Port the monotonic boundary; add a stubbed-clock test |
| 28 | Graphics | Turn worker's real error reason discarded as "invalid atlas response" | `planet-surface-turn-view.ts:132-137` | Accept the error message type |
| 29 | Audio | `AbortSignal.throwIfAborted` is Safari 16.4+; older iOS silently reports pilot audio unavailable | `pilot-sound-player.ts:21,23` | Explicit `aborted` check with a diagnostic |
| 30 | Audio | Decoded audio held twice per play; about 37 MB resident after one Listen | `pilot-pcm.ts:100-106` | Cache the `AudioBuffer`; drop planar copies |
| 31 | Audio | Main-thread PCM decode via per-sample `getInt16` on 2.3 M samples | `pilot-pcm.ts:66-70` | `Int16Array` view |
| 32 | Instruments | Pilot review asserts the pre-U1 dock and fails unconditionally; nothing runs it | `audiovisual-pilot-review.mjs:196-230` | Update or delete |
| 33 | Instruments | Four unit-test files take the exclusive checkout lock under parallel `node --test`: the "duplicate checkout lock" aggregate failure | `runtime-pack.test.mjs:15`, `mobile-pack-package.test.mjs:14`, `frozen-preview-client.test.mjs:14`, `species-references.test.mjs:24` | Tests do not take the checkout lock |
| 34 | Instruments | Stale-lock recovery can steal a live lock between `openSync('wx')` and the owner write | `workspacelock.mjs:55-78` | Temp file plus rename; age-gate unreadable owners |
| 35 | Instruments | Ten load-bearing files untracked, including the pinned variant plan read at preview-server start | `tools/local-image-generation/browser-variant-plan.json` and nine siblings | Commit together; add a tracked-files boot test |
| 36 | Instruments | Glass phone-dock gate `<=700` while the product compact rule is `<=700 or (<=900 and landscape)`; the 844×390 dock is never audited; sentinel narrowed the same way | `glassmatrix.mjs:~11036,~15944` | Share the predicate |
| 37 | Instruments | Contrast subject silently dropped when dock-utility markup drifts; structural guard runs only at phone-landscape/codex | `glassmatrix.mjs:~718-730` | Fail closed with a finding |
| 38 | Instruments | `readU1PhoneShell(training)` restores with `removeProperty`, leaving the empty style carrier the process laws forbid | `ui-shell-review.mjs:23-96` | Exact attribute restoration with receipt |
| 39 | Instruments | Five browser-owning tools run without holding the workspace lock for their lifetime | `ui-shell-review.mjs`, `ui-review-navigation-selftest.mjs`, `audiovisual-pilot-review.mjs`, `run-browser-proof.mjs`, `probe-webgpu.mjs` | Acquire the lock |
| 40 | Instruments | Throwing inside the CDP event callback on evidence overflow converts the session to a terminal error, losing the failure screenshot | `run-game-integration.mjs:88`, `run-landfall-viewer.mjs:79` | `fatal ??=` pattern |
| 41 | Instruments | 600 s total observer bound versus 900 s in the offline twin | `run-game-integration.mjs:198`, `offline-landfall-proof.mjs:76` | One documented bound |
| 42 | Pack | About 11 MB of query-gated study assets, including two 4.6 MB WAVs, precached on every install | `pwa-build.ts:589`, `pilot-assets.ts:3-45` | Exclude `assets/pilot/**` and all WAV |
| 43 | Release | Release notes advertise developer-only query lanes | `release-content.ts:223-228,237` | Move to DEVIATIONS or ROADMAP |
| 44 | Repo | Tracked audit evidence 79 MB to 766 MB; CI clones full history | `audits/`, `.github/workflows/test.yml:76` | LFS or release assets for bulky evidence; shallow checkout |
| 45 | Repo | Pause inventory stale for four docs edited after sealing | `audits/AI_PORTABLE_CLOSURE_20260909/pause-inventory.json` | Reseal at the next checkpoint |
| 46 | Docs | About ten stale claims: 233,094-byte asset set with a nonexistent atmosphere layer; 256 MiB limit "not enforced" in three docs; `landfall-fidelity.ts` "V1-only"; EL/EP controls in the wrong file; legacy CFB codec location; bulletin count 79/77/81 versus 83; source-contract dimensions and test counts; UI-parity gate commands at wrong paths; audio-native-mix README versus AUDIO.md | see Part G | Correct in the same batch as the code |
| 47 | Policy | AGENTS.md authorizes automatic tool installs at session start; toolchain check makes undisclosed network calls | `AGENTS.md` diff, `development-toolchain.mjs:143-146` | Nick decides; disclose the calls |
| P1 | AI game | Full-PNG pure-JS SHA-256 on the main thread per find/read, up to four candidates | `ai-landfall-originals.ts:102`, `local-ai-game.ts:224-250` | `crypto.subtle.digest`; one lookup |
| P2 | Shell UI | `releaseSurfaceVistaOwner` now throws; unwrapped callers would surface on scene change | `main.ts:~5990` | Verify callers |
| P3 | Graphics | App-global uniform group shared by overlapping turn views | `planet-surface-turn-view.ts:54-65` | Per-instance uniforms |
| P4 | Tools | Blender audit depends on 4.4+ action API without a version check | `audit_canid.py:67-72` | Pin and fail explicitly |

### K2. Optimization register

| # | Gain | Where | What |
|---|---|---|---|
| 1 | Largest per-landing win | `local-ai-runtime.ts:102,178-189` | Keep denoiser and VAE sessions warm across landings; one encoder session for all references; warm up on system entry |
| 2 | 12.5 s and a third of the download | text stage | Precompute text embeddings offline from the finite prompt catalogue; ship as data; no text encoder on device |
| 3 | Quadratic attention cost, plus exact counts | recipe | Per-organism passes then a low-strength integrate pass instead of one 5,904-token pass |
| 4 | Perceived wait to near zero | `main.ts` landing flow | Start the environment pass on orbit arrival; organism passes after the landing commits; painter shown instantly; crossfade |
| 5 | GPU contention | Pixi ticker | Throttle the render loop while a job draws |
| 6 | 336 MiB storage, five hash passes, three modules | `local-model-variant*.ts` | Expand the 87 MB of parent ranges in the worker at load; hand ORT in-memory external data |
| 7 | 1 to 2 minutes per session on phones | `local-model-delivery.ts:152,205,258` | Persist a verified record; hash in a worker; `estimate()` per 64 MiB; hash once on resume |
| 8 | Main-thread stalls | `ai-landfall-originals.ts:102` | `crypto.subtle` hashing; single identity lookup |
| 9 | Thousands of rebuilds | `notification-history.ts`, `main.ts:4325` | rAF-throttled refresh; memoized badge |
| 10 | Per-scroll relayout | `sheet-layout.ts:44-146,173-179` | Observe headers and class/style only; batch reads before writes; no mid-measure token writes |
| 11 | 9 MB pack, determinism | references | Pre-fit to 480×320 offline; ship about 150 KB |
| 12 | Boot cost | `main.ts:200-209` | Dynamic-import the painted and layered study modules; delete `scene-image-cache-plan.ts`, the `civet-rig.ts` deformer, the livingvista quartet, `run-offline-runtime.mjs` CLI, the stale pilot review |
| 13 | Audio memory and jank | `pilot-pcm.ts` | Cache `AudioBuffer`; `Int16Array` decode; Opus or AAC instead of WAV |
| 14 | Install time | `pwa-build.ts` | Count retained bytes without materializing |
| 15 | Quality experiment | model | Q4 transformer; never below four steps |
| 16 | CI minutes and clone time | repo | Bulky evidence out of history; shallow checkout |
| 17 | About 600 lines | `tools/local-image-generation/run-*.mjs` | Shared runner kit |
