# Canonical Earth material proof — 2026-09-08

Matches local implementation as of September 8, 2026. Codex/macOS, `openai/mac`, parent
`837db4aaa0ef5d3d8bffc79c70f62dcc2503032d`, 38 ahead/0 behind. This is one local graphics
batch in the authorized 24-hour campaign, ending 2026-09-09T03:11:15Z.

## Direction and resulting behavior

Nick reaffirmed that the approved rich painted space/creature images and biome atmosphere
remain the target. Preserve current UI placement; the supplied UI is a materials reference
only. Earth animals keep their authored anatomy, proportions, markings and appropriate
movement. Existing procedural identities and lineage remain authoritative.

`?planetturn=1&planetmaterial=1` enables one optional Earth material proof on the exact
canonical Earth route. The unchanged 768×384 atlas now supports subtle proportional grain,
bounded visual relief, ocean sheen and an inner atmospheric rim. The plain `?planetturn=1`
view defaults to material off. The existing finite 18-second/0.22-radian turn, lighting,
separate clouds and 420px globe geometry remain unchanged. This is a technical material
proof, not adoption of the reference images as finished textures or human art acceptance.

`planet-surface-material.ts` returns final lit RGB. Three smooth value-noise octaves use
12 scalar hashes with analytic coordinate gradients, zero additional texture fetches and
one sheen power. Longitude/latitude gradients map into the sphere tangent plane, with
bounded slopes and pole/limb fading. This requires no fragment-derivative extension or new
WebGL version. The renderer multiplies the returned RGB by the existing edge alpha once.

Blue surplus and pale neutral colors provide perceptual masks, not terrain classification,
elevation or calibrated roughness. No atlas texel, coast, canonical palette owner, genome,
world fact, geometry, dependency or texture allocation changes. It is not screen-footprint
filtering or physically calibrated linear-light shading. No cross-GPU pixel identity or
physical-device performance qualification follows from seeded shader arithmetic.

The one application-owned program/uniform group remains shared. Every accepted view resets
`uMaterial` from its own strict boolean option; material cannot leak from a predecessor into
a default view. Hidden scenes pause; Reduced Motion/Effects Off shows the standard globe.
Existing scene worker, geometry/buffers, shader, canvas and texture leases retire on exit.
Raw atlas storage remains 1.125MiB, with separate canvas/GPU/transfer/driver costs.

## Verification

All eight focused test files passed: 123 tests, including six actual-view lifecycle tests
and the new true→omitted→false shared-uniform reset with both-direction negative controls.
All three TypeScript programs, art-unused, art-audit, protected-art override, specification
and root validation passed. Root retained 1,010 clean species renders, zero boot errors and
50 matching deterministic fingerprints. `final-browser-free.json` owns the commands/results.
This scoped continuation does not erase the earlier stopped full-profile result.

The draft remains 83 ordered rows, SHA
`abf2b50d760d7f84b6a9df2694e14a0f58568c0f81ff45d2ed45c928b93bbdba`.
Current producer becomes
`cf8ad1a39c98d1464b34b6ccd69b92bbeb2ea2bf87b43a9be443428ab9a3fd9c`.
The measurement SHA remains
`4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`;
measurement/ruler/ceilings and historical reports remain unchanged. SceneMemory stays
production-only/quarantined. The 92-file evidence build is frozen separately under the
ignored `port/v2/apps/game/smoke/earth-material-evidence-dist-20260908` directory.

Fresh fixed phone390×844@2 and desktop1440×1000@1 native comparisons both passed. Trusted
Training Skip→exact Earth Survey→Land reached a natural turn angle, then the stopped ticker
held uniform0→1→0 comparisons on the exact same mesh/screen frame. Baseline/no-op and
restoration had zero changed pixels; the enabled material changed visible pixels with zero
alpha changes and zero pixels outside projected mesh bounds. Both forced-off positive
samples were rejected by the same delta assertion. Atlas bytes/dimensions and resource,
transform, angle, visibility, ordering and managed-registry identities remained equal.

Phone native Reduced/Effects Off restored the canonical fallback; both views retired the
mesh, shader, all three buffers, texture/source and canvas on actual exit. One program/group
remained intentionally app-owned, and cached uniform UIDs had live owners. No runtime
exceptions occurred. These are scoped Chromium diagnostics, not same-document re-entry,
physical-phone, full rotation, performance, heap or certification claims.

Root inspected phone material and desktop plain/material screenshots. The subtle change
remains well below the rich painted reference; broad soft terrain and polar stretching
remain. See visual-inspection.md and native-outcomes.json. Next visual work must produce
a visibly stronger reference-led asset/material treatment, not another small noise tweak.

## Preserved blockers and review questions

The prior phone-exit then desktop-resize run unexpectedly reached the galaxy; cause and
same-document re-entry remain unresolved. This batch uses separate fixed viewport sessions.
Earlier unsolicited-navigation/portrait-timeout reports remain unexplained. The signed
837db4a U2 attempt stopped at static TS6133 after 324 files/3,494 tests/1skip; its later fix
does not retroactively run its browser stages. Full U2–U4, Compendium/Slice/Glass admission,
physical iPhone/Safari/PWA, human art/listening and production acceptance remain open.

Claude should judge whether this subtle material pass improves the rendered globe, whether
perceptual masks remain unobtrusive across the finite view, and whether the single-program
material reset/lifetime is sound. A separate versioned map decision is still needed for the
nonperiodic source's full-turn seam/backside. Detailed painted terrain, species-coherent
articulated movement and the broader whole-universe finish remain unfinished.

## Local handoff

Required 1Password signing remains blocked (`failed to fill whole buffer`); no retry or
unsigned fallback. Latest staged recovery: `port/v2/apps/game/smoke/earth-material-staged-20260908.json`
and its adjacent `.patch.gz`, written and verified at batch close. Budget is
UNFROZEN/PUBLIC with private fallback 3,000; exact hosted authority/attempts/cost are zero.
No push, PR, labels, dispatch, merge, hosted dev publication, release, deployment or cloud
backup. The prior iCloud backup remains approval-pending; no retry.

Codex owns the local openai/mac work. Claude on anthropic/mac need not open or sync now;
preserve its173c806. After a separately authorized openai/mac→develop merge, Claude fetches
and merges origin/develop into its own clean branch. PR details are not needed now.


The verified local-only package is available at
[55500 material preview](http://127.0.0.1:55500/?planetturn=1&planetmaterial=1), PID53959/exec75189.
Package/boot/Skip/Guide identity smoke passed; contentSHA
`88ecc9a8282cf12e3bd7deaea7ed663e8f262b882b154027f513287122dc0658`.
The package contains no diagnostic API and is publishable:false. See the playtest record for
usage and a hash-verifying restart command. Older packages remain unchanged.
