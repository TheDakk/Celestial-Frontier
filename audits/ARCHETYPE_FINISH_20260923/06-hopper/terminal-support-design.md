# Pure terminal-support IK candidate planner

The new `port/v2/apps/game/src/creature-terminal-contact.ts` supplies mathematical candidates only. Runtime contact selection/integration remains separately owned by the parent task. It does not change any existing family, solver, joint limit, compression budget, accepted binding, S2 input, or contact threshold.

## Source authority and physical meaning

The intended optional record authority is `geometry.contactPads`, schema `cf.terminal-pad-support/v1`, containing explicitly authored normalized adhesive-pad points keyed by chain.end. That proposed record opt-in belongs to the integration owner. Old records retain their existing path.

A Frog's painted feet sit at different perspective depths. The current contact contract plants individual source-observed points; it never certified an invented flat floor or whole-sole terrain collision. A proposed terminal pad is an adhesive pivot on actual painted toe/pad tissue. It must be represented by the original rendered geometry with rigid, hard-pinned Paw contributors; mixed weights are not an exact rigid terminal support. The parent must retain the selected source part/vertex or interpolated rendered triangle and measure that same published surface. A mathematical candidate is not evidence that an arbitrary selected point is an actual pad.

This mode does not drop faint's forefoot contacts. It changes which independently observed painted point is planted and lets the existing terminal joint rotate within its original limits. Whole-foot/terrain clearance would be a separate physical model, not an unannounced gate in this planner.

## API

`createTerminalContactSolver({root:H, joint:K, end:A, support:P, bend, limits:{knee, end, terminal}})` snapshots points and angle intervals. Coordinates use the caller's source coordinate system; all angles are radians. `bend` is the original anatomical H-to-A / H-to-K cross-product sign, identical to createTwoBoneChain's convention.

`solve({root:posedHip, target:plantedPaintQ, parentRotation})` returns:

- `status: solved` with the preferred candidate fields and a `candidates` array containing all independently admitted candidates in priority order; or
- `status: refused`, `reason: no-admitted-candidate`, an empty candidate array, and per-attempt reasons.

Each candidate reports its mode, local knee/end/terminal rotations, independently reconstructed H/K/A/P points, foot world rotation delta, support residual and three link-length errors. Parent rotation is the actual inherited hip frame orientation, not the local hip joint angle. Parent/root admission and shared root accommodation stay with the existing owner.

The parent may select the first candidate satisfying its own unchanged program/source-support requirements. Rejecting all candidates remains a refusal. The planner cannot turn such a refusal into changed limits or a different support.

## Analytic candidates

The preferred foot world rotation delta is zero. Desired ankle is `Q - (P-A)`; the unchanged existing two-bone solver supplies H/K/A. Local knee/end rotations follow their rest vectors, and terminal rotation is minus the solved lower-bone world delta. The original anatomical bend and all three supplied local-angle bounds must hold.

For each active terminal boundary `tau` (minimum and maximum), combine the lower leg and rigid terminal support into the effective vector `v = (A-K) + R(tau)*(P-A)`. Its length supplies a virtual second bone. The existing `createTwoBoneChain` primitive solves each of its two analytic bend branches, using canonical virtual triangles that carry only the original upper length and this exact effective length. The virtual triangles are internal algebra, not authored anatomy or changed landmarks.

Recover the lower world rotation delta as `angle(Q-Kprime) - angle(v)`, then recover the original local knee/end angles and retain terminal angle `tau` exactly. Forward reconstruction uses the original upper, lower and terminal vectors. Reject changed anatomical elbow sign, any original limit violation, nonfinite values or a reconstruction error beyond floating-point roundoff. The numerical reconstruction check is `128 * Number.EPSILON * max(1, coordinate magnitudes, original link lengths)`; it is not the production 0.25-pixel contact gate and cannot relax that gate.

Candidates sort preferred first, then by smallest absolute world-foot rotation, then terminal-min before terminal-max. Equal candidates retain deterministic branch enumeration order. No returned joint is clamped to make it fit.

## Continuity and deliberate limitations

At a nonsingular transition where the zero-world-foot solution first reaches a terminal limit, its configuration also satisfies the active-bound reduction. Matching anatomical branches meet continuously; the focused test crosses that boundary from both sides and independently reconstructs support and lengths. Mirroring tests the opposite handedness and terminal boundary.

There is no universal continuity guarantee at straight/folded singularities, a feasible branch disappearing under another joint limit, or ties between separated active-bound configurations. This stateless deterministic planner does not hide those conditions with smoothing. Parent qualification must inspect actual full motion and source contacts.

The candidate set is intentionally bounded: zero-world-foot orientation and the two terminal-angle boundaries. It is **not** a complete three-link IK search. A feasible configuration controlled by an interior terminal angle and an active knee/end bound may be absent. `no-admitted-candidate` is therefore not a proof of global mathematical infeasibility. It must not trigger a wider search or a relaxed threshold automatically.

## Focused validation

One run: `npx vitest run apps/game/src/creature-terminal-contact.test.ts` in `port/v2`; **7 tests passed**. Evidence: `terminal-contact-test-01.log`.

Tests verify exact rest, active-terminal-bound outcomes without clamping, local boundary continuity, mirrored anatomical bend, moved hip with inherited parent orientation, unreachable/all-limit/opposite-branch refusals, source snapshotting and invalid inputs. Expected support coordinates and all three lengths are independently forward-reconstructed from returned rotations. No native film, ARAP solve, full static row, broad test battery or CPU certificate was run by this subtask.
