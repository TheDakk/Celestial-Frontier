# Tail-stalk gap fill: component-preserving coverage (Claude, 2026-09-26, C55 follow-up)

**Starting point:** Codex's `fill-gap-observed.mjs` (`audits/TAIL_STALK_C54_20260926`).
- On the Cod, it moves all 4,550 requested remainder-owned stalk pixels to `body-5`.
- It REFUSED Perch and Carp: 9 and 28 requested pixels were lost during contour rasterization.

**Cause.** `traceRegion` (`port/v2/tools/anatomy-verify/leaf-growth.mjs`) keeps ONE 8-connected component. A request that is still fragmented after the one-pixel collar therefore loses every fragment that the main outer contour does not enclose.

**Change (`fill-gap-bridged.mjs`, an audit copy of Codex's helper with one added block):**
- After the collar, the plain trace is tried first.
- Only fragments whose requested pixels that trace would lose are bridged to the main component. Each bridge is the shortest 8-connected path through pixels the stalk may already own: its own, the remainder's, or unowned.
- A path never crosses another part. A fragment that cannot be reached that way refuses (`Fragment cannot be bridged without crossing another owner`).
- Everything else is Codex's code, unchanged:
  - the automatic distance;
  - the priority ownership;
  - the lost-pixel and earlier-owner refusals;
  - validate-before-write;
  - the receipt, which now also records `requestFragments`, `bridged` and `bridgePixels`.

## Results

| Fish | Distance | Fragments / bridged | Requested pixels retained | Other owners changed | Intake / static | Native (Tang lake script, CPU ×4) |
|---|---:|---|---|---:|---|---|
| Cod (positive control) | 58 | 2 / **0** | 4,550/4,550 | 0 | — | — |
| Perch | 146 | 3 / 2 (67 px) | 14/14 | 0 | FIT_COMPILED / PASS_STATIC | DIAGNOSTIC_PASS |
| Carp | 103 | 2 / 1 (14 px) | 109/109 | 0 | FIT_COMPILED / PASS_STATIC | DIAGNOSTIC_PASS |

- **Positive control:** the Cod needs no bridge, and its authoring is **byte-identical** to Codex's `08-cod/cover-04/packet/authoring.json`. Codex's own helper, re-run here, also reproduces cover-04 exactly.
- **Negative controls** (`controls.txt`):
  - Codex's original helper still refuses Perch (9) and Carp (28), so the bridge is what changes the outcome.
  - The bridged helper still REFUSES Trout and Herring (`spine5`, Salmon-referenced) and Arctic Fox `tail3→tail2` with `Earlier ownership changed`, and writes no packet.
  - That refusal is a different class. The stalk's simple outer contour encloses pixels of later-listed parts, and a polygon cannot have holes. Bridging does not touch it, and it must stay refused.
- **With the previous selective welds re-applied** (`weld-g2fam-fish/pairs/*-bridged-final`, the same final pairs as `greedy.log`), Perch and Carp are both PASS_STATIC and native DIAGNOSTIC_PASS (`native-07-perch-welded`, `native-09-carp-welded`).
  - Unlike Codex's Cod cover-04 plus welds (static RED), these hold.
  - The gill-line hole of the unwelded bridged fit (`native-07-perch/turn1-hit-reaction-50.png`) is gone.

## What I saw (`tail-crops.png`: the left fighter's tail at 3×, four stills)

- **Carp:** a full, clean tail through the swing.
- **Perch:** the bridge adds only 14 pixels, so it looks nearly identical to the packet Dakk rejected.
  - The slim stalk is the painting's own proportion.
  - A faint pale notch shows at the top of the fin join in two stills.
- **This does NOT answer Codex's held-out requirement.** Neither Perch nor Carp is a *genuinely gapped* tail: their gap is 14 and 109 pixels, against the Cod's 4,550.

## Status

- **Candidate, NOT adopted into the author.** The general rule still waits for a genuinely gapped held-out fish that passes without regressing the others.
- Every G2 fish we have is either ungapped (Perch, Carp), the Cod itself, or refused by the ownership-steal class (Trout, Herring).
- **Next** (Codex's lane, or the next G2 fish batch): a held-out fish whose automatic fit shows a Cod-sized gap, then the bridged fill with unchanged seam, fold, mutation and native gates.

**Reproduce** (repo root): `node audits/TAIL_STALK_BRIDGE_20260926/fill-gap-bridged.mjs audits/G1_AUTO_AUTHOR_20260926/auto-g2fam-v10/<fish>/packet <fresh-out> caudal body-5`, then `intake-authored.mjs`, `harness/static-runner.mjs` and the native runner. Fits are regenerable and ignored.
