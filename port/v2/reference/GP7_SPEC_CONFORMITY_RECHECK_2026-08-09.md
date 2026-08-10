# GP7.1 strict-conformity recheck — 2026-08-09

> **Historical GP7.1 evidence — superseded as the live work sequence by the
> [full-catalogue reset](FULL_CATALOG_RESET_AUDIT_2026-08-09.md).** Nick reopened
> all 1,250 identities after Fruit Bat exposed a false acceptance. The r1/r2/r3
> pixels, hashes and measurements below remain frozen evidence, but their bands
> are not current verdicts and r3 is not the next review input. Those packets
> were also prepared before references were keyed by set+species, so Green
> Algae, Reindeer Lichen, Snow Algae and Tardigrade could receive another
> catalogue set's contract. Do not collect, relabel or certify this record.

## Status

**Historical remediation record — never certified as 100% PASS.** This was the
authority for the strict-conformity follow-up to the frozen GP7 baseline in
[GOLD_PASS_7.md](GOLD_PASS_7.md). It does not replace or rewrite any GP7
verdict, Nick review, or carried historical record.

## Supplied review-package provenance

Nick supplied `Celestial_Frontier_GP7_1250_Asset_Spec_Conformity_Recheck_Full_Package.zip`.

- SHA-256: `448BF5A465F195673E87DBEB487A3C3ADFDDE258A319050DD2493ECAB84CC6BB`
- Size: 7,317,675 bytes
- Contents: 23 non-directory metadata entries; all decompress and cross-link
  cleanly, but the ZIP contains **no PNG, JPEG, WebP, GIF, strip, or packet
  pixels**.

The package therefore proves an internally coherent 1,250-row work ledger and
evidence index; it does not independently prove the current rendered pixels.

## Verified ledger state

`gp7conformity` verified the exact 1,250-row identity/index/manifest/result
joins, set distribution, hashes, bands, and action routing:

| Ruler | Rows | FAIL | POLISH | PASS |
|---|---:|---:|---:|---:|
| Fresh strict current-pixel review | 503 | 301 | 37 | 165 |
| Byte-unchanged carried review | 747 | 317 | 378 | 52 |
| Mixed ledger inventory — **not a score** | 1,250 | 618 | 415 | 217 |

The actionable queue is 301 `FIX_TO_PASS`, 37 `POLISH_TO_PASS`, 165 `FREEZE`,
317 `REVALIDATE_STRICT_THEN_FIX_IF_CONFIRMED`, 378
`REVALIDATE_STRICT_THEN_POLISH_IF_CONFIRMED`, and 52
`REVALIDATE_STRICT_THEN_FREEZE`.

When the old `required_fix` conflicts with a verified current-pixel note,
`verify_why` and the current render govern the repair. Do not blindly replay
stale prose.

## Remediation contract

1. Close the 338 fresh strict non-PASS rows with bounded named changes and
   matched controls.
2. Render and strictly rejudge every one of the 747 previously carried rows;
   a carried FAIL/POLISH is a review queue, not an automatically confirmed
   current defect.
3. Preserve a new dated GP7.1 ledger and the actual current 1,250 portraits
   plus labelled review strips/contact sheets.
4. Run all art gates and `npm run gp7conformity -- --input <fresh-ledger-dir>
   --certify`.

Literal 100% PASS is allowed only when **all 1,250 rows are freshly strict
PASS** and the new evidence package contains the rendered pixels, review
strips, provenance manifest, and verdict ledger together. The existing GP7
records remain reproducible frozen evidence; they must never be relabelled to
make that condition appear true.

## GP7.1 first all-fresh baseline -- captured 2026-08-09

The contract above has now been exercised once against the post-remediation
source. `tools/gp71rejudge.mjs --prepare --out=gp71-rejudge --date=2026-08-09`
produced **1,250 native 440x440 portraits** and **196 labelled, hash-bound
review packets**. Independent strict judges then supplied all 196 packet
verdicts; the collector accepted the exact 1,250-row identity, ordering,
portrait-hash, strip-hash, date, and ruler join.

| Fresh GP7.1 ruler | Rows | FAIL | POLISH | PASS |
|---|---:|---:|---:|---:|
| All current rendered assets | 1,250 | 318 | 301 | 631 |

This is the first valid single-ruler baseline. It replaces neither the frozen
GP7 record nor Nick's reviews. It is a repair input, not a certification:
`gp7conformity` reports 318 `FIX_TO_PASS`, 301 `POLISH_TO_PASS`, and 631
`FREEZE` rows, with zero carried rows. `--certify` must remain blocked until a
subsequent all-fresh render/review reaches 1,250 PASS.

Largest current non-PASS groups are Other plant or harvest type (115),
procedural organisms (79), fruit and nut trees (27), rodents (17), herbs and
spices (17), primates (15), and shrubs and bushes (12). Repairs must use the
current packet row's `why` field and the actual source image, not historical
required-fix text.

## Post-baseline delta measurement -- r2 evidence only

The first bounded repair pass changed 362 portraits while 888 portraits were
byte-identical to the all-fresh baseline. Independent cross-domain reviewers
inspected every changed r2 pixel against its current packet/reference:

| Changed r2 scope | Rows | FAIL | POLISH | PASS |
|---|---:|---:|---:|---:|
| Earth fauna | 98 | 10 | 42 | 46 |
| Earth flora + fungi | 167 | 49 | 62 | 56 |
| Procedural | 97 | 0 | 21 | 76 |

These reports are SHA-bound auxiliary evidence under
`apps/game/smoke/gp71-rejudge-r2/review-deltas/`. They are **not** a new
1,250-row collector result and must not be used to certify the catalogue. The
second narrow repair pass has addressed their exact failures/polishes, but it
requires a new all-catalogue capture and independent visual review before any
band can be promoted.

## R3 current evidence -- captured, not yet judged

The second repair pass has been rendered into the separate
`apps/game/smoke/gp71-rejudge-r3/` evidence root: **1,250 native 440x440
portraits** and **196 packet directories**. Its identity manifest differs from
r2 in **106** portrait hashes: 13 Earth fauna, 59 Earth flora, 6 Earth fungi,
and 28 procedural; **1,144** portraits are byte-identical.

This is current visual evidence only. There is deliberately no r3 verdict
folder, result, ledger, or package yet. Every packet must receive a fresh
hash-bound strict verdict before `gp71rejudge --collect`, and a subsequent
all-1,250 PASS result is still required before `gp7conformity --certify` or
the dated image-inclusive packager may succeed.

## Related evidence

- [GOLD_PASS_7.md](GOLD_PASS_7.md) — frozen GP7 baseline.
- [NICK_GOLD_AUDIT_2026-08-08.md](NICK_GOLD_AUDIT_2026-08-08.md) — full
  one-by-one audit.
- [NICK_PATCH_REVIEW_2026-08-08.md](NICK_PATCH_REVIEW_2026-08-08.md) — fixed
  species review, byte-identical to Nick's supplied Downloads copy.
- [PLAN_100_PERCENT.md](PLAN_100_PERCENT.md) — prior historical plan;
  the full-catalogue reset now governs the literal fresh-PASS target.
