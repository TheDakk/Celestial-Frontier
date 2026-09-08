# Canonical Earth surface motion — September 8, 2026

The optional `?planetturn=1` game view now gently turns Earth's canonical surface under fixed
lighting and the existing independent cloud layers, then settles after 18 seconds. It qualifies
a spherical projection path for future painted assets. It does not install the approved painted
reference sheet, provide a seamless full revolution, or change generated worlds or creatures.

## Implementation

- The exact proven route is `CF1|g:999@90,-60|s:424242@560,170|p:133#2`. Only WebGL and this
  route qualify; the mesh pipe registers before app initialization. Missing pipe/worker/atlas
  leaves the standard globe. The view loads lazily and uses the existing app ticker.
- `apps/game/src/planet-surface-atlas.ts` samples the actual Earth `surfaceColor` and `makeNoise`
  without modifying those domain owners. A one-shot worker produces an unlit 768×384 RGBA atlas
  from detached canonical fields/facts; malformed data rejects before allocation.
- Longitude shifts through a maximum 0.22-radian yaw with smooth start, reversal and settlement.
  View-space lighting remains stationary. The existing surface function is not periodic; seam,
  backside mapping and full rotation require an explicit future visual recipe.
- One application-owned GlProgram and UniformGroup avoid a compiled-program/UID leak on each
  route. Each scene owns its worker, canvas/texture lease, shader, mesh and vertex/index buffers.
  Cleanup attempts all owners and records destructor failures. Late worker callbacks cannot mount.
- Hidden views pause. Reduced Motion and Effects Off reset the study and restore the existing
  globe. The `avpilot` Earth comparison can hide the globe, so use `?planetturn=1` by itself.
  Players use a supported browser; no authoring-tool installation is required.

Raw atlas storage is 1,179,648 bytes (1.125 MiB). Canvas and GPU copies, transfer/ImageData peaks,
existing fallback texture and renderer overhead are additional; this is not a phone memory budget.
Polar stretching and the existing nonpilot UI/vista composition remain visible in the captures.

## Verification and retained failures

The first full test run passed 330 files / 3,742 tests with one skip and stopped at five failures
in four existing verification files. All 20 new atlas/projection/lifetime tests passed. Stale
release inventory/producer bindings were corrected; 104 focused tests passed. Later targeted
runs passed 52 tests, then 32 producer/budget tests after the renderer-pipe correction. All three
TypeScript programs, unused-art, art-audit, override and spec checks passed. Root validation
rendered 1,010 species with zero boot errors and all 50 unchanged deterministic fingerprints.
These are retained continuation results, not a new complete green develop-admission certificate.

[Correction history](VERIFICATION_CORRECTIONS.md) retains the draft-count, TypeScript ownership,
protected-art dependency, initial unpositioned-pointer and real missing-render-pipe failures.
The mesh extraction observer was also corrected to restore render-group topology and classify
uniforms by actual owner; an orphan-UID negative control must fail the same ownership check.
No historical report, ruler or memory ceiling was weakened or relabelled.

[Phone report](native-owner-aware/review.json) contains successful native Training Skip → exact
Earth Survey → Land, actual moving/settled pixels, hide/restore controls, real Reduced/Effects
settings and complete scene-resource retirement at 390×844@2. Its aggregate remains **FAIL**:
after leaving Earth and switching to desktop size, the same document unexpectedly reached the
galaxy instead of retaining Sol. No runtime exception accompanied that transition. Its cause
is unresolved; it does not close or explain the older unsolicited-navigation blockers.

[Fresh desktop report](native-desktop/review.json) is **PASS** at 1440×1000@1: native entry,
natural 18-second motion/settlement, visible-paint controls, owner classification and complete
retirement. The custom mesh, shader, all three buffers, atlas Texture/Source and scene scope
retire; canvas shrinks to 1×1. The one application-owned program remains intentionally resident.
Same-document native re-entry was not reached. Unit coverage proves shared owner reuse, but
that does not replace the uncompleted native re-entry check. Temporary test browsers/servers closed.

[Qualified outcome details](qualified-outcomes.json) bind exact pixel results and live uniform
UIDs. [Visual inspection](visual-inspection.json) records the three inspected native captures.
Physical iPhone/Safari/PWA, full Compendium/Slice/Glass, broad native heap, seamless rotation,
rich painted assets, creature articulation and human art/listening acceptance remain open.

## Earth species and Claude review

Nick explicitly reaffirmed that Earth's creatures must obey their existing detailed species
instructions: recognizable anatomy, proportions, markings and species-appropriate movement.
Rich materials and animation must not turn them into fantasy redesigns. Alien biomes/life retain
their procedural rules and existing lineage boundaries. This direction is now explicit in
ART_DIRECTION.md and SPECIES_AND_GENOME.md. Full animal-specific locomotion is not implemented.

Claude's Thursday review should inspect the shader projection, exact-route/async lifetime guards,
application versus scene ownership, retained missing-pipe exception, extraction side effects,
and the new unresolved post-resize navigation transition. Preserve the previously approved
space/creature reference hashes and the UI-material-only restriction. The next art step is a
bounded painted material/geometry proof or one complete canonical creature encounter, not a
larger UI rework loop or bulk catalogue generation.

## Checkpoint and local delivery

Parent is 837db4aaa0ef5d3d8bffc79c70f62dcc2503032d on openai/mac, 38 ahead / 0 behind.
Current 83-row draft digest:83c07bed235bf897725871eeef32e921a4ca36de73bd9741a2e55a88642126ed.
Current producer:f5e16260e729a79e5dc865704525dd6f501b59a800d8b525171d19556d92ac1f.
Measurement:4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12, unchanged.
The two 92-file ignored evidence builds and all prior recovery snapshots remain immutable.
See preview-package.json / preview-server.json for the new local package and ROADMAP.md for
current delivery/recovery identity. It remains dirty-local-only, publishable:false while required
1Password signing awaits restoration evidence; no retry or unsigned commit fallback.

Codex/macOS owns this local work. GitHub step none; PR not needed. Claude/macOS need not open or
sync now and must preserve anthropic/mac's unmerged173c806. After a separately authorized
openai/mac→develop merge, Claude fetches/merges origin/develop into its own clean branch.
No develop/main/live/dev-site change, release or deployment occurred. Budget UNFROZEN/PUBLIC,
private fallback3,000; exact hosted authority/attempts/cost0. The 24-hour campaign deadline and
Thursday review remain unchanged.
