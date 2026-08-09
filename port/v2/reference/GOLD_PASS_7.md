# GOLD PASS 7 — final 1,250-asset certification (fresh drift + matched control)

**2026-08-09. Status: review and master packaging complete on the frozen source.** GP7
incorporates both of Nick's 2026-08-08 review documents, freshly judges every
pixel-changed asset, carries only byte-unchanged rows, and measures the strict judge against a
family-matched unchanged control.

## ★★★ THE HEADLINE: COMPLETE COVERAGE, WITH THE RULER MEASURED

| catalogue evidence | rows | treatment |
|---|---:|---|
| changed pixels | **503** | freshly judged across **95** family strips |
| byte-unchanged pixels | **747** | exact prior one-by-one verdict carried |
| **complete catalogue** | **1,250** | one traceable row per asset |
| matched control (outside the total) | **62** | unchanged, family-matched assets judged across 39 strips |

The final strict verdicts on the **503 changed assets** are **301 FAIL / 37 POLISH / 165 PASS**.
The same judge returned **47 FAIL / 4 POLISH / 11 PASS** on the 62 unchanged controls.

Among rows that had room to fall, the strict judge demoted **62/160 drift rows (39%)** versus
**21/32 controls (66%)**: **39% − 66% = −27 points net of the ruler.** The changed set was less
likely to be demoted than unchanged family peers. This is a defect-finding ruler, not a calibrated
continuation of Nick's GOLD / POLISH / FIX scale.

⚠ `reference/goldpass7-results.json` is deliberately a **mixed-ruler ledger**: 503 strict rows
plus 747 carried rows. Its **618 FAIL / 415 POLISH / 217 PASS** total preserves per-asset
traceability, but it is **not a catalogue score, regression percentage, or completion rate**.
Quote the fresh tally, matched-control calibration, and per-asset reasons instead.

## NICK'S TWO REVIEWS ARE BOTH INCORPORATED

- `reference/NICK_GOLD_AUDIT_2026-08-08.md` is Nick's complete 1,250-item audit: 381 GOLD,
  810 PASS WITH POLISH, and 59 FIX. It supplied the catalogue-wide baseline and named morphology
  requirements; its recommendation to avoid another global body pass was preserved.
- `reference/NICK_PATCH_REVIEW_2026-08-08.md` is Nick's 60-item fixed-species review: 15 PASS,
  25 PASS WITH POLISH, 19 STILL FIX, and one Mahi-Mahi regression before the final targeted
  refinements. Every held item and its must-read anatomy was folded into the GP7 target work.
- Nick's Downloads original,
  `C:/Users/Nick/Downloads/Celestial_Frontier_2026-08-08_Fixed_Species_Patch_Review.md`, is
  **byte-identical** to the committed patch review: both are 17,100 bytes and SHA-256
  `4C533151EFEC55B5FC741CD771E34CA0E32919F981E76D5C4BB390D4F4B72460`.

## REVIEW PROCEDURE

1. Freeze the art, then run `artlock --driftdump` against the judged baseline. The lock identified
   exactly 503 changed portraits; identical pixels are the proof that the other 747 verdicts carry.
2. Render the changed set into 95 labelled, family-grouped strips. Separately select 62
   deterministic, family-matched unchanged controls and render them into 39 strips. Both sets use
   the same strict PASS / POLISH / FAIL prompt and require one concrete visual reason per row.
3. Judge current pixels one strip at a time, checking the packet's exact `mustRead` morphology at
   card scale. Where a final targeted edit landed, regenerate that strip and replace only that
   species' row.
4. Collect by exact index, name, row order, band and non-empty reason. The collector fails on a
   missing, duplicate, reordered, unknown or malformed row. The merge treats the drift set—not a
   successful process exit or a 1,250-row output—as the completeness authority.
5. Merge the 503 fresh exact joins with the 747 byte-unchanged rows, retain the 62-control result
   beside it, and interpret band movement only after control calibration. Files:
   `goldpass7-rejudge.json`, `goldpass7-control.json`, and `goldpass7-results.json`.

## THE PROCEDURAL BLANK-STRIP RESULT WAS INVALID AND IS CORRECTED

Drift strips 11–15 first showed 57 red blank cells and yielded a bogus 57/57 FAIL. The art was not
blank. The same creature had three incompatible names: a baseline name such as
`fauna-h0-s1`, an art-lock drift name such as `f0·1#1`, and a renderer request such as
`proc:fauna:h0:s1`. The strip tool accepted the wrong namespace without proving a cell painted,
and the old merge then failed to join those fresh rows and silently retained stale baseline rows.

The checked 240-row procedural identity bridge now proves the mapping in every direction. The
renderer has a known-good Earth/procedural control plus an intentionally invalid negative control,
rejects any unpainted cell, and rebuilds when either package art or its app consumer changes. The
collector/merge fail closed on unmapped, missing or unknown identities. After regeneration, the 57
affected current portraits were independently rejudged **57/57 PASS**. The remaining 183
procedural portraits are byte-unchanged carry, so all 240 procedural organisms are covered.

## FINAL TARGETED FIX OUTCOMES

No final named target remains in the strict FAIL band.

- **PASS:** Arctic Blueberry · Bearberry · Crowberry · Cranberry · Giant Kelp · Huckleberry ·
  Harvestman · Kelp · Mahi-Mahi · Monkfish · Aardvark · Cat · Clouded Leopard.
- **POLISH:** Lingonberry · Mountain Cranberry · Harpy Eagle · Bobcat · Caracal · Fishing Cat ·
  Lynx · Ocelot. Each now carries the requested identity cues; its remaining issue is cosmetic.

The last five rechecks preserve the exact residual work:

| target | final | visible evidence / remaining polish |
|---|---|---|
| **Kelp** | **PASS** | Broad wavy olive-brown ribbon blades flow from distinct stiff stipes above a splayed claw holdfast; the rigid-rod read is gone. |
| **Bobcat** | **POLISH** | Bobbed tail, cheek-whisker ruff and black ear tuft read; the ruff and tuft remain oversized/angular. |
| **Lynx** | **POLISH** | Ear tuft, flared cheek ruff, long hind leg and snowshoe paws read; the ruff remains rigid black linework. |
| **Ocelot** | **POLISH** | Short tail, paired cheek stripes and horizontal rosette chains read; the rosettes remain overly regular capsule outlines. |
| **Fishing Cat** | **POLISH** | Stocky olive spotted body, neck stripes and short thick tail read; the long narrow muzzle still weakens the feline silhouette. |

The broader fixes supplied distinct boreal-berry growth habits, real kelp stipes/blades/holdfasts,
a fused-body long-legged Harvestman, diagnostic Mahi-Mahi and Monkfish profiles, Harpy Eagle
crest/chest identity, and feline tails/faces/ruffs/rosettes. Six dead or shadowed flora routes were
removed instead of being mistaken for live target work.

## AUTOMATED CERTIFICATION — GREEN ON THE FROZEN SOURCE

- `npm test`: **23/23 files; 234 passed, 1 skipped**. TypeScript: **PASS**.
- `speccheck`: **301 declared fields, 0 unread, 0 inert; self-test 5/5**.
- `overridecheck`: **1,014/1,014 routes live, 0 dead**; baseline + A–F + restore controls PASS.
- `coveragegap`: **1,010/1,010 Earth species, 0 remaining**.
- `artaudit`: **23 sources, 0 findings**. Procedural bridge, strip and GP7 collector self-tests:
  **PASS**.
- `speciesaudit`: **1,250/1,250 painted, 0 failures, 0 duplicate pairs, 0 clipped**.
- `artlock`: **exactly 503/1,250 drift**, all declared or advisory; **0 undeclared hard drift** and
  **0 HARD pairs**.
- `artbattery`: **6/6 PASS**. Vite's existing >500 kB chunk warning is the only diagnostic.

The final differentiation metrics are **HARD pairs 0**, colour-blind **SHAPE pairs 92 → 73**,
and art-lock confusable pairs under 1.5 **686 → 507**.

## CURRENT EXPORTS AND MASTER PACKAGE

The full current export trees contain exactly **1,250 native 440×440 portraits** (631 Earth fauna,
332 Earth flora, 27 Earth fungi, 20 Earth microbes, 240 procedural) and **196 labelled contact
strips across 152 families**, covering 1,250 unique names with no incomplete packet:

- `apps/game/smoke/species-fullsize/`
- `apps/game/smoke/catalogue-review/`

With this review record present, `npm run gp7package` validated the per-set counts,
dimensions, 1,250 unique identity/filename joins and SHA-256 manifest, then created the master ZIP at:

`apps/game/smoke/Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip`

The final archive size and SHA-256 are recorded outside the archive in the live handoff so the
archive is not asked to contain its own changing digest.

## REMAINING COSMETIC REVIEW PRIORITIES

Review the 196 family sheets first, with full-size portraits only when a thumbnail is ambiguous.
Prioritize the four felid notes above, Caracal's solid ear plumes (refine to slender black tassels),
Harpy Eagle's ochre rather than grey talons, Lingonberry's weak shoot-tip berry clusters, and
Mountain Cranberry's weak leaf-tip notches/terminal clusters. The 507 confusable and 73 SHAPE
pairs are useful optional Platinum triage, not release failures by themselves.

Do not start another global art sweep. Record any follow-up by exact species and PASS / POLISH /
FIX, then use a bounded must-read target list, artlock drift scope, regenerated current strips and a
fresh family-matched control.
