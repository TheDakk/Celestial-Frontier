# Full Catalogue Reset Audit — opened 2026-08-09, current 2026-08-10

_Live authority for the restarted species-art review. Matches the current
OpenAI/Codex worktree as of 2026-08-10; update this file in the same batch as
the audit source, renderer, or acceptance ruler changes._

Repository state at reset start: `openai/windows`, local HEAD `3528bfb`, with
the reset-foundation implementation and documentation still uncommitted. PR #7
is historical/already merged; no PR number exists for this reset batch.

## Status: reset foundation accepted; clean commit and full review open

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

The four-bat negative-control family now has a frozen independent refine3 PASS
at 440px, 300px and 132px. That result applies only to Bat, Fruit Bat,
Insect-Eating Bat and Vampire Bat; the other 1,246 identities have not yet
received the new reset verdict. There is no full-catalogue PASS, final ZIP,
certification, pull request, release, or deployment.

The independent bounded diff review of `gp71rejudge`, `fullresetlayout` and
`fullresetreview` found no blockers. Their syntax/selftests and the negative
controls for provenance, exact layout/contracts and every required resolution
passed. The integrated post-review pass also cleared syntax, TypeScript,
unused-code, 238-pass/1-skipped Vitest, reset-tool, hybrid-matrix and diff checks.
This accepts the reset foundation only; the clean commit, fresh capture and
1,250-row visual review remain separate requirements.

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

`npm run hybridcheck` is the production-browser outcome guard. It covers every
kingdom, all set-specific duplicate names, Earth/alien parent order,
multi-generation lineage, stripped-lineage and pure-procedural controls, cache
order, deterministic repeats, and injected routing failures. It proves route and
cache correctness; it does not prove that the resulting composition is visually
seamless.

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

## Hybrid continuity: routing closed, visual result open

`hybridmatrix` renders 12 representative lineages through five real
`crossGenome` stages: pure Earth, Earth×Earth (0.90), Earth×alien (0.73), a
next alien generation (0.46), and the 0.22 anchor floor. It also writes
unlabeled detail cards, silhouettes, attachment crops, repeat/reload proof and
reversed-parent cache controls. The current provisional roots contain 217
manifest-bound assets, 60 principal portraits and six cache pairs.

The machine route/cache controls pass, but **visual continuity remains OPEN**:

- Fruit Bat's pure stage uses the new owned family while its bred fauna stages
  still enter the older lineage renderer generation, producing a visible
  pure-to-child discontinuity.
- Vanilla Orchid's five production genomes are byte-identical in final pixels;
  anchor values exist but the owner does not express them.
- Apple and Oyster Mushroom remain unreviewed continuity cases; their named
  owners may preserve too much fixed Earth form or ignore reversed-parent traits.

The matrix therefore reports `FAIL_BYTE_IDENTICAL_STAGES` and makes no
seamlessness or art-PASS claim. The provisional r1/r2 roots were captured from
the same dirty source snapshot and are diagnostic only; rerun from the clean
commit before promoting evidence.

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

Commit the independently reviewed and gate-green foundation on `openai/windows`,
and require a clean worktree at the complete 40-hex HEAD. Then capture into new,
never-overwritten directories. Commands below run from `port/v2` on Windows:

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

1. Commit the accepted bounded foundation; that result does not certify any
   organism pixels.
2. Make the clean 1,250-current capture and
   official 181-family / 233-packet layout.
3. Generate the bound old/current comparison and fresh empty verdict templates.
4. Review Earth fauna family by family, then flora, fungi, microbes, and all 240
   procedural identities; repair only evidence-confirmed rows and repeat cleanly.
5. Resolve the open hybrid visual-continuity findings and rerun the matrix from a
   clean commit. Prototype the staged Pixi presentation seam only after anatomy
   and lineage continuity are sound.
6. Package and certify only after a fresh 1,250/1,250 PASS result. Until then,
   keep GP7/GP7.1 quarantined and the bat result explicitly family-scoped.
