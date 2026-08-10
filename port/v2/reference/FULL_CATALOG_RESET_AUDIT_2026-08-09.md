# Full Catalogue Reset Audit — opened 2026-08-09, current 2026-08-10

_Live authority for the restarted species-art review. Matches the current
OpenAI/Codex worktree as of 2026-08-10; update this file in the same batch as
the audit source, renderer, or acceptance ruler changes._

The clean full-reset baseline is commit
`bc26e800c7adca72805a832e753ace1a8f9837ba` on `openai/windows`. The current
accepted Wave 1 is committed and pushed as `d005090f`; the current worktree is
an uncommitted bounded Wave-2a family/continuity batch on top. PR #7 is
historical/already merged; no reset PR exists.

## Status: r1 frozen; Wave 1 pushed; Wave 2a 32/32 PASS and ready to commit

Nick stopped the GP7.1 remediation and explicitly reopened the entire catalogue
after Fruit Bat exposed a false acceptance: the current animal does not read as
a bat, although prior review material had allowed it through. GP7 and GP7.1 are
preserved as historical pixels and diagnostic evidence. Their bands are not
carried into this reset and none may be relabelled to manufacture completion.

The current render scope remains exactly 1,250 identities:

| set | identities |
|---|---:|
| Earth fauna | 631 |
| Earth flora | 332 |
| Earth fungi | 27 |
| Earth microbes | 20 |
| Procedural spread | 240 |
| **total** | **1,250** |

The reference tables contain 1,014 Earth route rows because four names have
separate identities in two kingdoms. Review joins therefore use **set + species
name**, never a bare name.

The clean r1 capture and complete fresh review are now frozen. The official
collector accepted all 1,250 rows and every required evidence surface as **516
PASS / 14 POLISH / 720 FAIL**:

| set | PASS | POLISH | FAIL |
|---|---:|---:|---:|
| Earth fauna | 151 | 6 | 474 |
| Earth flora | 125 | 0 | 207 |
| Earth fungi | 16 | 0 | 11 |
| Earth microbes | 12 | 2 | 6 |
| Procedural | 212 | 6 | 22 |
| **total** | **516** | **14** | **720** |

The frozen result is
`apps/game/smoke/full-reset-results-2026-08-10-r1/results.json`, sourced from
clean commit `bc26e8`. It records all rows fresh and all required evidence
reviewed, but `all_rows_literal_pass: false` and
`literal_certification_eligible: false`. This is the repair baseline, not a
certificate. There is no final all-PASS collection, image-inclusive ZIP, reset
pull request, release, or deployment.

## Wave 1: exact 177-target scope

Wave 1 selected exactly 177 r1 non-PASS identities and no catalogue-wide body
pass:

| bounded owner | targets | independent result |
|---|---:|---|
| root: 2 fungi + 8 microbes + 28 procedural | 38 | 38 PASS |
| fish (`faunaoverrides3.ts`) | 59 | 59 PASS |
| trees (`florarost.ts`, `floraoverrides2.ts`) | 48 | 48 PASS |
| fauna2 (`faunaoverrides2.ts`) | 32 | 32 PASS |
| **total** | **177** | **177 PASS** |

The five root-owner sources are `alientraits.ts`, `invertoverrides.ts`,
`proceduralfamilies.ts`, `proceduraloverrides.ts`, and `speciesoverrides.ts`.
Each owner wave was source-frozen and independently rejudged at 440/300/132
with named controls and repeat evidence. These 177 scoped PASS results must not
be added arithmetically to the frozen 516 and described as a new catalogue
score: changed hashes need a later full collector run, and the other 1,073 rows
have not received a post-Wave-1 verdict.

The 177 catalogue verdicts are closed. The complete Wave-1 gate set finished,
and the batch is committed/pushed as `d005090f`. Apple's independently accepted
continuity evidence and the pixel-neutral flora cleanup remain part of that
frozen checkpoint. These scoped results do not mutate the r1 ledger.

## Wave 2a: bounded family and Vanilla-continuity work

Wave 2a currently contains three catalogue batches totaling 32 r1 non-PASS
targets, plus the separate Vanilla hybrid-continuity repair:

| bounded batch | targets | independent status |
|---|---:|---|
| Mammal A | 4 | 4 PASS |
| INVERT worms + sessile | 13 | 13 PASS |
| S1–S3 fauna families | 15 | 15 PASS |
| **catalogue scope** | **32** | **32 PASS** |

Mammal A is Colugo, Sugar Glider, Fur Seal and Sea Lion. All four independently
pass at 440/300/132, repeats are exact, and all 71 protected controls remain
exact. Evidence is
`apps/game/smoke/wave2-mammal-a-evidence-2026-08-10-r3`.

The INVERT batch is Earthworm, Flatworm, Ice Worm, Lancelet, Marine Worm,
Polychaete Worm, Scale Worm, Barnacle, Coral, Cold-Water Coral, Deep-Water Coral,
Sea Cucumber and Sponge. All 13 independently pass at 440/300/132 with frozen
same-painter controls and exact repeats. Frozen `invertoverrides.ts` SHA-256 is
`861FA37AA88918EC908824A66AB800250B0A40BF7113E57F74069F7F7873717E`.

The S1–S3 first independent judgment returned **11 PASS / 4 FAIL**. Bounded R2
changed exactly Caddisfly, Diving Beetle, Firefly and Water Beetle; the second
independent judgment returned **4 PASS / 0 FAIL** at 440/300/132. Frozen
`faunaoverrides.ts` SHA-256 is
`EE6CC43E6A326942C3508878470F9490EE1CF21C50DC5C9BE35229AA130EF3F5`.
The immutable r2 evidence root
`apps/game/smoke/wave2-fauna-s1-s3-r2-evidence-2026-08-10-frozen` contains 26 rows /
156 current+repeat PNGs with zero
missing, hash, dimension, or repeat errors. Its source hash matches before A,
between A/B and after B, with zero drift across 139 build inputs; exactly four targets changed and all
22 protected rows remain byte-identical at every scale. S1–S3 is therefore
15/15 PASS and the three Wave-2a catalogue batches are **32/32 scoped PASS**.
This is not a post-wave catalogue total and must never be added to 516.

Vanilla Orchid r6 is independently judged continuity PASS at
`floraoverrides2.ts` SHA-256
`5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`.
The r6 evidence root validates 234/234 assets, exact source/hash/dimension
records and both browser orders. Its pure portrait is byte-exact to
`3f6834b7f984b35186fa1c441eeb4537d3e5793d446e447b021a1e3687939a25`;
all five stages are unique, preserve defining Vanilla organs, use continuous
joins, and drift progressively farther from pure as the anchor falls.
`hybridcheck` now requires five exact ID+kingdom+name focused lineages spanning all four kingdoms and
rejects eleven injected negative controls, including focused-species substitution and simulated
Vanilla stage collapse. This closes the prior focused Vanilla blocker, not every possible
bloodline or the final 1,250-row certification.

## Trigger and first closed family: bats

Fruit Bat's portrait SHA-256 was
`877AB8C2028350AF672E4B1E48979834FBCEEC1CE31651A360AD2796AF4B6C72` in
GP7.1 r1, r2, and r3. The unchanged wrong portrait exposed a review-ruler
failure, not a recent pixel regression. The newer named `faunaBat` route had
shadowed the older `_rigBat` treatment while retaining rigid membranes, weak
joint/foot/thumb reads and a generic eye pass over Fruit Bat's intended eyes.

Refine2d improved the family but remained four-for-four FAIL because required
digit, thumb, ankle/foot and rear-membrane supports did not survive all delivery
sizes. After another bounded repair, the source was frozen and an independent
review judged **Bat PASS, Fruit Bat PASS, Insect-Eating Bat PASS, and Vampire
Bat PASS** on unlabeled 440px, 300px and 132px evidence. The family hashes are
`EA10A134…6445C` at 440px, `CE38BEDF…C092` at 300px and
`72E8A203…E24C` at 132px; paired rerenders matched and five nearby controls
remained byte-identical to refine2d.

The complete hashes, source links, scale evidence, control invariance and strict
family-only boundary are in
[BAT_FAMILY_RESET_REVIEW_2026-08-10.md](BAT_FAMILY_RESET_REVIEW_2026-08-10.md).
This closes the first negative-control family only. It does not carry a verdict
to any other row or to a changed future bat hash.

## Reset-foundation defects and their current guards

### 1. Earth-lineage hybrids bypassed their inherited rig

`crossGenome` correctly writes `_earthBlend` and `_anchorVal`, and the verbatim
HD renderer contains the intended Earth-rig + child-palette + controlled-drift
path. The override router nevertheless sent every genome without `_earthName`
straight to `resolveProcedural`, including bred Earth-lineage children. That
discarded the inherited parent anatomy whenever a procedural override matched.

The repair now preserves the selected Earth parent's **set-qualified owner**.
The typed genetics facade carries `_earthBlendKingdom` through the existing
deterministic lineage pick without changing the lifted RNG stream. Fauna blends
return to the lineage-aware HD scaffold. Flora, fungi and microbe blends route
through the exact kingdom+name owner with the child's complete genome unchanged.
This distinction matters in mixed-kingdom crosses: the child's gameplay kingdom
need not be the catalogue that owns the Earth anatomy it inherited.

Species portrait and thumbnail caches now share one key over the complete
canonical deterministic genome. This includes the selected lineage, catalogue
owner and anchor, and distinguishes order-swapped crosses: genetics can produce
the same derived seed from `A×B` and `B×A` while inherited traits differ.

`npm run hybridcheck` is the production-browser outcome guard. It requires five
exact ID+kingdom+name focused lineages spanning every kingdom, all set-specific duplicate names,
Earth/alien parent order, multi-generation lineage, stripped-lineage and pure-
procedural controls, cache order and deterministic repeats. Eleven injected
negative controls cover route bypasses, owner loss, cache collapse, focused-species substitution and focused
stage collapse. It proves those route/cache and focused-stage outcomes; it does
not prove that every possible composition is visually seamless.

### 2. Duplicate names could receive the wrong kingdom specification

The GP7.1 preparer keyed references by bare species name and loaded `other.json`
after flora. Names present in more than one set were silently overwritten. For
example, Earth-flora Snow Algae could receive the Earth-microbe red-cyst contract
instead of its field-scale snow-stain contract. The preparer now keys every
reference by `set + species`; its self-test pins both Snow Algae identities and
rejects a collapse.

All r1/r2/r3 verdicts remain historical because their packets were prepared by
the faulty join. They can point reviewers toward risks but cannot certify this
reset.

### 3. A complete review needs clean, resolution-bound provenance

The official layout/review pipeline derives exactly **181 families** and **233
packets** at a maximum of 10 identities from the 1,250-row roster. It records 46
production-derived procedural plan families, binds every row to its exact
set/species `mustRead` or procedural-plan hash, and prepares labelled and
unlabeled family evidence. The review comparison binds native 440px pixels,
unlabeled 300px gameplay pixels, the actual unlabeled 132px thumbnail, labelled
old/current sheets, source commit, review date and a fixed attestation.
Collection rejects partial/stale/mismatched rows; certification writes only for
1,250 fresh PASS.

Official preparation requires a clean, complete 40-hex HEAD and refuses dirty
scoped art/app source or an existing output directory. The two current hybrid
matrix roots correctly identify themselves as **dirty-worktree provisional
diagnostics**. Their hashes preserve the findings, but they must be regenerated
from the clean committed foundation before they can enter final provenance.

### Reset-start repository and presentation hygiene

An exact file-signature and repository-consumer check proved
`packages/art/src/5` was an accidental 26,400×19,800 PNG (2,029,643 bytes), not
a source module or consumed asset; the reset batch removes it. Strict unused
checking and consumer/pixel proof also removed twelve superseded local painters
plus definite no-op locals while keeping all 1,246 non-bat portraits byte-identical
to the isolated baseline. The v2 app restores the standing mobile heat rule:
touch/coarse-pointer renderer DPR caps at 2, desktop at 3. These are valid
cleanup/cap corrections, not organism PASS evidence.

### Wave-1 whole-form ownership and stale cleanup

A whole-form named painter must own one winning route and return before the
older generic body. A required feature placed after that early return is inert;
adding another same-target overlay after the whole form risks double-painted
seams. The repair procedure is therefore route proof → winning whole-form edit →
target/control render → only then removal or narrowing of source-proven dead
same-target alternatives. Code presence is not evidence that pixels changed.

The bounded flora cleanup applied that rule without changing pixels. It made
`strictSignature` and `resetTreeSignature` mutually exclusive for their 39
overlapping reset names, removed impossible Apricot/Plum alternatives from the
Cherry/Peach/Pear-only arm, and constant-folded unreachable Lime/Orange
alternatives after their dedicated returns. The exact proof was **0/174 drift**
across the 58 tree target/control surfaces at 440/300/132 and **0/332 drift**
across every Earth-flora native portrait. `speccheck` also remained at zero
unread or inert fields. Pixel-neutral cleanup is accepted only with this form of
winning-route and hash evidence.

## What PixiJS can and cannot improve

The v2 game runs PixiJS 8.19, but species anatomy is still drawn by deterministic
Canvas2D painters at 440×440, encoded as image data, then displayed by DOM
`<img>` elements in the current Compendium and planetside UI. Pixi owns the
galaxy/world presentation today; a future creature RenderTexture/mesh pipeline
could improve resolution, filtering, compositing, lighting, and animation. It
cannot turn a rigid or biologically incorrect silhouette into a correct animal.
Geometry, attachment topology, occlusion, lighting continuity, and species
anatomy must be corrected first; a presentation upgrade must not conceal weak
source art.

The staged upgrade is therefore: (1) finish anatomy and lineage continuity in
the code-native painter system, (2) add an explicit resolution-aware detail seam
while preserving certified 440/300/132 outputs and mobile heat caps, (3) prove a
small Pixi living-preview surface over the same deterministic source, and only
then (4) consider the Phase-5 mesh/skeletal production pipeline. A broad Pixi
rewrite is not part of the current reset-foundation batch.

## Hybrid continuity: focused Apple and Vanilla results closed; final scope open

`hybridmatrix` renders 12 representative lineages through five real
`crossGenome` stages: pure Earth, Earth×Earth (0.90), Earth×alien (0.73), a
next alien generation (0.46), and the 0.22 anchor floor. It also writes
unlabeled detail cards, silhouettes, attachment crops, repeat/reload proof and
reversed-parent cache controls. The earlier r1/r2 roots contain 217
manifest-bound assets, 60 principal portraits and six cache pairs, but remain
dirty-worktree diagnostic history rather than current certification evidence.

The current production route/cache controls pass. Independent judgment accepts
the repaired Apple whole-form owner: it expresses all five focused genomes as
distinct integrated trees without a decorative pasted overlay, 58/58 tree rows
remain exact at all three delivery sizes, and pure-distance increases strictly
through the five-stage progression. The exact judge root is
`C:\Users\Nick\.codex\visualizations\2026\08\09\019fe72d-20c7-73a0-bac7-d2c64d10673d\flora-tree-focus\evidence-apple-continuity-judge`.

Independent judgment also accepts Vanilla Orchid r6. Its pure portrait remains
byte-exact, the five production stages are unique and progressively farther from
pure, defining vine/leaf/aerial-root/flower/pod organs survive every stage, and
the attachment atlas shows continuous joins rather than a pasted ladder. The
source-frozen r6 root is
`apps/game/smoke/hybrid-continuity-wave2-vanilla-2026-08-10-r6`; it validates
234/234 assets, source snapshots, dimensions, hashes, repeats, and both browser
orders. `hybridcheck` now binds five exact ID+kingdom+name focused lineages across all four kingdoms
and negative-controls eleven independent failure shapes. The earlier Vanilla
`FAIL_BYTE_IDENTICAL_STAGES` result is closed historical diagnosis.

**Final hybrid certification remains OPEN.** These focused passes do not inspect
every possible lineage or authorize a catalogue-wide seamlessness claim; the
final clean hybrid evidence remains coupled to the eventual all-PASS reset.

The first attempted live matrix after Wave 1 did not complete because of a real
schema-v2 harness contract bug: it incorrectly required Green Algae's retained
`microbe` compatibility route to be a current catalogue member. This was not
transient provenance. D-CAT-1 intentionally leaves only the `flora` owner in the
live roster while keeping the set-qualified microbe route for old saves. Schema
v3 in `hybridmatrixaudit.ts` and `hybridmatrix.mjs` repairs the provenance model:
it distinguishes current catalogue ownership from retained legacy-route
ownership, exercises both production routes, and negative-controls relabelling
the legacy route as current membership. Its sentinels, selftest, and TypeScript
check are green; the live run validated 234/234 assets in both stable browser
orders. The harness bug was not an organism verdict.

## Reset acceptance ruler

Every identity is judged from freshly rendered current pixels. PASS requires all
of the following; one missing required item is not PASS.

1. **Identity without the label:** the silhouette, posture, major proportions,
   and defining organs read in the bound native 440px portrait, unlabeled 300px
   gameplay render, and actual unlabeled 132px thumbnail. The 132px surface is a
   catalogue-wide requirement; the bat pass proved 440/300 alone can miss a
   card-scale collapse.
2. **Exact contract:** every set-specific `mustRead` is visible. The reviewer uses
   authoritative zoological/botanical references where the contract or pixels
   are ambiguous and records the source.
3. **Seamless construction:** limbs, wings, horns, tusks, tails, roots, flowers,
   fruit, fungi, and hybrid grafts share believable attachment, occlusion,
   outline weight, light direction, and material response. No paper-cutout or
   ornament-on-top joins.
4. **Family truth and distinction:** compare each identity beside close relatives
   and controls. Shared anatomy may use one rig; diagnostic proportions and
   organs must remain distinct.
5. **Historical regression check:** judge the hash-bound labelled old/current
   comparison beside the first fresh GP7.1 capture and any older verified
   renderer evidence. Preserve a stronger older feature unless a documented
   reason supersedes it.
6. **Deterministic procedural coherence:** procedural forms remain varied and
   readable; Earth-lineage hybrids retain recognizable ancestry while child
   palette and compatible drift integrate into the body rather than overlay it.
7. **Technical integrity:** clean 40-hex source provenance; exact 440, 300, 132,
   comparison and set-specific `mustRead`/procedural-plan hashes; current
   dimensions; no duplicate portraits, clipping, dead routes or inert spec
   fields; positive and injected-negative controls all pass.

POLISH means the identity and every required organ already read, but a bounded
finish issue remains. FAIL means identity, anatomy, topology, contrast, or any
required cue is absent or materially wrong. Literal 100% means 1,250 freshly
rendered rows are independently PASS under this ruler—zero carried bands, zero
POLISH, zero FAIL.

## Evidence and procedure

The clean baseline sequence completed once at `bc26e8`; its 516/14/720 result is
frozen. The command shape below remains mandatory for each future complete
post-repair capture: first commit the independently reviewed and gate-green
source on `openai/windows`, require a clean complete 40-hex HEAD, and write only
to new never-overwritten directories. Commands run from `port/v2` on Windows:

```powershell
node tools/gp71rejudge.mjs --prepare --out=<NEW_CURRENT_EVIDENCE> --date=2026-08-10

npm.cmd run fullresetlayout -- --prepare --evidence=<CURRENT_EVIDENCE> `
  --out=<NEW_LAYOUT_DIR> --per=10 --packets --source-commit=<40_HEX_HEAD>

npm.cmd run fullresetreview -- --compare --layout=<LAYOUT_DIR> `
  --old=<OLD_EVIDENCE> --current=<CURRENT_EVIDENCE> `
  --out=<NEW_COMPARISON_DIR> --source-commit=<40_HEX_HEAD>

npm.cmd run fullresetreview -- --template --comparison=<COMPARISON_DIR> `
  --out=<NEW_VERDICT_DIR> --review-date=YYYY-MM-DD `
  --source-commit=<40_HEX_HEAD>
```

Independent judges fill only the generated verdict templates, using concrete
PASS/POLISH/FAIL reasons. The collector and literal gate are separate writes:

```powershell
npm.cmd run fullresetreview -- --collect --comparison=<COMPARISON_DIR> `
  --verdicts=<FILLED_VERDICT_DIR> --out=<NEW_RESULTS_DIR> `
  --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>

npm.cmd run fullresetreview -- --certify --comparison=<COMPARISON_DIR> `
  --verdicts=<FILLED_VERDICT_DIR> --results=<RESULTS_DIR> `
  --out=<NEW_CERTIFICATION_DIR> --review-date=YYYY-MM-DD `
  --source-commit=<40_HEX_HEAD>
```

`--certify` must remain blocked unless all 1,250 rows are freshly PASS. The
repair loop is family review → bounded source repair → fresh clean commit → new
capture/layout/comparison/templates; never edit painters while judges are
working and never carry a verdict across changed pixels or a changed contract.

The clean hybrid evidence rerun is also required:

```powershell
npm.cmd run hybridcheck
npm.cmd run hybridmatrix -- --out=<NEW_CLEAN_HYBRID_EVIDENCE_NAME>
```

Only after every row is PASS should packaging assemble native portraits,
thumbnails, labelled/unlabeled family sheets, old/current comparisons,
references, manifests, verdicts, gate transcript and provenance into the new
dated ZIP. Keep this work on `openai/windows`; integrate by reviewed draft PR
into `develop`. No `main` merge, release or deployment is authorized here.

## Immediate order

1. Commit only the accepted Wave-2a source/tool/doc scope on `openai/windows`,
   then push that branch; do not include unrelated files.
2. Continue the remaining r1 non-PASS rows in bounded owner/family waves. Preserve
   author separation and never edit a painter while its judge holds source frozen.
3. After all rows close, repeat the complete clean 1,250 capture/layout/compare/
   collect sequence, rerun the clean hybrid matrix, and certify only a literal
   1,250/1,250 PASS result.
4. Build the image-inclusive ZIP only after certification. Until then, keep
   GP7/GP7.1 quarantined and the full certification, ZIP, reset PR and release open.
