# C13 — the build-generated master-pin generator and the pre-decode preflight (Claude, 2026-09-25)

Implements Claude's C4 proposal (`audits/C4_PIN_PROPOSAL_20260925/README.md`) with every amendment in Codex's review
(`audits/ART_BATTLE_FOCUS_20260925/master-pin-review-01/README.md`). **Masters stay shipped.** No binding, budget, S2 receipt or old
measurement changed. The shipped `public/battle2/` output and `battle2-assets.json` are byte-identical before and after (the builder was
re-run and git showed no change).

## What landed

| File | Role |
|---|---|
| `port/v2/tools/morph/battle2-pin-contract.mjs` (+ `.d.mts`) | The ONE shared contract: schema `cf-battle2-master-pins/v1`, the hash convention, `canonicalRepoPath`, `pinRecordSha256`, `pngHeaderSize` (IHDR only, no decode). Imported by both the generator and the runtime. |
| `port/v2/tools/morph/battle2-master-pins.mjs` (+ `.d.mts`) | The generator. Per archetype: `admitFamilyRecord` (the existing full byte admission of the retained master against the keyed alpha), then the binding hash/record linkage and the atlas hash, then a frozen pin. Refuses duplicates, malformed hashes/dimensions, extra/missing fields, non-canonical paths and an empty table. Owns `alphaOnlyPng` (moved from `build-shipped-battle2.mjs`, so the pinned alpha bytes ARE the served ones). |
| `port/v2/tools/morph/build-shipped-battle2.mjs` | Two-line call site: `writeBattle2MasterPins(CARD_ARCHETYPES)` after the shipped output. |
| `port/v2/apps/game/src/battle2-master-pins.generated.ts` | Checked-in generated module. Exports ONLY `BATTLE2_MASTER_PINS_SCHEMA`, `getBattle2MasterPin(creatureId)` and `isBattle2MasterPin(value)`. Authority = a private `WeakSet` of the exact frozen entries; a private `Map` for lookup. No exported table, registration or factory. 17 pins today. |
| `port/v2/apps/game/src/battle2-master-pin-admission.ts` | `preflightBattle2PinnedBytesV1` + `Battle2PinRefusal` (named codes) + `gunzipTransportBytes`. |
| `port/v2/apps/game/src/battle2-wiring.ts` | The parts-fit path now: manifest → pin lookup (`missing-pin` refusal, never a master fallback) → raw alpha/binding/atlas BYTES → preflight → only then master fetch, exact alpha decode (`decodePng`), marking masks, morph-cache lease, loader. The binding is parsed from the very bytes that were hashed. |

Pin fields (unchanged from the proposal): `creatureId, masterPath, masterSha256, masterWidth, masterHeight, recordPath, recordSha256, recipeHash,
alphaPath, alphaSha256, alphaWidth, alphaHeight, bindingSha256, atlasPath, atlasSha256, admittedBy:'byte-admission@build'`. Paths are
canonical repo-relative POSIX in the arena's served namespace (`public/battle2/<path>`; `alpha.png` and `binding.json.gz` exist only there).

Hash convention: record = SHA-256 of UTF-8 `stableJSON(full record incl. recipeHash)`, no newline; binding = exact DECOMPRESSED `binding.json`
bytes (never the `.gz`, never a reserialisation); master/alpha/atlas = exact PNG bytes.

## Preflight check order (runtime)

1. `isBattle2MasterPin(pin)` by private identity, before any pin field is read or any byte hashed (`untrusted-pin-authority`); the pin must
   name this creature (`pin-creature-mismatch`).
2. Record stableJSON hash and recipe hash (`record-mismatch`).
3. Record cut-out hash = pin master hash; canonical `repoRelativeSource(record.source)` = pin master path; geometry = pin master size
   (`master-mismatch`). Defence in depth: any change to the record already fails 2.
4. Requested alpha/atlas paths canonical and equal (`path-mismatch`); alpha exact-bytes hash and IHDR size = pin = master (`alpha-mismatch`).
5. Decompressed binding bytes hash (`binding-mismatch`); atlas exact-bytes hash (`atlas-mismatch`); then parse the hashed binding bytes,
   binding→record linkage, atlas IHDR = `binding.atlasSize`.

The loader's unchanged full admission (`loadCreatureRigV1`) still follows.

## Controls (all outcome tests, both directions)

- `apps/game/src/battle2-master-pins.test.ts` (9): drift (regenerated twice = checked-in module, byte for byte); every fighting archetype's
  SERVED bytes admit; a tampered retained master refuses at build (`cut-out hash`) and a tampered atlas too (`atlas hash`), while a genuine copy
  in a temp root pins identically; duplicate id / malformed hash / zero size / extra field / wrong `admittedBy` / nine non-canonical path
  spellings refuse and a valid table passes; `canonicalRepoPath` accepts one spelling only; the module's export list is exactly the three
  names; the pin is frozen (mutation throws); spread, JSON, `structuredClone`, `Object.create`, frozen-spread look-alikes are not pins; every
  preflight refusal code above, with the genuine control admitted BEFORE and AFTER the negatives; a clone pin refuses with ZERO record reads
  (counting proxy); the `.gz` transport and a JSON reserialisation of the binding both refuse.
- `apps/game/src/battle2-wiring.test.ts` (+3): through the real study with the Civet's served bytes: a tampered atlas refuses
  `atlas-mismatch` with no master fetch, no alpha image decode, no marking-mask fetch and no morph-cache lease; an unknown creature refuses
  `missing-pin` with zero byte fetches; the genuine bytes pass and fetch the master only after the atlas.
- `mutation-controls.mjs` (this folder): nine source mutants, each must turn its suite red: identity check removed, alpha hash removed, binding
  hash removed, a mutable map exported, structural authority, dot segments allowed, master fetched before the preflight, missing pin not
  refused, alpha decoded before the preflight. **All nine killed; restored sources green.**

## For Codex (the narrow pin overload is yours)

- The generated authority is `port/v2/apps/game/src/battle2-master-pins.generated.ts`; a representative genuine pin is `getBattle2MasterPin('civet')`
  (master `a5e62568…a76b`, record `c89cec5b…9527`, recipe `d092bfcc…2a7f`, binding `65ff9709…4178`).
- Your overload should take the pin object and call `isBattle2MasterPin` first; `preflightBattle2PinnedBytesV1` already returns the admitted
  pin and the binding parsed from hashed bytes, so the overload can share the unchanged private admission tail and skip only the master-byte
  hash (never through a public boolean).
- Still required before masters leave the package (C4 §5): your overload's controls, then the cold / controlled-worker / offline
  `masterFetches === 0` picker checks and a measured before/after of the shipped bytes (~13 MiB is still an estimate).

## Not done / open

- The root `tsc --noEmit` program reports 184 errors on this head AND on the parent `anthropic/mac` head before this change: Codex's merged
  `motion/grounded-bird.ts` and `motion/contact-envelope.ts` pull `creature-rig.ts` (pixi.js / `@webgpu/types`) into the strict root program.
  Pre-existing, not introduced here; the app program (`-p apps/game/tsconfig.json`) is clean.
