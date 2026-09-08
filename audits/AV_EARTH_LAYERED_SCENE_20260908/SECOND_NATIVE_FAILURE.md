# Second native Earth failure — exit target and visible scene boundary

Recorded 2026-09-08. `native-phone-policy/review.json` remains **FAIL**.
The run started at `2026-09-08T16:48:20.249Z` and ended at `2026-09-08T16:48:23.800Z`.
No desktop, blocked-image or default native stage followed this failure.

## What failed

The runner selected `world.toGlobal({x:0,y:0})` as a phone right-click target.
Before dispatching input, it required `document.elementFromPoint` at that point
to equal the game's canvas. That requirement failed with **Native exit canvas
occluded**. No right-click or other exit input was sent, so the run does not
verify scene exit or resource retirement.

The failed expression did not retain the chosen coordinates or actual hit
node. It is therefore not possible to name the exact DOM hit from that receipt.
The failure screenshot visibly shows the existing **PLANETSIDE — Biosphere**
panel covering the center/lower panorama. Source creates and populates this
`#planetside` element for Earth's nonempty canonical roster. That is evidence
for the likely obstruction, not a recovered exact hit-node witness.

The existing native **Survey → Leave world** control is appropriate for phone
exit. Its handler validates the same proven world and goes up through the
normal route owner. The next runner measures its real rectangle and hit target,
uses native input, and checks actual exit/resource outcomes. It does not hide
or move the Biosphere panel, write a fixture, or force navigation. Desktop
Escape remains a separate existing native exit. Right-click exit is not claimed.

## What was reached, and the instrument's blind spot

This run passed the corrected exact Earth landing receipt and reached the
ready two-layer scene. It independently observed the actual labeled background
and resident Sprites, matching complete 960×430 frames and transforms, hidden
decorative globe, one loaded background, and the ready resident worker result.
Native Survey reopen and Close retained the same Earth scene.

With the ticker paused, Pixi full-stage extraction found **228,899 changed
pixels** when the background was hidden and **26,329 changed pixels** when the
resident layer was hidden. Both exact restorations and the no-op changed **0**
pixels. The forced visible globe changed **268,134** pixels and the same
composition acceptor rejected it. The real resident source canvas had **42,902**
nontransparent pixels, transparent top 64 rows and corners, and bounded alpha
at x=24–911 / y=122–392. Source, resource, pool and transform identities remained
stable through the controls. There were no Runtime exceptions or cleanup faults.

These are scoped observations inside an overall failed run. Most critically,
**Pixi extraction excludes DOM overlays**. The saved screenshot shows the
Biosphere panel covering much of the lower panorama where residents sit.
Unchanged DOM-control rectangles plus Pixi pixels did not establish visible
resident presentation to the player. No unobstructed phone composition,
all-resident visibility, human art acceptance, exit or retirement is accepted
by this attempt. This is a real unfinished composition issue in addition to
the runner's center-point assumption.

## Next bounded correction and evidence

The product successor fits the complete paired artwork into the measured free
band between visible top chrome and the existing Biosphere panel, with uniform
scale and 12-pixel margins. Both Sprites move together. The actual labeled
surface cloud container is hidden only while the painted Earth pair owns a
usable band; canonical fallback preserves the normal decorations. UI placement
is unchanged.

The new immutable `native-earth-layers-visible-runner.mjs` keeps the prior exact
identity, receipt, alpha, pixel and retirement controls and adds:

- Independent visible DOM rectangles and nonintersection checks, including
  Planetside, top chrome, rails, dock, captions, notifications and open panels.
- A **7×5 grid** of actual `elementFromPoint` samples spanning the panorama,
  with observed hit-node identifiers retained. Canvas coordinates are mapped
  to CSS coordinates before DOM comparisons.
- A real legacy-placement mutant: move both Sprites to H/2, reject it with the
  same composition acceptor, restore exact pixels/transforms and retain
  unchanged controls. The phone mutant must reproduce actual Biosphere overlap
  and failed canvas-hit samples; desktop records the observed overlap rather
  than assuming an identical phone obstruction.
- Actual cloud-container visibility, forced-visible pixel and rejection
  controls, and destruction of the old container and its children on exit.
- Native phone Survey / Leave world instead of an assumed center right-click.

The new runner binds current layout/chrome/style/index sources as well as the
existing art/recipe/protocol dependencies. This note and runner were prepared
without executing a browser, build or test job. The successor's outcome is
pending; a fresh build and fresh native output directory are required. Both
previous failed reports and all previous runners remain unchanged.

- Failed policy runner SHA-256: `81f8044d5b62304746049aea1f03d7919cdd6eeccc673e5a8267d08a9c504a7b`.
- Failed phone-policy report SHA-256: `9cebc06b77e4b034e754e8fee30e223c1882ff2cc84b7dd6ac7d88155dc7027f`.
- Visible runner SHA-256: `4f61ec141bb07cf84b397a5bd75d378e78ca538586d7457d11aa72aa77fb3091`.
