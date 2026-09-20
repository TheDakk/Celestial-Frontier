# P1 animation review — Coconut Crab on its rig (Claude, read-only, 2026-09-20)

Codex packet: `/Users/nick/Projects/celestial-frontier-openai-mac/audits/VISION_P1_COCONUT_20260920/hidden-01/`
(producers `580a6ffb` hidden pair + measured limits, `670fe8b6` mask correction, `df296fa4` sheet; signed).

## Verdict on the deliverables: ACCEPTED as built, with two leaf classes open
- **The hidden-presence contract is exactly the P1 verdict's law 2**, implemented the right way round: declared in
  the record (`cf.anatomy-presence/v2` `hidden:["leg3Far","leg3Near"]`, `absent:[]`), never inferred from a missing
  landmark; hidden joints kept in the complete skeleton and flagged; hidden pair placed by explicit mirrored
  inference from pair 2 (segment lengths preserved 1:1); parts empty; hidden contact chains excluded; forged hidden
  paint refuses before decode; the eight-visible painter crab still admits with nothing hidden; absent-as-hidden and
  duplicate declarations refuse. The shared contract needs no reconciliation on this lane: the E1 parts rig will
  read `hidden` from the record at the re-merge and exclude those chains from its contact solve, nothing more.
- **Intake on the painted master is honest**: original 1254² RGBA untouched, 21 visible parts, 3,838 field vertices,
  six contact supports, exact pixel rest, planted drift 0.00107 px, endpoint error 4.6e−16, seam control fails at
  12.5 px when a part is displaced, all twelve rows plus presentation green on contact/seam/fold/limit.
  `masterIntakeAccepted: true` is correct.
- **Measured brachyuran contact limits** (Nick authorized in Codex's session): six subjects, 12,318 samples, the
  same measured-max + 10° rounded-to-5° rule as R3-S → Knee ±30° / Foot ±65°, raw clip limits untouched. Consistent
  with the R3-S law; nothing to reconcile.
- The film (14.2 s, 853 frames, zero refusals) and the sheet are for Nick's eye. Codex's own note on the initial
  displaced claw-tip fragment (fit-03 rejected, fit-04 tip-only correction) is the kind of finding that should be kept.

## The two leaf classes, and what each is
1. **CPU.** Approach row p95 2.10 ms against a strict < 2 ms gate; the recorded full film p95 3.20 ms (whole frame
   3.30 ms). This is the first rig with a painted 1254 px master: 3,838 field vertices versus a few hundred to a
   thousand on the painter crabs. The cost is in the field/ARAP publication, i.e. proportional to vertex count, and
   every painted master will look like this. **Not a P1 defect; a budget decision for the painted tier.** Two honest
   routes: (a) a vertex budget for painted masters — coarser `interiorStep` in the paint-skin build for the interior
   (boundary step unchanged so seams and contacts keep their resolution), measured on the same six subjects; (b)
   accept a painted-tier CPU gate above 2 ms on desktop and keep 2 ms for phones, which already receive retained
   originals. Nick decides; my recommendation is (a) first, because it is a measurement, and (b) only if (a) cannot
   reach 2 ms without visible seams.
2. **Root continuity during faint recovery.** One sample steps 9.10 px against an 8.10 px bound that was derived from
   the stride (4 % of the shortest leg). That bound is a gait bound; the faint recovery is an authored whole-body rise
   with six planted feet on a crab whose legs are long, so its stride bound is small and its authored rise is fast.
   Same family as the R3-S findings: a clip-authored motion measured against a locomotion guard. **Direction:**
   measure the maximum per-sample root step for every row on all six subjects (one ledger, as for the limits), then
   split the guard: stride bound for gait rows, a measured non-gait bound (max + margin) for authored rises and
   collapses. No root key, no clip, no threshold moves by hand.

## Roster and the four packets
`masterIntakeAccepted` is true and the two leaves are rig-side, will be fixed once for every painted master, and do
not touch painting or intake. **Painting of the other four crabs can start now**, in parallel with the leaf work; their
rigs wait for the CPU and continuity decisions. This keeps the painter busy while the budget question is measured.

## Direction for Codex (copy-ready)
```
P1 animation review: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/VISION_PROGRAM_20260920/P1_ANIMATION_REVIEW.md
(read-only; do not sync). hidden-01 is accepted as built; masterIntakeAccepted stands; the hidden contract matches the
verdict's law and needs no change. Two bounded steps, in order, no other variant: (1) CPU — a vertex-budget measurement
for painted masters: rebuild the P1 paint skin at coarser interiorStep values (boundaryStep unchanged), report field
vertices, approach p95 and full-film p95 per value on the same native path, plus seam maxGapPx and planted drift; no
threshold change; Nick decides the painted-tier gate from that table. (2) Root continuity — one ledger of the maximum
per-sample root step for every row on all six subjects, then split the guard: stride bound for gait rows, a measured
non-gait bound (max + 10 %, rounded) for authored rises/collapses; both-way control: a doubled faint-recovery key must
still refuse. In parallel, PAINT the other four crabs from the packets in
/Users/nick/Projects/celestial-frontier-anthropic-mac/audits/VISION_PROGRAM_20260920/P1-{crab,freshwater-crab,mud-crab,vent-crab}-packet/
exactly as generation 01 (one generation each, exact prompt, retained); intake and rigs wait for (1)/(2).
Signed commits; no fetch, push, PR, merge.
```

## Addendum 2026-09-20 — CPU lever corrected, and the three chains
Codex's measurement (`/Users/nick/Projects/celestial-frontier-openai-mac/audits/VISION_P1_ANIMATION_20260920/`) shows
interior coarsening is not the lever: the adaptive compiler subdivides every cell that contains an alpha boundary or a
part-ownership cut at `boundaryStep`, so interiorStep 56 → 256 removes 51 of 3,838 vertices (1.3 %). The vertex count
is boundary-driven. **Amended direction:** keep the interior series as recorded (measure the 80/256 candidates once,
since 128 aliases 80), and add a boundary series at `boundaryStep` 24 (baseline) / 32 / 48 with interiorStep 56,
reporting field vertices, approach and full-film p95, seam `maxGapPx` and planted drift for each — the seam gap is
the thing that will move. A part-count series (merging the two claw-finger parts into one per claw) is the third lever
if boundary 48 still exceeds 2 ms; that changes the rig's part inventory and is Nick's call after the numbers.

The three unresolved chains in `VISION_P1_FOUR_CRABS_20260920/intake-01` are the legs nearest the claws (Codex's
leg3Near/leg3Far, the vent crab's landmarks confirm leg3 roots sit beside the claw bases). They are occluded behind the
claws, not missing — see `P1-four-crabs-review/README.md` addendum: declare `hidden` per law 2, seed points given.
