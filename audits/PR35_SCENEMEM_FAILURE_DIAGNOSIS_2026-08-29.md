# PR #35 SceneMemory failure diagnosis — 2026-08-29

## Boundary

- Draft PR: `openai/mac` → `develop`, base
  `7a9f4c1370dd84292388d718c38ff34214f6203b`.
- Consumed hosted run: `33278630671`, head
  `017fa6decbc41809188768ccdb98ab86ef1b9ebc`, 2026-08-29 22:27:19Z–22:35:18Z.
- The authorization job passed. Root validation, smoke, legacy checkpoint capture, ten-viewport
  layout, rarity, dead-code, tracked-input, the complete v2 browser-free/type/art/coverage battery,
  current producer authority, Edge installation, and SceneMemory controls all passed.
- The one-attempt SceneMemory product stage stopped on the phone profile with
  `Earth planetfall was rejected`. Its verifier then failed because the stopped report could not
  contain a complete terminal inventory. Compendium, Slice, Glass, personas, preview, and every
  later browser stage correctly did not run.
- The approval label is absent, the run is consumed, PR #35 remains Draft/unmerged, and no retry or
  replacement hosted attempt is authorized by this record.

This document records diagnosis and repair reasoning. It is not an immutable copy of the hosted
artifact and therefore does not invent raw/gzip carrier hashes.

## Root causes

### 1. Survey → Landing crossed only one of two persistence barriers

The one-call browser API can begin while the route into a system still owns an ordinary persistence
checkpoint. Survey then installs its own replacement product checkpoint. The prior implementation
invoked Survey first and waited only the barrier it could see afterward. Under the hosted ordering,
Landing reached Main while persistence was still active and correctly refused the mutation.

The permanent ordering is now explicit and retry-free:

1. capture and drain the current route barrier;
2. start Survey exactly once and retain its exact settlement promise;
3. if Survey cannot start, stop;
4. capture and drain Survey's replacement barrier;
5. require the retained Survey settlement to return true; a later durable false stops;
6. invoke Landing exactly once.

`survey-land-handoff.ts` owns only that choreography. Manually controlled promises prove each
barrier, initial and late refusal, and exactly-once call; omitted-barrier, ignored-late-false and
duplicate-action mutants fail.

### 2. Raw successor evidence disagreed with the persistence codec's same-commit canonical state

Once the route interleaving was removed, a veteran mining timestamp exposed a second systemic
boundary. Product derivation correctly returns raw gameplay state, while the compatibility writer
may apply deterministic save housekeeping using the commit's injected `codecNow`. Several action
wrappers compared their raw predicted whole state with the committed canonical state and could
misclassify a valid durable write as postcommit convergence.

The deterministic F4 product owner now detaches its content registry once, validates the injected
save clock once, and supplies derive callbacks with an owner-minted `canonicalizeState`. That helper
uses the exact same registry snapshot and checked clock as the eventual write. Actions still return
their raw domain derivation to the transaction; seals and expected-state comparisons retain the
codec-canonical prediction. Later-clock veteran controls cover the shared owner and each affected
action family, including the Arc 3 partial-state coordinator.

No wall clock, gameplay RNG, reward, save schema, migration meaning, or numeric ruler changed.

### 3. Exact-build PWA ownership stopped at the window and omitted its worker client

After Landing and canonical settlement were repaired, the real browser reached the biome vista but
reported:

`Failed to fetch dynamically imported module: .../assets/biome-vista-*.js`

The service worker selected the correct exact build for the module-worker entry request using the
initiating window's pin. It did not propagate that build to the fetch event's
`resultingClientId`. The worker's own dynamic import therefore arrived from an unpinned worker
client and the fail-closed PWA correctly returned 503.

Worker and shared-worker entry requests now require a valid `resultingClientId` and copy the
initiator's selected build pin to that child before returning the entry response. Live-build
retention enumerates all client types, not only windows, and confirms an apparently missing client
with `clients.get()` before deleting its pin. Tests prove active/prior isolation, worker-local lazy
imports, missing/invalid child identity, reserved-worker races, termination pruning, and
third-build refusal while a worker still owns the retained predecessor.

This is exact-build realm ownership, not an Edge point-version pin. Compatible Edge updates remain
provenance only and never trigger a rebaseline, recalibration, or threshold change.

### 4. SceneMemory's same-origin BFCache helper was inside product service-worker scope

After the worker-client repair, SceneMemory reached the BFCache phase. Its old same-origin
`/__scenemem_away__.html` navigation was legitimately handled by the product service worker as an
app navigation, so the instrument received the game index instead of its minimal away document.

SceneMemory now serves that one minimal document from a second ephemeral loopback origin, outside
the product service-worker scope. It uses a data favicon, returns 404 for every other path, remains
open through `Page.navigateToHistoryEntry`, and closes in `finally`. This isolates the instrument
fixture without weakening or bypassing the product PWA.

## Diagnostic and false-green hardening

- Landing and its bounded rejection state are captured in one browser task, including route,
  persistence authority, mutation witness, Landing outcome, and whether convergence was scheduled.
- Every biome-vista fault records a bounded `surfaceVistaLastError`; a positive fault count is a
  terminal SceneMemory failure with the exact cause instead of a generic 30-second timeout.
- Missing, malformed, negative, or internally inconsistent vista diagnostics are also terminal;
  absence cannot impersonate zero faults.
- Stale worker responses remain harmless stale drops. A current response with mismatched document
  token, generation, world, environment fingerprint, profile schema or profile digest authority is
  a fault, not a stale success; its scene and biome key are then checked separately before publish.
- The real product render envelope is validated before `postMessage` for Earth and the non-Earth
  gas, abyss, and reef compositor families.

## Local evidence boundary

Dirty diagnostic run `20260829233652913-23084-4b4362f86b` completed the full phone and desktop
SceneMemory mechanics through Earth Landing, biome worker/lazy import, Compendium, Shipyard,
ascent, BFCache return, and reload cleanup. It exited zero as **CALIBRATION ONLY** because the source
was intentionally dirty and no checked-in budget was supplied. That label is a source-authority
boundary, not a product failure or a browser certificate.

The final source-authority records, complete browser-free totals, signed commit, and clean
exact-budget SceneMemory run must be generated only after the repair code, tests, and current
references stop changing. Historical signed `3f69e88…` evidence remains truthful for its own
bytes and is never relabelled as evidence for this repair.
