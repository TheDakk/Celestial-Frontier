# G1 tail repair — Eagle and Sandpiper pass static

2026-09-26, C46 continuation. **One automatic source-contour rule repairs the original Eagle and Sandpiper fits at the static boundary.** Each passes all14 isolated actions (121 samples each), full blended presentation (Eagle1,043 / Sandpiper1,053 samples), exact rest and zero changed visible RGBA channels. No target hand polygons or landmarks, reference shopping, solver/limit changes, or weaker gate were used. The admitted v10 auto packets are the inputs; their earlier red reports remain intact. This is not native, visual, gameplay or full G1 acceptance.

The helper is an explicit **audit-only post-author candidate**, not enabled in `auto-author.mjs`. It uses the declared tail joint and parent, chooses the transferred polygon's most-proximal edge, then closes the distal part against the original painted silhouette behind that edge. Only previously owned tail pixels and remainder/unclaimed paint seed the region. A new guard excludes rear components disconnected from the original tail. Earlier polygon owners retain priority. Raster tracing can trim boundary pixels as well as grow them; the measurements are part of the contract:

| Subject | Body → tail pixels | Tail → body pixels | Static result |
|---|---:|---:|---|
| Eagle |1,214|474|PASS_STATIC|
| Sandpiper |3,588|193|PASS_STATIC|

Both masters and every landmark remain byte-identical. These two fits exchange ownership only between tail and body. No RGBA channel changes. The rule uses target silhouette and existing transferred geometry; neither original target hand authoring nor a more convenient reference enters the repair. C44's hand/auto hybrid findings motivated the tail diagnosis but supplied no geometry to this candidate.

## Remaining failures and boundaries

- **Grouse:** unchanged observed-split contact/fixed-root collision. Tail closure cannot repair leg ownership.
- **Sparrow:** unchanged faint `legNearFoot`45.1900° joint limit; full presentation also refuses. The constraint is landmark-driven.
- **Mongoose:**19 isolated actions pass, blended gallop still refuses `foreFarAnkle`−108.5299°. Do not omit the presentation failure.
- **Tapir:** tail attack still exceeds scale-compression bound; faint retains15 folded triangles. The guarded distal-tail candidate does not repair its contact/ownership geometry.

All outcomes, first refusals, hashes and input checks are in `summary.json`, with full reports/logs alongside it. These are separate from the rejected contact-refinement experiment in `G1_FIT_REPAIR_20260926`.

The original Sandpiper v10 provenance says **RESOLVED**; Eagle says **UNRESOLVED** from merged near/far leg chains. Both declarations remain unchanged. Eagle is not eligible for play admission on this evidence. Static improvement does not prove semantic presence or anatomy quality.

The fresh stride Sandpiper remains the unchanged baseline **REFUSE** (tail coverage19% versus reference61%, `G1_AUTO_AUTHOR_20260926/auto-c46-stride`). Applying contour closure **before** coverage would change what that refusal measures: this operation can trim a part as well as extend it. Local controls do not replace the complete same-policy erased/duplicated/flip/wrong-family battery. Therefore no pre-admission flag or bypass is introduced. That complete battery and source-ownership qualification are prerequisites for broader integration; D24/D25 remain unchanged.

## Real tool bug found and fixed

`port/v2/tools/anatomy-verify/leaf-growth.mjs:traceRegion` previously treated the empty mask's unvisited label−1 as the winning connected component and returned a whole-canvas polygon. It now returns null when no component exists. This is an offline authoring helper, not a runtime motion or renderer change. Default adopted G1 generation has `grow=false`, so its current baseline does not call this path. Positive contour behavior is unchanged.

**Six focused controls pass**, including the real Eagle closure, Sandpiper full-static outcome, real erased-tail refusal, detached rear island independence, unchanged prior owners, missing/degenerate declarations and empty/nonempty contour behavior. `empty-trace-negative-control.mjs` removes the new guard in memory: the intentionally broken copy again returns a canvas polygon from empty paint; the fixed copy returns null, and source files stay unchanged. The result is retained in its JSON receipt.

Adding the detached-island guard left Eagle, Sandpiper, Sparrow, Grouse and Mongoose polygons byte-identical. Tapir changed and received one fresh measured candidate (`18-tapir-guarded-*`); both old red and new red remain. `candidate-reproduction.json` confirms the final helper regenerates all six final measured polygons exactly. No unchanged static retries. An initial missing ignored master caused intake setup refusal before measurement; that receipt also remains.

## Sandpiper native handoff — not executed by this subtask

Use the current full-script native runner on a clean signed checkpoint, after the three-crab slot releases the shared workspace lock. One browser slot; reserve100MiB (the previous full-script Sandpiper packet was35MiB). Its four-turn script exercises both directions, dodge and faint at4×CPU. It is a diagnostic of current stage/morph/contact owners with no requested morph, not a physical-phone or Nick art acceptance certificate.

```sh
CF_CPU_THROTTLE=4 CF_BROWSER='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' node port/v2/tools/battle2-proof/native-runner.mjs audits/G1_TAIL_REPAIR_20260926/sandpiper-fit audits/G1_TAIL_REPAIR_20260926/sandpiper-fit audits/G1_TAIL_REPAIR_20260926/sandpiper-native-01 audits/ART_BATTLE_FOCUS_20260925/23-sandpiper/observed-script.json
```

macOS requires approved out-of-sandbox execution on the first attempt. Use one fresh output and stop on any refusal; inspect film/stills and source receipt before any acceptance. Do not substitute the old proposed-bundle harness.

- Record recipe: `c52942142416564e8450f015992e24ee957435ca853e1c50a9e06e1789abbb73`
- Binding: `c7261a36e4099070caf783f5133d9be1bd399b7c742afd7f0361cde17bbe961a`
- Master/source: `sandpiper-packet/master.png`, byte-identical to the original source.

## Reproduction

`run-candidate.mjs SOURCE_PACKET NEW_PACKET PART_ID` reads the source master, auto authoring and family contract. It writes a new candidate packet and receipt without editing its source. All birds here use `tail`; the quadruped diagnostic uses distal `tail3`. Then run unchanged `intake-authored.mjs` and `G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs` on fresh paths. `measure-ownership.mjs` measures exact priority-raster ownership changes; `verify-candidates.mjs` checks regeneration.

Positive Eagle/Sandpiper packets retain their exact masters. Rebuilt fits are ignored duplicates; keep both positive fits while native work needs them. Other rejected fit duplicates may be pruned only after receipts are preserved. `source-hashes.json` binds helper/test/intake/static sources. Parent owns the final lane commit, full battery, mailbox and native outcome.

## Parent native result

The exact command above ran once on signed clean `cf1a24da`: **DIAGNOSTIC_PASS**,0/0 refusals,780 measured frames,CPU p95=7ms at4×,13.206083s encoded media (786 decoded frames). The timeline proof covers every phase of all four script turns. `sandpiper-native-01/report.json` binds original fit/binding/painter/current-stage sources. Reaction/idle stills retain continuous tail silhouette; impact flash obscures anatomy and is not used as a seam assessment. No new morph sweep, phone or Nick visual acceptance is claimed. The complete film is retained at the exact local path/hash in `battle-full.webm.receipt.json`; compact report/stills stay in Git. Eagle remains UNRESOLVED and the other four fits remain refused.
