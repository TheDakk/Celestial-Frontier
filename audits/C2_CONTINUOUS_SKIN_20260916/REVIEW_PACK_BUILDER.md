# C2 review pack builder

The builder is ready for a later packaging step. It does not choose a final run, run tests/native jobs, transcode films, modify originals, or infer acceptance. Do not package while a native run or source edit is in progress.

Use an explicit final native directory and motion directory. Supply the actual retained test receipt and geometry receipt; repeat either flag for additional named evidence. Paths are repository-relative or absolute within this worktree. Output must be a new directory outside the repository, under an existing parent.

```sh
python3 audits/C2_CONTINUOUS_SKIN_20260916/review-pack-builder.py \
  --native audits/C2_CONTINUOUS_SKIN_20260916/NATIVE_RUN \
  --motion audits/C2_CONTINUOUS_SKIN_20260916/MOTION_RUN \
  --test-report PATH_TO_RETAINED_TEST_RECEIPT \
  --geometry-report PATH_TO_CURRENT_GEOMETRY_RECEIPT \
  --out /private/tmp/c2-claude-review \
  --plan-only
```

Replace the uppercase placeholders. Inspect the selection, then remove `--plan-only` to package. Planning reads/hashes evidence but creates no archives. The candidate manifest defaults to the native receipt's bound manifest; `--candidate FILE` is an explicit override recorded in the package. `--include FILE` adds a precise extra document/report. Missing creature films refuse by default; `--allow-partial-media` permits a clearly labelled incomplete diagnostic pack.

Add separately prepared viewing derivatives explicitly with `--media-addition civet=PATH_TO_CIVET_MP4` (likewise `fox` and `procedural`; repeat as needed). They are hashed and included beside the original WebM, never substituted for it. The builder does not create these derivatives.

Output is one common code/docs ZIP plus separate creature media ZIPs, split using **actual compressed archive sizes**. Every ZIP must be **strictly below 30,000,000 bytes**. A single oversized file refuses; no automatic quality reduction or transcoding occurs. Common code/docs is not silently split or pruned. Selected native PNGs, motion PNGs and the actual ten-second WebM films retain their original bytes and repository paths.

Each ZIP carries a file-hash manifest. `PACKAGE_INDEX.json` lists final ZIP bytes/hashes; the common ZIP and output folder include one consolidated `CLAUDE_REVIEW_PROMPT.md`. Git head, branch, upstream ahead/behind counts, dirty paths, each run's own head/diagnostic/status fields, source-hash matches and missing films remain explicit. A newer clean packaging commit does not relabel an older diagnostic or failed run. External producer/dependency paths are recorded but not copied outside the worktree. Current source code is included as current code, with recorded mismatches exposed; an archive is not a substitute for an exact-source native certificate.

The live audit README carries concise failure history and links to retained historical runs. The builder includes only the explicitly selected native/motion media, not the hundreds of megabytes of superseded captures. Source changes or Git-state changes during packaging abort before publishing the output directory. ZIP entries are normalized, traversal/symlinks are refused, metadata is fixed for repeatable archives, and CRC/size checks precede publication.

Tiny synthetic controls can run independently of game/native jobs:

```sh
python3 audits/C2_CONTINUOUS_SKIN_20260916/review-pack-builder.py --self-test
```

They test path traversal, external roots, symlinks, strict splitting, repeatable ZIP bytes, oversized members and source mutation. They do not package game evidence.
