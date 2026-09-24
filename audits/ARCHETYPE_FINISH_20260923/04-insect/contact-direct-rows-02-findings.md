# Beetle — direct rigid-support contact sweep02

The direct analytical path does **not** repair any of the five complete failing rows. It repairs selected first poses, then reaches genuine unchanged compression or rotation limits later. This is a new contact-only model diagnostic, not a repeat of the original static battery.

Command: `node audits/ARCHETYPE_FINISH_20260923/04-insect/contact-direct-rows-02.mjs`.
One execution sampled every121point action grid for cast/hit/dodge/victory/tame and the exact869point60Hz presentation. Every attempted time, phase, original root/thorax, result, error, compression owner and available metrics is retained in `contact-direct-rows-02.json`; the first trace for each refusal class is retained in full.

## Counts and bounds

| Row | Contact-only passes / attempted | Refusals | First refusal overall ms | Maximum requested compression px |
|---|---:|---:|---:|---:|
| cast | 92/121 | 29 | 162.666666666667 | 50.370482086559 |
| hit | 93/121 | 28 | 176.250000000000 | 46.152010961974 |
| dodge | 73/121 | 48 | 32.666666666667 | 117.544047441371 |
| victory | 65/121 | 56 | 100.000000000000 | 54.580623976428 |
| tame | 18/121 | 103 | 96.000000000000 | 72.556735498484 |
| presentation | 793/869 | 76 | 7283.333333333333 | 117.386601714975 |

Compression cap stays35.03168851197441px. Hit first fails at176.25ms with legHindFarFoot−75.9940092319001° against−75°; its first compression failure is202.5ms,36.110467989524686px. Other first refusal owners are legFrontFar for cast/dodge/victory and legHindFar for tame. Presentation contains the same failure classes: cast9, hit2rotation+4compression, dodge7, victory17, tame37.

No mixed-support approximation is involved: all six observed supports are wholly endpoint-owned. The solver still checks all six active physical chains, unchanged anatomical lengths, current rotation limits, the original compression cap,1e−8 endpoint error and0.25px painted-target residual. This diagnostic never calls ARAP or publishes paint and cannot establish exact rest, continuous joins, film quality or CPU.

## Actual action/contact ownership mismatch

Sources: `port/v2/apps/game/src/motion/family-actions.ts:24–37,109–129`; `port/v2/tools/creature-animation/family-contracts.mjs:4256–4273`; `port/v2/apps/game/src/creature-rig-contact.ts` historical source retained at `contact-before/creature-rig-contact.ts`.

- **Cast/victory:** the authored cast rise explicitly keys both front knees−50° then−55° and mid knees−25°/feet+10°; victory keys front knees−55° and mid knees−30°/feet+10°. Hind chains are not lifted by those key dictionaries. These are canonical lift/rear gestures, but the insect contract has no `contactStance`, so `contactStanceForAction` returns`all`. IK overrides the keyed leg rotations to keep all six feet at their rest contact targets. The observed limiting chain is legFrontFar, a deliberately animated front leg. The current master's mid legs point rearward rather than canonically downward; negative canonical knee rotation does not guarantee identical visible lift direction on this projection.
- **Dodge:** raw motion tucks every knee+30°/foot−35° while translating the rootdx−0.22/dy−0.030. There is no insect dodge contact exemption. The contact model retains all six fixed targets, and the frontFar chain needs up to117.54404744137068px accommodation, well above the existing cap. Treating this as a small numerical residual would be incorrect.
- **Hit:** generic recoil/stagger moves the rootdx−0.08→−0.14; the insect stagger also keys hind knees−20°/feet+25°. FrontFar controls required global accommodation, and that accommodation drives HindFarFoot beyond its current angle range before later compression failures. The direct solver cannot remove this full-row geometric constraint.
- **Tame:** the generic builder moves the root to+0.12 body lengths during its approach and retains+0.12 through lower/end. Insect supplies a tripod approach with15°knee/10°foot keys. However contact gait detection recognizes only`approach:walk|trot|gallop|crawl|scuttle`; action`tame` is not gait travel, so no alternating swing/step target accompanies the translation. HindFar stays fixed while the body travels forward. Measured sampled rootdx spans0..0.12 (maximum52.54753276796161px at this record's scale); the rear chain controls103of121refusals.

The existing quadruped policy demonstrates explicit cast/victory hind support and dodge none, but it cannot simply be copied to insect. The shared selector currently recognizes hind support via `c.id.startsWith('hind')`; insect IDs start`legHind`. A naive insect`cast:'hind'` mapping would select **zero** chains, silently removing all contacts. Any future lawful stance policy needs an explicit anatomical group resolver and the exact intended support inventory, not a passing empty-contact set. No policy or gate is changed here.

## Source isolation and scope

While this diagnostic was being prepared, the parent changed the production contact fallback. This run intentionally loaded the exact historical owner SHA256`37ce18684c45eb771cbc927341c4bd6c2179145cd033b02e5db4588eddaba3e4` from`contact-before/creature-rig-contact.ts` under its original module ID, preserving relative imports. All41 sampled non-entry authorities match the original static bytes; all42 physical source files selected by the bundle stayed unchanged through the run. The receipt records the production owner's before/after hashes as **not used**.

The temporary bundle bypasses endpoint iteration only to invoke the already-existing analytical block from the uncompressed authored root. No numeric limit, target, landmark, source paint, accepted binding or S2 input was changed. A new family stance/translation decision must be independently scoped and validated; these results are evidence for that decision, not authorization or a passing archetype.
