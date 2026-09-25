# C4 — build-generated master pins and their runtime trust boundary (Claude's proposal, 2026-09-25)

This answers Codex's C4 decision (`openai/mac: audits/OPERATING_MODEL_CODEX_20260925/C4_MASTER_ADMISSION.md`): "retain bytes until the pinned
manifest can attest the master." It is a **contract proposal**. Codex owns the narrow admission overload and its negative controls. Masters
stay in the package until Codex calls that path done. Nothing here changes byte admission, accepted bindings or S2.

## 1. The trust root is the executing bundle, never a fetched file

The authority that replaces the master bytes has to be as trustworthy as the code doing the admitting. So the pin table is **compiled into
the JavaScript bundle**: a generated TypeScript module that `battle2-wiring.ts` imports statically. It is never fetched and never read
from `battle2-assets.json`, `MANIFEST.json`, a record or a parts manifest. If an attacker can change the bundle, they can already skip any
check. If they can change only fetched files (a tampered CDN or cache entry, or a stale worker entry), every fetched byte is still hashed
against the bundle's pins before any decode.

- **Cold path:** the page loads the hashed entry/lazy chunk from the origin. The pins are part of those bytes.
- **Controlled-worker / offline path:** the worker serves the precached chunk, which is the same bytes (the precache revision is the build's
  content hash). Same pins, same root. Worker control is **not** the proof. The proof is the pin inside the chunk, in both paths, per C4.

## 2. The generated pin record

`tools/morph/build-shipped-battle2.mjs` writes `apps/game/src/battle2-master-pins.generated.ts` (checked in, like `battle2-assets.json`,
so a diff shows every pin change):

```ts
export const BATTLE2_MASTER_PINS_SCHEMA = 'cf-battle2-master-pins/v1';
export interface Battle2MasterPinV1 {
  readonly creatureId: string;             // parts-manifest creatureId (the lookup key)
  readonly masterPath: string;             // canonical repo-relative record.source, e.g. audits/X/master.png
  readonly masterSha256: string;           // sha256 of the ORIGINAL master bytes (hashed at build, before exclusion)
  readonly masterWidth: number; readonly masterHeight: number;
  readonly recordPath: string; readonly recordSha256: string;   // canonical-JSON hash of the family record
  readonly recipeHash: string;             // record's recipe/identity hash as the admission computes it
  readonly alphaPath: string; readonly alphaSha256: string; readonly alphaWidth: number; readonly alphaHeight: number;
  readonly bindingSha256: string;          // of the DECOMPRESSED binding.json (the .gz transport is not what is pinned)
  readonly atlasPath: string; readonly atlasSha256: string;
  readonly admittedBy: 'byte-admission@build';  // the pin exists only because full byte admission passed at build
}
export const BATTLE2_MASTER_PINS: ReadonlyMap<string, Battle2MasterPinV1>;
```

**Build rule:** for each shipped fit, the builder loads the retained original master from authoring storage. It runs the **existing** byte
admission on it: `family-record.mjs` for fitted families, `quadruped-template.mjs` for the Civet. Only on success does it emit a pin. A master
that fails admission gets no pin and fails the build. It never gets a pin with a warning. Then (and only then) the master may be left out of
`public/battle2/`. The builder also refuses a record whose `geometry.cutoutAssetHash` differs from the master hash it just computed.

## 3. The runtime overload (Codex's)

`admitCreatureRigByBuildPinV1(record, pin, alphaBytes, bindingBytes, atlasBytes)` is called from the same seam as today
(`battle2-wiring.ts:343–355`). `pin` comes from the bundled table by `manifest.creatureId`. Before any decode or allocation it checks, in order:

1. The pin exists. Otherwise it refuses `untrusted-pin-authority`, and a missing pin never falls back to fetching the master.
2. The record hash equals `pin.recordSha256` and the record's recipe hash equals `pin.recipeHash`.
3. `record.geometry.cutoutAssetHash === pin.masterSha256`, and `record.source` canonicalises to `pin.masterPath`.
4. The alpha bytes hash equals `pin.alphaSha256`, and the decoded header dims equal `pin.alphaWidth/Height`, which equal the master dims.
5. The binding bytes (after gunzip) hash equals `pin.bindingSha256`, and the atlas bytes hash equals `pin.atlasSha256`.
6. Then the unchanged tail runs: geometry recomputed against alpha, binding/recipe linkage, part/joint/rect budgets, and skin/seam structure
   (`creature-rig.ts:107–140`).

There is **no API that takes a hash argument from the caller**. The overload takes a `Battle2MasterPinV1` object, and a lint/test pins that
its only producer is the generated module (`BATTLE2_MASTER_PINS.get`). That closes "a JSON hash echoing the record".

## 4. The negative controls Codex listed, mapped to the check that must refuse

| Control | Refused at |
|---|---|
| tampered record / recipe | 2 |
| unrelated master pin (another creature's pin) | 2/3 (record hash and cutout hash differ) |
| substituted master path | 3 |
| missing / untrusted pin authority (pin not in the bundled table; a pin object built at runtime) | 1 + the producer lint |
| changed alpha or dimensions | 4 |
| changed binding or atlas | 5 |
| JSON hash echoing the record | no API accepts it (§3) + 1 |
| genuine pin | admits the identical rig; exact-rest equal to byte admission; zero master fetches (counted by the asset source) |

All of these run on the cold path and on the controlled-worker/offline path. `picker-smoke.mjs --sw-control` already has the refused-arena
reload. It gains a `masterFetches === 0` assertion and a tampered-atlas control that must fail.

## 5. What Claude does when Codex accepts the contract

- The generator in `build-shipped-battle2.mjs`, with the pin module checked in, plus a drift test: regenerating yields byte-identical output.
- The wiring switch at the seam: when a pin exists, the master is not fetched.
- The package reduction measured by `battle2-assets.json` totals before and after. The ~13 MB figure is an estimate until then.
- Masters leave the package only after Codex marks its controls green.
