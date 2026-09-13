# Approved painted direction: storage and animation plan

Nick approved the supplied space-object and creature sheets on September8. Exact images and
hashes are in [approval.json](approval.json). He requested slow galaxy and planet rotation and
articulated battles, and is preparing biome/UI references separately. This approves the visual
target; it does not establish a measured production budget or waive canonical world/genome rules.

## Feasibility

This is a credible browser visual target. Rich painted detail can live in textures, while a
small number of meshes, layers and shaders supply movement. The browser does not need to run
Blender or generate a new AI painting per frame. The hard work is preparing coherent resources,
compatible procedural variation and correct animation, then measuring them on target devices.
The sheets are references: they lack seamless globe maps, hidden creature surfaces, layer
separation, skeletons and animation data. Their exact visual quality is the target, not proof
that every runtime variant already reproduces it. AAA-level scope/performance is not certified.

## Three different costs

- Download: deliver compressed derivatives at the required display size and fetch the current
  scene's set. The entire universe does not need to download at boot. The two supplied PNG sheets
  total4,816,556 bytes (about4.59MiB); these reference files are not the final runtime asset pack.
- Persistent storage: bound the existing cache and retain only the chosen offline content.
  Browser quotas and eviction differ, so no unlimited persistent art cache or altered save
  policy is implied. Assets must be recoverable independently of protected progress.
- Working memory/GPU: an uncompressed RGBA8 texture costs width×height×4 bytes before mipmaps,
  duplicate decode/upload buffers and other overhead:512²=1MiB,1024²=4MiB,2048²=16MiB.
  A small WebP download does not make its decoded texture equally small. Actual GPU compression
  may reduce residency if separately qualified; this plan does not assume it is available.

The sheets themselves would each occupy about6MiB as one1254² RGBA8 base level. That arithmetic
is not a total app-memory measurement. Likewise,60 full1024² RGBA8 frames would cost240MiB for
base texture pixels alone; avoid shipping long independent frame stacks for every phenotype.
Compatible rigs/deformation reuse textures and clips. Frame sequences remain a bounded option
to compare for short actions, not a commitment to an unbounded animation atlas.

## Motion by object

| Object | Proposed implementation and qualification |
| --- | --- |
| Galaxy | Slowly animate a painted disc in its declared projection. Rotate texture coordinates within a tilted plane when appropriate; do not roll the entire sky or move navigation targets. Use canonical system coordinates and separate decorative depth. |
| Earth/solid planets | Seamless longitude-wrapping surface data mapped to a sphere or equivalent fragment shader; rotate geography, preserve illumination direction, and separate cloud/atmosphere layers. A flat pre-lit portrait cannot reveal the far side or retain a correct terminator when simply spun. Preserve Earth's actual canonical geography; generative concept changes are not permission to alter it. |
| Gas giants/stars | Seeded band/surface structure with bounded time-driven motion and separate restrained emissive/coronal effects. Rings remain separately occluded and lit. Keep the generated star class and palette. |
| Creatures/Guardians | Authored coherent anatomy families, compatible painted layers or Blender rigs, proportions driven by the complete canonical phenotype, then attack/reaction/idle clips consumed from actual combat events. Unsupported topologies use correct fallback until qualified; do not collapse all diversity into these12 examples. |

Near objects may use higher detail; distant objects use smaller shared resources. Reuse existing
leases/texture scopes, cancel stale work, unload inactive resources and stop decorative animation
when hidden. Respect Reduced Motion and Effects Off. Limit layered transparency and expensive
full-screen effects; monitor heat/response rather than optimizing only frame counts.

## Next bounded coding proof

Build one local opt-in rotating planet at the current scene boundary using an approved-look,
wrap-compatible surface and separate light/cloud ownership. Preserve canonical world identity;
first inspect the current Earth surface producer rather than replacing geography from a concept.
Add one galaxy motion treatment only after confirming projection/navigation ownership. Measure
bytes fetched, decoded/upload peak, retained resources after exit/re-entry, frame/interaction
latency and visual seams. A physical iPhone/Safari thermal and touch check remains required.
Then qualify one complete articulated creature encounter. Reference/profile-specific art review
continues, but no further generic approval of these two accepted visual sheets is needed.

Primary technical references checked September8:
[Pixi mesh capabilities](https://pixijs.com/8.x/guides/components/scene-objects/mesh),
[Pixi performance guidance](https://pixijs.com/8.x/guides/concepts/performance-tips),
[MDN WebGL memory and system limits](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices),
[MDN browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
These support the engineering approach; they do not benchmark Celestial Frontier or set its caps.
