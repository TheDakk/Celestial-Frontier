# Codex long-run program C243 ALL-OUT — 2026-10-11 (written by Claude for Dakk; SUPERSEDES PROGRAM_C243_20261011.md)

Dakk, 2026-10-11: "We need a bigger pass than doing this one by one, we need to get it all out."

C243 was a list of hand-picked defects. This program instead covers **every Earth species still uncovered**, as a batched loop that
runs until each one is either delivered whole or truthfully refused. Same contract as before: one run, no stops between batches; stop
only at a real gate (push / PR / label / hosted run / develop-main merge / release / deploy, a sealed-gate re-bind, a signing refusal)
or when the ledger is exhausted. Routine calls are yours.

## Ground truth: the gap ledger
`audits/C243_ALLOUT_20261011/gap.json` (made by `gap.mjs` beside it; re-run it after each of my registry commits): roster 631,
done 385 (283 certified + 102 pending), **gap 246 species**:
- **204 intake-refused**: every packet in the sweep-5 pilot refuses on what the master contains (missing-anatomy 227 packets,
  unexplained-anatomy 123, no-reference 56, extra-anatomy 50, wrong-family 31, family floor/sprawl/ground 49, facing 16). Motion
  or finish fixes cannot move these; **the painting has to change.**
- **38 admitted, not accepted**: static or native holds, plus my visual holds (the old C243 list).
- **4 with no master**: Tree Frog, Jellyfish, Starfish, Tarantula.

Largest families: quadruped 50, fish 33, insect 31, bird 26, crustacean-small 13, hopper 12, radial 11, primate 10.

## The loop (one batch ≈ 30–40 species, largest refusal family first)
1. **Repaint (track R)**, for every intake-refused species in the batch:
   - Compile a prompt with the canonical compiler, ART_KIT and Atlas, and the native 1254-square generator, with exact generator bytes as in your C287 repaints.
   - The prompt names the parts that the refusal says are missing or unexplained, the required facing, and the family pose. Do not
     loosen the ruler, the margin ruler or the conservation checks.
   - Generate **up to 3 candidates** per species and score each with `score-batch.mjs --no-native`.
   - Keep the best ADMIT. If all three refuse, log the refusal classes and move on; the species returns in the final sweep.
2. **Class fixes (track M)**, applied to the batch's admitted species. These are the old C243 phases, now done in the batch where
   they matter, not as separate phases:
   - Magenta key inside fine structures, fixed in keyed intake. Moth, Bee wings and head, and the Water Beetle hairs.
   - Distal antenna segments follow their chain in every action. Carrion Beetle, c196 Water Beetle, Springtail.
   - Seams, strands and fragments: Egret hit-reaction seam, Monkey, Kinkajou, Cockatoo, Buffalo c192 and g2c136, Water Buffalo,
     Okapi, Beluga, River Dolphin.
   - Compression and hidden-anatomy holds: Gorilla, Osprey, Howler, Kookaburra, frogs. A truthful refusal is acceptable.
   - The largest static RED class, transferred missing-part paint, fixed by class. The 8 mutation refusals keep refusing.
3. **Film and finish, in your reservation.**
   - Native-film every static PASS.
   - Run the AI finish chain on every native PASS: `finish-batch → rebind-batch → native.mjs` from `AI_FINISH_C121_20261001`.
     Every subject carries `nativeReport`; use the manifest creatureId as the subject id.
   - This moves the finish from my window into yours, so a batch arrives ready for review.
4. **Triage**: run `node audits/G1_AUTO_AUTHOR_20260926/bulk-review.mjs <batchdir>/triage <finished native-01>`.
   - The triage counts magenta pixels in all five review frames, flagging ≥5 (controls: Moth 122, Bee 638, Water Beetle successor 41; accepted films 0–3).
   - Fix or drop each flagged film before you call it whole.
5. **Deliver**: one signed commit and one TO_CLAUDE row per batch.
   - The row gives the species list, static before/after on the batch, and native and finish PASS counts.
   - Commit, for each finished candidate, `turn1-hit-reaction-50`, `turn2-dodge-reaction-50`, `turn3-hit-reaction-50`,
     `turn3-hit-idle-50`, `turn3-hit-idle-90`, plus the triage `triage.json` and sheets.
   - Then start the next batch at once. Do not wait for my review.

I review every batch as its commit lands, at full size including the reaction frames, and post ACCEPT/HOLD per species in
TO_CODEX. Fold my HOLD species back into your next batch, treating each hold reason as that species' refusal for re-paint or class
fix. Admission stays mine.

**Final sweep.** After every gap species has had one pass:
- Give every species that is still unaccepted a second round: three more candidates with the hold or refusal reason added to the
  prompt, then that species' class fix.
- Paint the 4 no-master species.
- End with a full 457-packet (+ new) static measure on the sweep-5 pilot plus your new candidates, and a TERMINAL row listing
  every species still uncovered with its truthful reason.

## Throughput and machine rules
- **One reservation for the whole run**; the reservation row goes before the first image or native job, and TERMINAL at the end.
  I do no native or heavy work while it is open. My review is read-only of your committed stills.
- Keep ≥ 30 GiB free. Delete your own uncommitted intermediate candidates, never committed evidence.
- Commit only the selected candidate per species, not the two losers (record their scores in the batch row).

## Standing rules
- Limits stay unchanged.
- All-pairs stays HOLD.
- Never re-bind a sealed gate without saying so.
- Signed commits only.
- No PR, label, hosted run, develop/main merge, release or deploy.
- Refer to the owner only as Dakk/TheDakk; write home paths as ~/; relative symlinks only.
- Add any new finish-client module to the served list in `finish-batch.mjs`.
- Certification and the C223 fold fix run only under a TO_CODEX row that records Dakk's explicit authority. The fix is still valid:
  C234 did not touch `release-content.ts` or `slicesmoke.mjs`.
