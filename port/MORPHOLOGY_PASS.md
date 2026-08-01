# THE MORPHOLOGY PASS — approved slate + execution plan

**Approved by Nick 2026-08-01 ("go the whole slate — it all begins with the art").**
This document is the COLD-START GUIDE for the pass. Read with:
`port/ART_REVIEW_SPECIES_2026-08-01.md` (the merged verdict) and
`audits/species-audit-2026-08-01/` (Nick's full system audit — Blockers 1–8, §15 order,
§16 manifest shape, §17 regression sentinels).

## The law of the pass

The verbatim-parity boundary is now FORMALLY OPEN for the species-art surface ONLY, under
this approval. Everything else stays verbatim. Rules:
1. Every change is a NAMED deviation (D-ART-*) with before/after contact sheets.
2. `npm run speciesaudit` (port/v2) is the gate — 1,254/1,254 must paint after every batch,
   and it GROWS per-family sentinels (Nick §17) as renderers land.
3. The hdart lift stops being regenerable once edited: after the FIRST art edit, mark
   hdart.verbatim.js header "FORKED FOR THE MORPHOLOGY PASS — do not re-lift" and rename
   mentally to the port's own engine. Scene/domain/UI code untouched by this approval.
4. Goal: "every Earth label visually earned" — bodies, not recolors. Style stays: rim-lit
   painterly figurine, grounding shadow, vignette. The strongest existing work IS the bar
   (Elephant/Owl/Chameleon/Scorpion/Sunflower/Fern/Corn/Flytrap).

## Phase P1 — integrity & routing (mechanical, do first)

- [ ] Count canon: diff `tools/render-audit.js`'s enumeration vs `_EARTH_NAMES` (1,010 vs
      1,014) — name the 4-species delta, decide the canonical manifest count.
- [x] Filename mojibake — exporter safe() ASCII-normalizes (done 2026-08-01).
- [ ] The 16 exact byte-duplicate flora groups (38 files; list in Nick's audit §3.3):
      root-cause first (same template+palette hash from hdGenesFor/flora rolls?) — the FIX
      lands with P2's flora organs, but P1 adds a DUPLICATE-DETECTION assert to speciesaudit
      (hash all outputs; fail on exact dupes among differently-named Earth species).
- [ ] The metadata manifest (Nick §16): `port/v2/packages/art/species-manifest.json` —
      per-species `art_family / signature_traits / life_stage / expected_growth_form`.
      Start with the P0 lists (fungi 27, microbes 22, insect life-stage set, specialist
      fish, iconic flora, iconic mammals/birds). The audit gains expected-vs-resolved
      checks against it.

## Phase P2 — systemic renderers (the heavy build)

Each lands as its own batch with sheets + audit re-run:
- [ ] FUNGI structural families ×15 (cap-and-stem · bolete · bracket/shelf · coral ·
      puffball · earthstar · stinkhorn · morel · tooth · truffle · jelly · mold/mildew ·
      yeast · lichen · cordyceps). Route the 27 Earth names; procedural fungi draw from the
      same families + alien opportunities (crystal mycelium, spore bladders…).
- [ ] MICROBE morphologies ×15 (amoeboid · ciliate · flagellate · diatom radial/bilateral ·
      dinoflagellate · radiolarian · foraminiferan · coccoid/rod/filament colonies ·
      cyanobacterial mat · algal colony · glow field · tardigrade). Tardigrade FIRST (the
      icon). Environment labels mod
---

# WAVE 1 — LANDED 2026-08-01 (fungi + microbe families; the icons)

**Architecture decision (better than this doc's original assumption):** the corrections do
NOT fork `hdart.verbatim.js`. They live in a NEW hand-written layer,
`packages/art/src/speciesoverrides.ts`, that `speciesPortrait` consults FIRST (keyed by the
genome's `_earthName`, curly-apostrophe-normalized). Anything unmatched falls through to the
byte-verbatim engine — so the verbatim lift STAYS PRISTINE AND RE-LIFTABLE, and the ~1,200
un-corrected species remain parity-exact. Corrected species cache under a name-suffixed key.
Palette is read EXACTLY as the engine does (`SP_HEX[SP_COLOR[color%len]]`), so a corrected
body still belongs to its rarity/color roll — bodies, not recolors.

**Fungi families shipped (Blocker 1 / audit §8):** bracket/shelf (Oyster · Bracket · Turkey
Tail · Chicken-of-the-Woods · Shelf · Reindeer Lichen — shelves on wood with growth bands) ·
puffball (Giant Puffball · Black Truffle — round spore balls) · coral (Coral Fungus ·
Lion's Mane · Cordyceps — recursive branching fingers) · morel (honeycomb-pitted conical cap)
· mold/mildew/yeast (fuzzy spreading colonies, no cap/stem) · earthstar (splayed rays + spore
sac). True gilled mushrooms (Chanterelle/Fly Agaric/Shiitake/Porcini/Death Cap/Enoki/Maitake/
Jelly) correctly FALL THROUGH to the verbatim painter.

**Microbe morphologies shipped (Blocker 2 / audit §9):** tardigrade (segmented barrel + 8
clawed legs + terminal mouth; ⚠ CONTRAST GUARANTEE — a dull/dark roll warms toward real
translucent-amber so the icon never vanishes, the D-ART-3 floor at the source) · diatom
(radial spoked shell OR bilateral ribbed glass) · radiolarian (radial silica) · ciliate
(Paramecium/Euglena — slipper + cilia fringe + oral groove + vacuoles) · amoeba
(Foraminiferan too — pseudopod blob + nucleus). Environmental bacteria (cyanobacteria,
methanogen, the -ophile/-oxidizing set) keep the verbatim cluster for now — Nick §9 says
habitat labels MODIFY morphology, a later wave.

**Proof:** `npm run speciesaudit` → 1,254/1,254 painted, 0 failures (parity held); the fungi
and microbe contact sheets are the before/after (smoke/sheet-earth-{fungi,microbe}.png).
Gates green: vitest 22/220 · tsc clean · slicesmoke PASS. `D-ART-6 (fungi families)` and
`D-ART-7 (microbe morphologies)` are the ledger entries; wave 1 corrects
`OVERRIDE_COUNT` species by name.

**NEXT WAVES (unchanged order):** P1 remainder (count canon · the 16 flora dupes · the §16
manifest + duplicate-detection assert in speciesaudit) → P2 remainder (insect life-stage ·
specialist fish bodies · aquatic inverts · iconic flora · the flower-head family beyond the
daisy) → P3 fauna family polish (defining-feature guarantees; the agents' weakest-list is the
worklist) → P4 procedural body plans + heat-as-design + the cold-flora blur bug. Each wave =
its own batch: override painters → audit re-run → sheets → gate → commit.

---

# WAVE 2 — LANDED 2026-08-01 (flora: the duplicates die, the icons earn their labels)

**★ ROOT CAUSE PROVEN for Blocker 3 (the 16 byte-duplicate groups / 38 files):** the verbatim
flora painter's generic "leaf ladder" is deterministic per FORM and consumes no per-species
variation — the species NAME never reaches the painter. Acai/Milkweed/Salmonberry have
genuinely DIFFERENT genomes (form 12 / 10 / 1) and still rendered byte-identical pixels.
Not an art-taste problem: a code-shape problem.

**The fix (`packages/art/src/floraoverrides.ts`):** a NAME-SEEDED painter. Leaf count,
phyllotaxy (alternate vs opposite), leaf angle/shape, stem lean, and the fruiting organ
(berries vs seed head) all derive from a hash of the species' OWN NAME xor'd with its genome
seed — so two different labels can never collide again, structurally rather than by luck.
All 37 names from the 16 groups route through it.

**Iconic plants (Blocker 5) with bespoke bodies:** Rafflesia (five fleshy spotted lobes at
ground level, central well, NO stem) · Pineapple (basal rosette + crosshatched fruit +
spiky crown) · Joshua Tree (branching woody trunk + terminal spike rosettes) · Cotton
(branching plant hung with white bolls) · Dragon Fruit (climbing ribbed cactus stems +
hanging fruit) · Rhubarb (broad basal leaves on RED petioles) · Tobacco (broad leaves, green
petioles) · Cabbage (layered ground head).

**★ THE DUPLICATE SENTINEL IS NOW PERMANENT (Nick §17 regression):** `speciesaudit` hashes
every Earth portrait and FAILS (exit 1) naming any two differently-named species that render
identical pixels. Blocker 3 cannot return silently.

**Proof:** flora duplicate groups **16 → 0**, files **38 → 0**, all 334 flora unique;
`speciesaudit` 1,254/1,254 painted · 0 failures · 0 duplicate pairs. Gates: vitest 22/220 ·
tsc clean · slicesmoke PASS. `hdart.verbatim.js` STILL UNTOUCHED.

**Ledger:** D-ART-8 (flora name-seeded anti-duplicate) · D-ART-9 (iconic flora bodies).

---

# WAVE 3 — LANDED 2026-08-01 (fauna specialists: life stages, body plans, THE WING)

**Blocker 4 — life-stage + arthropod body plans.** `faunaLarva` (legless segmented grub with
a dark head capsule — Fly Larvae/Maggot/Caterpillar/Grub were drawn as WINGED ADULTS) ·
`faunaWingedInsect` (TWO WING PAIRS with venation, long segmented abdomen, compound eyes, six
thoracic legs; `open` for Dragonfly, folded+slim for Damselfly/Mayfly, Scorpionfly) ·
`faunaBeetle` (domed elytra + seam; spots for Ladybug, luminous abdomen for Firefly, paddle
hind legs for Diving Beetle) · `faunaSpringtail` (WINGLESS, compact, with the furcula spring)
· `faunaFiddler` (ONE dramatically enlarged claw + one small — the whole point) ·
`faunaHorseshoe` (horseshoe carapace + rigid tail spine).

**Blocker 6 — specialist fish + marine bodies.** `faunaFlatfish` (lying flat, continuous fin
fringe, BOTH EYES ON THE UPPER SIDE — Flounder/Halibut/Sole) · `faunaAngelfish` (deep
laterally-compressed body, tall dorsal+anal fins, trailing filaments) · `faunaLionfish`
(radiating venomous spine fan + bold bands) · `faunaCephalopod` (mantle + lateral fin skirt +
EIGHT arms, plus two long feeding tentacles for squid) · `faunaCetacean` (long body with a
HORIZONTAL FLUKE — never a vertical fish tail — blowhole, pectoral flipper, and a per-species
dorsal: tall for Orca, small for Blue/Humpback/Dolphin, none for Sperm/Right/Gray/Beluga,
blunt heads where the species has one).

**★ THE WING, AT LAST (the agents' #1 systemic: NO bird in 631 fauna showed one).**
`faunaBird` draws a real FOLDED WING — three layered covert bands plus six primaries fanning
to the tail — and takes leg length + bill shape as species parameters: hooked raptor bills
(Eagle/Harpy/Hawk/Falcon/Vulture/Secretary), long probing bills (Heron/Crane/Stork/Ibis/
Snipe/Godwit/Albatross), the spoonbill's spatula, huge bills (Pelican/Toucan/Kookaburra/
Hornbill), stout bills, crests, and flightless posture (Kiwi/Cassowary/Ostrich/Emu/Kakapo).
⚠ Fixed in review: the leg math had the body at a fixed height so a Flamingo didn't tower —
the body now rides legLen ABOVE a fixed ground line, so wader vs raptor reads instantly.

**Scope discipline (recorded):** the quadruped mega-template polish (Rhino vs Hippo
proportions, cheetah spots, Camel's neck) is WAVE 4 — those read as the right animal FAMILY
today, just under-differentiated, whereas wave 3 fixed species that were categorically wrong.

**Proof:** `speciesaudit` 1,254/1,254 painted · 0 failures · 0 duplicate pairs. Gates: vitest
22/220 · tsc clean · slicesmoke PASS. `hdart.verbatim.js` STILL UNTOUCHED.
**Ledger:** D-ART-10 (insect life stages + arthropod plans) · D-ART-11 (specialist fish +
cephalopod + cetacean bodies) · D-ART-12 (the bird wing + bill/leg species parameters).

---

# WAVE 4 — LANDED 2026-08-01 (the quadruped system + THE OVERRIDE LAW)

**Nick's instruction:** carry wave 3's structure "to everything, forward and backward."

**THE QUADRUPED SYSTEM (`packages/art/src/quadrupedoverrides.ts`).** One parameterized mammal
painter whose SPEC *is* the species: leg length · body depth/length · neck length · BACK PROFILE
(level/humped/sloped/arched) · muzzle projection · jaw (fine/broad/barrel) · ear family
(tiny→huge) · tail family (stub/tuft/bushy/plume/banded/long) · coat (spots/rosettes/stripes/
patches/panda/shaggy/banded) · signature organ (nose horn / twin horn / ossicone / palmate
antler / branched antler / tusks up or down / curled horn / humps / trunk). **Proportion carries
identity before decoration does.** Coats are CLIPPED to the torso so they read as fur rather than
stickers; a species-true hue overrides the roll ONLY where the animal's color IS its identity
(white Polar Bear, the Panda's blocking, Cheetah tan) — everything else keeps its rarity palette.
40 species routed: the pixel-siblings finally separate (Rhino: twin nose horns, longer legs;
Hippo: barrel jaw, stub legs, tiny ears), Camel/Bactrian get humps and a long curved neck,
Giraffe carries patches UP the neck with ossicones over a sloped back, Moose gets palmate antlers
on a humped shoulder, Bison a shoulder hump and shaggy front, Cheetah spots + tear lines, Fennec
huge ears, Hyena a sloping back, Koala round ears, and the bears differentiate (Grizzly hump /
Polar long neck + white / Sloth shag).

**THE OVERRIDE LAW, learned the hard way this wave:**
> **NEVER OVERRIDE WHAT ALREADY EXCELS.** A generic system cannot beat bespoke work.

Caught in review: the generic quadruped made the **Elephant WORSE** — the verbatim engine's
Elephant scored 4.5/5 (one of the catalog's best, with a real curled trunk), and Nick's audit
lists Zebra/Tiger/Lion/Red Panda among its "stronger reads". All were REMOVED from the override
table and keep the verbatim painter. This law governs every future wave: the override table is
for the FAILING, never for the strong.

**Two painterly fixes from the same review:** the back line was a faceted polyline (a sloped back
read as a table edge) → sampled and joined through midpoint quadratics; the spine rim light was a
flat bright stroke (another hard edge) → now a gradient that FADES at both ends, like light falls.

**Proof:** speciesaudit 1,254/1,254 · 0 failures · 0 duplicate pairs. Gates: vitest 22/220 · tsc
clean · slicesmoke PASS. hdart.verbatim.js STILL UNTOUCHED.
**Ledger:** D-ART-13 (quadruped proportion/coat/signature system) · D-ART-14 (the override law +
the two profile fixes).

## Backward check (Nick's "forward and backward")
Waves 1–2 hold the same structure: fungi families draw real growth habits (shelves on wood with
concentric bands, branching coral, honeycomb morel, fuzzy mold), microbes draw real morphology
(segmented tardigrade with clawed legs, ribbed diatom glass, ciliated slipper), flora varies per
name with bespoke iconic bodies. All keep the shared furniture (vignette, grounding shadow, rim
separation, genome palette). No backward rework needed; the remaining gap is the UNTOUCHED long
tail, which the audit tracks.
