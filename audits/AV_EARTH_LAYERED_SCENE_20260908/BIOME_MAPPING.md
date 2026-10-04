# Earth layered scene: biome mapping and named-art source review

Matches local candidate source as of 2026-09-08. This records source findings and the
bounded correction; it does not claim tests/native visual checks have run. Root owns
that shared-lock chain and its retained failures. No jobs were run by the mapping agent.

## Canonical mapping authority and preserved discrepancy

- `port/v2/packages/domain/biome-profile/src/index.ts:21–27,144`: exact profile
  vocabulary and temperate fauna `[mammal,bird,insect,amphibian]`, flora
  `[tree,shrub,flower,grass,fern]`. This presentation authority has schema
  `cf.domain.biome-profile.v1`, digest `bpd1-6fce883d4d70e3b6bde0fb184b416e8e`.
- `port/v2/apps/game/src/world-roster.ts:172–175,446–478,571–607`: one canonical
  profile selected alongside the complete deterministic roster. Earth classifier
  returns null (`domain/strays/src/strays.verbatim.js:110–111`); terran fallback is
  temperate. The scene therefore does not select a new landing biome.
- `domain/ecology/src/ecology.verbatim.js:14–91` generates the seeded full roster;
  `domain/descriptors/src/apphooks.verbatim.js:25–32` overlays Earth names within
  kingdom by seeded index and duplicate probe, without biome filtering. The
  world-roster facade preserves that content and full ordered source genomes.
- `BIOME_ATLAS.md` §1.1 records the dead legacy `wbRoll.fauna` read from
  `BIOME_SETS`, which has no fauna member. `port/v2/DEVIATIONS.md:3720–3724` D-9e
  remains open and decision-gated. `WORLD_GENERATION.md:11–22` confirms current
  presentation profiles did not repair generation or change creature selection.
  Root corrected the older conflicting ART_DIRECTION landing-roll claim in this batch.
- A bounded search of current docs/source/reference filenames did not find a single
  `BIO_MAP` owner. The profile catalog, source roster/name overlay, and named art
  owners are distinct authorities; none should be presented as one implemented
  universal creature-to-biome database.

## Selected residents and source-owned families

All six already occur in the captured full19-row Earth epoch-0 roster. The cosmetic
preview is not authoritative; the Platypus is outside the captured preview. Exact
captured world: `CF1|g:999@90,-60|s:424242@560,170|p:133#2`, environment
`cwe1:148:50c1b7d6`, full roster fingerprint `cwr1:19:6305:58e079f2`.
The complete request and full-authority roster JSON are additionally compared; the
weak fingerprint alone cannot admit a changed world/genome/order/epoch.

| Resident | Family | Existing named source owner |
| --- | --- | --- |
| Civet | mammal | `art/src/mammaloverrides.ts:95`: exact `mammalDPlan:'Civet'`, family mustelid, hue `#a8996f`, spotted coat, banded tail; `quadrupedoverrides.ts:2094–2180,2781,2806` selects the audited whole viverrid form. |
| Platypus | mammal | `art/src/speciesoverrides.ts:1448` CANON route to `faunaMonotreme`; `faunaoverrides5.ts:1605–1618,1664–1726` describes egg-laying mammals, brown anchored pelt, paddle tail, bill and webbed feet. |
| Frog | amphibian | `art/src/faunaoverrides2.ts:1579–1598,3410` uses `amphFrog` and `#4c9a3f`; old named resolver independently classifies amphibian at `hdportrait.worker.verbatim.js:440`. |
| Persimmon | tree | `art/src/florarost.ts:165`: tree, broad leaves, crown fruit, foliage `#2f5f30`, fruit `#e07a22`; same table wrapper selects current tree recheck/reset owner. |
| Devil's Club | shrub | `art/src/floraoverrides.ts:377–381,444` explicitly identifies the shrub, drawing thick spiny canes, huge palmate leaves and red berry cone. |
| Cranberry | shrub | `art/src/florarost.ts:271`: shrub, creeping cranberry habit, foliage `#3f5841`, berries `#a8232c`; current table wrapper owns its botanical recheck. |

Paths in this table are relative to `port/v2/packages/`. Every selected family occurs
in the canonical temperate profile. `earth-resident-plan.ts` stores these explicit
annotations beside the unchanged full genomes. `earthResidentFamiliesFitBiomeProfileV1`
in the app recipe checks every named annotation against its exact identity and the
profile's matching fauna/flora list. It rejects missing families, cross-kingdom lists,
wrong-but-otherwise-allowed annotations and duplicated/missing names. The app performs
this gate after complete canonical binding. No global classification map was invented.

This supports a curated rainy riverbank scene with selected mammals/amphibian and
woody flora. It does **not** prove real-world geographic coexistence. Raw genome
habitat/loco labels are inappropriate evidence for named Earth habitat: `habOf/locoOf`
(`domain/speciestraits/src/speciestraits.verbatim.js:185–186`) simply index random
pools. The captured Platypus has habitat9/loco1 (volcanic ashfields/burrowers), Civet
habitat5/loco6 (subterranean caverns/ambush predators), Frog habitat17/loco11
(mangrove tangles/drifters). Those bytes remain untouched and do not drive this static
scene's species anatomy or pretend to implement species movement.

## Renderer correction: current named bodies, not obsolete bare recipes

The first proposed adapter reused old `hdBeastBare`/`hdFloraBare`. Source inspection
found that this would lose already-authored Earth work:

1. `domain/strays/src/strays.verbatim.js:188,204` calls `_earthArt` without a local
   definition/import and catches the reference error. Its request-side `hdGenesFor`
   retains raw plan/palette plus `_earthName`. This existing domain/request behavior
   is unchanged; its complete captured request remains the exact admission binding.
2. The art worker's local `hdGenesFor` does have `_earthArt`, but its Civet/Platypus
   old keyword routes still omit later species-specific color/morphology corrections.
3. Bare `_earthFlora` knows Persimmon/tree and Cranberry/shrub, but Devil's Club
   falls through to herb. Later dedicated audited flora owns the correct shrub.

Root authorized replacing the new adapter with the **current** named body owners.
`earth-resident-layer.ts:29` dispatches the same six routes as `resolveOverrideCanvas`,
using complete original genomes and the shared `speciesGenomePalette` input owner.
Only that existing private palette function receives a hand-owned export alias;
no algorithm, generated painter/lifter, domain, roster or saved genome is changed.
Named palette/spec/body owners decide colors; no blanket riverbank tint is applied.

The adapter excludes Compendium vignette, floor fade, fit framing and global polish.
Each current body paints into the existing 440-coordinate, 880×880 transparent ink
layout with +220 origin. A bounded scan crops alpha>12 (the Compendium visible-ink
floor) and uses the lowest alpha>=230 body row as static contact, excluding the six
painters' translucent ground shadows. Blank, shadow-only or boundary-clipped ink
rejects the whole layer; no residents silently disappear. Crop width maps to the
plan's normalized relative width. Flip applies only to Platypus. Contact scaling is
uniform; no body parts or palettes are independently transformed.

This alpha contact is a static sprite-ground assumption, **not** a terrain collider,
locomotion system or metre scale. Native review must inspect actual silhouettes,
transparent outskirts, no opaque rectangles, edge clearance and foot/root contact.
Soft shadows remain below the solid contact. Broad leaves, roots and the faintest
antialias pixels may extend around that contact; future motion needs its own contract.
Each temporary ink canvas shrinks after stamp (also on failure); only one is live at a
time. Raw peak canvas storage is output960×430×4 + scratch880×880×4 = 4,748,800 bytes,
plus one temporary readback array of 3,097,600 bytes and browser/driver overhead. Final
transferred resident RGBA layer remains 1,651,200 bytes. No scratch/canonical portrait
is cached by the adapter; no opaque background belongs in the resident layer.

## Focused test contract and limits

- Recipe tests exercise live canonical builder plus full captured authority, changes
  outside preview, preview-only changes, wrong worlds/epochs/full roster/order, getter
  and serialization hooks. Separate semantic compatibility tests accept a reduced
  profile and reject four missing-family controls, wrong allowed family, cross-kingdom
  lists, duplicates and getters. They do not rely only on exact JSON equality.
- Renderer tests compare actual named body command traces (including Path2D commands)
  against the independent current `resolveOverrideCanvas` Compendium route's ink
  layer for all six. Explicit Civet route/palette/markings and Frog, Devil's Club,
  Platypus color/anatomy markers catch stale bare routing. Full source genome stays
  unchanged; changed family/genome/placement and hostile input reject preallocation.
- Synthetic alpha fixtures independently prove cropping/contact below/above shadow,
  empty/weak/edge rejection, deterministic transforms and scratch/output retirement.
  They are deliberately not real pixels. Root's native worker/canvas proof must
  supply actual rendering and human-visible compositing evidence before acceptance.

Tests are written in `port/v2/tests/earth-layered-recipe.test.ts` and
`port/v2/packages/art/test/earth-resident-layer.test.ts`; execution status belongs to
root's final batch receipt. No scheduled prompt, browser, build, deploy or hosted action
was started by this mapping task.


## Preserved guard rejection and bounded parser correction

Root's frozen chain passed 308 focused tests across 20 files, three TypeScript
programs, art-unused and art-audit. `overridecheck` then exited2 at the new adapter's
`QUAD2_SPEC.Civet` read: it permitted route-table consumers only inside canonical
`hasNamedRoute`/`resolveOverrideCanvas`. The chain stopped before spec/root/native.
That rejection is retained; the runtime product and 96-file native build are unchanged.

The guard successor explicitly recognizes one extra **bounded consumer**, without
altering global catalog, table-value or routing-precedence accounting. It requires
exact `paintNamedResident` body SHA256
`9a99a692ba30750eb2a2340b2b8078f804d7844b084d1f38c90d137adc33d75d`, one top-level
definition, the seven unchanged direct import owners and no local reassignment of
those imports. Only the four actual route-table member AST nodes inside that sealed
function receive permission. All other reads, aliases, escaped imports, mutation and
namespace rules remain active. No painter/source alias was introduced to evade the
sentinel. Deliberate future consumer changes require body/source review and resealing;
this hash does not replace current Compendium-owner equality or native-pixel evidence.

`overridecheck.control.mjs` retains every prior mutant and adds EL0–EL13: unchanged
acceptance; changed Civet member, Platypus painter, Frog species argument, Devil's Club
table, missing Persimmon case, lost source genome, extra internal read, wrong import
owner, aliased import, extra external read, missing/nested duplicate helper, and restored
acceptance. Every mutation uses the existing exact-write/current-source guard and safe
restore owner. Controls were written but not run by this agent; root owns their one
fresh execution and subsequent nominal chain. Guard files alone changed in this correction.

The optional Earth resident worker is 957,316 bytes in the existing native build.
Reusing the current named owners pulls their graph into this lazily requested worker;
this is a recorded download/parse cost, not a completed bundle optimization. No painter
refactor, dependency split or art-quality/animation expansion belongs to this batch.


## Preserved first controls failure and descriptor-guard successor

The first guard-control execution remains **FAIL: 102 failed / 21 passed**. New
dispatcher mutation checks rejected their intended faults, but nominal/restored paths
reached `earth-resident-plan.ts` and rejected `Object.prototype` under the existing
restricted Object-member rule. None of those nominal/restored controls was green;
root stopped before subsequent nominal/spec/root/native stages. No product correction
or source reseal is attributed to this failed instrument run.

Review of both new art modules and the palette-export delta against every guard branch
found four unsupported members, all inside `snapshotEarthLayerDataV1`:
`Object.prototype` (identity comparison), `Object.setPrototypeOf([], null)` (fresh detached
array), `Object.create(null)` (fresh record), and `Object.defineProperty(snapshot,key,...)`
(copying guarded data descriptors into that fresh output). These are deliberate input
hardening, not route-table alias acquisition. Existing direct Object queries already
meet the old rule; no other new runtime Object permission was needed.

The successor seals the one top-level exported snapshot declaration with SHA256
`62bfacb4c5bdda7fbb8f8609f7eaa7d78e9cb4c82dc0134dad25d01ef1a6ba63`, then admits only those
four member AST identities (exactly one per name). Global Object-method permissions,
prototype/alias rejection elsewhere and every existing mutant remain unchanged. The
runtime helper was not modified. Its full descriptor/prototype/data-budget behavior,
including getter rejection, remains covered by the earlier focused tests.

New EP0–EP10 controls cover unchanged acceptance; inverted prototype admission;
setPrototypeOf or defineProperty targeting the original input; a non-null output
prototype; getter-triggering value reads; missing/duplicate helper; external mutation
or prototype alias; and restored acceptance. Both new Earth control writers now assert
current source, create a sibling temporary with `wx`, recheck the target, then rename;
the same path restores their owned originals. Older control writers remain unchanged.
These successor controls are written, **not executed by this agent**. Root owns the
next fresh guard chain and its actual outcome.
