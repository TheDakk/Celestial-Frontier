# Procedural (Non-Earth) Characteristics — Catalog & Pass Map

_Matches code as of 2026-07-21 (v1.6 Batch 15.5). Companion to `ART_DIRECTION.md`._

> **B15 release-polish (render-only, fp 50/50):** FA_SKIN now renders as STRUCTURAL material
> (scale rows / fur fringe / chitin bands / wet sheen / armour plates / warts / feathers /
> translucent channels / crystal facets) in hdBeastBare, masked to the body. Procedural land
> limbs draw functional fore/mid/rear GROUPINGS (tripod 3, arthropod 8). HABITAT no longer erases
> the plan: aquatic shelled/crystalline/tusked/horned/squat → shell-backed / mineral-plated /
> tusked / horned / benthic SWIMMERS (`_procFamily` `fpreserve` + hdBeastBare grafts). fish/crust/
> ceph express the TAIL gene. AQUATIC flora splits into 6 subfamilies + AERIAL into 3 (`aqsub`/
> `aersub` from the form gene). FROGS draw an iris+pupil on top of the texture. Plan 0 = **sturdy-
> limbed land grazer** (renamed from "six-limbed"; limb gene sets the count). VISTAS: coral →
> new `_hdReefScene`; jungle canopy; global creature scale/contact.
>
> **B15.2–15.5 (render-only, fp 50/50):** the 3 weak skins REBUILT — furred = soft uneven fringe +
> neck/chest/tail tufts; feathered = overlapping directional contour feathers + tail plume;
> translucent = body opacity dropped to 0.66 with internal spine/ribs/gut/heart. Butterfly/moth
> return `faceOn` → a matched frontal eye PAIR. LEPIDOPTERA classifier hardened (resolves before
> hawk/peacock/tiger/elephant → "Hawk Moth"/"Peacock Butterfly" → insect; bare Hawk/Peacock → bird);
> 23 regression sentinels in rig-audit. BIOMES: canyon walls · glass shards · saltflat(cracks) vs
> saltpan(brine) split · rocky-cluster dressing (geode amethyst crystals etc.) · gas-giant aerial
> life in `_hdDeckScene` · `_hdAbyssScene` now draws the real genes (Earth≠procedural). Non-Earth
> biome coverage tooling: `tools/sheets/biome-coverage.js` (MODE=earth|proc, EMPTY=1) +
> `tools/biome-audit.js` (empty-purity / population / Earth≠procedural separation / fauna-free whitelist).

This is the alien-life equivalent of the Earth bible: a map of every genome
descriptor that _could_ drive procedural creature/flora art, **what it currently
draws**, and **the pass opportunity**. Built from the catalog sheets
(`proc-plans`, `proc-heads`, `proc-features`, `proc-flora-forms`,
`procswarm`, `procflora`) — all rendered full-size through the real card box-fit.

> **UPDATE — Pass 7 (2026-07-21): the fauna PHENOTYPE RESOLVER is now BUILT.** The genome's
> head/eye/tail/limb descriptor genes now DRAW on procedural creatures — beaks, fangs, paired
> mandibles, tendril fringes, crests, neck frills, bulbous domes, eyeless sensory pits; eye
> counts (0/1/2/4/6/8); tail types (whip/finned/spiked/prehensile/plume/stinger); and true
> limb counts (2/3/4/6/8). This required a Nick-authorized determinism re-pin. STILL open:
> skin surface treatment, tusk/horn libraries, habitat-preserve-body-plan (aquatic override),
> diet-driven mouths. The sections below describe the PRE-Pass-7 state for reference.

The headline (pre-Pass-7): **procedural FLORA already reads as distinct growth forms; procedural
FAUNA carries rich descriptor genes that the art mostly ignores** (heads, tails,
eyes, limbs, and most traits are text-only today). That gap is where an
Earth-style pass buys the most — fangs, mandibles, frills, tendrils, real wings,
varied horns/tusks, tail types, eye counts.

Determinism note: procedural body-family selection (`_procFamily`) and all rig
drawing live in the DRAWING layer, so new rendering here is **fingerprint-safe**
(the probe pins `hdGenesFor` genes, not pixels) — no re-pin, same as the Earth work.

---

## 1. Fauna body plan (`g.body % 16` → `plan`) — WORKS, some weak spots

Each plan yields a coherent silhouette. Aquatic habitats route many plans through
`_procFamily` to a fish/ceph/jelly swimmer (intentional — the water writes the body).

| plan | family | reads as | status |
|---|---|---|---|
| 0 | sturdy-limbed land grazer | limb gene sets the count (2/3/4/6/8); grouped fore/mid/rear stance | OK (B15: renamed from "six-limbed", count now gene-driven) |
| 1 | armored crawler | crab / low armored body | OK |
| 2, 12 | stilt-legged | tall-legged quad | OK |
| 3 | tentacled | octopus / squid / cuttlefish | OK |
| 4 | serpentine | snake | OK |
| 5 | segmented | ant-like, antennae, many legs | OK |
| 6 | shelled | turtle-ish dome | OK |
| 7, 14 | **winged** | **plain quad — wings ~invisible** | **WEAK** |
| 8 | crystalline-spined | quad/fish + back spikes | OK |
| 9 | gelatinous | jellyfish | OK |
| 10 | tusked | quad/fish + one small tusk | thin |
| 11 | heavy-horned | quad + small horn | thin |
| 13 | squat | low-slung quad | OK |
| 15 | radial | urchin / anemone / radial | OK |

**Pass opportunities:** (a) real WINGS for plan 7/14 — membrane or feathered,
folded-at-rest or spread, taking the hide texture (today only a faint stub
membrane draws). (b) plan 10/11 tusks/horns are small & generic — give them the
variety we gave Earth (curved/straight/spiral/palmate, paired tusks).

## 2. Fauna HEAD (`g.head % 10` = `FA_HEAD`) — **TEXT-ONLY TODAY (biggest gap)**

Every descriptor draws the **same generic circle-head + one eye + an occasional
thin nub/horn**. The `proc-heads` sheet shows all ten rows are visually identical.

| idx | descriptor | should show | today |
|---|---|---|---|
| 0 | blunt-snouted | short rounded muzzle | generic |
| 1 | beaked | a bird-like/keratin beak | generic |
| 2 | eyeless & smooth | no eye, smooth dome | draws an eye anyway |
| 3 | crested | a raised head crest | thin nub only |
| 4 | mandibled | insect mandibles / jaws | generic |
| 5 | tendril-fringed | sensory tendrils around the face | generic |
| 6 | horned | horns (already partly via `horn`) | thin horn |
| 7 | domed & bulbous | swollen cranium | generic |
| 8 | **fanged** | protruding fangs/teeth | generic |
| 9 | frilled | a neck frill (dilophosaurus-like) | generic |

**Pass opportunity:** a procedural HEAD system keyed on `g.head`, the way
`_rigMammal`'s head supplement keys Earth families — fangs, mandibles, beak,
frill, crest, tendrils, dome, eyeless. Highest visual payoff of the whole
procedural set.

## 3. Fauna TAIL (`g.tail % 7` = `FA_TAIL`) — TEXT-ONLY TODAY

`whip / finned / spiked / prehensile / plumed / stinger` all draw the **same thin
curved tail** (`proc-features` rows TAIL 1–6). Only length varies slightly.

**Pass opportunity:** tail-type rendering — a fin blade, spike row, curled
prehensile tip, feather plume, scorpion-style stinger. (`R.tail` is currently a
scalar length; add a tail-TYPE channel from `g.tail`.)

## 4. Fauna TRAITS (`g.trait % 25` = `FA_TRAIT`) — mostly text-only

Visually distinct today: `crystal antlers` and `crested` feed `R.horn`. **Not
rendered:** `single curved horn`, `armored crest-plates`, `humped water-store`
(no hump!), `whip-like tails`, `retractable claws`, `translucent flesh`,
`electric charge`, `sensory whiskers`, etc.

**Pass opportunity:** wire the marquee traits to silhouette modifiers (a real
back hump for humped; dorsal plates for crest-plates; a single asymmetric horn),
mirroring Earth's `withers`/`shag`/`orn` flags.

## 5. Fauna EYES / LIMBS / SKIN — TEXT-ONLY TODAY

- `FA_EYES` (1/2/4/6/8): always draws **one eye** regardless (`proc-features` EYES
  rows identical). Opportunity: multi-eye clusters, compound eyes, eyeless.
- `FA_LIMBS` (2/4/6/8/3/0 pairs): quads keep the standard leg count. Opportunity:
  drive leg count from `g.limbs` (hexapod/octopod land forms, legless).
- `FA_SKIN` (scaled/furred/chitinous/plated/warty/feathered/translucent/crystalline):
  the texture pass shades it but there's little structural read. Opportunity:
  plates, scutes, fur fringe, translucency, crystal facets.

## 6. Procedural family rigs (`_procFamily`) — WORKS

Non-Earth genomes with the right plan route to a functional rig with real anatomy:
serpent / jelly / sessile-radial / ceph / insect / crust / fish-swimmer. This is
the piece that already reached Earth-rig quality. **Next:** within-clade variation
(feeding-specific heads, foot/joint types, propulsion, predator-vs-grazer).

## 7. Procedural FLORA (`g.form % 16` + `aq`/`af`/`lumin`) — STRONG

All growth forms render distinct and recognizable (`proc-flora-forms`):
`tree · conifer · palm · shrub · herb · flower · grass · cactus · fern · vine ·
seaweed · moss · trap · crop · root`. Sub-variants vary too:
- tree `tform`: broad / weep / baobab / acacia
- conifer `cform`: spire / layered / bushy / dense / round / columnar _(bushy/round
  read least conifer-like — same note as Earth juniper/pinyon)_
- flower `fform`: daisy / disc / orchid / spike / lily
- luminescence: localized organ glow works

**Pass opportunities (finer, per the review):** visible roots / substrate
attachment; visible harvestable organs (fruit, pods, tubers); wider scale classes
(tiny groundcover → giant canopy); tie morphology to biome chemistry; keep
luminescence organ-localized.

---

## Suggested pass order (highest payoff first)

1. **Procedural HEAD system** (`g.head`): fangs, mandibles, beak, frill, crest,
   tendrils, dome, eyeless — §2.
2. **Real WINGS** for plan 7/14 — §1.
3. **Tail-type rendering** (`g.tail`) — §3.
4. **Marquee trait modifiers** (hump / crest-plates / single horn) — §4.
5. **Eye-count & limb-count** from genes — §5.
6. **Within-clade variation** for the family rigs — §6.
7. **Flora roots / harvest organs / scale classes** — §7.

Each is drawing-layer + gene-driven → fingerprint-safe. Review the catalog sheets
and mark which to run; we take them one at a time exactly like the Earth passes.
