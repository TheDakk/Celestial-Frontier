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
