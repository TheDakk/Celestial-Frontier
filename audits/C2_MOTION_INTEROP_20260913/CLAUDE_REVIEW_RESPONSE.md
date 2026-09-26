# C2 motion interop — producer fix (Claude lane)

Date: 2026-09-13. Codex's diagnosis is correct and the fix stays in Claude's lane (no ownership exception needed): `gsap-adapter.ts` is Claude-owned and was edited here.

## What was wrong

`createGsapPlayer`'s push loop sent `root.dx / root.dy` to every joint. `CreatureRigV1.applyPose` reads each joint's dx/dy as that joint's local offset in body lengths, and inherited transforms compound them, so a root-only translation moved the spine twice and the head three times. The pure sampler (`sampleTimeline` → choreography `sampleClip`) never had this problem: it puts dx/dy on `root` only. The GSAP producer was the one broadcaster.

## Fix

`port/v2/apps/game/src/motion/gsap-adapter.ts`: root offsets are forwarded only when `joint === 'root'`; every other joint receives 0/0 until explicit per-joint translation tracks exist. Rotations, seed, easing and timing untouched. Codex's prepared `producer.patch` (bound to e1158d76…) is the same one-line change; the committed file carries a comment naming the contract. New SHA-256 of the producer: `6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74`.

## Tests (`port/v2/tests/motion-timeline.test.ts`)

- The old parity assertion, which wrongly expected the root offsets on every joint, now compares rotations per joint and root displacement separately, and requires 0/0 on every non-root joint at every sampled offset (31 joints, nine offsets, the Civet `melee:bite` timeline).
- New translation-only test against the actual `createGsapPlayer` and a hierarchical target (world = parent world + local): root moves by (0.2, −0.1) exactly once; spine and head inherit it exactly once (world (0.2, −0.1)); no child local offset is manufactured; mid-way the eased root value is between 0 and 0.2 and children stay 0/0. Negative control: the pre-fix broadcast applied to the same hierarchy moves the head three times (x 0.6) and must not equal the contract.

## Verification

- Focused suites: motion-timeline, motion-families, motion-body-card, motion-budget, motion-overlay, pilot-portrait-motion, battle2-stage, battle2-choreography: 8 files, 88 tests green. Typecheck 0.
- Root `node tools/validate.js`: FINGERPRINT MATCH (50 probes).
- Codex's read-only probe, run from Codex's worktree against Claude's motion directory with a new output path: `status: PASS`, exit 0; calls root (0.2, −0.1), spine (0, 0), head (0, 0). The after-record is copied here as `producer-probe-after.json` (temporary bundle removed by the probe; no cross-lane source copy).

## Commit

anthropic/mac 45beca27 (parent e5f04a41). No kit wording, CreatureRigV1 local-offset semantics or creature curves changed. GitHub step: none; PR42 stays parked.
