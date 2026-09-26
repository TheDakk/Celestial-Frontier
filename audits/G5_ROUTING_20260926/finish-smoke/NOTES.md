# G5 finisher in a real browser behind `?finish=1` (2026-09-26)

This is the first real-browser run of the in-game finisher. The creature is Crab-drawn (the core `Crab` painting, 880x880 master).

**Setup:**
- **Browser:** Edge 154.0.4258.37, headless, over CDP (`openChromiumCdp`, the default launch flags; WebGPU works without extra flags). Viewport was desktop 1280x800@1 with no touch.
- **Adapter:** Apple metal-3, shader-f16, not a fallback adapter. `probeLocalModelCapabilitiesV1().supported` = true, so the route tier is `desktop`.
- **Server:** `tools/local-image-generation/game-preview-server.mjs` (`createGamePreviewServer`, in-process) over the verified model cache (6.77 GB), behind a loopback front proxy owned by the smoke that logs every request.
- **Source:** the tested files are unchanged between 0c208c4c and cb5430ba (HEAD at run time).

## Headline

**(A) does NOT pass on the code as shipped.** Three real defects stop it before any pixel is finished. Bug 1 stops the preview server from starting at all. Bugs 2 and 3 each independently stop a finish, and bug 4 stops retention.

With the smoke working around all four (a process-local shim, one served file, and two in-flight rewrites of the served Vite output; no file on disk is modified), the whole chain passes end to end:

- portrait open → enqueue
- the local model runs
- one finished original is retained in IndexedDB
- the reopened portrait differs
- 0 page errors

**(B), the negative control, passes.**

## Files
- `finish-smoke.mjs`: the smoke. Usage and phase definitions are in its header.
- `resolve.test.ts`: a helper that picks the genome with the real `paintedArtV2`. It writes `crab-genome.json`: a procedural `crust:crab`, seed 7000, which the core `Crab` painting draws in both the card registry and the fit registry. The seeded save is the veteran_rich fixture plus this genome, named "Finish Smoke Crab".
- `run-02/`: **the final run, 4 phases, status PASS.** It contains `report.json`, the portrait JPEGs per phase (`*-portrait-first.jpg`, `*-portrait-reopen.jpg`, about 7 KB each), and `patched-retained-original-440.jpg` (the retained 880² original, downscaled).
- `run-01/`: the first run, 3 phases, before the `patched` phase existed. Its `finish` phase (720 s, nothing happened) is what led to bugs 3 and 4.

Re-run from the repo root (browser-owning, so it needs out-of-sandbox execution; about 6 min):
```
node audits/G5_ROUTING_20260926/finish-smoke/finish-smoke.mjs audits/G5_ROUTING_20260926/finish-smoke/run-NN [--phases=control,shipped,finish,patched]
```

## Results (run-02)

| Phase | What it serves | Retained | Finish worker | Portrait first → reopen (sha256) | Page errors |
|---|---|---|---|---|---|
| control (no flag) | as shipped | 0 (the store DB was never even created) | none | 244c677f… → 244c677f… (0 px changed) | 0 |
| shipped (`?finish=1`) | as shipped | 0 | never constructed | 244c677f… → 244c677f… | 0 |
| finish (`?finish=1`) | + `creature-finish-math.mjs` served | 0 | never constructed | 244c677f… → 244c677f… | 0 |
| **patched** (`?finish=1`) | + the 2 rewrites below | **1** | ran, `complete` | 244c677f… → **0765a7b8…** | **0** |

**(B) control, PASS:**
- 0 originals retained;
- 0 finish-worker events;
- 0 model-file requests;
- 0 finish-source requests;
- the portrait was byte-identical on reopen (pixel diff 0 of 193,600);
- 0 page errors.

The game's boot always reads `/__local_ai/runtime.json` (for local-ai-game), with or without the flag, so the control is judged on the finisher's own traffic.

**(A) patched, PASS:**
- The portrait open posted a `creature-finish-v1` job **569 ms** after the click.
- The worker completed. Its own `elapsedMs` was 22,873 ms. From job post to `complete` took **22.5 s**, including the full model fetch from a cold profile.
- One original was retained in `cf-ai-creature-originals-v1`:
  - PNG, 880x880, 34,620 B;
  - sha256 `2b131d1d…3db88679`;
  - key `35c3efc1…6682f72`;
  - receipt schema `cf.creature-finish-engine/v1`.
- Close and reopen of the portrait redrew it (no reload needed). The portrait sha went from `244c677f…` to `0765a7b8…`: 13,160 of 193,600 portrait pixels changed (6.80 %), with max channel delta 122 and mean |delta| 0.25 per channel.
- 0 page errors.
- **The finish is deterministic.** An earlier independent patched run in a fresh profile gave the same finished portrait sha `0765a7b8…`.

**Timings (patched, cold profile, loopback):**

| Step | Time |
|---|---|
| Model bytes | 6,773,398,741 B in 219 requests; 18.3 s from first request to last byte (3.3 s → 21.6 s after navigation) |
| Session creation | encode 0.45 s, text 1.9 s, denoise 5.1 s, decode 0.27 s |
| Inference | encode 1.87 s, text 1.10 s, denoise 7.63 s (1 step, 3,025 image tokens, 96 text tokens), decode 3.84 s |
| Whole phase | 33.8 s |

**Visual:** at a glance the finish is almost invisible. Compare `patched-portrait-first.jpg` with `patched-portrait-reopen.jpg`. The worker reports `editablePixels: 5128`, which is 0.66 % of the 880² master (the mask keeps only label interiors 4 px from any edge, and strength is 0.35). This is a quality/design observation for Nick's G5 review, not a wiring defect.

## Bugs found (not fixed; source untouched)

1. **The preview server cannot start in this repo.**
   - `tools/local-image-generation/kit-tracked-inputs.mjs:9`: `execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'})` has no `maxBuffer`.
   - `git ls-files -z` here is 3,005,156 B (42,181 files), which is over Node's 1 MiB default. So `createFrozenGameViteServer` → `assertTrackedKitSources` throws `Error: spawnSync git ENOBUFS`, and `node tools/local-image-generation/game-preview-server.mjs --port=…` exits.
   - The smoke raises `maxBuffer` for that one git call inside its own process.
   - Separately, the CLI also requires `--reference-identity=<string>`, or it refuses with "Invalid game preview options".
2. **The worker's import graph is not served.**
   - `kit-stage-worker.mjs:4` and `kit-worker-engine.mjs:1` import `./creature-finish-math.mjs`, but `GET /__local_ai/creature-finish-math.mjs` returns **404** (checked with curl).
   - It is not in the server's `HELPERS` (`game-preview-server.mjs:20`), it does not match the `/__local_ai/kit-[a-z-]+.mjs` pass-through (`:181`), and it is not in the Vite plugin's `names` list (`port/v2/apps/game/kit-runtime-assets.ts:8`, which is also what a built package emits).
   - In a browser the module worker fails to load (an error event, then `finish worker failed`, then the engine falls back with nothing retained). This was seen in a diagnostic page run.
   - In the game this is currently masked by bug 3, which refuses first.
3. **The engine refuses every real creature before inference (the decisive one).**
   - `creature-finish-route.ts:64` sets `individualId: o.visualKey`, and `creature-finish-app.ts:111` makes `visualKey = speciesVisualKey(g)`. That is the canonical JSON of the whole genome: **700 chars** for this saved genome.
   - `creature-finish-engine.ts:38` `validateShape` requires `individualId.length <= 512`, so `request` returns `{status:'fallback', reason:'Error: individual identity'}`. That is measured on the real source in the browser.
   - `enqueue` discards the reason and returns `'fallback'`. No worker is constructed and no model byte is fetched.
   - The unit tests pass because their stand-in genomes give shorter keys.
   - Fix direction: a bounded individual id, e.g. `sha(visualKey)`. That is what the `patched` phase uses: `individualId: sha(new TextEncoder().encode(o.visualKey))`. `visualKey` (cap 2048) stays as is.
4. **The adapter rejects the worker's result.**
   - `creature-finish-app.ts:66` accepts `data.rgba` only as `Uint8Array` or `ArrayBuffer`.
   - The worker returns a **`Uint8ClampedArray`**: `cropCreatureFinishCanvas` and `conserveCreaturePixels` in `creature-finish-math.mjs:72` and `:24`. So `out = null`, the adapter rejects with "finish adapter: result contract", the engine falls back, and **nothing is retained after a successful 23 s inference**. That was observed in the first patched run (only bug 3 patched): worker `complete`, store empty.
   - The adapter test's worker double posts a `Uint8Array`, so it cannot see this.
   - The `patched` phase adds `data.rgba instanceof Uint8ClampedArray ? new Uint8Array(data.rgba.buffer, data.rgba.byteOffset, data.rgba.byteLength)`.

The smoke applies these workarounds only in the phases that name them, and `report.json` records each one (`shims`, `identityRewrites`, `finishModuleRequests` with per-module rewrite counts).

## Not proven
- **The shipped code path end to end.** That needs fixes 1–4 in source, then a re-run with `--phases=control,finish` and no patches.
- **The battle2 stage under `?finish=1`** (`stageFinishV1`) was not exercised. Only the Compendium portrait was.
- **Persistence across sessions:** a reload over the stored original was not needed (the reopen redrew), so it was not tested.
- **Other tiers and sources:** the phone tier, delivered originals, and 1254² masters were not tested (out of scope).
- **Hardware:** only one creature and one machine (Apple GPU, headless Edge).
- **Quality:** the finished image's quality is not judged here. See the visual note above.
- **ORT warnings:** ORT logged `VerifyEachNodeIsAssignedToAnEp` warnings (the console `error` channel, but they are warnings). They are not page errors and did not affect the result.
