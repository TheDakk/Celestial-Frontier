# C132 — ten painted effect themes

All ten remaining themes have three generated phases and pass Claude's unchanged v4.3 delivery contract. These are review and integration candidates, not visual acceptance, native performance evidence or I5 authority. No game source or shipped pack was changed by this packet.

Start with `delivery.json`. Each theme's `delivery.json` names the exact final anchors, runtime PNG hashes, selected master/prompt hashes, review sheet and validation report. `manifest-rows.json` contains the ten rows for Claude's new painted-theme registry. The paths resolve from the existing arena directory, as its registry requires.

| Theme | Final anchors | Depicted source ability |
|---|---|---|
| Fire | `fire/anchors.json` | Magma Strike |
| Frost | `frost/anchors.json` | Shatterfrost |
| Storm | `storm/final/anchors.json` | Chain Lightning |
| Tide | `tide/anchors.json` | Riptide |
| Stone | `stone/shards/anchors.json` | Boulder Charge |
| Venom | `venom/anchors.json` | Venom Strike |
| Void | `void/final/anchors.json` | Eclipse Strike |
| Sand | `sand/final/anchors.json` | Sandblast |
| Chem | `chem/anchors.json` | Acid Spray |
| Psionic | `psionic/final/anchors.json` | Mind Spike |

There are 30 selected paintings and 36 retained original generated PNGs: one call per phase, three Psionic repairs, one Sand impact repair and two Stone travel attempts. `generation.json` records every call's exact prompt, source location using `~/`, master SHA-256 and selected/held state. Every master was compared byte-for-byte with the built-in image generator's saved output. `requests.json` is the original immutable request plan; its PENDING labels describe the plan before execution, not the delivered state.

`compile-prompts.mjs` preserves the approved reference/frozen-style/system-card prefix and accuracy/layout/technical/negative suffix from the Wild prompt, uses the exact v4.3 closed material table and checks the depicted abilities against CombatCore. Discovery Atlas bytes match the reference lock. The historical commit printed inside the frozen prompt is a pre-rewrite reference; the frozen prompt text itself remains unchanged.

The generator returned 1254-square masters. `intake.mjs` uses the existing keyer, then uniformly scales and translates the complete master canvas into 1024-square RGBA. It does not crop or rotate paint. The measured anchors map to origin `[0.2, 0.55]` and contact `[0.8, 0.55]` within half a pixel. Original masters, initial keyed images, registration receipts and superseded attempts remain available.

## Repairs and review

Full-size generated masters and all final three-phase sheets were inspected. The original Psionic lavender shading was damaged by key extraction; three neutral pearl/silver repaints replace it. Sand impact originally exceeded the accent limit (27.54%); its terracotta/umber material repair measures 12.31%. Stone travel passed the numeric contract after edge cleanup but still showed muted pink dust bands during visual review. An edit retained those bands, so the selected replacement uses crisp separate granite/slate fragments. Its two prior travel attempts are held and must not be wired.

`targeted-despill.mjs` retains the existing conservative pale/umber protections and performs one radius-8 simultaneous colour-only pass on explicitly selected contaminated edge pixels. No alpha, bounds, geometry, registration or threshold changed. The selected Storm, Void, Sand and Psionic derivatives change 486 RGB pixels across six phases; the additional 165-pixel Stone pass belongs to the held previous travel attempt. Each receipt records the exact input/output hashes, target and sampled-neighbour indices, remaining unresolved pixels and unchanged alpha.

No sheet establishes motion continuity or final art acceptance. Claude still scores the material, full-size edges, in-battle visibility and phase continuity; Dakk owns final visual acceptance. Void's dark material particularly needs its real biome plate behind it. The Stone travel is greyer than its launch/impact and the Sand impact is more terracotta than its other phases; these deliberate material repairs remain visible review points.

## Verification

`delivery-validation-before.json` preserves the initial contract failures. `delivery-validation.json` reports ten clean themes using the production validator's exact SHA-256. All 30 final runtime PNGs have the required canvas, alpha, transparent border, matching hashes/bounds and shared anchors. Maximum fringe is 0.3574% against 0.375%; maximum accent share is 24.275% against 25%; opaque key-colour interior pixels are zero. These metrics are mechanical checks, not proof of zero visible fringe.

Each final theme passed the official `effects-theme-delivery.test.ts` candidate run, including its accepted Wild control and rejection cases: six tests per run. Logs and exit codes are in `tests/`. The superseded Stone run is retained separately. Four existing edge-despill/target-selection tests passed, including unknown-target refusal, unchanged alpha/input and no-clean-neighbour controls. No thresholds or validators were modified.

For a read-only mechanical recheck from the repository root, PowerShell:

```powershell
node audits/C132_EFFECTS_20261001/validate-deliveries.mjs
```

## Exact native proof preparation

`native-runner.mjs` is an audit-local exact-transform copy of the stock runner. `native-harness-transform.json` records every unique replacement and the original/generated hashes. It supports `CF_EFFECT_ANCHORS`, `CF_ARENA_MANIFEST` (`recipe`, `far`, `mid`, `near` as repo-relative files) and `CF_PROOF_SOURCE_OVERRIDES` for audit-local module substitutes. It preserves the current capture timeline/media checks, source-byte hashes and original native entry. Captured source paths are repo-relative and home paths are normalized to `~/`.

`native-proof-plan.json` pins every final effect anchors file. A matching arena manifest, accepted real fit pair and script whose A/B themes match the selected effect are still required. The default stock script uses Wild/Stone; it must not be mistaken for a proof of a different effect. `prepare-native-input.mjs` writes a four-turn script with both attack directions for a supplied exact pair and theme; it never starts a browser.

No native proof ran for these effects. Parent's C12 current-source baseline failed: at 4949.7 ms Centipede crawl refused one folded ARAP triangle and consumed 543.7 ms, producing a 533.4 ms live-frame gap that skipped turn 1 action and hitstop. This is a real failed capture, not an accepted effects result. No successor epoch should be represented as run. Before any future native epoch, post **native/performance reservation active**, serialize it with other performance work, and post a terminal notice afterwards. I5 remains unchanged.
