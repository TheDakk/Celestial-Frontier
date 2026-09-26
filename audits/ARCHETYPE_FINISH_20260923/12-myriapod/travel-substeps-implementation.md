# Compact reaction travel cadence

The compact myriapod contract explicitly declares `travelSubsteps: {hit:2,dodge:2}`. Only these two source-step reactions may opt in; wrong models, actions, values or malformed maps refuse. Other actions retain their previous cadence. Each nonzero compiled travel interval now owns two equal signed foot substeps. The original body displacement `base + stride * progress` is evaluated and retained **before** any division or reassociation, preserving exact root travel at source waypoints, internal midpoints and final endpoints. Lift/retraction amplitudes, blend weights, source easing residuals, actual contacts and numerical bounds remain unchanged. Zero-displacement holds and stage-owned travel retain their prior path.

The actual fit07 dodge49 ms and63 ms failures now resolve all28 contacts under independently reconstructed bone lengths, local joint limits, endpoint error and full original weighted-paint bounds. No cadence is inferred from a refusal or tuned per sample. No source coordinate, binding, solver threshold, ARAP setting or pin changed in this step.

The first focused run retained35/36PASS: all18 new cadence controls and6 support-candidate controls passed; one historical swing control's nested mock restoration accidentally restored the new cadence on its second purportedly old fixture. The exact failing test bytes and first log remain retained. Its source-only test correction explicitly removes both optional declarations from that fixture; the affected swing owner then passed12/12. The24 already-passing cases were not rerun. Each invocation retained66 unchanged source/input hashes. New checks cover exact old root arithmetic, signed alternating groups, unchanged amplitudes, internal continuity, holds/endpoints/stage exclusion, malformed and foreign declaration refusal, actual failed poses, external offset and joint-limit controls. Historical success/fallback/swing tests now explicitly select their original cadence, preserving their original assertions.

Commands (cwd `port/v2`):

```sh
npx vitest run apps/game/src/creature-rig-contact-travel-substeps.test.ts apps/game/src/creature-rig-contact-support-candidate.test.ts apps/game/src/creature-rig-contact-swing-lift.test.ts
npx vitest run apps/game/src/creature-rig-contact-swing-lift.test.ts
```

Prior production/test bytes and exact runtime edits: `travel-substeps-before-01/`. First receipt: `travel-substeps-tests-01.*`. Test-only repair: `travel-substeps-swing-before-02.ts`, `travel-substeps-swing-repair-02.json`. Changed owner receipt: `travel-substeps-swing-tests-02.*`. Frozen file hashes: `travel-substeps-final-source.json`.

This subtask ran no full static, S2, ARAP, native film or TypeScript battery. Codex root owns final fit qualification, reference updates and signing; Claude's lane remains read-only.
