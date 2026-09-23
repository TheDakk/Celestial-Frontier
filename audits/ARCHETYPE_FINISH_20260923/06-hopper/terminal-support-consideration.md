# Terminal painted support — considered, not implemented

Status: **UNIMPLEMENTED**. Nick's current repair proceeds with bounded source-art/observation correction first. No terminal-contact production mode, new solver, foot-angle search, support selector, gate or threshold has been introduced by this proposal. The feasibility review performed source and binding-data inspection only, with no pose or solver execution.

## Current limitation

`observedContactSupports` in `port/v2/apps/game/src/creature-rig-contact.ts` chooses a rendered vertex on the chain.end owner (Ankle for Hopper). The existing two-bone solve plants that surface and counterrotates terminal Paw by `-lower`, holding its world rotation delta at zero. Thus the visible pad-bearing terminal foot is not the selected support authority, despite terminal Paw limits remaining enforced. Releasing faint forefeet solely to avoid those limits would not establish a truthful replacement support policy.

## Possible exact reduction

For an explicitly selected Paw-rigid painted support P, rest ankle A, desired fixed support Q, and a chosen foot world rotation delta psi:

1. Set desired ankle A-prime = Q minus R(psi) times (P minus A).
2. Use the existing unchanged two-bone solver for hip to knee to A-prime.
3. Compute the solved lower-bone world rotation delta thetaLower. Set the terminal local angle to wrap(psi minus thetaLower).
4. Independently enforce every original hip/knee/ankle/Paw limit, rest segment length, reach condition, shared root-compression bound, and the existing 0.25-pixel planted-paint tolerance.

This is a three-joint planted-support problem with one remaining degree of freedom. It is not permission to clamp a rejected joint, move a fixed contact, relax a gate, or replace the actual image geometry. A deterministic foot-rock selection policy, continuity across samples/phase boundaries, and truthful support-surface clearance are necessary before implementation. Keeping one selected point planted does not prove other toes avoid penetrating the ground. Body/sole collision assumptions must remain explicit; a speculative success on a convenient point is insufficient.

## Fit03 data feasibility

Record recipe `a5110a56f4ed6757bb0c9f9c3fd194fd5ec4c8b82d5787d14c018c9d7d23ba27`; binding `2fba5ff7a18a3153c08225212d47ab0d378494aa633e26b614d95279a1d91453`; master coordinate space 1254 by 1254. Counts below were measured directly from the immutable JSON binding. An eligible rendered vertex has every nonzero barycentric contributor weighted exactly 1 to its Paw and present in the existing solver pin inventory.

| Paw part | Eligible rigid, pinned rendered vertices / total | Nearest eligible rendered vertex to authored Paw landmark |
| --- | --- | --- |
| far-hind-foot | 73 / 107 | index78, (175.5, 646.5), 10.511898020814346px away |
| far-front-foot | 16 / 55 | index42, (1194.5, 685.5), 63.65924913160695px away |
| near-hind-foot | 75 / 101 | index47, (195, 861), 4.242640687119286px away |
| near-front-foot | 13 / 65 | index52, (1057, 744), 71.02816342831899px away |

Both forefoot vertices nearest the authored Paw landmark are mixed-weight and unsuitable for the exact rigid formula. The eligible points above are feasibility witnesses, **not selected or approved ground contacts**. Selection must follow the actual observed pad/sole and support trajectory, not whichever vertex permits a solve.

## API and evidence requirements if revisited

- Explicit opt-in family contact mode; preserve the default/S2 path unchanged.
- Distinct terminal-rigid eligibility. The current endpointOnly check specifically requires chain.end weights; mixed terminal weights cannot be reclassified as rigid.
- Retain the chain end identifier while explicitly identifying the supportJoint and source part/vertex. endpointTarget becomes the solved anatomical ankle; paintedTarget remains the actual planted terminal surface.
- `creature-rig.ts` reads the surface chosen by observedContactSupports. Static/native contact observers must consume that same selected source vertex; the old chain.end-part lookup cannot certify a new Paw-support model.
- Preserve actual published-mesh inspection, independent length/limit/contact checks, original refused evidence, exact rest, continuity, and unchanged S2 receipts. No acceptance is established by this note.
