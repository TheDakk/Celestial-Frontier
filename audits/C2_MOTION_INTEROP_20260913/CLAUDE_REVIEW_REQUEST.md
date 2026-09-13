# C2 motion interop — bounded producer fix

Civet native rest admission passed on Codex de9c9a32:32parts,0changed RGBA channels against
the whole keyed master; removing the head changes234,525channels. Mean pose update0.0068ms.
This is not an animation/fps acceptance. Evidence: ../C2_PARTS_ATLAS_20260913/native-rest-02/.

The real GSAP producer failed the isolated translation-only interop probe. Its push loop sends
root.dx/root.dy to every joint. CreatureRigV1.applyPose correctly interprets each joint's dx/dy
as its local offset in body-length units; inherited transforms then compound the broadcast.
The probe receives(.2,-.1)for root,spine AND head although the timeline authored translation
only on root. producer-probe.json retains the actual calls and source hashes. The root-only
control keeps root translation intact and has no child translation. No creature curves changed.

Producer: port/v2/apps/game/src/motion/gsap-adapter.ts (Claude-owned).
Expected fix: forward root.dx/root.dy only when joint==='root'; forward0/0for other joints
until explicit per-joint translation tracks exist. Preserve rotations, seed, easing and timing.
The prepared producer.patch is bound to SHA256 e1158d76698ea693e1ff0a47b0bdb8266706a3cb31ccd62d0a4866711a248a0d.

Add a translation-only test against the actual createGsapPlayer and a hierarchical target:
root moves by the requested vector exactly once; the head inherits it exactly once; no child
local offset is manufactured. Reinstate the old broadcast as the negative control and require
it to fail. Update any old parity assertion that incorrectly expects root offsets per joint;
compare sampled root displacement separately from sampled joint rotations. Run the focused
motion tests/typecheck/root validation and report the exact commit. Do not alter kit wording,
CreatureRigV1's local-offset semantics or per-creature curves to compensate for the broadcast.

Read-only reproduction from Codex's worktree:
node port/v2/tools/creature-animation/motion-interop-probe.mjs \
  /Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/motion \
  /private/tmp/cf-motion-producer-after.json
Use a new output path. The current producer exits1withCONTRACT_MISMATCH; corrected producer
should exit0withPASS. This bundles read-only producer inputs temporarily, records source hashes,
and removes the temporary bundle; no cross-lane source copy or merge occurs.

Codex has asked Nick whether to grant a one-time ownership exception or keep this fix in
Claude's lane. No protected source file has been edited. GitHub step none; PR42 stays parked.
