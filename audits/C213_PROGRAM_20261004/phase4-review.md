# Phase 4 source successors — diagnostic review, 2026-10-04

Sixteen changed ownership fits pass static and native numerics. The unchanged D28 island cap remains 0.5; no solver/contact/triangle limit changed. The adapter for Nilgai, Impala and Bee validates their exact old raster declaration, old keyed RGBA and ownership before applying the same island rule. The raw master and alpha remain unchanged. Derived edge RGB can change under the separately tested narrow-edge keyer; the adapter's sourceRgbaChanges:0 describes raw-source/ownership conservation, not identical newly keyed RGB.

Full-size still observations (not complete-film acceptance):

- River Otter C202: approach50 mouth/eye/chest attached. Impact still is obscured by the white strike flash and cannot prove an open-mouth seam absent. River Otter C90 and Sea Otter C118 reaction50 are whole; Colugo approach50 eye/chest surfaces are whole. Deliver all four for Claude's strike-film inspection. Four additional unscaled encoded action85 frames were inspected (no new native run): exposed chest edges stay connected, but water-strike effects cover portions of the mouth/eyes, so those pixels remain unproven. `phase4-strike-extractions.json` records exact times and hashes.
- Spotted Hyena and Nilgai idle90: shoulder/back continuous, no detached shoulder thread. Nilgai's bent front limb remains conspicuous; motion quality not certified.
- Wild Pig idle90: HOLD, snout still into the ground and front leg folds tightly. Cow idle90: former obvious withers spike/flank hole/ear island not visible, but contorted forelegs and curled shoulder remain HOLD. Pig C98 idle90: whole body, no obvious spike/hole, no full-film acceptance.
- Impala horn, Swordfish bill and Stork crown are attached at idle90. Egret remains HOLD on its existing static-red island repair; no unchanged retry.
- Falcon C275 and Springtail C95: native numerical PASS on changed ownership; approach50 looks whole. They need full-film review, not a claim that a single still proves every triangle.
- Snow Petrel C101: HOLD, visible open wing tear at idle90. Bee: abdomen connected at idle90; existing pink wing coloration remains a source-quality concern.
- Tahr and Elephant original-keyer successors: static/native PASS, numerical pink-edge pixels reduced 149→43 and 100→61 respectively; interior pink 115/147 unchanged. Full-size idle90 still shows suspect pink. HOLD for clean-edge admission. Alpha and interior RGB unchanged by keyer. Two transparent generator repaints failed framing; two smaller successors pass framing. Fresh anatomy: Tahr static PASS; Elephant refuses far forepaw paint (16% versus reference57%). A saturated-red diagnostic finds896/833 nonzero-alpha pixels respectively, but total alpha mass only3.99/3.85 full pixels; native compositing is needed to distinguish source-viewer display artifacts from visible fringe. No local resize/crop, all four masters retained.

The product keyer only uses a nearby clean edge donor when no clean interior donor exists within the existing six-pixel search, and only across connected source alpha. One-pixel erosion, three-pixel interior, pink threshold and donor radius are unchanged. No cross-gap borrowing or interior recolor. Targeted keyer/ownership negative controls pass. Runtime motion code is unchanged in phase4; existing d51d75fde remains uncertified.

`phase4-native-source.json`, `phase4-native-integrity.json` and `phase4-portable-masters.json` bind the delivery. Selected full-size stills are committed; every other local film/still is retained with its hash in `phase4-media-index.json`. All-pairs HOLD; no certification/gallery/coverage claim.

Full fixed-cohort sweep: 447 scored, static41 →41, zero gains/losses. This sweep does not substitute source successors into the old pilot; named successor outcomes are reported separately.

Transparent Tahr: first native numerical PASS exposed large mane/horn islands at idle90. The unchanged D28 rule, adapted through the native-alpha painter declaration (not the opaque keyer schema), moves16043 remainder pixels; raw RGBA and alpha remain unchanged. Successor `phase4-transparent-tahr02/joined-fit` is static/native PASS; full-size idle50/90 no longer shows the islands or obvious pink fringe. Source03 remains a new original, not an edited alpha mask. Earlier schema-adapter errors and first visual failure are retained. Full-film/finish/admission still pending.

Phase-end disk:106 GiB free. Mailbox read at end: latest C213, no new certification authority.
