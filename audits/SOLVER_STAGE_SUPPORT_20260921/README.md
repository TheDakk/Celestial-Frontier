# Stage stride and published support — September21

Nick authorized two measured findings from Claude's merged E1 tree. This producer applies
the explicitly permitted minimum travel correction: `travel:stage` zeros both root dx and
local gait stride advance. Swing lift remains; default/solver-owned travel is unchanged.
No stage displacement exists in ContactPhase, so this does not claim arena-space planting:
Claude's185px arena test still needs stage-relative target input/adapter work. No invented
stage offset, reach clamp, clip or limit change is made.

`readCreatureRigContactSupport(rig,joint)` reads the selected observed support's actual
last-published ARAP/Float32 mesh vertex in normalized source coordinates. It returns null
before publication, for non-supports/non-skin rigs, and after disposal. Refused frames retain
the prior point. The binding-derived `surface:{partId,vertexIndex}` now accompanies the
existing weighted support model. Prediction arithmetic and the skin/weights are unchanged.
Claude can transform this point through its actor/stage matrix and compare the surface,
rather than treating an intentionally offset foot joint as the contact invariant.

Focused new support/stage and weighted tests passed6/6; stance5/5 after correcting the
assertion to a later gait cycle (the first planted group had zero advance in both modes).
The original failed fixture assertion and command-path errors remain in focused01/02 and
stance03 logs. The new test checks the accessor against the actual Pixi mesh buffer, proves
painted drift<=0.25px while joint drift>0.25px, and detects deliberate root translation.
App TypeScript PASS. Next: signed-producer S2 sweep once, five crabs bit-identical to R2c-prime,
Civet inside0.25px and exact rest. No input/mask/binding or source pixel was changed.

## Completed S2

Signed producer `cb1a667d` passed the one six-subject sweep. See [S2 ledger](S2_LEDGER.md). Five crab rows are bit-identical; Civet maximum row drift 0.165256373 px; exact rest and all presentation samples pass. No S2 halt.

## Coconut declaration correction

Nick’s painted `leg3Far` decision is applied to `audits/VISION_P1_COCONUT_20260920/hidden-01/fit-04/presence.json`, the current compiler anatomy input. Hidden is now only `leg3Near`; absent/folded are empty. SHA256: `41ecbcdfc2bbe926e635ca150b4839836198fcd782b240814f0a537101078026`. Focused inventory checks PASS (seven visible contact chains). All 35 existing sealed fit files, including historical record, landmarks, masks, bindings and rigs, remain byte-identical; see `coconut-declaration.json` and `coconut-presence-check.json`. No battery rerun.

## Ordered run stop

Step 1 producer `cb1a667d`, S2 evidence `1b3f4454`; step 2 declaration `20534d6d` — all signed and verified. Step 3 is retained in [D2 generation 01](../VISION_D2_GUARDIAN_20260921/generation-01/README.md): four visible legs, valid v2 presence, one unchanged tool output. **G1 size red: 1254 square returned against 1536 square requested.** G2 passes. No S2 red; no retry or silent resize. The full run stops with this accumulated packet. No push/fetch/merge/PR occurred.

Codex holds. Claude consumes the stage fix and published-support accessor, the corrected coconut compiler declaration, and the bear master/declaration for G3 diagnostics and G6. Full arena planting still needs stage displacement; G1 format is not accepted. Nick has no new scope/tier decision in this packet.
