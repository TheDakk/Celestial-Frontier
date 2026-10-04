# C163 fixed-rotation candidate — 2026-10-02

This audit-only candidate avoids recalculating rotations that cannot change during one ARAP solve. A vertex qualifies only when it is pinned and **every adjacent vertex is pinned**. Membership is derived from the validated movable rows and snapshotted into private Wasm storage; it is not a caller-supplied hint. For the retained Centipede mesh, 1,307 of 5,334 rows qualify. Across four passes this avoids 3,921 of 21,336 rotation calculations (18.38%). All RHS arithmetic, ordered symmetric sweeps, iteration ceilings, orientation projection, strain/fold checks and atomic publication behavior are unchanged. This operation count is not a timing result.

`runPass(sweeps)` still computes every rotation. New `runPosePasses(sweeps, passes)` owns one synchronous block: its first pass is always full, later passes may use the compiled dynamic list, and any leaf refusal immediately ends the block. It returns the completed count. The pose owner recomputes the failed pass fully through robust JS; subsequent passes use the existing full Wasm/JS path. There is no previous-frame cache, external cache token, callback/interleaving point or exposed remaining-pass API. Every fresh call starts full, even after failure or public pose/rotation-buffer changes. Scratch retains its existing exclusive-owner contract.

The leaf ABI adds a fourteenth i32 pointer: zero requests the original full rotation loop; otherwise it points to a private count followed by ascending dynamic vertex indices. The strict artifact owner admits exactly this fourteen-i32 signature and retains its memory-only import and forbidden-section rules. Admission checks both the full path and a two-pass block against independent full-reference arithmetic. A subset-only corrupting runtime is rejected even if its full first pass is correct.

Validation is recorded in `verification.json` and `validation.log`: **22 tests pass** (16 inherited leaf/ARAP/numerics tests plus six new lifecycle, source mutation, count validation, late norm-refusal and subset-only-corruption controls). The 56 captured/adjacent real Centipede targets pass byte-exact publication and internal-state parity in `captured-parity.json`: position, target, rotation, RHS, queue heap/location/priority, queue metadata, stats, pass/fallback counters and hard pins agree. This includes 1,792 painted-part checks and 218,736 pin-coordinate checks. Contradictory pinned folds still refuse atomically and nonfinite targets still refuse. The original source files are unchanged and their hashes are pinned in `baseline-sources.json`.

The C leaf was compiled twice with identical C-derived module, generated JS bytes and build-receipt bytes. Expected module SHA-256 is **8dc3b57219c486d8e6db654284a3d6c9987233695d1c116d5559df2e235cd2be** (1,933 bytes). The full flags and compiler provenance are in `candidate/arap-sweep-build.json`. No fast math, contraction, reassociation or relaxed SIMD was introduced.

`source-overrides.json` is ready for the existing native runner. It redirects the three changed JavaScript modules and maps the candidate ARAP file's four unchanged sibling imports back to their production owners. The same resolver pattern was used to bundle the candidate successfully without launching a browser. `candidate/` source imports remain production-compatible; no import rewrites will be needed for a future separately authorized promotion.

PowerShell verification from the repository root:

```powershell
node --import ./audits/C163_C12_FIXED_ROTATIONS_20261002/import-hook.mjs --test audits/C163_C12_FIXED_ROTATIONS_20261002/fixed-rotations.test.mjs audits/C163_C12_FIXED_ROTATIONS_20261002/candidate/wasm-arap-sweep.test.mjs audits/C163_C12_FIXED_ROTATIONS_20261002/candidate/arap-skin.test.mjs audits/C163_C12_FIXED_ROTATIONS_20261002/candidate/arap-kernel-numerics.test.mjs
```

The retained parity/verification scripts write immutable report paths; use a separately named successor report when repeating them. `prepare.py` documents exact unique-match construction and was used before freezing this packet; do not rerun it over the frozen directory.

**Native measurement pending.** No browser/native/performance epoch was run by this agent, no strict 60 fps claim is made, and no production files are changed. Root owns the signed reservation, one unprofiled 4× capture, full-size review and any later promotion decision.
