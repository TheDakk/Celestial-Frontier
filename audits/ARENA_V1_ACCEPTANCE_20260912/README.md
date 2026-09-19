# Accepted arena v1, one MID intake pass, Pixi 8 emitter correction

Nick accepts the three arena masters from75a5c4a4 as Earth temperate arena template v1.
acceptance.json is the current acceptance record; the older v4.2 capture/intake receipts
remain historical. Wild shapes/phases are accepted; its palette is rejected as Frost.
No current Wild image is marked fully accepted. Keep its per-phase anchors as fallback.

![Accepted arena composed with corrected MID copy](arena-template-v1.png)

One intake-only pass on a copy changed exactly190 RGB pixels and zero alpha pixels.
All original masters remain hash-identical. The correction uses nearest clean opaque
neighbours within a fixed32-pixel search; no repaint, re-keying or additional erosion.
The initial guard found212 total residual pink edge pixels and wrote no image. Read-only
reconstruction of the original keyer's no-neighbour cases selected the authorized190;
the other22 residual pixels were untouched. despill-receipt.json records every changed
pixel and sampled neighbour. This is not a claim that every possible pink pixel is gone.
The corrected PNG and composite are derivatives; original key-painted/opaque masters
remain in ../ARENA_EFFECTS_V42_PROOF_20260912/.

@pixi/particle-emitter5.0.10 and37 unused transitive packages are removed. No peer override,
new renderer or Pixi downgrade. SeededBattleEmitter on the existing Pixi8.19.0 container
supports bounded travel/impact recipes, stable seeded coefficients, absolute-time replay,
200-particle maximum, explicit texture ownership and disposal; no internal ticker or RNG.
Three tests manipulate actual Pixi objects and prove frame-rate/seek replay and refusals.
This is not a browser GPU/performance or battle-wiring certificate. Initial root test
placement pulled Pixi's duplicate WebGPU types into the strict domain config; moving the
rendering test alongside existing app Pixi tests uses the existing app type boundary.
No skipLibCheck flag or other test setting was changed. Two despill tests, full v2 typecheck
and root validate passed. No checkout lock in unit tests. No production pack or hosted run.

SOUND_KIT.md now says APPROVED v1 in two metadata labels; frozen paragraphs unchanged.
Motion/Sound frozen-paragraph approvals are recorded in kit-approval.json. The revised
Motion Kit with world-life and ARENA_EFFECTS_REVIEW_20260912.md are missing at the supplied
locations and in Downloads; a path question is pending. Earlier Motion Kit remains intact.
V43_PENDING.md preserves the known Wild row and remaining instructions. No fabricated
review table, world-life prose, Wild repaint, source recording, voice derivation or parts-rig
staging. Next: receive files, propose complete v4.3 diff, stop for Nick's approval. Then the
already authorized one repaint, body-card proof, first sound sources and staged captures.
GitHub none; PR42 parked. No release or deployment.
