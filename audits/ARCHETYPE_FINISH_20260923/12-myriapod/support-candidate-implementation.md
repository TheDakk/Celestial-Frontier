# Validated support candidate after a failed contact solve

The original anatomical endpoint iteration can refuse before reaching a physically valid painted-support pose. Two retained fit06 failures demonstrated this: each provisional rest-support solve preserved actual bones and passed original joint/paint bounds, despite one mixed support containing nonzero foreign-joint weights.

`creature-rig-contact.ts` now permits that geometry as one candidate after an iterative refusal or excessive painted residual. It restores the complete authored/travel-adjusted pose for mixed candidates, solves every active chain and reconstructs each actual anatomical endpoint, then evaluates the entire candidate ensemble against unchanged joint, endpoint, compression and painted-support guards. Mixed supports retain their exact original weights and use `predictContactSupport`; they are never reclassified as rigid. A rejected candidate remains nested beneath its original iterative refusal. Existing successful iterations and endpoint-only fallback arithmetic retain their existing behavior. There is no cadence, target, pin, smoothing or numerical limit change.

The exact prior owner and edit manifest are retained in `support-candidate-before-01/`. The existing default path and the generalized candidate still use the same finite geometric construction; this is not a general optimization or a claim that an absent candidate proves physical impossibility.

One focused invocation passed **9/9 tests** in two files (301 ms total, 56 ms test time): new full 28-contact hit/dodge admission and independently reconstructed bone/endpoint/weighted-paint/joint outcomes; complete prior successful receipt byte equality; heavy foreign-weight rejection through actual LBS residual; impossible translation and joint-limit refusal; failure-state reuse; and the existing exact rigid-refusal controls. The test receipt records 56 unchanged source/input hashes. No full static, S2, native film or TypeScript run was performed by this subtask.

Command (cwd `port/v2`):

```sh
npx vitest run apps/game/src/creature-rig-contact-support-candidate.test.ts apps/game/src/creature-rig-contact-rigid-refusal.test.ts
```

Frozen implementation SHA-256: `b6b7e745c61c6e9634ab4b8fd5c7411913ca383cb7772f5b143b49bcb0149abc`.
New test SHA-256: `cb7c437b1dc410d37317a1e50ea2ea22db3309b684440597bb8d7562cb275daa`.

Codex root owns changed-source static/S2/native qualification, current-reference updates and the signed item commit. Claude's lane remains read-only; no GitHub or synchronization action was performed here.
