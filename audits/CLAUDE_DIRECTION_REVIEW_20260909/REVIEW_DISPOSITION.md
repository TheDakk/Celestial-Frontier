# Actual Claude review and Codex disposition — September 9, 2026

Claude completed the requested broad direction/source review of signed head
`8bdbea9a65b1f64c09906fd99589d75e5d8bc50a` at 12:49:06 UTC. The installed Claude CLI
ran a fresh read-only invocation from its verified `anthropic/mac` workspace. It
read immutable local Git objects; no source import, tests, browser/build, fetch,
GitHub write or existing-session reuse occurred. The original [response](CLAUDE_RESPONSE.md),
[CLI JSON](CLAUDE_RESPONSE.json), [receipt](CLAUDE_RECEIPT.json), request and wrapper
are preserved with exact byte/hash inventory in [REVIEW_ARTIFACTS.json](REVIEW_ARTIFACTS.json).
The implementation signature was independently verified by Codex; Claude only saw
its signature block. [Implementation signature receipt](IMPLEMENTATION_SIGNATURE.json).

**Claude's verdict is no merge for that head.** It supports the state-machine/resource
construction and overall direction, but highlights species conditioning, quality,
delivery and missing current-head admission. Its scope section explicitly excludes
large parts of the accumulated game/UI/instrument diff; “review returned” does not
mean every line was inspected. Its findings are evidence to assess, not instructions
to rewrite code, lower the quality bar, change platforms or spend hosted attempts.

## Disposition of all numbered findings

| Claude finding | Verified disposition and action |
| --- | --- |
| 1 — duplicate Civet heads / visual record | Rechecked untouched 1024×576 pixels independently. Both reviewers see one head/eye pair/two ears, not a substantiated second face. The old “coherent Civet” description is also too strong: torso/leg attachment remains ambiguous. Preserve both original reviews; the [native recheck](NATIVE_VISUAL_RECHECK.md) owns the clarification. Quality remains false. |
| 2 — no genome-to-conditioning compiler | Confirmed. The exact Earth snapshot supplies validated provenance/display names, while prompt/anatomy prose is handwritten. This is not universal generation. The canonical exporter is groundwork; a reusable conditioning compiler remains a priority, alongside original retention, delivery and multiworld ownership. |
| 3 — footprint / on-phone impossibility | Footprint concern confirmed; categorical impossibility is not established. Graphs plus external weights total 6,675,137,531 bytes; complete runtime inventory is 6,691,020,416 bytes, before the optional derivative. Exact retained maximum is 3,113,808 KiB = 2.970 GiB summed process RSS, not 3.05 GiB; neither unique RAM nor GPU memory was measured. No phone is qualified and no model installer ships. The proposed mandatory 10–100× reduction is an unsupported estimate. |
| 4 — four-step schedule allegedly invalid | Unconfirmed diagnosis, no scheduler change or sweep. Four steps are the official model-card example. Coefficient names alone do not prove invalid use or the cause of anatomy errors; more steps on distilled weights do not guarantee improvement. See sources/limits below. |
| 5 — cache ignores installed model bytes | Disagree as written. `scene-image-cache-plan.ts:59–60,253–258` includes all installed/unknown same-origin usage, and the model-accounting test at `port/v2/tests/scene-image-cache-plan.test.ts:60` guards this. A development filesystem cache is outside browser-origin usage; a shipped origin model would count. The scene cap is not total download/origin size. |
| 6 — cannot admit a new sole original | Confirmed existing contract: disposable-variant admission requires a verified surviving protected copy. `SCENE_CACHE_PLAN.md` already documents the absent protected-original owner. Preserve the refusal; implementing durable retention is necessary before a gameplay cache. |
| 7 — post-decode cancellation | A native click cannot interrupt synchronous RGB conversion/PNG publication. A cancel already requested after decode resolves but before its await continuation is a real exposed-API boundary. The controller now checks it before publication; it adds no asynchronous gap or cancellation after completed publication. |
| 8 — completion destination | Latent in the one-Earth proof, tightened now. Completed art binds the whole recipe/job key, world key, environment fingerprint, ecology epoch and snapshot hash to the existing Earth panel. Publication and explicit return recheck that binding; stale notices cannot navigate or consume a current result. This grants no normal-game route authority or multiworld queue. |
| 9 — hidden failure presentation | Confirmed and corrected: a friendly failure/cancellation message is visible outside either navigation panel, while detailed diagnostics remain in generation evidence. Retry clears it. No normal-game UI moved. |
| 10 — zero target skips audio ramp | Intentional existing immediate-silence contract, not changed. `AUDIO.md:429`, runtime test at `packages/audio/test/runtime.test.ts:1115`, and retained native DSP evidence explicitly cover category-zero silence. Nonzero duck/recovery keeps 25/90ms smoothing. This does not claim inaudible switching; physical listening remains pending. |
| 11 — event log growth/re-serialization | Valid scaling concern. The isolated single-page proof retains diagnostic events across runs; it is not the future multiworld queue. Bounded job telemetry/retention is required at that future owner. No unrelated logging rewrite in this correction. |
| 12 — research module location | Organizational suggestion, not a demonstrated runtime defect. The snapshot/cache modules have no `main.ts` import; current docs label them research/advisory. Moving established tests/import paths does not solve quality and is deferred. |
| 13 — optional studies in draft release copy | The current bullet says “optional” but does not clearly identify developer-query access. Tighten that copy before the accumulated normal-game candidate is marked Ready; no new studies are made default or advertised as universal AI. This prototype-only correction does not change the normal-game release/Guide/Training. |
| 14 — exact shared image identity | Agree that exact-image sharing must retain/transport verified pixels plus provenance, not promise recipe-only cross-device regeneration. Already documented as a separate future feature. Reference-image conditioning itself does not guarantee output anatomy “by construction.” |
| 15 — visibility style reads | Confirmed ancestor-style reads on filtered root attributes/body class, not an observed per-frame regression. They enforce hidden/reduced-motion cleanup. No measured style-recalc cost or native performance failure was supplied; retain the guard pending evidence, rather than remove a safety outcome. |

## Reference checks and limits

The [pinned official BFL Klein 4B card](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/blob/e7b7dc27f91deacad38e78976d1f2b499d76a294/README.md)
uses four inference steps. The [Diffusers v0.40.0 Klein pipeline](https://github.com/huggingface/diffusers/blob/v0.40.0/src/diffusers/pipelines/flux2/pipeline_flux2_klein.py)
retains empirical-mu scheduling and configurable step counts. The exact previously
inspected Diffusers commit could not be retrieved in this follow-up; current code
is not substituted for the pinned source/hash contract. Reconcile those sources
before proposing a schedule change, and never relabel a hypothesis as a repair.

[WebKit's Safari 26 announcement](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#webgpu)
establishes WebGPU support on iOS. It does not qualify this particular model's
shader-f16 feature, buffers, memory, heat, latency or foreground responsiveness.
[WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
also distinguishes an origin quota from available physical space and persistence.
No measured device profile, model delivery or protected-original execution is added.

The next bounded quality work should compile supported canonical species/appearance
into explicit anatomy and conditioning inputs, then compare one reviewed anatomical
reference under a fixed seed/model/four-step recipe. Start with a clearly diagnostic
failure such as Platypus. Reference anatomy must itself meet the named-species rule;
the old procedural painter is not automatically an accepted rich-art reference.
Keep organism count, individual identity, botany, material detail and composition
as separate outcomes. Neither six speculative reruns nor more progress/cache polish
is necessary to close this review. No new generation was performed here.

## Follow-up verification

The correction passes its first 42-case actual-controller suite (35 existing plus
seven added behaviors), including removed-cancellation-guard rejection, eight stale
binding inputs and exact restoration. [Log/receipt](review-controller-01.json).
One real-browser run passes three fresh-page flows with 16 trusted clicks, two
hidden-ancestor negative/restored controls and six changed-identity refusals followed
by restored return. Real HTTP and explicitly synthetic2×1 workers; no model inference.
Six observed sources remain unchanged; owned targets/browser/server close.
[Native receipt](review-controller-native-01/result.json). Root inspected the actual
friendly-failure/cancel screenshots, not only state objects. Root validation passes
1010renders/0booterrors/50originalfingerprints with unchanged legacyHTML.
[Validation](root-validation-review-01.json). No broader exact-head admission claim.

## Integration boundary

No merge recommendation or production/art acceptance has been obtained. The actual
review applies only to 8bdbea9a; the correction successor is not silently included
in that review or in its older native-inference source inventory. The prior 4,121-test
result belongs to 9bfec7dc and does not certify either later head.

The repository's current budget/protocol, rather than the review's generalized
battery wording, owns integration: default agent admission includes browser-free
develop checks and two phone Glass canaries; the full Compendium/Slice/Glass chain
requires its separately authorized lane. Neither lane has a new exact hosted attempt.
All earlier reds, unknowns, quarantines and human/device gates remain in ROADMAP.
PR42 stays Draft/unlabeled, `openai/mac` → `develop`; no push, Ready, label, hosted
run, merge, release, deployment or scheduled task occurs in this review correction.
