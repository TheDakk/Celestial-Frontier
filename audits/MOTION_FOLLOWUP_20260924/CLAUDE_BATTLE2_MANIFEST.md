# Item4 — pinned first-use arena lane: builder contract for Claude

Please have `tools/morph/build-card-masters.mjs` generate **`port/v2/apps/game/battle2-assets.json`**, outside `public/`, from the same complete list used to ship `public/battle2/**`. No hand-maintained second list. This file does not hash itself or enter public/.

```json
{
  "schema": "cf-battle2-assets/v1",
  "files": [
    {"path": "battle2/keyed/wild-launch.png", "bytes": 123, "sha256": "<64 lowercase hex characters measured from final file bytes>"}
  ]
}
```

The example byte count/digest are placeholders, not measured production pins. Paths are relative to `public/`, begin `battle2/`, use safe ASCII path components, and have no leading slash, query, fragment, `.`/`..`, duplicate or symlink. Include **every regular file**, including SOURCE/record/binding/manifest JSON, atlas/keyed/mask/arena resources the builder ships. Sort by path; hash final encoded bytes after compression/copy. Emit the manifest after successfully writing its complete public output.

Implemented local build owner reads this file automatically. With no public/battle2 directory and no manifest, the existing shell build remains valid. If the directory exists without the manifest, or either public source or final dist has any missing/extra/different file, build fails. Entries become build-marker assets `{path: BASE + file.path, sha256, bytes, cache: "first-use"}`. All four fields are bound into the selected build identity. The external manifest is not a runtime discovery request.

Worker behavior: install verifies and caches only the eager shell. The complete marker still commits last. A retained document’s exact non-navigation, non-worker GET for a pinned arena path fetches full bytes with redirect refusal, validates size and SHA-256, then publishes to that selected build’s cache. Concurrent first uses share the request. Repeat/offline reads recheck cached bytes; corrupt data is removed and only an exactly pinned replacement can be accepted. A previous-build client never receives changed new-build bytes for the same path. Unpinned paths, range/query variants and missing client ownership are refused.

The **128 MiB total shipped-pack cap is unchanged and includes eager files + all declared lazy files + generated worker**. The arena does not silently escape that cap merely because install is lazy. Optional AI’s existing retained-payload accounting remains separate and unchanged. Leaner builder output may be needed if the combined pack exceeds the existing cap; measure it, do not raise the limit.

Local checks: 45 PWA/inventory outcomes pass, including an actual plugin-hook fixture, nested-base path, changed emitted bytes, offline reuse, digest bypass negative control, corrupt cached response, redirect/partial response, old/current build ownership and untouched default-shell controls. Three-project typecheck passes. The retained first test failure was only an outdated literal install-comment expectation, corrected to the new eager-shell completion meaning. This is not the missing production manifest or a controlled-browser proof of Claude’s actual integrated arena.

Claude next: generate real pins, integrate signed worker changes, build once, and run the built picker smoke **with the service worker controlling the page** (no `--no-sw` acceptance). Retain first-use fetch and subsequent offline/cache evidence. The new worker changes I5 producer authority: take the exact Edge certificate only after final clean committed integration; never rebind historical local I5 evidence to it. No push/label/hosted permission is implied.

One actual local evidence build completed successfully. The browser-free authority printer then exited2 because its exact current producer differs from the old budget; measurement authority still matches. Current local producer: `d607dde2899982371673b1d7b02f100f3a74e6eb8434cccf20bf71463a977032`; measurement: `6a829fb18eab4c171afaace0f49ad2a987cfcdc520d33dbc05337c379df85ee2`. Raw stdout (including build log) is pwa-local-authorities.json; parsed authority is pwa-authorities-parsed.json. No budget/test authority was hand-rebound and no certificate was consumed.
