# C132 library scale owner correction — 2026-10-02

The scale sweep previously called `compileAnatomyAttack` without the fit's weapon declaration and swallowed compilation errors by returning null. That could test generic delivery motion while reporting a successful anatomical attack. Only `port/v2/apps/game/src/battle2/library-arena.test.ts` changes.

The sweep now passes the same hash-bound declaration as the first library owner and lets compilation errors fail. Each own attack must remain non-null in the staged plan. During the existing 30 Hz loop, the expected anatomical action must be observed while the actual rig holder moves forward; after return it must be back at its original x, including the final frame. All prior refusal, complete-bout and scale-count checks remain. Existing absent-declaration controls remain; matching-record refusal controls additionally exercise wrong hashes at 1×.

**One run: 9/9 tests PASS, 114/114 scale cases, 342 anatomical attacks and 342 returns, zero rig refusals, zero retries.** Vitest duration 87.69 seconds; wrapper duration 87.96 seconds. `outcomes.json` parses and requires every exact name/scale row in the retained log. `source-change.json` binds before/after test hashes and four unchanged production owners; `execution.json` confirms those bindings before/after the run. The original test is retained as `before.library-arena.test.ts`. No browser, native run, product-code change, threshold change or certificate operation occurred.

A separate single negative-control run temporarily returned null from only the scale-sweep attacker callback. The unchanged new assertion failed at **Crab ×0.85 turn 0: anatomical attack must not fall back**, exit 1 (one failed, eight skipped, 1.69 seconds). The runner restored the exact green test bytes in `finally`; restored SHA256 is `1e74d781f23ba68f747a2d23adddfa4cc59df8dbfa8ad6cd2350a87400f5be68`. `negative-control.json` and its log bind the mutant, expected refusal, unchanged production inputs and successful restoration. This was one explicit adversarial control, not a retry of the positive owner; the full owner was not rerun.

Reproduction command for Dakk, from the repository in PowerShell:

```powershell
Push-Location ~/Projects/celestial-frontier-openai-mac/port/v2
node node_modules/vitest/vitest.mjs run apps/game/src/battle2/library-arena.test.ts --reporter=verbose
Pop-Location
```

This is deterministic stage evidence with portrait opponents, selected attack ordinals and forward/return placement observations. It does not certify all verbs, both attack facings, every real-rig pair, physical paint/ground clearance, native 60 fps or visual acceptance.

## Short read-only motion gap audit

Current `anatomy-attacks.ts` has 33 melee rows across 13 animal families. All 13 have a library prototype among 38 cards: quadruped 10, fish 6, brachyuran 5, bird 4, serpent 3, insect 2, radial 2; hopper, primate, arachnid, cephalopod, membrane flyer and myriapod one each. At audit time, `ATTACK_ANATOMY.md` still said 32 and omitted brachyuran pinch from its table. Parent subsequently corrected that reference separately to 33 rows / 13 animal families plus two unsupported plant families; this test-only source change does not alter attack behavior.

The generated gallery coverage is a separate source: `audits/GENERATED_GALLERY_20260927/coverage.json` counts 181/631 species and excludes 19 held species. Counts are quadruped 49/205, fish 72/132, bird 36/102, insect 6/41, serpent 16/22 and hopper 2/18; the other 18 coverage families have zero counted generated acceptance. Existing library prototypes do not fill those generated-coverage gaps.

The four newly supported controlled painting routes cover 32 primate, myriapod, cephalopod and membrane-flyer identities. They request paintings; they do not create observed fits or accepted rigs. The current controlled G2 compiler still has no hopper, arachnid, radial, crab or specialized small-body family request route. Earlier candidate topology mapping is not observed painting admission.

The latest C12 SIMD film (`audits/C132_C12_SIMD_20261002`) has zero refusals but three frames above 16.667 ms, maximum 23.3 ms. Chimpanzee's inherited victory deformation remains visible. Every-pair strict 60 fps remains open.

Alligator's reported late dip is a held **faint**, with idle weight zero. `audits/C132_FAINT_GROUND_20261002` contains an audit-only head/neck candidate; the spine-owned 619-pixel island and layered tail defects remain. The next concrete art repair is source-owned island/tail repair followed by a fresh geometry-bound faint candidate on the changed fit. A blanket no-dip idle would not fix the captured pose.

No further source, art or native work was performed for this read-only gap audit. Parent owns current reference updates, signing and mailbox delivery.


The full profile on signed `85fb78b2b` passed all 5,812 tests but stopped at game TypeScript: the fake root children were typed as `object[]`. The subsequent correction narrows that test-only container array to the existing `Node[]` factory type. Game TypeScript now passes; no emitted game code, assertion or threshold changes. `type-correction.json` binds both source hashes and the retained red profile. A full profile on the corrected signed source follows.

Final corrected signed source `f85c1ce94` passes the full develop profile in 130.829 seconds: 577 passing test files, one skipped; 5,812 passing tests, two expected failures, three skipped; all three TypeScript programs, artaudit, overridecheck and speccheck PASS. Optional local-AI dependencies were set aside and restored. Root validation also passes. Exact evidence: `typed-final-develop-profile.json`, `typed-final-develop-profile.log`, and `root-validate-final.log`. The existing overridecontrol and 81-control Actions policy evidence remain current because their inputs did not change.
