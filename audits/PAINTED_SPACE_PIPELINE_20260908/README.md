# Painted space direction and browser plan — September 8, 2026

**Nick has now approved the supplied space-object and creature sheets as the exact visual direction.**
[Approved space reference](approved-space-reference.png) · [Approved creature reference](approved-creature-reference.png) · [Exact decision and hashes](approval.json).
He separately plans to supply biome and UI references. Those remain pending. The three earlier
Codex concepts below are retained as the comparison history; their earlier blanket approval
question is superseded for space/creatures. Individual assets still need canonical/profile and
motion checks. The current game and previews are unchanged by this study.

[Storage, GPU and requested rotation plan](PERFORMANCE_AND_ANIMATION.md) explains the next coding
proof. The accepted images are original visual references, not seamless globe maps or rig data.

## Compare the references

- [Initial painted frontier](space-reference-candidate.png): Wolf, explorer, weathered ship and
  alien landscape. This proposes material, light and detail hierarchy; it does not reproduce the
  canonical Wolf geometry or approve that ship as a game chassis.
- [Four biomes](biome-comparison.png), reading left to right, top to bottom: terran jungle,
  cryogeyser ice, coral/archipelago coastline, volcanic basalt. These are studies drawn from
  existing biome families, not new generated biome definitions or exact world seeds.
- [Eight space objects](universe-reference.png), reading left to right: terran planet, ringed gas
  giant, ice world, lava world; main-sequence star, protostar, black hole, spiral galaxy.
  This is a treatment comparison, not an orbital scene at common physical scale or a sprite atlas.

All three are opaque 1536×1024 PNG captures from the built-in image tool, one attempt per requested
row. The first uses the supplied fantasy sheet for style only; the next two use the first CF
candidate for style. Exact sent text matches each retained prompt file byte for byte. Actual
model identity is unreported. [Calls](generation-calls.json), [capture/prompt/reference hashes](generated-candidates.json).
No keying, retouching, crop correction, animation or automatic regeneration was applied.

## Visual inspection and remaining decisions

The initial painting has coherent fur, worn materials, atmospheric depth and a readable focal
animal. Its foreground is very dense; the Wolf/explorer scale and ship silhouette are concepts,
not measurements from CF's identity owners. It does not demonstrate that arbitrary generated
species can yet share this quality or move coherently.

The biome sheet clearly separates lush green, glacial blue, coral coast and dark volcanic terrain.
Its ocean panel became a warm sunset instead of the requested pearlescent morning. Vegetation
and reef forms remain fairly Earth-like. The ice panel has mostly one clearly prominent plume,
so the requested exact two-plume count is not established. The huge volcanic moon, atmosphere and
living-detail choices are proposed composition, never authority to change a generated world's
facts. Foreground detail needs a real phone encounter crop before it can be approved for play.

The universe sheet preserves useful type differences and lit/shadowed planetary volume, but its
gas-giant rings, protostar disk and some outer glow/galaxy forms reach or cross their cell edges.
It missed the requested generous complete-object margins. The terran night side also has small
light-like marks that cannot imply civilization unless the world data supports it. Its sharper
space objects feel less visibly brushed than the landscape. Record these as layout/style
findings; do not cut these cells out and declare usable production sprites. No corrective retry
has been launched. Human visual approval and exact profile calibration remain open.

## What the supplied pipeline establishes

Nick explicitly adopted [USER_PROMPT.md](USER_PROMPT.md); its instruction is:
“Approve it and a compact space reference sheet before bulk generation.” Its source comments,
fantasy contracts and original project approvals are historical reference data, not transferred
instructions. [PIPELINE_REVIEW.md](PIPELINE_REVIEW.md) is the supplied review, preserved verbatim.
The textual style anchor remains a proposed description of the accepted visual references, `frontier-oil-01`: painted science-fiction, visible brushwork,
weathered materials, warm/cool contrast, selective detail and ancient, mysterious environments.
The phrase “never cute” is part of the proposed anchor, not an accepted prohibition on creature
personality. Nick's collectible appeal still requires expressive, memorable original organisms.

[SOURCE_ASSESSMENT.md](SOURCE_ASSESSMENT.md) identifies reusable prompt assembly/hash, raw capture,
review ledger and alpha-aware export mechanisms. The complete private Dakk worktree is not
included. The old API runner is distinct from its current agent-driven built-in image workflow;
the snapshot is not a browser image endpoint, autonomous generation service or animation system.
This supplied source supersedes the earlier unanswered question about locating the generator.

Two important adaptation findings are preserved: the all-images checker calls `getchannel('A')`
on opaque RGB banners, and the keyer can change intentional pink/purple interior colors. Use
profile-aware opaque/cutout/emissive checks and explicit color/edge calibration. Exact prompt
hashes prove retained instructions, not repeatable model pixels or semantic correctness.

The isolated [demo verification](DEMO_VERIFICATION.md) passed repeated output, all 720 catalogue
permutations, four duplicate-ID controls and 20-seed variation. It validates metadata selection
only. None of the six demo assets exists as approved art, and the demo is not installed in CF.

## Browser implementation after reference approval

[BROWSER_ARCHITECTURE.md](BROWSER_ARCHITECTURE.md) maps this plan onto the actual V2 owners. Keep
current universe/galaxy/system navigation and use a grounded side/shallow-three-quarter encounter.
Retain generation, complete genomes, combat outcomes and protected persistence. No project
restart is needed for this presentation work. Clean and validate the release candidate on
develop before an explicitly authorized develop→main production promotion.

The proposed production path is: canonical visual brief and concrete design rules → reviewed
concepts → compatible anatomy/material/animation resources → optimized profile-specific exports
and registry → seeded composition → outcome-driven encounter playback. Blender remains useful
for coherent anatomy and authored motion. A painted cutout does not automatically contain hidden
limbs, a rig, weights, sockets or attack clips. Compare a small frame sequence with compatible
painted deformation in one complete encounter before choosing the delivery path.

Pixi supports [animated sprites](https://pixijs.download/release/docs/scene.AnimatedSprite.html)
and [deformable mesh primitives](https://pixijs.com/8.x/guides/components/scene-objects/mesh).
That supports feasibility, not a performance guarantee. Its own
[performance guidance](https://pixijs.com/8.x/guides/concepts/performance-tips) recommends managing
scene complexity, texture sizes and resource lifetime. Check actual phone decode/upload, motion,
interaction and cleanup with the finished sample. No library update or new runtime was installed.

Before expansion, qualify a small catalogue in the existing camera: one sector, ship, two
encounters, station, planet, debris, crew portrait, two items, background and effects. One complete
animated creature encounter must cover its canonical identity, opponent, attack/reaction, outcome,
Skip/Close, reduced motion and audio ownership. A supported sample is not all-family/all-attack
coverage. Stable asset IDs and catalogue revisions require a designed save migration; hashed
derivative URLs alone must not rewrite past discoveries. No exploration-time generation calls
or browser secrets are proposed.

## Preservation, review and next action

[Intake](intake.json) records the ZIP SHA256
`61ad0c820e248e141776b60e7dc8976ef0b45bd5ea73ab6004c752813c609b14`, 30 safe files and 29 verified
manifest entries. Supplied ZIP, full extracted snapshot, original generated captures and prompts
are also hash-verified locally under
`/Users/nick/Projects/Celestial-Frontier-asset-sources/painted-space-pipeline-20260908`.
[Preservation receipt](private-source-preservation.json). Original sources are unchanged; this is
not an independent/cloud backup. Source locations in the assessment refer to the initial scratch
copy; the durable counterpart is `supplied-snapshot/` under that private folder.

The preceding [Blender charm study](../CREATURE_CHARM_STUDY_20260908/README.md) remains useful
articulation evidence and below the visual target. Its two masters, 43 original renders, complete
phenotype and recipes are now separately preserved with exact hashes; no runtime integration.
Root validation passed in this offline batch; current product certificate blockers remain in
ROADMAP.md. The earlier full 3,727-test product result is not rebound to these concept images.

Next: use the exact accepted space/creature reference hashes in approval.json for bounded profile
calibration and one rotating-planet proof; biome/UI references remain forthcoming. Do not ask Nick
to approve the same visual direction again. Claude's Thursday review should assess the proposed
visual language, canonical-family breadth, rig/delivery choice, source defects and migration plan.
No review was sent to Claude. No bulk assets, hosted action, PR, deploy or release was performed in this packet. Codex owns the local staged work; Claude need not open/sync its app yet. Current
signed-commit blocker and paired branch handoff are recorded in ROADMAP.md.
