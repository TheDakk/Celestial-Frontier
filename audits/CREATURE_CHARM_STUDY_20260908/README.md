# Creature charm and universe richness study — 2026-09-08

[Open the comparison and motion](review.html). Nick requested the description-informed richness
of Dakk’s Ultimate Tokens plus original collectible personality, then extended it to the entire
universe and UI. He also asked whether this can be procedural, whether V2 needs a restart, and
whether develop can be clean when promoted to production. Those answers are recorded in
[ARTFLOW.md](ARTFLOW.md) and [ARCHITECTURE_RECOMMENDATION.md](ARCHITECTURE_RECOMMENDATION.md).

## Result and candid visual finding

Two Blender surface treatments and ten 640px poses have been rendered from the same exact Wolf
master. The private new masters preserve the original 68,890-vertex skin coordinates/topology,
complete phenotype and speciesVisualKey. Seed 792844710, canonical named proportions, palette
family and planted paw owners remain unchanged. Procedural coat ribbons inherit the original
skin weights. No generated game content, protected painter, runtime or dependency changed.

**These treatments do not yet meet Nick’s requested visual quality.** The fine coat adds surface
detail, while the broad coat reads as noisy stippling. Face character, snout definition, abrupt
shoulder/limb junctions and overall construction-model appearance remain unresolved. The two
finishes are insufficiently differentiated to establish a production style. Root inspected the
original rests/strike and the labelled comparison. A structural/render PASS is not art acceptance.
At this study’s initial checkpoint, further style correction waited for Nick’s external review.
That source has now been supplied and reviewed: see the [pipeline review](../PAINTED_SPACE_PIPELINE_20260908/PIPELINE_REVIEW.md),
[source assessment](../PAINTED_SPACE_PIPELINE_20260908/SOURCE_ASSESSMENT.md) and
[browser architecture](../PAINTED_SPACE_PIPELINE_20260908/BROWSER_ARCHITECTURE.md).
Earlier, three built-in image-tool proposals showed a Wolf/explorer/ship vista, four biomes
and eight space objects; Nick requested more samples before deciding. He has now explicitly
approved the exact direction of the supplied [16-object space sheet](../PAINTED_SPACE_PIPELINE_20260908/approved-space-reference.png)
and [12-creature sheet](../PAINTED_SPACE_PIPELINE_20260908/approved-creature-reference.png).
See the [approval record](../PAINTED_SPACE_PIPELINE_20260908/approval.json). Space and creature
visual direction is accepted; biome and UI references are still forthcoming from Nick.
This does not accept these Blender assets, canonical anatomy replacements or runtime integration.
The earlier Wolf audit and these below-target visual findings are unchanged.

## Actual articulated study

The separate finite action braces, moves the neck/head, recoils, inspects and settles over
frames 1–65 at 24 fps. The old idle action is preserved in the private new masters. The video
renders every other frame at 12 fps: 33 frames, 512×512, H.264, 2.75 seconds, no audio. It is a
slowed authoring demonstration, not a claim of matching the game’s 200ms event presentation.
The jaw remains unweighted; this is not an opening bite or walking stride. There is no browser
skeletal runtime, opponent, elemental VFX or all-attack coverage in this study.

A fresh saved-model process verified both candidates across all 65 evaluated frames. Maximum
actual skin displacement was 0.159275 scene units; 1,364 planted paw contacts had zero drift;
final-to-first delta was exactly zero. Coat-weight error was 4.338e-8. A disabled-action/rest
control had zero motion and differed from the strike, establishing actual deformation rather
than only a moving camera/image. Original skin coordinates and polygon topology matched the
old source exactly. Embedded full identity matched; both new masters remained byte-unchanged.
[Exact saved-motion report](saved-motion.json).

Blender 5.2.1 LTS build 9e2066aef7ef used only Apple M4 Pro 16-core Metal, CPU disabled. Initial
two-treatment/ten-pose job passed in 22.285s wall time; fresh motion check plus 33 frame renders
passed in 47.373s. [Initial execution](render-first-execution.json), [motion execution](motion-execution.json).
Initial stills used 32 samples; video frames used 16. Fresh output and the shared foreground
lock were used. The uninterrupted startup receipt remains TOOLCHAIN_STARTUP_20260907.

The first packaging attempt stopped because ImageMagick could not resolve the Helvetica font
alias. Its controller/partial WebPs are retained. The copied controller uses the inspected
absolute system Arial.ttf path and a new samples-final directory. Packaging and ffprobe pass;
no Blender render was retried for this font correction. [Retained failure](sample-package-first-failure.json).
Root validation is recorded separately. No full unchanged browser-free battery was rerun for
this offline-only authoring batch; earlier current-product results remain bound to their source.

## Procedural capability and scope

The initial public README/LICENSE and scoped Mac inspection established only the published
style/export contract; the private generator was not found in those folders at that time.
Nick’s supplied ZIP now supersedes the missing-path question for this review. Its source proves
an agent-driven built-in image-tool route: exact queued prompt and locked reference → retained
raw capture → profile-appropriate extraction/export → technical checks and visual review.
The snapshot is not the complete original worktree, and that worktree was not changed.
The earlier concept → Blender proposal was CF’s local experiment, not Dakk’s demonstrated
production route. No copied D&D art or undisclosed recipe was used for these Wolf samples;
no supplied component automatically turns a 2D painting into a rig or animated creature.

Curated procedural art has precedent: Hello Games’ art director describes artistic control
and the concept-to-final pipeline for No Man’s Sky in the cited GDC session abstracts.
[Research provenance and limits](reference-research.json). That precedent supports feasibility,
not a guarantee that this first Wolf or every generated variant meets the desired bar.

The game needs excellent authored anatomy families, constrained shape/material variation and
compatible movement, preserving exact genomes/lineage. It cannot ship an individually rendered
movie for every possible phenotype. Select bounded runtime assembly/deformation/rendering and
cache/fallback from one measured complete encounter. Blender authoring does not require Blender
on the player’s phone or establish a real-time 3D runtime. Recommendation: continue V2 and extract
its actual rendering/encounter ownership seams; retain generation/combat/persistence. Cleanup and
one signed, verified release candidate belong on develop before an authorized main promotion.

## Preservation and handoff

Private masters, original renders, complete phenotype and recipes are preserved locally with
hash verification; see private-source-preservation.json. The existing source Wolf remains
untouched. This batch starts no cloud copy; independent backup is not claimed. The old pending
Wolf iCloud question covers its original payload and is not silently expanded to these sources.

OpenAI/Codex × macOS × /Users/nick/Projects/celestial-frontier-openai-mac × openai/mac tracks
origin/openai/mac; parent837db4aaa0ef5d3d8bffc79c70f62dcc2503032d remains38ahead/0behind, with
origin/develop ancestor. Prior555 staged files and their exact trinary recovery patch are
preserved. Required signing still awaits1Password restoration; no retry or unsigned fallback.
New staged recovery is port/v2/apps/game/smoke/charm-study-staged-20260908.json and adjacent gzip
patch. Existing previews53304/50689 are unchanged; these are separate offline samples.

Next: use the exact approved space and creature references for bounded asset work; receive
Nick’s forthcoming biome and UI references. Individual canonical asset/anatomy acceptance,
rig/deformation technology and runtime admission remain open. The supplied workflow and accepted
space/creature direction do not automatically qualify an asset or animation for the game.
No game restart or renderer migration was performed. The24-hour deadline stays September9 03:11:15UTC; Claude review is
September10. All earlier U2/native/physical-device/human-art blockers remain in ROADMAP.

Codex owns this local checkpoint. GitHub step none; PR details not needed. Claude/macOS/
anthropic/mac need not open/sync now and does not have the unmerged changes. After a later
authorized openai/mac→develop merge it fetches/merges origin/develop into its own clean branch,
preserving173c806. No manual copying, develop/main/site update or production release.
Actions UNFROZEN/public, private fallback3000, current hosted authority/attempts/cost0.
