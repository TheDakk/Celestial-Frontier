# D2 G6 — the first guardian on the battle stage (2026-09-22)

The Brown Bear (Codex's signed comparison fit `audits/VISION_D2_GUARDIAN_20260921/fit-01/`, producer `1ff30009`)
plays on the real battle stage with the guardian frame fill (`GUARDIAN_FRAME_FILL = 0.9` of the frame height, an option
of `combatantScale`, taken when the record carries a `guardian` block). Native film (Edge over CDP,
`tools/battle2-proof/native-runner.mjs`, rest supports — the stage's default; Claude's review of the static RED is
`audits/VISION_D2_GUARDIAN_20260921/G6_CLAUDE_REVIEW.md`):

| Film | Left | Right | Attacks | Refusals | CPU p95 | Verdict |
|---|---|---|---|---|---|---|
| `bear-vs-crab-01` | Brown Bear, guardian fill, family solver, cadence approach (reach 0.120) | crab (crab-fits-03) | claw (foreNearPaw) ×2, dodge | **0 / 0** | **3.10 ms** (guardian tier gate 5 ms; painted tier 3.5) | **DIAGNOSTIC_PASS** |

Stills: `turn0-hit-approach-50.png` — the bear at 0.9 of the frame walking its planted cycle, head at the HUD band;
`turn0-hit-impact.png` — reared on the hind legs, fore paw on the crab (bleached by the hit flash by design).

## Findings for the eye (Nick), not defects of the gates
1. **Headroom when rearing.** At 0.9 fill the standing bear touches the HUD band; when the claw attack rears it,
   the head leaves the frame top. Options: fill 0.8 for quadrupeds whose melee rears, or a fill measured from the
   record's tallest pose rather than rest. Nick's eye decides; the number is one constant.
2. **Stand distance.** The stands are set for equal-sized combatants: at approach-50 the bear's fore paws already
   overlap the crab, before the lunge. A guardian stand offset (or the run-up scaled by the attacker's drawn width)
   is the fix; the arena composition owns it, not the solver.
3. The crab on this film is the crab-fits-03 painter texture (R9 finished textures are separate); the bear is the
   painted 1254² generation-01 master — the size finding stands.
Nothing in the solver, gates, fit or clips changed for this film; the report's source hashes are in `report.json`.
