# Universal family intake and painter topology — September 16

Codex on macOS, openai/mac. This package extends the real parts loader and offline intake to
all fourteen current motion contracts. It is not completion or visual acceptance of every
painted family. The prior continuous-skin/shared-pose checkpoint is signed `1a6dd61d`.

## Implemented

- Closed family contracts: quadruped, hopper, biped-bird, fish, insect, serpent, arachnid,
  radial, plant-woody, plant-herb, myriapod, cephalopod, flyer-membrane and primate.
- Family-specific hashed record admission, exact joint inventories, geometry/material/clip
  checks, alpha support, depth layers and original source binding. Quadruped checks remain
  unchanged. No missing joint is invented and no unknown family defaults to a quadruped.
- Actual Pixi loader selects the admitted family graph and body-length units. Continuous
  paint skin and authored/painter-mask intake use that inventory. The legacy quadruped seam
  bridge mode explicitly refuses other families rather than applying its torso assumptions.
- Existing pinned atlas packer runs for all fourteen. Part count and 2048 atlas caps remain.
- Draw-time topology observation for generic birds, radial fauna, myriapods and cephalopods.
  Actual procedural/named dispatchers can expose the selected owner's observation. Missing
  owners return null. This is incomplete raw source geometry, not a fitted anatomy record or
  captured part masks. Callback consumers cannot rewrite the original draw.

## Evidence

- `contracts-01.json`: 14 producer contracts, 65 perturbed geometries each (910 total),
  matching every bound measure, graph, joint name, clip ID, leg name and rotation limit.
- `atlas-01/report.json`: all 14 pass the real label intake and two pinned atlas builds;
  exact PNG/binding repeat, zero rest/atlas changed channels. These are explicitly synthetic
  calibration stripes, not animal artwork. Lost labels and foreign joints are failing controls.
- `tool-tests.txt`: 137 Node tests pass, including family hash/bounds/alpha negative controls.
- `focused-tests-final-04.txt`: 45 tests pass across 9 files, including actual Pixi transforms
  for every family and actual procedural dispatch/paint-command parity.
- `packages-typecheck-final.txt`, `game-typecheck-final.txt`: exit 0.
- `root-validation.txt`: 1,010 Earth renders, 43 biomes, zero boot/render errors, and the
  unchanged 50-probe v1.0 deterministic fingerprint. This legacy render gate does not replace
  v2 native painter/animation qualification.
- Initial fixture/typing/route-test failures remain recorded. Hopper and fish synthetic source
  fixtures name stale clip IDs. The new admission rejects them; positive test records explicitly
  use their real template's current clip ID. Consumer strictness was not loosened.

## What the source actually paints

The source observers retain ten radial arms, every segment and paired leg of the myriapod,
eight cephalopod arms plus the squid's two feeding tentacles, and bird appendages actually
visible in perched, hovering, soaring, swimming and clinging poses. Geometry controls match
observed arm/leg paths to the real Canvas commands. Deliberate truncated inventories fail.
The observers do not replace absent anatomy with dummy pivots. A folded bird only paints one
independent wing; an airborne or swimming drawing may omit legs.

These findings require count-aware motion contracts. Current templates describe six radial
arms, eight myriapod leg chains, and eight cephalopod arms without the extra squid tentacles.
Those fixed inventories cannot establish universal coverage. Fungi, microbial/colony forms,
specialist Earth owners and missing source views also need their own actual observation and
motion treatment. The root's fauna renderer reports 19 routing groups (including sessile,
gastropod, marine and legacy); those groups are not a one-to-one list of the 14 motion templates.

Nick has been asked for a narrow exception to the current `motion/` ownership restriction.
No Claude-owned module or contract packet was changed. Until that is resolved, this package
finishes the shared consumer/intake work and exposes truthful anatomy; it does not truncate
real creatures to pass a template. First-family painted visuals and phone qualification remain
separate review gates. No art masters, kit wording, game parameters or GitHub state changed.

Next: extend actual count-aware motion in the owning module once authorized; complete winning
painter landmarks and masks (including material/visibility/contact data), then prove each real
family and procedural extremes through the same atlas/skin/runtime. Preserve the approved
quadruped, bird, fish, insect, reptile, remaining-family rollout order. Do not promote the
calibration fixtures to library assets or claim fluid whole-animal motion from their tests.
