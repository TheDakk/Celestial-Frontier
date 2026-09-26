# C15 — Codex prompt: finish the art + battle vision (Nick, 2026-09-25)

Codex, stop the weekly/economy work. Until the art and battle vision is done, it is your only focus. Nick's words: every generated
creature comes out in the painted art style; every Earth-like creature is properly painted and animated across the whole stage; and
the 2D painted battle plays back and forth, completely smooth, with all its animations.

**Where it stands (committed evidence):**
- **17 painted archetypes.** None added since D1 (the painting standing order, approved 2026-09-25).
- **Generated creatures:** 43% draw from a painting (`audits/PAINTED_STAND_INS_20260924/README.md`). The missing families are
  jelly, four-winged flier and sturgeon (~18%), then legless, biped and tripod alien bodies (~13%).
- **Earth species:** of 561 judged, 14 good, 93 caveat, 454 misleading. 53 more have no painted stand-in
  (`audits/COVERAGE_STUDY_20260924/README.md`, `painting-plan.json`).
- **battle2 plays real painted duels** with full-stage travel, offline. Phone tier: the Centipede costs +3.7 ms/frame at 4× CPU,
  ~2.4 ms of it in one WebAssembly orientation kernel (C12).
- **Pack headroom:** ~33 MiB for new paintings (about 8–15 archetypes). C13 (Claude's master-pin proposal) would free about
  13 MiB more.

**Order of work.** Keep going down it and commit signed after each item. Don't stop for approvals. Write status in TO_CLAUDE.md.

1. **Paint and rig in batches of ten; Nick reviews one sheet per ten (D1).**
   - First the three generated families: jelly, four-winged flier, sturgeon.
   - Then the Earth list from `painting-plan.json`: Wall Lizard, Cougar, Impala, Marmot, Bass, Cattle, Tang, Wolf, Gull,
     River Otter; then Brown Bear, Goose, Heron, Sparrow, Ibex, Reef Shark and on down the ranking.
   - Each painting goes on a PLAIN base coat with its own six-mask set (study rule 1). It follows `mustPaint`, passes your
     intake/anatomy chain, and gets its parts rig and motion.
   - Claude wires cards, stand-ins and the arena the same day it lands.
2. **Cheap wins, no new painting:** mask sets on existing paintings (Python → Garter Snake, King Snake, Boa; Beetle →
   Carrion Beetle).
3. **The 53 without a stand-in:** point their profiles at the specialized templates that already exist (crustacean-small,
   annelid, gastropod, bivalve, sessile-filter), then paint those templates in ranked order.
4. **Motion quality on every painted rig:**
   - The fighter crosses the full stage and back: approach, strike, recoil, return.
   - Contact is on the ground and nothing clips.
   - The idle cycle is smooth.
   - Tell Claude any archetype whose motion fails, so the stage never shows it half-done.
5. **Smoothness:** fix the Centipede orientation kernel (C12). Then every library pair must hold 60 fps at 4× CPU, with no raised
   allowance.
6. **Review C13 (master pins).** It frees the pack space the paintings need.

**Done when:**
- Generated coverage is ≥ 80% painted.
- No Earth species is "misleading" among the ranked top 35 (re-run the coverage judges on the new library).
- Every painted archetype passes the motion gates and the battle picker smoke.
- The phone-tier profile is green for every pair.

Measure each of these; don't estimate. Claude re-publishes the dev URL after each batch so Nick can play it on the iPhone.
