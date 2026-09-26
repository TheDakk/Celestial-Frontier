# Painted canonical Civet — local study, September 8, 2026

The bounded study is complete: one richer painted Civet, finite connected-texture motion and
[desktop/phone evidence](study-native-final/report.json). [Final results](final-results.json)
bind the exact assets, source and remaining limits. This study is not imported by the game.
Starting checkpoint: `5e222931efd642c03ce55c5e67f7670a7aef890c`, Codex/macOS `openai/mac`.

## Open the local study

[Review motion locally](http://127.0.0.1:58519/). Use Breathe once, Brace and thrust, Recoil,
Rest, Reduced motion, Effects on and Hide study. Dispose study retires its resources; reload
for another review. Close portraits and the Earth inset share one decoded creature texture.
The 440/300/132 extraction sizes are fixed; larger displayed views fit narrower screens.

The server is PID 598 / exec 25947. It serves only the 17 verified files in
`study-native-final/dist` (1,775,620 bytes). Inventory SHA:
`86c5e30524484e6a4156d71b6fd051fa589719d1486997f1a52619acff4aed2d`. [Preview receipt](local-preview.json).
To restart from the owned repository, use:

```sh
node audits/CREATURE_PAINTED_CIVET_20260908/serve-study.mjs study-native-final 58519
```

This is a standalone art bench, not a second game preview or admission battery. The server
checks every file's retained hash at startup and on access; it does not rebuild or publish.
The original game preview is separately documented in
`port/playtests/20260908_EARTH_LAYERED_LOCAL_PREVIEW.md`; its old process/port is not reverified here.

## Art, identity and reference direction

The [native baseline capture](BASELINE_CAPTURE.md) binds the actual current Civet, its complete
29-field Earth epoch 0 genome and pixel-identical six-body/five-body Earth layers. Seed
3212817920 remains Civet: pointed muzzle, rounded ears, four feet, mask, khaki/tan spotted coat
and ringed tail. [Both new reference sheets](../PAINTED_EARTH_AND_ALIEN_FLORA_20260908/README.md)
are preserved byte-for-byte. Earth anatomy/botany and seeded alien whole-growth forms are now
explicit in ART_DIRECTION, SPECIES_AND_GENOME, BIOME_ATLAS and the codebase reference.
No species, roster, genome, lineage, biome, save, share or accepted UI placement changed.

The [preferred painted RGB](civet-first-opaque.png), [matte master](alpha-v3/civet-painted-v1.png)
and [asset manifest](asset.json) are retained. The 768×512 lossless WebP is 179,856 bytes,
SHA `7df99d643544f47f0b9cfd22e97e3bcb8af5ccc184a51f29d2e6c42c603815ac`.
One decoded RGBA base is 1,572,864 bytes before renderer/upload/canvas overhead.
Both generator attempts returned opaque checkerboards. Nick explicitly authorized ImageMagick
alpha extraction. All 4,718,592 original RGB channel bytes survive the matte master unchanged;
the lossless study derivative was resized with ImageMagick 7.1.2-31.

[Visual review](VISUAL_REVIEW.md) finds a large improvement in volume and fur, consistent with
the Earth sheet. Fine whiskers remain attenuated, with pale fringe/mouth fragments and a patchy
nose edge on light backing. The bright coat and weak local contact shadow still need scene-light
integration. The five other Earth residents retain their older flat art. These are recorded
production edge/lighting limits; this is agent review, not human art acceptance.

## Motion and verification

`port/v2/tools/painted-creature/civet-rig.ts` admits the exact serialized genome, uses a connected
49×33 grid / 3,072 triangles, and samples finite breathing (4.2 s), brace/neck thrust/recoil
(1 s), and reaction (0.7 s). Whole paw triangles stay fixed; head movement preserves its
projection. Every clip returns to exact rest. The Earth anchor stays x=.72, groundY=.77,
width=.15. This is one-view texture deformation, not walking, a jaw rig, unseen anatomy,
metre-scale ecology or native ability mapping.

Final checks pass:

- 113 rig tests, including full finite-clip geometry sweeps, exact identity, policy, mutation
  controls and the regression where moving triangle vertices slipped between planted points.
- Study typecheck, all three V2 TypeScript programs and root validation: 1,010 clean named
  renders, zero boot errors, all 50 original determinism fingerprints unchanged.
- One final immutable Edge 152.0.4191.66 / CDP 1.3 run: desktop 1440×1200@1 and emulated phone
  390×844@2. Eight probes/five control groups per mode; actual four-paw ink is nonempty and
  pixel-stable at 440/300/132. Constant-rest, shifted-paw, opaque/hash and horizontal-overflow
  mutants fail; exact restoration passes. Native buttons complete finite motion, cancel on
  Reduced/Effects Off/Hide, and retire all four meshes/geometries/actor roots, Earth container,
  three textures/sources/bitmaps. Repeated disposal is inert. No Runtime/cleanup errors;
  the isolated browser closed.

Native document-hidden is a synthetic event control, explicitly separate from actual background
or physical phone qualification. Phone control inputs are trusted CDP mouse events under mobile
emulation, not physical touch/Safari/PWA. Final native source/asset bytes were unchanged throughout;
8 source inputs and the dist inventory are retained. Native report SHA:
`cd84e42ea90c7f05a0754d4efa5595dea8e8fc20500bafd5ff4b1d87a9db97d9`.

All first failures remain immutable: two opaque generator outputs, two matte edge failures,
first native paw-pixel red, the independent analysis's raw-GPU/encoded-PNG comparison red,
and the second native scrollbar assertion red. [First native diagnosis](FIRST_NATIVE_FAILURE.md),
[second native diagnosis](SECOND_NATIVE_FAILURE.md), and
[analysis carrier clarification](CONTACT_ANALYSIS_METHOD_CLARIFICATION.md) distinguish fixes
from evidence that was not collected. Source review corrected NaN rest validation, destroyed
mesh observation and Earth-container disposal; those were found before their relevant test run.
No failed aggregate was rerun unchanged or relabelled PASS.

Native Compendium/Chronicle/Planetside integration remains unimplemented. The game keeps its
current painters and whole-portrait battle movement, so no Guide/Training/release-note or
version change is appropriate in this study-only batch. All stopped profiles, instrument reds,
Compendium/Slice/Glass/Recovery, physical iPhone/Safari/PWA, human art/listening, retained heap/
heat, art-lock CI, ITP/DECISIONS 19 and production-only SceneMemory quarantine remain open.
No budget, ceiling, ruler or history was rebaselined.

## Local authority and handoff

[Startup receipt](../TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json): approved tools current,
no eligible updates. Campaign deadline remains 2026-09-09T03:11:15Z. No scheduled prompt,
hosted write, PR, push, merge, release, deployment or version bump. Budget UNFROZEN/PUBLIC,
private fallback 3000, exact hosted attempts/cost 0.

Codex/macOS keeps this checkpoint on `openai/mac`. Claude/macOS `anthropic/mac` does not yet
have these unmerged changes and need not be opened now. Preserve its `173c806` checkpoint;
review the durable packet Thursday. Future separately authorized integration is
`openai/mac` → `develop`, then Claude fetches/merges `origin/develop` into its clean own branch.
PR details currently not needed. Source signing is restored; resolve current HEAD and see the
commit receipt once recorded. Original/cloud reference files remain untouched; no independent
cloud backup was claimed or retried.
