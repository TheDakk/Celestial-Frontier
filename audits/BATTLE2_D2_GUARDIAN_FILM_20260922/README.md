# D2 G6 — the first guardian on the battle stage (2026-09-22)

The Brown Bear (Codex's signed comparison fit `audits/VISION_D2_GUARDIAN_20260921/fit-01/`, producer `1ff30009`)
plays on the real battle stage with the guardian frame fill (`GUARDIAN_FRAME_FILL = 0.9` of the frame height, an option
of `combatantScale`, taken when the record carries a `guardian` block). Native film (Edge over CDP,
`tools/battle2-proof/native-runner.mjs`, rest supports — the stage's default; Claude's review of the static RED is
`audits/VISION_D2_GUARDIAN_20260921/G6_CLAUDE_REVIEW.md`):

| Film | Left | Right | Attacks | Refusals | CPU p95 | Verdict |
|---|---|---|---|---|---|---|
| `bear-vs-crab-01` | Brown Bear, guardian fill, family solver, cadence approach (reach 0.120) | crab (crab-fits-03) | claw (foreNearPaw) ×2, dodge | **0 / 0** | **3.10 ms** (guardian tier gate 5 ms; painted tier 3.5) | **DIAGNOSTIC_PASS** |
| `bear-vs-crab-02` | same bear; the fill sizes its TALLEST pose (0.96 of the frame, `tallestHeight` = 1.38 × rest → rest 0.70 of the frame) and the guardian stands (0.30 / 0.82) | crab (crab-fits-03) | claw (foreNearPaw) ×2, dodge | **0 / 0** | **3.00 ms** | **DIAGNOSTIC_PASS** — both eye findings answered; -01 kept beside it for Nick's choice |
| `bear-vs-crab-03-observed` | same bear on OBSERVED painted supports (`script.supports: 'observed'`) with Codex's analytic rigid-support IK merged (`58f81e54` → `137c272a`) | crab | claw (foreNearPaw) ×2, dodge | **0 / 0** | **2.80 ms** (guardian tier gate 5 ms — measured, PASS) | **DIAGNOSTIC_PASS** — the observed-support refusals are gone on the stage too (`d2-guardian-fill` measurement: 77/216 → **0/216**) |
| `crab-attacks-bear-01` | crab (crab-fits-03), attacker | Brown Bear as the TARGET on the right (mirrored guardian stands 0.18 / 0.70, tallest-pose fill): hit, dodge, hit | pinch (clawNearDactylTip) ×2, dodge | **0 / 0** | **3.40 ms** | **DIAGNOSTIC_PASS** — the guardian's hit reaction and the mirrored composition (`turn0-hit-reaction-50.png`) |

Stills: `turn0-hit-approach-50.png` — the bear at 0.9 of the frame walking its planted cycle, head at the HUD band;
`turn0-hit-impact.png` — reared on the hind legs, fore paw on the crab (bleached by the hit flash by design).

## The two eye findings, built (film -02) — Nick chooses between -01 and -02
- **Headroom:** the parts rig measures its tallest pose at load through its own public path (largest upward landmark
  rise over approach / the anatomy attacks / hit / dodge / faint / victory; crab ×1.00, Civet ×1.26, bear ×1.38 of
  rest) and the guardian fill sizes THAT (`GUARDIAN_FRAME_FILL = 0.96` of the frame for the tallest pose → the bear
  stands at 0.70 of the frame and its rearing head stays under the HUD band; `d2-guardian-fill.test.ts` asserts the
  landmarks never leave the frame through the whole turn on both viewports).
- **Stands:** `composeArena(..., { guardianSide })` moves the stands to `GUARDIAN_STANDS` 0.30 / 0.82 (mirrored on the
  right); the test asserts the bear's landmarks clear the crab's at the stands from both sides; the game wiring and
  the native entry compose the arena after the rigs so they know the guardian side.
- Trade recorded for the eye: -01 is the bigger bear (0.9 at rest) whose head leaves the frame when it rears and whose
  paws overlap the crab before the lunge; -02 is 0.70 at rest, always inside the frame, clear of the crab. One
  constant each (`GUARDIAN_FRAME_FILL`, `GUARDIAN_STANDS`) if Nick wants it between.

## Findings for the eye (Nick) as first seen on film -01
1. **Headroom when rearing.** At 0.9 fill the standing bear touches the HUD band; when the claw attack rears it,
   the head leaves the frame top. Options: fill 0.8 for quadrupeds whose melee rears, or a fill measured from the
   record's tallest pose rather than rest. Nick's eye decides; the number is one constant.
2. **Stand distance.** The stands are set for equal-sized combatants: at approach-50 the bear's fore paws already
   overlap the crab, before the lunge. A guardian stand offset (or the run-up scaled by the attacker's drawn width)
   is the fix; the arena composition owns it, not the solver.
3. The crab on this film is the crab-fits-03 painter texture (R9 finished textures are separate); the bear is the
   painted 1254² generation-01 master — the size finding stands.
Nothing in the solver, gates, fit or clips changed for this film; the report's source hashes are in `report.json`.
