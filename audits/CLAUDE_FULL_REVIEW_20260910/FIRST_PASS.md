# Claude review — art direction, local-AI landfalls and accumulated openai/mac work

Date: 2026-09-10. Reviewer: Claude (Anthropic, macOS worktree `anthropic/mac` at c860f57f).

## What was reviewed and how

- `origin/develop` is still c1791e21, already merged into `anthropic/mac`. Nothing to sync.
- Reviewed in place, read-only: the Codex worktree `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, signed HEAD f6eed9b4 (124 commits ahead of develop) plus its uncommitted working copy. No file in either worktree was edited; no tests, builds, browsers, model runs, fetches or GitHub writes.
- Read: PAUSED_CHECKPOINT, ROADMAP, the five September 9 packet handoffs, MIDGAME_ART_DIRECTION README/REVIEW/TIME_AND_SHARING, DIRECTION_DECISION, LOCAL_AI_GENERATION, the ART_DIRECTION diff, my own September 9 CLI review and Codex's disposition of it.
- Viewed at native resolution: approved Living Worlds triptych (02), approved Earth full landfall (03), the six-reference local output, the desert and fungal local outputs, the six reference PNGs, and the in-game "viewed landfall" screenshot.
- Code: four parallel read-only reviews (game integration; model delivery and storage; conditioning and inference math; gameplay, graphics, audio and UI). I spot-checked the highest-weight findings in source myself. Findings marked CONFIRMED were read end to end; PLAUSIBLE were not.

## Verdict in one paragraph

The engineering is disciplined and the direction is right, but the work of the last two days has been spent almost entirely on the perimeter of the problem: delivery, storage, transactions, contracts, packs and diagnostics. The two things that decide whether this direction succeeds, painted finish and per-subject fidelity, have moved very little, and one avoidable choice is actively pulling the output away from the target: the reference images are flat studio specimen plates and the model faithfully reproduces that finish. Fix the inputs before spending more on the plumbing. Separately, the phone question has to be answered with one real device measurement before any more storage engineering, because if a 6.2 GiB model cannot be loaded on the target iPhone, most of the delivery layer is a dead end on the primary platform.

---

## 1. Art direction: why the output does not look like the target, and what to change

### 1a. The reference finish leaks into the painting (CONFIRMED by inspection)

Compare the three local outputs side by side:

| Run | Conditioning | Finish of result |
|---|---|---|
| Fungal test | one full-scene reference at the target painted finish (04) | closest to the target: textured moss, wet stone, real atmospheric depth |
| Six-reference Earth | six studio specimen plates on a flat `#72786e` matte | flat storybook illustration, clean contours, centered specimen tree, exposed persimmon roots on a rock island |
| Desert test | text only | smooth, toy-like, most stylized |

The persimmon reference shows the tree on a gray backdrop with exposed roots; the output put the tree center-frame on a bare rock with exposed roots. The frog reference is glossy and emphatic; the output frog is oversized and glossy. This is the model doing exactly what it was shown. Whole-image references condition style and presentation, not just anatomy. Six of them, all in specimen-plate style, dominate a 452-token prompt.

Recommendation, in order of leverage:

1. **Repaint the six references in the target finish and in situ.** Each organism on damp riverbank ground under overcast light, with fur and leaf brushwork matching the approved Earth panel, no matte, no exposed roots, no studio floor shadow. Generate them with the same image tool that produced 02/03 so the finish is inherited. Keep the diagnostic anatomy explicit (bill, calyx, prickles, runners) but stop presenting them as plates.
2. **Add one style anchor reference**: a crop of the approved Earth panel (03) with no organisms in it, or the fungal-style full scene, as image 1 "for composition, material detail and shared lighting", exactly as the fungal prompt did. That prompt phrasing is the one that produced the best finish.
3. **Rewrite the prompt budget.** The current prompt spends roughly 80% of its tokens on per-species anatomy and percentage anchors ("at 72% across, base 77% down, 15% wide") and one clause on finish, and that clause says "restrained detail", which argues against the target. The model demonstrably ignores the percentage anchors (civet went left, persimmon went center). Drop them, and spend the recovered tokens on the vocabulary from the 02/03 prompts that produced the approved images: tactile directional brushwork, weathered mossy rock, directional fur and leaves, strong calm value masses beneath selective detail, not flat cartoon, not oversharpened.
4. **Reference resolution.** References are downsampled to 480×320 (600 tokens). That discards the bill and calyx detail the diagnostics depend on. Test one run at 640×384 or 768×448 for the two or three subjects whose diagnostics keep failing (Platypus, Persimmon, Devil's Club) before concluding the model cannot draw them.

### 1b. The model's ceiling versus the target

Klein 4B at 4 steps at 1024×576 has a real finish ceiling below the approved 02/03 images, which came from a far larger model. The fungal result shows the ceiling is much higher than the six-reference output suggests, so the current gap is mostly inputs, not model. But the target itself should be set honestly: "matches the fungal-test finish with correct species" is achievable on this model; "matches 03 pixel for pixel" probably is not, and no amount of delivery work changes that. Nick should decide whether the fungal-test finish is acceptable as the shipped quality bar.

### 1c. Per-subject fidelity needs a different pipeline shape, not a better prompt (CONFIRMED)

The graph has no box, mask or count input; the code says so itself (`landfall-fidelity.ts:18-21`, `perInstanceSpatialControl:false`). Two prose-only attempts plus one six-reference attempt all fail count or anatomy. More prompt engineering will not fix this. The pipeline reviewer's recommended plan, which I endorse:

1. Unfreeze `steps`, `seed` and size as recipe fields (they are hard-coded literals in three owners: `local-ai-game.ts:211`, `landfall-fidelity.ts:124`, `stage-worker.mjs:22`) and run a 4/6/8-step × 3-seed sweep to get a baseline. This is one afternoon and has been recommended twice.
2. **Generate each organism separately** (about 512×320, one reference, prompt entirely about that species), then composite. Count becomes exact by construction, and single-subject anatomy is where a 4-step distilled model is strong. Attention cost is quadratic in tokens, so six small passes are cheaper than one 5,904-token pass.
3. **Integrate pass**: place subjects at the existing plan anchors over a background pass, then run a low-strength image-to-image pass (start at sigma 0.35 to 0.5) to unify light, contact shadows and vegetation overlap. The VAE encoder and the Euler loop already exist; this is a small change to `stage-worker.mjs`.
4. Optional latent masking during the integrate pass (restore latents outside subject boxes after each step) gives spatial lock with no graph change.
5. Use the deterministic species painter's output as the per-organism reference. That is what turns the current six-record template into an actual genome-to-conditioning compiler that works for any world.

What survives that change: `pipeline-math.mjs` in full, the stage-worker stages, reference verification and matte prep, the snapshot and `speciesVisualKey` identity, the placement anchors, and the fidelity byte-binding. What gets reworked: the two prompt templates, the single-pass six-reference recipe, and the byte-exact JSON gates as the only admission.

### 1d. "Compiler" is the wrong word for what exists (CONFIRMED)

`earth-layered-recipe.ts:65,74` admits only a byte-identical Earth request and roster. `landfall-conditioning.ts:145-158` refuses anything but temperate/rain/liquid. All anatomy prose is hand-authored per Earth name in `LANDFALL_NAMED_RULES_V1`; the genome contributes only an identity hash and pass-through anchors, and a test asserts genes are not turned into prose. The docs say "not universal coverage", which is honest; the name is not. Reaching a second world needs a Descriptors-to-prose adapter, biome/weather/time scene vocabulary, a seed-driven layout, painter-derived references, and brand-plus-fingerprint admission instead of byte-exact JSON. None exist yet.

### 1e. The rest of the game does not share the painted language (CONFIRMED)

Protostar is two baked radial gradients, the magnetar field is two vector ellipse strokes, the trinary companion is a gradient corona sprite, and the Earth turn samples `PlanetGen.surfaceColor` into an unlit atlas with GLSL hash noise. All are verbatim ports of the legacy Canvas renderer and are explicitly "not painted reference quality". A painted landfall now sits beneath a vector system view and a procedural globe. If natural-history painting is the direction for universal objects, these are throwaway and should not be extended further; decide the system-view and globe art language before adding more procedural work. Small consistency bug: binary and trinary companions use different corona gradients (`main.ts:5605-5615`).

### 1f. The rig question

There is no multi-family rig. The battle stage is whole-portrait translation on a div. The reusable pieces are `tools/creature-animation/kinematics.ts` (a clean, family-agnostic 2-bone IK and chain-wave solver) and the mesh-grid plus bone compose/inherit/skin-weight mechanism in `civet-articulated-rig.ts`; every landmark, weight and pose curve in it is Civet-specific and nothing selects by body plan or land/flying/aquatic family. Treat this as staging polish, not a down payment.

---

## 2. Delivery and the phone: a decision is owed before more storage work

### 2a. The uncommitted block32 variant storage layer should probably not exist (CONFIRMED)

The 347 MB derived file is a pure expansion of about 87 MB of parent ranges: `expandVariantOperandsV1` (`local-model-variant.ts:119-125`) repeats each scale/zero byte four times. It can be built inside the denoise worker in about a second and handed to ORT as in-memory external data, hashed against the pinned digest first. That deletes `local-model-variant-storage.ts`, the transaction half of `local-model-variant.ts`, two test files, the extra 336 MiB of player storage, the "Prepare / Verify / Stop" controls and the extra verify pass, with the same integrity guarantee. Current implementation reads the derived data back three times and hashes it five times. And if block32 shows no measured speedup on the target device, delete it entirely.

### 2b. Full-model passes are far more numerous than they need to be (CONFIRMED)

| Scenario | Parent 6.23 GiB passes |
|---|---|
| Fresh install | network + write + readback hash, plus 6,381 `storage.estimate()` calls |
| Resume at X GiB | the persisted prefix is hashed twice (`scan` then `downloadFile`) |
| Every new session | one full read plus pure-JS SHA-256 on the main thread before any Land can queue (1 to 2 minutes of frozen tab on a phone) |
| Every Land | about 7.4 GB re-read by ORT from blob URLs; a fresh Worker per stage; the VAE encoder session is built six times per painting |

The normal-game 600 s timeout is best explained by this plus GPU contention with the Pixi render loop, not by OOM: the portable model is about 3.5× slower than block32, and the six-reference run that succeeded used block32 on a desktop. Fixes: persist a per-attempt verified record and only re-hash on load failure or explicit request; hash in a worker with sync access handles; one VAE encoder session for all references; keep the denoise session alive across Lands; throttle the Pixi ticker while a job is drawing.

### 2c. Recovery and probing holes (CONFIRMED)

- A single flipped bit in a ready install lands in phase `invalid` with the ready marker intact; both Download and Verify take the same path, and only `install({restart:true})` escapes, which the game never calls. Unrecoverable from the UI.
- The capability probe checks `storage.getDirectory` but not `createWritable`, and never calls `navigator.storage.persist()`. Safari's ITP evicts script-writable storage after 7 days for a plain tab; the home-screen PWA is exempt.
- Variant readiness is keyed on the parent attempt id rather than the parent content hash, so a restart reinstall discards correct derived data.
- Model Blobs are consumed for minutes with no lock; safe only because nothing deletes attempts yet. The day cache eviction lands, in-flight reads throw mid-denoise.

### 2d. The phone question (PLAUSIBLE, needs one measurement)

ORT Web loads each external-data file into a JS/WASM buffer before GPU upload. The transformer shard set is 4.13 GB and the text encoder 2.19 GB. iOS Safari's per-process memory ceiling and Apple-GPU `maxBufferSize` defaults make that structurally out of reach for this model, independent of how well it is downloaded. Codex correctly noted my earlier "10 to 100× smaller" figure was an estimate; the way to settle it is one probe run on the actual target iPhone that reports `maxBufferSize`, `shader-f16`, and memory at transformer load. That single run should gate all further delivery work. If it fails, the phone lane needs a smaller model or generation elsewhere, and Nick decides which stated constraint yields.

---

## 3. Game integration defects (all CONFIRMED)

1. **"View landfall" from Notifications can perform a real landing and silently start a new GPU job.** `viewLocalAiOriginal` (`main.ts:8772`) calls `landWithPilotPresentation(true)` when the snapshot digest differs, and every committed landing calls `queueCurrentAiLandfall()` (`main.ts:8830`). A view control has become a Land action with a multi-minute side effect. Make View navigation-free: show the notice and let the player land.
2. **"Stop model preparation" produces an error toast, a fault record and a persisted "Painting unavailable" notification**, because the variant path throws `AbortError` while the install path returns `{ready:false,error:'canceled'}`. The test pins the rejection, i.e. the code path, not the outcome. Unify abort semantics (or delete the variant layer per 2a).
3. **IndexedDB originals store poisons itself for the page lifetime after one transient open failure.** `ai-landfall-originals.ts:121-148` caches the `opening` promise and never resets it on rejection; `onversionchange` sets `closed` permanently. Every later job fails at "Retaining original" with a Retry that cannot succeed. Reset on failure and add a negative-control test.
4. **Panel refill on every progress event.** `notification-history.ts:64-80` restores focus only for read buttons; delivery fires `onStatus` per 1 MiB chunk, so roughly 6,700 full rebuilds of the survey card and notifications panel during one install, each stealing focus from Cancel/Pause. Throttle to one rAF and preserve `[data-ai-act]` focus.
5. **Cancel during retention yields a "canceled" job whose painting auto-mounts on the next landing**, with no notification and no View step; a test asserts this. It contradicts the explicit-View model everywhere else.
6. **Untrusted clicks on `[data-ai-act]` are swallowed** (`main.ts:8783-8797`), so the `simrun dom` reachability tier cannot exercise Cancel/View/Inspect/Retry at all. A wired-to-nothing button here passes reachability by construction, which is the exact PROCESS_LAWS failure mode.
7. Full-PNG pure-JS SHA-256 on the main thread on every find/read (up to four candidate identities per landing) when `crypto.subtle.digest` is already used elsewhere. `pagehide {once:true}` stops tracking after one bfcache round-trip, and running paint jobs are never aborted on pagehide.

Well built, do not re-litigate: jobs never touch the save; ready is published only after commit plus re-read verification; publication re-checks world key, environment, epoch, snapshot digest and vista generation; Blob URLs revoked in `finally`; the viewer isolates background roots and restores exact attributes; the old sprite stays until the successor validates; no delete API on originals.

---

## 4. Non-AI gameplay, graphics, audio and UI

- **Determinism clean; save shape intact** (CONFIRMED). No random or clock source reaches generation or share codes; `save.notifications` existed already and the checkpoint overlay validates it with bounds.
- **Study assets ship in the installed PWA pack** (CONFIRMED). `pwa-build.ts:589` inventories every bundle output, so two 4.6 MB uncompressed WAVs, other pilot WAVs, pilot and painted webps and the Inter font (about 11 MB of query-gated study payload) are fetched and hashed on every phone install. The new 128 MiB pack assertion accommodates this instead of pruning. Never ship WAV; exclude study assets from the inventory.
- **Release notes advertise developer-only query lanes as player features** (CONFIRMED). `release-content.ts:223-228, 237` describe `?avpilot`, `?planetturn`, `?planetmaterial`, `?paintedvista`, `?livingvista`, `?paintedlanding` and `?localai` behaviour in `V2_DRAFT_RELEASE`. None is reachable from the default build. Move them to DEVIATIONS or ROADMAP.
- **`sheet-layout.ts` is a layout-thrash engine** (CONFIRMED): about 15 `getComputedStyle` and 12 `getBoundingClientRect` per sync with a mid-measure `--hint-h` write, scheduled by ResizeObservers on about 12 elements and subtree/characterData MutationObservers on every panel, toast and topbar. rAF-coalesced, but Compendium row churn or a toast fade forces layout every frame on the "phone runs hot" mandate.
- **Frontier Resolve fixed by string-matching copy** (`combat-cues.ts:216-227` matches the ability description text and exact numbers). Any copy or balance edit silently re-breaks the player Chronicle. Match on identity instead.
- Static imports of `painted-*`, `earth-layered-*` and `earth-resident-plan` (with two multi-KB JSON literals) sit in the main chunk for paths only query strings use; pilot and planet-turn are correctly dynamic. Dead hidden markup (`#shelfnotifications`, `#railinventory`, `#railrecords`, `#trail`) is still built and badged.

---

## 5. Process observations

- **The batch is too large to admit as one unit.** 331 files, 54,000 insertions, 254 new audit directories, 122 changed test files, and an uncommitted tail whose "last edits have NOT even had a syntax check". PR42 has been parked since 9bfec7dc; nothing after it has a changed-head Compendium/Slice/Glass admission. Recommend splitting into (a) production-facing UI/graphics/audio, (b) the query-gated AI integration in the game, (c) `tools/local-image-generation` research, and merging (a) first under one authorized hosted attempt.
- **Ceremony is crowding out progress.** The fidelity contract is a schema validator over human-typed verdicts: `allPass` is satisfied by six "pass" strings and any non-empty evidence text; the observer evidence hash is verified against nothing; placement records no coordinates. Its one real property (reviews bound to exact image/recipe hashes so they cannot be laundered) is worth keeping. Make it useful by requiring observed bounding boxes per instance, which makes count and placement machine-checkable against the plan anchors. Likewise the negative prompt is generated, hashed and never consumed; `steps/seed/size` are byte-gated in three places so the sweep recommended twice cannot even be run under contract.
- **Cross-browser determinism hole in references.** Reference bytes are resampled to 480×320 by the browser's own resampler (`local-ai-runtime.ts:167-174`), so the latents fed to the encoder depend on the engine, while the recipe hashes only the source PNG. Pre-fit the references offline to 480×320 (or the chosen size), ship those bytes (about 100 to 200 KB total instead of 9 MB of 1536×1024 PNGs in the runtime pack), and hash them. One change fixes payload, determinism and one test gap.
- The handoff documents are excellent at preserving evidence and terrible at stating priorities; every packet lists the same twenty open items with equal weight. The next ROADMAP handoff should name the three things that matter.

---

## 6. Recommended next batch, in priority order

1. One real-iPhone probe run (`maxBufferSize`, `shader-f16`, memory at transformer load). Gate all delivery work on it.
2. Repaint the six references in the target finish in situ, add a style-anchor scene reference, rewrite the prompt budget away from anchors and toward finish vocabulary, pre-fit references offline. Then one run.
3. Unfreeze steps/seed/size; run the 4/6/8-step × 3-seed sweep.
4. Prototype per-organism generation plus low-strength integrate pass with the existing stage worker.
5. Fix the seven integration defects in section 3; they are all small.
6. Replace OPFS variant storage with in-worker expansion, or drop block32 if the device probe shows no gain.
7. Prune study assets and WAVs from the pack; move query-lane sentences out of release notes; split PR42.

Merge stance: no merge of the accumulated head as one unit. The production-facing tier is merge-eligible in principle once split out and admitted on its exact head; the AI tier stays quarantined research behind `?localai=1` and should be described as such in the PR body.

Nothing above was verified by execution. No tests, builds, browsers, model runs, fetches or GitHub writes occurred, and no file in either worktree was changed.
