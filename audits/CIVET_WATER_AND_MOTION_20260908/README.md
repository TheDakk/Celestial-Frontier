# Civet shallow-water and articulated-motion study — 2026-09-08

Nick asked for stronger environmental cohesion, removal of unfinished residents, visible breathing
and more fluid limbs/tail. This isolated review follows his shallow-water reading of the existing
anchor. It displays only the painted Civet, with four narrow waterlines, submerged contacts and
faint broken ripples. The five unfinished residents remain in the native game’s unchanged roster.

The creature now has two visible breath cycles over six seconds, distinct brace/thrust and reaction,
a neck/four leg/three tail-chain study, and Stop/reset pose disabled when already at rest. The
Creature/Environment tabs keep controls beside the subject. Real width changes preserve motion.
All clips settle exactly; Reduced motion, Effects off and Hide cancel/refuse appropriately.

The direction fits Nick’s Earth reference in anatomy, natural palette and painted volume. The
source remains the calmer Civet with the same repaired alpha, not the rejected busy generation.
The result still has a warmer/sharper animal than its diffuse rainy background, delicate water
contact and fine-edge artifacts. Planted leg flex still has an image-deformation character.
Fully fluid stepping/turning needs separately painted overlapping parts or a proper 3D rig;
this is one painted projection, not a finished locomotion/jaw/turning set or human acceptance.

## Review and restart

Current loopback review: <http://127.0.0.1:58523/>. Select **Environment** for water blending,
**Creature** for the close motion study. Dispose is under Details; reload after disposal.
Server PID 13898 / exec 88960 serves the final immutable inventory. HTTP 200 and exact HTML hash
are in `served-html-verification.json`; app-open returned queued, not verified foreground navigation.
Earlier comparisons at 58519/58521 are separate and unchanged. Restart only if this owned port is
free, outside macOS Seatbelt (no build or certification run):

```sh
node audits/CIVET_WATER_AND_MOTION_20260908/serve-study.mjs native-filter-state 58523
```

Native review media are in `native-filter-state/`: `desktop-breathe-native.webm`,
`desktop-strike-native.webm`, `desktop-recoil-native.webm` and the equivalent phone files.
`desktop-environment-water.png` and `phone-native-environment.png` show actual painted outcomes.
See `SOURCE_REVIEW.md` and `VISUAL_REVIEW.md` for the remaining art limits.

## Source and identity

New pure rig: `port/v2/tools/painted-creature/civet-articulated-rig.ts`, with 44 focused tests in
`port/v2/tests/painted-civet-articulated-rig.test.ts`. The prior rig remains unchanged. Twelve
aspect-correct local transforms deform a connected 49×33 grid (1,617 vertices/3,072 triangles),
with stable typed-array ownership of 76,248 bytes per mesh. Four whole paw regions are fixed;
the former low-tail foot-lock is released. Breath 6,000 ms, strike 1,600 ms, reaction 1,100 ms.

`study-harness.ts` owns two actors sharing one creature texture, one background texture, one
finite RAF owner and native capture. `water-owner.ts` owns four borrowed-background waterline
sprites, twelve Graphics, two containers and one creature-light filter. It allocates no texture
or decoded bitmap. Scope and visible contacts derive from actual alpha, not convenient emptiness.
The background/actor transforms, borrowed textures and full immutable recipe stay intact.

Exact Earth world: `CF1|g:999@90,-60|s:424242@560,170|p:133#2`; environment
`cwe1:148:50c1b7d6`; full nineteen-genome plan and original 29-field Civet seed 3212817920.
Civet anchor remains x=.72, groundY=.77, width=.15 in the 960×430 scene. The selected 768×512
WebP is 179,816 bytes, SHA `186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365`.
The source is retained in the preceding cohesion packet; no generated or edited image this batch.
Earth named anatomy/colors/botany and seeded alien architecture/palettes/biomes remain binding.

## Verification and first failures

`static-first.json` retained 44 passing rig tests, then stopped on study TypeScript errors
(MIME exact-optional and readonly filter arrays). Later static receipts correspond to actual fixes;
`static-filter-state.json` is final PASS: study typecheck, runner syntax, all three V2 programs and
root validation (1,010 clean named renders, zero boot errors, 50 unchanged original fingerprints).
The unchanged rig’s first 44-test PASS is reused, not rerun to inflate evidence.

`native-first/report.json` is a retained desktop FAIL. Its motion outcomes passed, then real
Water off→on exposed Pixi’s empty filter normalization from undefined to null. The owner’s strict
empty-chain check threw; phone/water pixel probes/disposal were not reached. See
`FIRST_NATIVE_FAILURE.md`. The fix treats empty chains equally while preserving ordered nonempty
filter identities and foreign-chain rejection. `FIRST_STATIC_FAILURE.md` preserves the earlier red.
No unchanged red was retried and neither first aggregate is relabelled green.

`native-filter-state/report.json` is final **PASS**, Edge 152.0.4191.66 / CDP 1.3, desktop
1440×1000@1 and emulated phone 390×844@2. Each has 34 frame observations, 18 control groups and
three bounded actual-canvas WebM captures from native button input. The clips reach completion
on one sequence without cancellation and return to exact rest pixels. Two real chest lifts, a
brace retreat before thrust, independent tail movement, actual leg pixels and exact fixed paws
are measured. Constant-rest, subpixel, rigid-block, frozen-tail and held-breath controls reject.
A real canvas-width resize preserves the running clip; explicit Stop resets it.

Water output proves all four waterline/ripple/shadow contributions nonempty, the five legacy
residents absent, and 407,189 unowned background pixels unchanged. Creature luma ratio is
0.905494; grading does not change alpha. Eight water faults reject the same acceptor; restoration
passes. Water toggle changes/restores actual canvas pixels. Water retirement restores scene pixels;
the still-live hero sibling is then actually painted. Final disposal destroys both geometries,
all six vertex/UV/index buffers, two textures, two sources, two bitmaps and actor roots; repeated
cleanup is inert. Runtime errors 0, cleanup errors 0, browser closed.

Report SHA `1d230a9cbded6b5ae256c1dff14672f23869e35af8ccc7331924363efc0cc917` binds ten source
inputs and fifteen dist files / 1,724,943 bytes. Dist inventory SHA
`a485c8f4fe04876205d229db6d02e41ccf0bd24706418d43dc5a92be22e02e50`.
`evidence-verification.json` records the final read-only hash/media audit; `final-results.json`
indexes these receipts. Deduplicated identical PNG records may point to a preceding phase name.

The bench enables preserveDrawingBuffer and bounded MediaRecorder capture solely for actual
pixel evidence. No production memory/performance inference, physical touch/Safari/PWA/background
qualification, full admission/Compendium/Slice/Glass/Recovery or native-heap certification follows.
Tests verify this source/view; they do not certify human art quality or fluid locomotion.

## Git, toolchain and handoff

OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` · `openai/mac` ·
`origin/openai/mac`. Start commit `86ea06b79e11382b62173fbb2ccfc8c90fb37baa` signed the prior two
studies after Nick confirmed 1Password open; `SIGNING_RESTORED.json` retains the successful retry
and command-scoped signature verification. The original failed signer evidence and old staging
recovery pointers remain historical; no unsigned fallback or persistent signing change occurred.
The new water/motion signed commit later failed with the same buffer error; HEAD remains the
prior signed checkpoint and this completed study is staged. `SIGNING_NEW_BATCH_FAILURE.md`
preserves it. `RECOVERY_POINTER.md` identifies a separate ignored binary staging recovery and
its exact readback/reverse-check receipt. Nick was asked to confirm changed signer readiness
before one retry. Resolve current
HEAD and any later restored-state receipt; source hashes above bind what was actually run.

Uninterrupted startup receipt: `audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json`.
No new tool install, personal UI, scheduled prompt or hosted action. Foreground tool/checkout
locks governed build and native capture. No native Guide/Training/release-note/version/save or
accepted game UI placement changed, because this is an authoring study only.

Codex retains the completed batch staged pending signing recovery; GitHub step none, PR details
not needed. Future separately authorized
integration is `openai/mac` → `develop`, never directly `main`. Budget UNFROZEN/PUBLIC,
private fallback 3,000; exact hosted authority/attempts/cost zero. No release/deployment.
Claude/macOS/`anthropic/mac` does not have these unmerged changes; no need to open or sync Claude
now. Thursday review can use this durable packet after authorized transfer through develop.
Only after a future authorized exact merge should Claude fetch/merge origin/develop into its own
clean branch; preserve `173c806` and all ROADMAP blockers. No manual worktree copies/messages.
Campaign deadline remains 2026-09-09T03:11:15Z; no extension or broad rework loop is implied.
