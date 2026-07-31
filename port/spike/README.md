# Canvas/Pixi visual spike — v1.8.9, Phase 0

**Deliverable:** §20 Phase 0 — *"run the two-week Canvas/Pixi visual spike: rotating planet,
ring occlusion, one creature, one layered biome."*

**Run it:** `node render.mjs` — or open `spike.html` directly. Output: `spike-proof.png`.

> ## ⚠ THIS IS A ONE-SITTING SPIKE, NOT THE TWO-WEEK ONE
>
> The plan budgets **two weeks**. This is a few hours. It is enough to answer the
> *structural* questions and it is **not** enough to answer the art-quality one. Read the
> verdict below with that in front of you — overstating a spike is how a plan gets approved
> on evidence that was never there.

---

## Setup notes worth keeping

**Isolated dependency.** `port/spike/` has its own `package.json`. Pixi is deliberately **not**
added to the game's root dependencies — `tools/deps.pinned.json` declares acorn + jsdom and was
written the same day; polluting it to run a spike would have invalidated it immediately.

**Pinned 8.19.0 — which is already drift.** Addendum D verified "current stable **8.18.1**" on
2026-07-31. npm served **8.19.0** the same day. The pin moved within hours of being recorded,
which is the point Addendum D makes about re-verifying at each gate.

**Two environment traps, both cost time:**

1. **Chromium blocks ES-module imports from `file://`.** The module build loads, silently never
   executes, and the page just sits at its loading title — no error. Fixed by using the UMD
   bundle (`pixi.min.js`) as a classic script.
2. **`--virtual-time-budget` hangs against a live local HTTP server.** Serving the page to work
   around trap 1 made Edge never exit. Going back to `file://` + UMD removed the server entirely.

**Renderer:** WebGL (Pixi `RendererType` 1) under headless Edge — **but via ANGLE on
"Microsoft Basic Render Driver", a software rasteriser.** So this spike says nothing at all
about performance. Any FPS or GPU number taken here would be meaningless.

---

## The verdict, panel by panel — what actually rendered, not what was intended

### ✅ 2 · Ring occlusion — **the structural question is answered: yes**

The hardest geometry in the brief works. The back half of the ring passes *behind* the planet
and the front half passes *over* it, with correct banding, using nothing but two masked
containers and painter's order. **This was the item most likely to force a different
architecture, and it did not.**

### ✅ 4 · Layered biome — **parallax depth works**

Sky gradient, sun with bloom, and three ridge layers composite cleanly and read as depth.
⚠ The *near* canopy and foreground silhouettes barely placed — visible only as small marks at
the lower right. A layer-placement bug in the spike, not a Pixi limitation.

### ⚠ 1 · Rotating planet — **surface yes, shading no**

Procedural continents, ice caps and the atmosphere rim all render well. **The terminator
failed.** Instead of a smooth day/night gradient it produced hard-edged grey lobes, because I
built the shading from ~26 stacked translucent `Graphics` circles. That approach does not
produce a smooth falloff — it produces visible banding and mask seams.

**The lesson is real and transfers:** soft shading in Pixi belongs in a **shader or filter**,
not in stacked alpha primitives. That is how production would do it; the spike proves the naive
route is a dead end, which is worth knowing cheaply.

### ⚠ 2 · Ring occlusion, shadow — **same failure, same cause**

The planet's shadow across the rings is a hard geometric block, not a soft umbra — the same
stacked-alpha mistake. The *occlusion* is right; the *shading* is not.

### ❌ 3 · Creature — **this does not answer the question, and should not be read as if it did**

It renders — limbs, head, horns, spines composite in the right order, so the phenotype-to-rig
*plumbing* is fine. But it looks like a cartoon spider, nowhere near the painterly bar in
`ART_DIRECTION.md`.

**That is not a Pixi verdict. It is a verdict on building creatures from primitives**, and it
*confirms the plan's own premise*: §10 and Addendum A call for authored art with rig families
and mesh deformation precisely because procedural primitives will not get there. This panel is
evidence *for* the plan's creature approach, not against Pixi.

---

## What this spike does and does not license

**Answered:**
- Pixi 8 initialises and renders under WebGL headlessly. ✅
- Ring occlusion — the riskiest geometry — needs no special architecture. ✅
- Multi-layer parallax depth composites correctly. ✅
- Scene-graph compositing for a limbed creature works structurally. ✅

**Not answered — and these are the ones that decide the port's art bar:**
- **Can it hit the painterly quality bar?** Unresolved. Everything here is flat primitives with
  no shaders, filters, or authored textures — the three things production quality depends on.
- **Is it fast enough on a phone?** Completely unresolved. Software rasteriser.
- **Does mesh deformation / Spine-or-equivalent integrate cleanly?** Not attempted, and it is
  decision D3 plus a $379-per-seat cost line (Addendum D).

**Recommendation:** treat this as the spike's *first day*. The remaining time should go
exactly where this one failed — a shader-based planet terminator and soft ring shadow, one
creature built from authored art on a real rig rather than primitives, and a run on actual
hardware. **Nick's art verdict should wait for that**, because judging the port's visual
ceiling on the creature panel above would be judging my primitives, not Pixi.
