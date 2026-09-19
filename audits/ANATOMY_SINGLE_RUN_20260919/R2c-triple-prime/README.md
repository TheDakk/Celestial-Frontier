# R2c‴ — constructor rounding correction

Acceptance pending. Nick authorizes the single constructor change under read-only review §11:
reject barycentric coefficients below −1e-8, preserving stored values without snapping or
renormalizing. No other runtime line, binding, input, solver limit or gate changes.

[Direction receipt](direction.json). Runtime remains Node26.9.0 with the uninterrupted
[R2c″ toolchain receipt](../R2c-double-prime/toolchain/check.json).

- [25 contact tests PASS](contact-tests-native-units.log): real regenerated Civet constructs;
  stored negative coefficient remains exact, prediction matches positive-zero control within
  1e-12 normalized prediction coordinates; −1e-3 with sum preserved still rejects.
- [Initial test result](contact-tests.log): the first assertion converted to pixels before
  comparing to 1e-12 and measured 1.2835631168434424e-12 px. Corrected assertion uses the
  prediction API's normalized coordinates; the pixel result is retained, not claimed below1e-12px.
- [TypeScript PASS](typecheck-corrected.log); [initial invocation typo](typecheck.log) retained.
- [Root validation PASS](validate.log), no changed baseline.
- `offline.ts`, `static.ts`, `unpinned-control.ts`, `controls.ts` retain the R2c″ harness;
  output paths only move here, regenerated inputs still reference R2c-double-prime/civet-input.

Next, signed/verified producer → native rest with [melee:bite] on unchanged inputs → required
unpinned-candidate10 negative control → six-subject static covariance/crab-bit-identity/Civet
all-row and presentation sweep. No further variant after shared red. If green, continue §8.
Pose-exporter absent-module reds are expected until a separately authorized re-merge; no retry.
No fetch/push/PR/merge; PR42 parked. Claude stays read-only; no app switch or sync needed.
