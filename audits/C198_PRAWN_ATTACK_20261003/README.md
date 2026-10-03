# C198 — observed Prawn foreleg strike

Status: product candidate ready for the combined signed/native checkpoint. No native run,
performance certification, gallery admission or full visual acceptance is claimed here.

## Reproduced failure and source-supported correction

The unchanged C196 Prawn fit is
`audits/C196_SPECIALIZED_REFERENCES_20261003/01-prawn-contours/fit01`.
Its recipe is `d72e88d53aca2b1dcd02dc94a74fc0af2f5c45d611975f8ce3f51125b22edc07`,
binding `1e7428610a44b61cdcbdb5e1dcc9498239d4f6e7eb9debd041eff0b0866d7756`.
The source, all anatomical owners and landmarks, keyed pixels, material, presence,
rig, bounds and ground line remain untouched.

`baseline.json` retains both original failures: generic melee refused
`motion: no admitted crustacean-small melee for weapons []`; anatomy selection had
no admitted move. The source has both front root/knee/foot chains, but no independently
authored opposing fixed/dactyl fingers. The correction is explicitly a **Foreleg tip
strike**, not a pincer closure.

The existing `claw` capability/verb now has one water-only `crustacean-small` row.
Both front chains plus head/thorax must exist. The five-name shrimp/prawn intent group
is separated from the remaining small crustaceans; no Krill, Copepod, Water Flea or
isopod weapon is invented. Procedural cards still require the exact record-bound
observed weapon declaration. D31 remains limited to its existing four families.

`motion/small-crustacean-attack.ts` rotates the existing two front chains toward the
painted forward axis, with source-handed signs. Upper/distal turns are bounded at
12/18 degrees under the unchanged limits. Anticipation reverses 60% of the extension;
strike reaches contact, the smear holds it, recovery returns exactly. Root and all
other appendages are fixed. There is no source stretch, new joint, altered solver,
relaxed numeric allowance, species-specific angle or explicit-editor substitution.
The stage still owns approach, impact presentation and return.

The actual medium-mass Prawn contact is `leg0NearFoot` at230ms: anticipation140,
strike90, smear16.6667, recovery260ms. The near tip starts at source[821,674], gathers
3.44px backward and reaches3.54px forward; the far tip gathers5.21px backward and
reaches6.40px forward. These are **posed1254-square source-coordinate skeleton
pixels**, not native screen pixels or independent surface-contact measurements.
The small front-leg excursion is deliberate; native film must judge readability
alongside the stage's full approach/return.

## Verification

- Final focused unit run:35 PASS in five files. The C198 test reproduces the old
  empty-weapon failure, checks both attack-selection paths and the battle turn,
  missing near/far chains, wrong medium, unrelated profiles, stale procedural
  declarations, degenerate axis/segments, mirrored geometry, fixed other chains,
  zero clamps and exact recovery. A zero-motion mutant fails the same extension
  oracle. Anatomy/pincer/D31/profile controls remain green.
- All three TypeScript programs PASS (`typecheck-02.log`).
- Existing static owner:12 actions ×121 samples =1,452; full presentation823
  samples. All PASS, exact rest, zero changed visible source RGBA channels.
  Established0.25px painted-contact and1e-8 endpoint limits remain unchanged.
- All11 prior Prawn non-melee timelines and200 timelines across17 retained
  prior-family fixtures are byte-identical as serialized JSON. The baseline's
  signed zeros serialize as ordinary zero; comparison uses exact serialized bytes.
- Actual publication:5 poses ×2 facings, byte-compared against loaded
  `CreatureRigV1`. Existing contact/skin/ARAP/rigid-parent pipeline and seam guard
  are used. No fit files are copied, modified, rebound or replaced.

`tests-01.log` preserves the first run's32 PASS/3 harness failures: the synthetic
Earth-name-free Prawn clone lacked explicit aquatic habitat, and two assertions
compared signed zero against the JSON baseline's ordinary zero. These were corrected
without changing motion or limits. `tests-02.log` passed35; `tests-03.log` passed35
with the stronger same-oracle zero-curve control and recovery outcome assertion.
No static/native failure was retried. The first main-program typecheck and final
three-program typecheck both passed.

## Full-size software review and remaining holds

Inspected the original retained master, rest-left, anticipation-left, strike-left and
strike-right at full size. The two front limbs remain visibly connected, extend and
recover without a newly detached tip in these inspected poses; the other legs and
body remain still. Both strike facings preserve the same anatomy. Inherited pink
fringe on swimmerets and fine antenna edges remains visible. The broad glossy art
hand is unchanged. These software rasters and their red reference line are not
native stage grounding, a full film, frame-rate evidence or gallery admission.

Exact review paths are `motion-melee-claw-0-left.png`,
`motion-melee-claw-28-left.png`, `motion-melee-claw-45-left.png` and
`motion-melee-claw-45-right.png`. Additional80%/100% and opposite-facing images
are retained for review. Native battle evaluation belongs to the parent-controlled
combined epoch after signing; no browser or native command ran in this queue.

## Handoff

Source changes: `anatomy-attacks.ts`, `earth-fauna-profiles.ts`,
`motion/specialized-actions.ts`, `motion/timeline.ts`, new
`motion/small-crustacean-attack.ts`, and the three relevant unit-test files.
`body-card.ts`, `family-actions.ts`, D31, anatomy/paint inputs, guards and limits
remain unchanged. ATTACK_ANATOMY, MOTION_KIT and the codebase reference are refreshed
in the same batch. There are34 measured physical rows in14 families and87 current
profile groups; the old83-group documentation count was stale.

The parent owns release copy and its exact Guide/slicesmoke checks, root validation,
Git/signing, mailbox/ROADMAP, certificate/gate work and the single combined native
window. No source pools, sibling files or Git state were changed by this queue.
All recorded home paths use `~/`; there are no symlinks in this packet.
