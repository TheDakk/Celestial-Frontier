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

> ## ▶▶ READ §"ATTEMPT 2" AT THE BOTTOM FIRST
>
> The panel-by-panel verdict below describes **attempt 1**, which Nick correctly called
> amateurish next to the shipped art. Attempt 2 rebuilt it with the real technique stack and
> **still missed** — improving two panels and *regressing* a third. That second failure is
> the more useful result, and it changes what the remaining spike time should be spent on.

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

---

# ATTEMPT 2 — the real technique stack, and why it still missed

**Trigger:** Nick compared attempt 1 against the shipped art and called it amateurish. He was
right. The reference points are `tools/uisheets/vista-1-terran.png` (11 terran vistas) and
`tools/uisheets/rig-mammal1.png` (24 mammal sub-rigs).

**What the shipped art actually does**, which attempt 1 did none of:

| | Shipped Canvas-2D engine | Attempt 1 |
|---|---|---|
| Form | radial gradient shading, light from one side | flat `.fill()` |
| Depth | atmospheric haze bands *between* ridge layers | hard-edged stacked shapes |
| Light | rim light along the lit edge, additive | none |
| Grounding | soft contact shadow under every subject | none |
| Texture | mottling / pelt variation under blur | none |
| Falloff | true gradients | ~26 stacked translucent circles |

**The critical correction: this was never a Pixi limitation.** The shipped engine reaches that
bar in **plain Canvas 2D**. Attempt 1 did not prove "primitives can't get there" — it proved I
had not ported the *techniques*.

## What attempt 2 changed

Rebuilt using `FillGradient` (radial + linear), `BlurFilter`, additive blend for rim light and
bloom, mottling under blur, and contact shadows. All confirmed present in Pixi 8.19.0.

## Result: two panels better, one WORSE

- **Planet** — much better form; reads as a lit sphere. ⚠ The terminator all but vanished and
  the ice caps blurred into white smears.
- **Ring occlusion** — the planet now reads as a sphere. ⚠ The umbra is **still a hard-edged
  notch**, and the fine ring banding was lost.
- **Creature** — a large improvement: gradient body, contact shadow, legible silhouette. Still
  well short of the shipped rigs, whose species identity comes from *silhouette*, not shading.
- **Biome — REGRESSED.** Over-blurring destroyed it: ridge definition gone, river gone, grass
  gone, sun bloom a dim smear. Attempt 1's version was better.

## ★ The finding that actually matters

**I am re-inventing art direction from scratch and getting worse at it under time pressure.**
The shipped engine encodes a long tuning history — specific palettes, layer counts, blur radii,
silhouette rules, per-biome grading. Two attempts of hand-rolled approximation produced two
different kinds of wrong. **A third would too.**

So the remaining spike time should not go into more hand-drawn Pixi scenes. It should answer
the question the port actually turns on:

> **Can the existing Canvas-2D painters be carried into Pixi, rather than re-authored?**

Two candidate paths, and this is the real architectural fork:

1. **Re-express each painter as Pixi `Graphics`/shaders.** Full GPU benefit, but every painter
   is re-authored — and these two attempts are direct evidence of how much quality is lost when
   art code is re-written rather than moved.
2. **Run the existing painters on an offscreen Canvas 2D and upload the result as a Pixi
   texture.** The art arrives *pixel-identical* — no re-authoring, no quality loss — at the cost
   of texture upload and giving up per-pixel GPU effects on those layers.

`tools/proofsheet.js` already lifts named functions **verbatim** from `main.js` into a
standalone page, so path 2 is directly testable with machinery that already exists. **That is
the spike worth running**, and it is a far better use of the remaining budget than a third
attempt at drawing a planet by hand.

## Standing recommendation, unchanged and now stronger

**Do not take an art verdict from this spike.** Neither attempt represents what the port would
look like — attempt 1 because it ignored the techniques, attempt 2 because it re-invented them
badly. The shipped art in `tools/uisheets/` is the bar, and the open question is how to *move*
it, not how to *redraw* it.
