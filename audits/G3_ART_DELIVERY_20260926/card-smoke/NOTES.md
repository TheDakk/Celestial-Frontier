# G3 Compendium card smoke: real browser (2026-09-26)

This smoke closes the "Not browser-smoked" item in `../README.md`: the Compendium card path over the art library, and its offline fallback. It ran against a built package in Edge 154 over CDP. The viewport was phone-class, 390x844 at DPR 3 with touch.

Package: `port/v2/apps/game/smoke/dev-preview-65800c42ede6-20260926052535`. It was built from source 65800c42 with `--allow-dirty`, so it is stamped LOCAL ONLY and publishable=false. The production service worker was served, and the page was controlled by the worker in both phases.

## Files
- `card-smoke.mjs` runs the smoke. Usage is in its header.
- `resolve.test.ts` is a helper, not a gate. It calls the real `paintedArtV2` over the card registry to choose the seeded genomes, then writes `seeded-genomes.json`, which the smoke reads.
- `run-local/report.json` plus two JPEGs hold the main run. `run-local/control/` holds the negative control.

## Seeding
The veteran_rich fixture's fauna resolve to no painting at all: `fixtureRows` in `seeded-genomes.json` are all null. So the smoke adds five procedural fauna genomes, derived from the fixture's first entry, to that fixture:

| Seed | Painting | Source | Core fallback |
|---|---|---|---|
| s5000 | Wolf | library | Civet |
| s5100 | Cougar | library | Civet |
| s5200 | Pike | library | Salmon |
| s5300 | Racer | library | Python |
| s5400 | Civet | core | (in-run control) |

The save is written as the raw stored blob into the game's own IndexedDB, at `cf-v2-slice` v2, store `meta`, key `save`. This happens on the same origin in a fresh profile before the game boots, and the game migrates it itself. The Compendium lists all 8 entries.

## DOM signal
The row thumbnail is `#codexpanel [data-sel="codex-entry"] img`.
- **Painted card:** the src is `data:image/png;base64,…`, which comes from `PaintedCardSource`.
- **Procedural painter:** the src is always a `blob:` URL (`defaultCreateThumbObjectUrl` in `species-art-loader.ts`).

The list is virtualised, so the smoke scrolls it top to bottom and waits at each stop until the thumbnails settle.

The DOM cannot say which painting drew a card. That is proven two ways:
- by the server log (library files served per archetype)
- offline, by the sha256 of each row's data URL compared with the online run

## Results (run-local, PASS)

**(A) Online: PASS.**
- 8 rows: 5 painted (the expected set) and 3 procedural (the fixture's creatures).
- The library served 25 requests: `art-library.json` once, then 6 files each for wolf, cougar, pike and racer (card.json, record.json, master-512, labels-512, markings.json, markings/banded.png).
- 0 requests were refused and there were 0 page errors.
- The Civet row fetched nothing from the library.

**(B) Offline library: PASS.** This phase used a fresh browser profile, and the server answered 404 to every `/library/` request from the first one.
- 3 requests were refused, all of them `/library/art-library.json`. The library admits nothing before its pinned manifest verifies, so no card file was ever requested and 0 were served.
- There were still 5 painted rows (all data PNGs) and 0 page errors.
- The pixels changed on exactly the 4 library rows (s5000–s5300). The core Civet row (s5400) is byte-identical to its online image.
- The offline Cougar row (s5100) is byte-identical to the Civet row, which shows it was drawn by the Civet painting.
- The screenshots show the same thing: `A-online-compendium.jpg` has a Cougar and a Pike, and `B-offline-library-compendium.jpg` shows a Civet and a Salmon on the same rows.

**Negative control (`--control`): PASS.** It seeds the unmodified fixture:
- 3 rows, 0 painted, 0 library requests, 0 page errors.
- All 5 of the real run's painted and library checks FAIL on it (5 of 5), so the smoke can see when painted library cards are absent.

## Not proven
- **Card-level `libraryFallback`:** the label is not exposed in a distributable build (no DOM attribute, and there is no `__CF_SLICE__` outside evidence builds). The fallback is proven by outcome: the manifest was refused, the cards are still painted, the pixels changed to the core painting's, and there were no errors.
- **Detail portrait (440):** it was not opened. Only the 132 list thumbnails were checked.
- **Offline reuse of library cards the worker cached earlier:** not tested here. Phase B deliberately starts with an empty cache. The picker smoke's `--sw-control` covers the stage side of that.
- **Hardware:** the run used a simulated phone viewport, not an iPhone.
- **Service worker:** it was served, not refused. `--no-sw` exists but was not run.
- **The seeded creatures:** they are the procedural-variant route. The Earth-variant route (for example Lion→Cougar) was not browser-run.
