# G3: on-demand art delivery (2026-09-26)

This is Stage G3 of the Generated Creature Pipeline (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`; Nick, D22/D23). Painted archetype art is now delivered **on demand from the origin, outside the precached PWA pack**, so the library can grow to hundreds or thousands of creatures without touching the 128 MiB cap.

## Design

**Tiers** (`tools/morph/art-library-tiers.mjs`)
- **CORE** ships in the pack, as before. It is one painting per body family (every `TEMPLATE_PAINTING` stand-in) plus the jelly's: Civet, Crab, Salmon, Eagle, Beetle, Python, Tree Frog, Chimpanzee, Starfish, Tarantula, Octopus, Fruit Bat, Centipede and Jellyfish. A fresh offline install therefore still draws and fights every creature painted.
- **LIBRARY** is everything else (today 24 archetypes). Its files are served from `library/`:
  - arena files at `library/battle2/audits/…`, in the same relative layout;
  - card files at `library/cards/<key>/…`.

**Trust chain**
- The bundle carries ONE generated pin (`apps/game/src/art-library.generated.ts`) of the manifest `library/art-library.json`.
- The manifest lists every library file's exact byte count and SHA-256.
- `apps/game/src/art-library.ts` verifies the manifest against the pin. It then verifies each file before returning any byte, so no decode, morph-cache lease or Pixi allocation ever sees unverified art.
- Refusals are named: `manifest-unavailable`, `manifest-mismatch`, `manifest-invalid`, `not-in-library`, `http`, `size-mismatch`, `digest-mismatch`.

**One resolver (CARD = STAGE)**
- The stage's asset source (`devAssetSource.get`) routes a library path through the module.
- The card's assets (`shippedCardAssets`) do the same.
- Codex's C13 master pins and `loadPinnedCreatureRigV1` are **unchanged**. Pins are repo-path keyed, so the pinned preflight still checks alpha, binding and atlas after the library check.

**Fallback**
- Card: an unreachable or refused library painting draws as its body family's CORE painting. The card is labelled `libraryFallback` and is never cached, so the creature's own painting appears once the library is reachable.
- Stage: a failed library fit rebuilds with the family core record, with the reason in `skipped` (`coreStandInRecord`). Stand-ins are chosen only from records that actually loaded. A CORE fit's failure still fails the study, as before; this is never a silent substitute.

**Service worker** (`pwa-build.ts`)
- The worker carries the manifest pin (`ART_LIBRARY`) and routes `library/` BEFORE build selection:
  - verify, then cache (`cf-art-library-v1`, build-independent because the content is pinned);
  - LRU-bounded by `ART_LIBRARY_CACHE_BYTES` = 128 MiB;
  - on a quota failure, still serves the verified bytes, uncached;
  - serves offline;
  - never caches an unverified response;
  - 404 for unlisted paths, 403 for query or range variants.
- The build verifies the whole `public/library` inventory against the manifest (no unlisted file, every size and digest exact), checks that the bundled pin names that manifest, and re-verifies the copied output.
- Library bytes never enter the pack count (`shippedPackByteInputsV1`).

**Builders**
- `build-card-masters.mjs` splits card output by tier (`cardRootOf`) and generates `CARD_LIBRARY_FILES`. `build-shipped-battle2.mjs` splits arena output and writes a library-scoped provenance `MANIFEST.json`.
- `art-library-manifest.mjs` writes the manifest and its pin. Run order is unchanged: `node tools/morph/build-card-masters.mjs && node tools/morph/build-shipped-battle2.mjs`.

## Pack numbers (measured `npm run build -- --mode evidence`)

| | Before | After |
|---|---|---|
| Shipped pack total | 95,716,912 bytes (91.28 MiB) | 63,602,741 bytes (60.66 MiB) |
| Pinned battle2 (in pack) | 59.8 MiB | 36.5 MiB |
| Bundled card assets | 13 MiB | 5.2 MiB |
| On-demand library (outside the pack) | — | 521 files / 30.6 MiB arena + library cards (~32 MiB in the package) |

## Evidence

- **Unit/outcome tests:**
  - `apps/game/src/art-library.test.ts` (6): the trust chain; card fallback labelled, uncached and replaced when back online; a tampered master refused before decode; the stage source; the stage stand-in. Mutation controls: removing the digest check fails 3 tests, and caching the fallback fails 1.
  - `tests/pwa-offline.test.ts` "on-demand art library (G3)" (8): the worker verifies, caches and serves offline; tampered, oversized and truncated files are refused and uncached; a manifest mismatch; 404/403; LRU eviction; quota failure; and a mutation control (a worker without verification serves a tampered file).
  - `tests/pwa-art-library.test.ts` (3): library growth never changes the pack total, and moving bytes into battle2 does (control); the build refuses an unlisted, changed or missing file; the real library matches its manifest and bundled pin.
- **Real browser:** `picker-sw-01/`, on package `dev-preview-5a2ac12f6edb` (verify PASS), in Edge with the production service worker controlling the page.
  - Wolf vs Racer (both LIBRARY) and Ibex vs Civet play with painted rigs on both sides.
  - The worker fetched 37 library files on first use.
  - The offline reload refuses every `/battle2/` and `/library/` request at the server, and Wolf vs Racer still stages two painted rigs from the verified worker cache with zero server hits.
  - The cold control (an uncached pair) fails as required, and there are zero page errors.
  - `picker-smoke.mjs` now counts `libraryHits` and refuses `/library/` in its offline run.
- **Compendium card path, browser-smoked 2026-09-26** (`card-smoke/`; package `dev-preview-65800c42ede6`, the G4 head; Edge at 390×844@3 touch, with the service worker served and controlling the page).
  - **Seeded save:** the veteran fixture plus five procedural fauna chosen with the real resolver.
  - **Online:** 8 rows, 5 painted (a `data:image/png` thumb, where the procedural painter gives `blob:`). The server served the manifest once plus 6 card files each for Wolf, Cougar, Pike and Racer. 0 refusals and 0 page errors. The core Civet row fetched nothing.
  - **Offline library** (fresh profile; every `/library/` request is a 404 from the first):
    - 3 manifest refusals and 0 card files served;
    - still 5 painted rows and 0 page errors;
    - exactly the 4 library rows changed image (Cougar → Civet, Pike → Salmon on screen); the Civet row is byte-identical.
  - **Negative control** (`--control`, unmodified fixture): all five painted/library checks fail on it.
  - **Not covered:** the 440 detail portrait, offline reuse of worker-cached cards, a real iPhone, and the Earth-variant route in the browser. The `libraryFallback` label is proven by outcome only; it has no DOM attribute.

## What Codex's pins and loader must keep

- `getBattle2MasterPin` / `preflightBattle2PinnedBytesV1` / `loadPinnedCreatureRigV1` stay **repo-path keyed** (`audits/…`), independent of the serving location. The library changes only the URL a byte comes from, never its pin.
- The service worker's first-use `battle2/` route is unchanged. The library route is separate, runs before build selection, and uses the same `verifiedLazyBytes` digest reader.
- I5 inputs move: the service worker, the index, and the Compendium's card fetch path for library archetypes. The certificate epoch must run on an integrated head that includes this.

## Scaling notes

- The bundle and the worker each carry ONE pin, whatever the library size. The manifest grows by about 150 bytes per file, so ~15 files per archetype makes about 2 MB for 1,000 archetypes. At that scale, split the manifest per archetype, each pinned by a top-level index.
- `ART_LIBRARY_CACHE_BYTES` (128 MiB) bounds device storage for fetched art; the LRU keeps the most recently seen creatures.
