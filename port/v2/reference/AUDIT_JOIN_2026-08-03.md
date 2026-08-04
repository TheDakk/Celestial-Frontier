# THE TWO AUDITS, JOINED — 2026-08-03

Nick's engine package (`Celestial_Frontier_Current_One_By_One_Audit`) against gold
pass 2 (`goldpass2-results.json`). Both judged the **same 1,250 renders** at 440×440.
Joined on species; 1,233 of 1,250 joined (17 lost to name normalisation — `Aye Aye`
vs `Aye-Aye`, `Deep Sea Fish` vs `Deep-Sea Fish`; his `asset_id` strips hyphens).

| | PASS | middle | FAIL |
|---|---|---|---|
| **his engine** | 347 | 758 HOLD | 145 |
| **gold pass 2** | 71 | 748 POLISH | 431 |

The middle bands agreeing to within 10 is a coincidence of totals, not agreement.

## Agreement matrix (1,233 joined · rows = his, cols = mine)

```
              →FAIL  →POLISH   →PASS
  FAIL           88       53       3
  POLISH        278      456       9
  PASS           60      228      58
```

- **exact band agreement 602/1,233 = 48.8%**
- **875/1,233 (71%) agree the asset is NOT shippable as PASS**
- **only 58 assets we both call PASS** — 4.7% of the catalogue is clean by both yardsticks
- our FAIL sets overlap on **88**: 61% of his, 20% of mine

## ★★ HIS PACKAGE FOUND TWO THINGS MINE STRUCTURALLY COULD NOT

### 1. The family chassis — the single biggest defect in the catalogue

`expected_body_family` + `global_body_template_risk: HIGH`, evidenced by his focused
family contact sheets. **Twelve canids are one animal in twelve colours, and it is a
pony**: straight vertical legs on dark hoof-like tips, level topline, deep barrel
chest, a tiny ear. Wolf, Coyote, Dingo, Jackal, Fox, Red Fox, Arctic Fox, Fennec Fox,
African Wild Dog, Maned Wolf, Pampas Fox. **Twelve felids are the same chassis with
spots** — the Tiger is a striped pony, the Lion is that pony wearing a mane.

★ **My pass graded most of these POLISH**, and one judge called African Wild Dog
"a lean blotched dog in camouflage markings". That is wrong, and the reason is
methodological, not a lapse of attention:

> ⚠ **I BATCHED THE CATALOGUE ALPHABETICALLY, SO NO FAMILY EVER APPEARED TOGETHER.**
> A judge shown one Tiger against a row reading "orange with black stripes, heavy
> build" ticks stripes, ticks orange, and lands on POLISH. Twelve felids side by side
> make the shared chassis undeniable. `GOLD_PASS_2026-08-03.md` §2 states this in its
> own words — *"these clusters are only visible because everything was judged in one
> sitting"* — and my re-measure destroyed exactly that signal by construction.
> **Next pass batches BY FAMILY.** A per-asset harness cannot see a cross-asset defect,
> and 431 per-asset verdicts did not add up to the one finding that matters most.

### 2. Silhouette similarity — my `[SAME]` ratchet reports 0 while duplicates exist

My artlock prints **"0 pairs under HARD 0.6"**. His silhouette metric finds 42 high
similarity pairs, topped by **Flounder ≈ Halibut at 1.0000**. Verified by rendering:

| pair | his similarity | mine | truth on the render |
|---|---|---|---|
| Flounder ≈ Halibut | 1.0000 | not flagged | **the same bristly tan egg with a face** |
| Diving Beetle ≈ Water Beetle | 0.99999 | not flagged, both POLISH | one body, green vs brown |
| Duck ≈ Eider Duck | 0.9998 | not flagged | one posture, two hues |
| Sand Dollar ≈ Starfish | 0.9981 | I independently called Sand Dollar *"a five-armed starfish"* | **convergent** |

★ **`0 hard look-alike pairs` is a FALSE ASSURANCE and I repeated it as a result.**
The gold pass already wrote the reason down — *"the `[SAME]` ratchet misses this
because colour separates them — the gate measures pictures, not construction"* — and
the number still read as safety. His metric is **colour-blind and shape-only**, which
is precisely the axis mine lacks. **Port it into artlock as a second distance.**

## WHERE MINE IS RIGHT AND HIS IS TOO LENIENT

His FAIL band is reserved for "visible correction required"; 338 assets I FAIL sit at
his HOLD. Four picked from that list and adjudicated by rendering — **my FAIL held 4/4**:

- **Agouti and Capybara are the same picture** — a crouching brown rodent ball with
  erect ears and a white incisor block. Both read as guinea pig. (Also a duplicate
  pair neither gate flagged.)
- **Bonefish** — a straight untapered rod out of the snout, 27% of body length, with
  no lower jaw under it. Reads as a swordfish.
- **Baboon** — a flat frontal tan disc with zero snout projection, wide-set eyes and a
  painted smile. The muzzle *is* the baboon.

**Procedural is the sharpest split: he reports 238 PASS / 2 HOLD / 0 FAIL; I report 37
FAIL.** Resolved by looking — `fauna-h1-s3` is **a headless fish body with two
ball-tipped stumps where the head should be**, an anterior clip, and `fauna-h0-s15` is
a fragment shoved into a corner. These are broken renders, not stylistic calls. His
procedural check scores "trait blend coherence" and does not ask whether the picture
is intact.

## WHAT HIS PACKAGE HAS THAT SHOULD BE ADOPTED WHOLESALE

1. **`sha256` + `previous_sha256` per asset.** Provable change tracking — 1,053 changed,
   197 byte-identical since his last submission. My pass has no equivalent and had to
   prove "did this actually move" by stashing a diff and re-running.
2. **Per-part sub-scores** (`torso`, `head`, `eyes`, `legs_wings_appendages`,
   `rear_tail_flukes`, `signature_traits`). Mine emits one prose `verifyWhy`; his says
   *which part* to edit, which is what a queue needs.
3. **`expected_body_family` / `global_body_template_risk`.** The axis that found §1.
4. **A prioritised action queue** (`engine_action_queue_903_assets.csv`, P0…).

## THE COMBINED WORKLIST

1. **THE FAMILY CHASSIS FIRST — it is one painter, and it outranks everything in either
   FAIL list.** Canids and felids do not have a carnivore body: digitigrade legs, paws
   not hoof-tips, a crouched spine, deep chest, rounded skull. ~140 mammals route
   through `quadrupedoverrides.ts`. Neither audit's per-asset count captures this,
   because it is a defect of the SCAFFOLD, not of any one row.
2. **88 both-FAIL assets** — certain work, no adjudication needed.
3. **His 56 FAIL-only** — mostly the chassis cluster above; largely absorbed by (1).
4. **My 338 FAIL-only** — real (4/4 upheld on audit) but per-asset and expensive. Join
   them to his per-part columns so each becomes "edit THIS part" rather than prose.
5. **The broken procedural renders** — an anterior clip is a bug, not a judgement.

## HOUSEKEEPING THIS EXPOSED

- 17 assets fail to join on name. **Normalise once, in one place** (hyphens, spacing)
  and publish the canonical id alongside the display name.
- The 240 procedural assets still cannot join between my own passes (`fauna-h0-s0` vs
  `f0·6#126`). His package keys on `filename`, which is stable — **adopt filename as
  the join key for procedural.**
