# Addendum D — External technology verification

**Restores v3.1 §25. Slots into v4.0 as §28, and gates Phase 0.**

v3.1's §25 was a fifteen-line list of the vendor documentation the stack recommendation had been checked against. v4.0 dropped it. It is worth having as a *dated* check rather than a static list, because two of the four locked technologies have moved since the July 2026 lock and one of them changes a cost line.

**Re-verified 31 July 2026.** Two findings below are material.

---

## D.1 PixiJS — current, and the version to pin

| | |
|---|---|
| Current stable | **8.18.1** |
| Maintained | 8.x only |
| Not maintained | 7.4.2 · 6.5.10 · 5.3.12 · 4.8.9 |

The 8.x line is healthy and actively shipping — 8.16 was a documented feature release and the blog carried a June 2026 update. **Decision D3 (PixiJS 8) stands unchanged.** Pin a minor and upgrade deliberately; the plan's WebGL-baseline / WebGPU-opt-in rule (§2.4) matches the vendor's own current guidance, which continues to treat WebGL as the safer production baseline.

*Action for Phase 0: pin the exact minor in `package.json` and record it in the baseline archive, so Gate A's "exact v1.8.9 archive" has a matching renderer version.*

## D.2 Spine — **two findings that change cost and sourcing**

### D.2.1 The runtime moved

The community `pixijs/spine-v8` repository is **archived**. Its last release was **v2.1.1, 24 September 2024**, and it now redirects to the official Esoteric Software runtimes at `spine-runtimes/tree/4.2/spine-ts`.

The canonical package is **`@esotericsoftware/spine-pixi-v8`**, maintained by the vendor rather than the community.

*Action: reference the vendor package by name in §18's repository structure and in any dependency list. v3.1's §25 cited "Official `spine-pixi-v8` runtime documentation", which was correct at the time and now points at an archive if taken literally.*

### D.2.2 The licence tier the plan needs is not the cheap one

| Tier | Price | Notes |
|---|---:|---|
| Essential | **$69** | *"Meshes and other advanced features are not included"* |
| **Professional** | **$379** | All features, all future updates |
| Enterprise | **$2,499 base + $379 per user** | **Required above $500,000 annual revenue**, annual, concurrent-user model |
| Education | $850–$2,900 | Accredited institutions, non-commercial only |

**Essential explicitly excludes meshes — and mesh deformation is the core of decision D3.** §2.1's "animation-ready layered art, reusable rig families and mesh deformation", §10.4's core animation library and §17.4's phenotype-to-rig pipeline all require it. **Professional at $379 is the floor**, per rigger seat.

Runtime licensing: an editor licence is not required to *use* the runtimes, but it is required to *integrate* them into a new product. A lapsed licence lets you keep distributing what you have shipped; it does not let you ship something new. For a project with a rigger and a technical animator on staff (§21.4), that is at least two Professional seats maintained through production, and **Enterprise becomes mandatory if the browser release crosses $500,000 annual revenue** — which is a success condition, not a failure one, and should be a budgeted line rather than a surprise.

*Action: two decisions before Phase 0 locks — how many Professional seats, and whether the Enterprise threshold is modelled in the business plan. Neither blocks Phase 1.*

## D.3 Web Audio — unchanged, and the plan's assumptions still hold

The Web Audio API remains a W3C browser standard built around a routable audio-node graph, and it is appropriate for interactive canvas/WebGL applications. `AudioWorklet` is available for custom low-latency processing on a separate audio-rendering thread and should be used selectively rather than for routine playback.

Modern browsers commonly block audible autoplay until a user interacts with the page, so **the existing gesture-resume behaviour remains a required production feature** — v4.0 §15.1 already lists "audio activation, suspension recovery, mute lifecycle, and hidden-tab cleanup" as release-blocking, which is the correct treatment.

Nothing here changes. §15's architecture is standards-aligned.

## D.4 Howler.js — reconsider, and probably drop

v3.1 listed Howler as an optional lightweight abstraction for audio sprites and spatial audio. Two things have changed since that recommendation:

1. The game's audio is **fully procedural with zero shipped assets** — measured across v1.8.2 to v1.8.6 as zero `.mp3`/`.ogg`/`.wav` references and zero `decodeAudioData` calls. Audio-sprite management, Howler's main value, has nothing to manage.
2. §15.3's architecture calls for a **multi-bus mixer** (master / music / ambience / creature / combat / UI) with spatial emitters, which is a Web Audio node graph. Howler sits above that abstraction rather than inside it.

If §15.4's adaptive music introduces streamed authored tracks, revisit it then for the streaming and concurrency handling. Until then it is a dependency with no job, against a hard payload budget.

## D.5 Not previously verified, and worth adding to this section

Four dependencies in the locked stack that v3.1's §25 predates:

| | Status for Phase 0 |
|---|---|
| **Vite** | Verify the major version and the plugin set at pin time; the build is a Gate A artefact |
| **Zod** | Confirm the version whose `z.infer` behaviour the type layer depends on — the whole point is that the type and the runtime check cannot drift, and that is a version-coupled guarantee |
| **Vitest** | Pin alongside Vite; the two track each other |
| **Playwright / owned raw CDP** | Pin the driver/transport and record the exact browser tuple for every run. Gate authority should bind compatible family, protocol and exercised capabilities; point version is provenance unless a ruler explicitly proves it owns a version-coupled numeric contract |

That last row is a real gate hazard in both directions. v4.0 §22 Gate A requires “negative controls
prove tests discriminate,” so neither an incompatible browser nor a green-by-version check is
acceptable. The root layout gate seals outcome keys rather than browser-specific numeric samples:
its current authority is canonical Chromium family + CDP `1.3` + the source-derived exercised
method contract + complete run provenance. A compatible point-version update alone never
rebaselines or changes thresholds. Exact Edge 150 remains historical v1.8.9 capture provenance.
Compendium and SceneMemory own separate explicit capability/profile authorities; exact package
installation in a workflow is reproducible provisioning, not a cross-gate version pin.

---

## D.6 Summary of actions

| # | Action | Blocks |
|---|---|---|
| 1 | Pin PixiJS 8.x minor and record it in the Gate A baseline | Phase 0 |
| 2 | Switch the dependency reference to `@esotericsoftware/spine-pixi-v8` | Phase 0 |
| 3 | Budget Spine **Professional** ($379) per rigger seat — not Essential | Phase 0 |
| 4 | Model the **$500k Enterprise threshold** in the business plan | Not blocking |
| 5 | Drop Howler unless §15.4 introduces streamed authored music | Phase 7 |
| 6 | Pin Vite / Zod / Vitest and the browser driver/transport; seal browser family/protocol/capabilities and record exact per-run revision provenance | Phase 0 |
| 7 | Re-run this verification at each milestone gate, dated | Every gate |

Item 7 is the point of restoring the section at all. A static list of vendor documentation ages into a liability; a dated check that is re-run at each gate does not.

---

**Sources**

- [PixiJS — Versions](https://pixijs.com/versions)
- [PixiJS — News and releases](https://pixijs.com/blog)
- [Esoteric Software — Spine purchase and licence tiers](https://esotericsoftware.com/spine-purchase)
- [pixijs/spine-v8 — archived repository, last release v2.1.1](https://github.com/pixijs/spine-v8)
- [Esoteric Software — spine-runtimes 4.2 / spine-ts](https://github.com/EsotericSoftware/spine-runtimes/tree/4.2/spine-ts)
- [Esoteric Software — spine-pixi-v8 runtime release announcement](https://esotericsoftware.com/blog/spine-pixi-v8-runtime-released)
