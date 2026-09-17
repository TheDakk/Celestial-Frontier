# Claude review — R1/R2 native evidence (`r1-r2-native-01`), 2026-09-17

Reviewer: Claude (anthropic lane). Read-only review of the Codex worktree
`/Users/nick/Projects/celestial-frontier-openai-mac`, evidence commit `57dfe112` on producer
`6b11407d`, approved plan `9769d299`. Inspected: the full R1/R2 source diff (`9769d299..6b11407d`,
20 files, +763/−213), `r1-r2-static-01/README.md`, all eight `report.json` files, before/after
montages and 3× crops of the crab and cranberry stills, and ffmpeg frames from the four films.
No edits to either lane, no sync, no tests run, no GitHub writes.

## 0. Integrity — verified
- Chain `9769d299` → `6b11407d` → `57dfe112`; producer diff is exactly the 20 claimed files; nothing
  in reserved areas, kits or masters. Both commits carry signatures. All eight reports name producer
  `6b11407d`; 794 unique inputs re-hashed. The README matches the JSON (per-clip rows, drift values,
  fold count, stack). Failures are carried as failures; the "12 actions" alias caveat is honest.

## 1. What R1/R2 genuinely fixed (visual, not numeric)
- **Cranberry** (`cranberry-native-03` → `-04`): the disturb-155 smear is gone; every 25/50/75 still
  and all eight film frames show an intact plant. First flora capture with no tear or smear.
- **Crab scuttle/dodge** (`crab-native-02` → `-03`): legs on the ground in every frame; floating
  splay gone; no legs crossing through the carapace.
- A8 closed correctly: `overlay.ts` re-exports `buildActionTimeline` from `timeline.ts`; the parity
  test covers sway, mirroring and pincer scales.

## 2. Findings

| ID | Sev | Location | Finding | Repair | Proof |
|---|---|---|---|---|---|
| **N1** | **High** (root cause) | `specialized-templates.mjs` brachyuran `bodyAxis:['root','carapace']`; `creature-rig-contact.ts:155-157`; `amplitude-profile.ts:263-268`; `skeleton-pose.mjs:32` | Every body-length-relative quantity uses `bodyLength = |root→carapace|`, which for the Crab record is **0.0416** of the image (the `body` bound min is 0.04 — it passed by 0.0016). Computed from `crab-fits-02/crab/record.json`: swing lift = min(body·0.035, reach·0.025) = **1.28 source px**; swing stride = ±**0.55 px**; hit root dy 0.015 body = 0.5 px; leg amplitude scale = 0.5/(bone/0.0416) ≈ 0.36. That is why the four passing films are effectively static: scuttle 25/50/75 and pinch-50 are pixel-indistinguishable in 3× crops. The same reference shrinks Cranberry (low mat, short root→trunk). | Give each template a declared **scale reference** that is physically meaningful (brachyuran: leg-root span `leg0FarRoot↔leg0NearRoot` or carapace width; plants: painted canopy extent or trunk+longest branch), carried on the card as `scaleLength`, used for lift/stride/amplitude; keep `bodyAxis` for bounds. Raise the brachyuran `body` bound floor so a 4 % axis refuses. | Negative control: today's Crab axis must refuse or report scale < 10 % of painted extent; re-capture shows lift ≥ ~15 % of lower-leg length. |
| **N2** | **High** | `creature-rig-contact.ts:156-157`, `specialized-actions.ts:24`, `amplitude-profile.test.ts:241` | No readability floor: the "minimum motion" test asserts any joint > 0.001 rad, satisfied by an invisible gait. `approach` still has root travel 0, so even a correct stride walks in place. Codex's own note ("faint remains a subtle body lowering") confirms C3 open. | Define stride/lift as fractions of leg reach (not body length); give `approach` a root travel per cycle equal to the stride so stance feet stay planted while the body advances (S3 as approved). Add a readability control: peak foot displacement ≥ N % of leg reach; peak carapace displacement in faint ≥ N % of carapace height. | Outcome test on all five crabs; 25/50/75 stills that differ visibly. |
| **N3** | Med | `native-entry.mjs` `paintContacts`/`checkContactPaint`; Mud 0.256 px, Vent 0.253/0.269/0.309 px vs 0.25 | The gate samples the skin vertex *nearest* the endpoint landmark; that vertex carries diffused weights (`smoothSkinWeights`), so it moves a fraction of a pixel with the knee even when the bone endpoint is exact (bone error 4e-16). The failures are real per the gate, but the gate measures a weighting artifact, and 0.25 px has no derivation (contrast the seam epsilon, derived from Float32 ulps). Do not relax it. | Pin the contact vertex at split time: for each declared contact endpoint, weight the nearest endpoint-part vertex `[[end,1]]` (extend `splitObservedSurfaces` pins to contact endpoints). Then 0.25 px is exactly achievable and the gate measures contact, not diffusion. | Mud/Vent dodge/hit pass at the same threshold; an unpinned mutant fails. |
| **N4** | Med (instrument) | `native-entry.mjs` `motionFrames()` → `motionBounds` runs the 601-sample presentation **before** the per-action gates | Persimmon threw 132 folded triangles inside framing, so the report has no action id, time or per-action rows — the failure most in need of diagnosis has the least data. | Run per-action rows first (or record `presentedPose(ms).name`/ms in the framing failure), then framing. | Persimmon re-run names the folding action and time. |
| **N5** | Med | Devil's Club 2.0–3.4 ms / 4,130 field vertices; Cranberry 1.9 ms / 3,417 | Expected from S5; a desktop pass at 1.9 ms is a phone fail by 2×. Not an R1/R2 defect; it is the R8/Q4 question. | — | — |
| **N6** | Med (process) | `amplitude-profile.ts:268` applies `min(1, 0.5/max(0.5, ratio))` to every template's `legs` group; `library-amendment.json` records a changed 169-action hash | The plan required native sentinels only "if affected paths changed" — the shared timeline changed for all families. Static parity passed; no quadruped/frog/bird/Skink/Beetle native re-capture exists on this producer. | One Civet or fox native sentinel before R3. | Sentinel report on the corrected producer. |
| N7 | Low | `creature-rig-contact.ts:148` | Solver zeroes every leg `Root` rotation and overwrites Knee/End, so the authored `legs` keys in `specialized-actions.ts:12` (and the `.25` factor added this batch) are dead under the solver. | Comment or remove. | — |
| N8 | Low (visual) | `crab-native-03/approach-scuttle-25.png`, `dodge-50.png` (3× crops) | Thin stair-stepped/streak fringes on the far-left leg strokes — sub-pixel quadratic strokes sampled through a deformed mesh with `antialias:false`. Pre-existing, not R1/R2, but visible. | Later: mesh edge padding / antialias policy in the arena renderer. | — |
| N9 | Info | `amplitude-profile.ts:267` | Plant scale clamps to [0.08, 0.5]: authored plant angles can never exceed half. A kit-level constant now; once Nick accepts the look, write it into Motion Kit §4. | — | — |
| N10 | Info | `creature-rig-contact.ts:141` | `free` regex exempts `:(flight|fly|swim|jet|hop|leap|climb)$` and `melee:kick` only. A bird `melee:claw` (talon strike) and hopper kick variants will get both feet pinned; check when those templates are re-captured. | — | — |

**Q4 kit paragraph:** approved as proposed — it says "declared joints" (matching the code's
vocabulary), keeps the 4 ms / 30 fps / two-combatant scene gate, and makes the vertex cap provisional.

## 3. Verdict
R1/R2 removed the two visible failure modes (tears, floating legs) and replaced them with one
invisible one: the motion is now correct and unreadable, and N1 explains why with a number. That is
a bounded correction, not a rework — the contracts are right, the scale reference is wrong.

**Recommendation:** do not open R3–R8. Authorize one **R1b/R2b** correction limited to N1–N4
(+ the N6 sentinel), then the same eight-subject re-capture on the unchanged producer, then Nick's look.

## 4. Copy-ready direction for Codex
```
Claude's R1/R2 evidence review is at
/Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1R2_REVIEW.md
(read-only; do not sync). Q4 kit wording: APPROVED as proposed.

R3–R8 stay closed. Authorize one bounded correction, R1b/R2b, limited to:
  N1  template-declared scale reference (leg-root span / canopy extent) replacing root→carapace /
      root→trunk body length for lift, stride and amplitude; raise the brachyuran body-bound floor.
  N2  stride/lift as fractions of leg reach; approach root travel equal to stride per cycle; a
      readability floor control (foot displacement ≥ share of leg reach; faint/hit body displacement).
  N3  pin the declared contact-endpoint vertex at split time; keep the 0.25 px gate unchanged.
  N4  per-action gates before presentation framing so a fold names its action/time.
  N6  one quadruped native sentinel (Civet or fox) on the corrected producer.
Static checks → sign → eight-subject re-capture (new numbered folders) → stop for my review.
No other rows, no threshold relaxation, no kit edits beyond the approved Q4 paragraph, no push.
```

## Coordination
- **Nick:** owns visual acceptance; the Q4 paragraph is approved by this review only as a
  recommendation — the kit edit itself still needs Nick's word.
- **OpenAI/Codex:** R1b/R2b as above; no R3–R8; PR42 parked; no push.
- **Anthropic/Claude:** idle until the re-capture; E1 runtime integration remains queued for this lane.
