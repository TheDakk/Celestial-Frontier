# C2 consolidated review package — September 16

The plan, current code, tests, native poses and all three diagnostic films are packaged together. Each ZIP is strictly below30,000,000 bytes; preserved originals and labelled 60fps MP4 viewing copies are included.

Upload all six ZIPs and use the [consolidated prompt](/private/tmp/c2-claude-review-20260916-kernel05/CLAUDE_REVIEW_PROMPT.md). Packages record dirty source on signed base b79fd32e. They do not claim clean signed-source qualification, universal coverage or Nick’s visual acceptance.

| Package | Size (decimal MB) |
| --- | ---: |
| [c2-common-code-docs.zip](/private/tmp/c2-claude-review-20260916-kernel05/c2-common-code-docs.zip) | 2.21 |
| [c2-civet-01.zip](/private/tmp/c2-claude-review-20260916-kernel05/c2-civet-01.zip) | 29.15 |
| [c2-civet-02.zip](/private/tmp/c2-claude-review-20260916-kernel05/c2-civet-02.zip) | 10.40 |
| [c2-fox-01.zip](/private/tmp/c2-claude-review-20260916-kernel05/c2-fox-01.zip) | 29.08 |
| [c2-fox-02.zip](/private/tmp/c2-claude-review-20260916-kernel05/c2-fox-02.zip) | 10.66 |
| [c2-procedural-01.zip](/private/tmp/c2-claude-review-20260916-kernel05/c2-procedural-01.zip) | 24.89 |

Film previews: [Civet](motion-06/viewing-cfr/civet-10s.mp4), [fox](motion-06/viewing-cfr/fox-10s.mp4), [procedural quadruped](motion-06/viewing-cfr/procedural-10s.mp4).

All three measured60fps; inclusive creature CPU p951.6/1.7/0.9ms.117 tool tests,15 runtime tests, typecheck and root validation pass. Native rest/final-rest changes0channels. The source report owns exact values; playback derivatives are not performance measurements.

The universal roadmap is [UNIVERSAL_ANIMATION_PLAN.md](UNIVERSAL_ANIMATION_PLAN.md). Exact sizes, hashes, source matches, run status and packaging Git state are retained in REVIEW_PACKAGE_INDEX.json. ZIPs are in the local temporary folder above; the builder and index let them be recreated without duplicating ZIPs in Git.
