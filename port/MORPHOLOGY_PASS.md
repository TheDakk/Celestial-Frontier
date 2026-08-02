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

---

# WAVE 5 — LANDED 2026-08-01 (Nick's two laws: FIT THE FRAME · BLEND THE PATTERN)

Nick's review of wave 4: *"the animals must fit within the window — the hippo's nose is off
screen, same with the giraffe … the giraffe could use a lot more spots, the spots are like
octagons right now. Make them blend into the creature's skin around the edges. That's the way
it should look on all creatures."* Both became universal laws, applied backward and forward.

## ★ LAW 1 — THE FIT PASS (no subject may ever clip)
`resolveOverride` no longer lets a painter draw straight into the frame. Every override
subject is painted to a TRANSPARENT layer, its ink bounds are measured, and it is
scaled + centred into the frame at a 0.90 margin (shrink-only — a small creature is never
blown up). This is the verbatim engine's own `_fitPlant` convention generalised to EVERY
override painter, so the clip class cannot exist again — fungi, microbes, flora and fauna all
route through it. Hippo's muzzle and Giraffe's head now sit fully in frame with air around
them.

## ★ LAW 2 — THE PATTERN LAW (a mark blends into the skin)
A coat mark is never a hard-edged polygon stamped on the body. `softMark()` draws each mark
as a radial gradient whose alpha falls to zero at the rim, and organic patches are built from
OVERLAPPING soft marks so the outline is irregular the way a real coat is. Rewritten with it:
- **patches** (Giraffe) — the 6-gon stamp that read as octagons is GONE; 84 patches, each a
  cluster of 3-5 soft lobes, now covering the FULL torso (the old y-range missed the upper
  back) and carried up the neck as soft marks (was a dashed stroke — another hard edge).
- **spots** (Cheetah/Deer/Hyena/Lynx) — 78 soft marks, varied radii and rotation.
- **rosettes** (Jaguar/Leopard/Snow Leopard) — the ring is 4-6 soft marks around a circle
  with a soft core: broken and blended, the way a rosette sits in fur.
- **stripes** — bands stacked from soft marks so their edges melt into the coat.

## Also this wave
The 'level' back got a gentle withers-to-rump curve: a ruler-straight spine reads as a table
edge, never as an animal (same family as wave 4's faceted-back and hard-rim fixes).

**Proof:** speciesaudit 1,254/1,254 · 0 failures · 0 duplicate pairs. Gates: vitest 22/220 ·
tsc clean · slicesmoke PASS. hdart.verbatim.js STILL UNTOUCHED.
**Ledger:** D-ART-15 (the fit pass) · D-ART-16 (the pattern-blending law).

---

# WAVE 6 — LANDED 2026-08-01 (the PRE-CLIP bug + the CLIP SENTINEL + coverage map)

Nick: *"the hippo's nose is still getting cut off. It's not round. We're gonna go back and
check that on all the artwork … are we done with all the creatures yet?"*

## ★ THE PRE-CLIP BUG — why wave 5's fit pass wasn't enough
Wave 5 measured the subject's ink and centred it. But the ink was measured on a **440 layer**,
and a painter reaching past 440 is **cut by the canvas edge BEFORE the measurement happens** —
so fitInk was faithfully centring an already-severed muzzle. A fit pass can only rescale what
survived the draw.
**Fix:** the ink layer is now **OVERSIZED (2S = 880) with the painter's origin offset by S/2**,
so overflow in every direction survives; the measurement then sees the WHOLE subject before
it is scaled into frame. (Same shape as the port's other instrument lessons: the check was
honest, the thing it measured was already broken upstream.)

## ★ THE CLIP SENTINEL — "check that on ALL the artwork", automated forever
`fitInk` records any subject whose ink reaches the oversized layer's own edge — i.e. cut at
DRAW time, which no fitting can undo. The audit surfaces it and **`speciesaudit` now exits 1
naming the offenders**, alongside the paint and duplicate sentinels. Current run:
**1,254/1,254 painted · 0 failures · 0 duplicate pairs · 0 clipped.**

## The hippo's snout is ROUND
`jaw: 'barrel'` no longer draws a tapered ellipse: it draws a blunt rounded block with a domed
end and two nostril pads on top — a hippo muzzle, not a snout.

## ★ COVERAGE MAP (Nick asked "are we done with all the creatures?") — honest answer: NO
| group | corrected |
|---|---:|
| fungi families | 5 routes covering all 27 |
| microbe morphologies | 4 routes |
| flora iconic | 8 |
| flora anti-duplicate | 37 |
| fauna specialists (insects/fish/marine/birds) | 66 |
| quadruped system | 40 |
| **TOTAL** | **160 of 1,014 Earth species (15.8%)** |

The other **854 still render on the byte-verbatim engine** — which is the correct default: the
reviews found the engine's *coherent* set with specific failures, and the override table is
for the failing (D-ART-14: never override what already excels). REMAINING WORK, in the order
the reviews ranked it: reptiles/amphibians · rodents/small mammals · the remaining fish and
shellfish · primates · the long tail of birds · procedural fungi/microbe body plans (Nick's
audit §12/§13) · flower-head families beyond the daisy · the 43 biome-scene painters (Phase 6).

**Proof:** gates vitest 22/220 · tsc clean · slicesmoke PASS · hdart.verbatim.js UNTOUCHED.
**Ledger:** D-ART-17 (the pre-clip fix + clip sentinel) · D-ART-18 (the barrel snout).

---

# WAVE 7 — LANDED 2026-08-01 (reptiles·amphibians·rodents·primates·invertebrates
# + ★ THE DEAD-ROUTE SENTINEL + ★ THE EYEBALL INSTRUMENT)

Nick: *"all right, let's continue on. This is great. Keep making progress."*

## ★★ THE FINDING OF THE BATCH: 24 PAINTERS NOTHING COULD EVER CALL
Wave 7's first table was written from memory of *what animals exist* rather than from
**what the CATALOG contains**. It routed King Cobra, Sea Snake, Bonobo, Tarsier, Chinchilla,
Loris, Periwinkle, Coral Snake, Boa Constrictor, Cane Toad, Giant Tortoise, Electric Ray and
Ring-Tailed Lemur — **none of which are species in this game.** Then the same audit of waves
3 and 4 turned up eleven more (Caterpillar, Grub, Maggot, Lacewing, Sole, Stag Beetle,
Bighorn Sheep, Dromedary, White Rhino, Bracken, Water Bear). **24 painters, written, listed,
and unreachable.**

Every species audit through all of it was **green**: 1,254/1,254 painted, 0 failures. It had
to be. *The audit renders the names the catalog asks for* — a table key the catalog never
mentions is not a thing the audit can look at. This is the project's own recurring lesson in
a new costume (PROCESS_LAWS: seven checks have passed while the thing they guarded was
broken): **a check can only see the axis it measures.**

### `tools/overridecheck.mjs` — the standing guard (`npm run overridecheck`)
Reads the catalog straight out of `apphooks.verbatim.js`, reads every override table key,
and **exits 1 naming any key that resolves to nothing** — with the nearest real catalog name
attached, so the finding is actionable ("Dromedary → did you mean *Dromedary Camel*?"). It
also reports **measured coverage**, so our percentages stop being claims. It catches
**duplicate keys** too — legal JavaScript in which the later entry silently wins.
**Its own first cut had two bugs before it found any of ours:** a naive string scan reported
38 phantom dead routes (a painter's *options* — 'barrel', 'spots', 'monkey' — are strings
too, so the scan is now brace-depth aware), and an `export const`-only scan skipped
FUNGI_NAME and MICROBE_NAME entirely and would have reported "fungi 0" as if wave 1 never
happened. **Negative-controlled in both directions** (a nonexistent key → exit 1; a duplicate
key → exit 1; clean tables → exit 0).

**Result: 310 keys · 310 resolve · 0 dead.** Measured coverage is **fauna 241 · flora 43 ·
fungi 16 · microbe 10 = 310 of 1,010 Earth species (30.7%)** — up from wave 6's *claimed* 160.
(Wave 6's "5 fungi routes covering all 27" was wrong: it covers **16**; the other 11 fungi
fall to verbatim.)

## ★ `tools/speciesstrip.mjs` — the EYEBALL INSTRUMENT (`npm run strip "A,B,C"`)
The audit answers *"did 1,254 paint?"*. Nothing answered *"does it look right?"* without
exporting 1,254 PNGs. The strip renders any named list BIG and labelled into one sheet,
through **the same genome the audit uses**, so what a human judges is exactly what the audit
measured. It paid for itself immediately — the first strip is what showed the two red boxes
that exposed the dead routes above, plus four painters that were quietly bad.

## What the strip showed, and what it cost to fix
| the strip said | the cause | the fix |
|---|---|---|
| snakes are strings of BEADS | 46 stamped discs along the spiral; the gaps were the whole problem | one continuous 200-segment round-capped ribbon, shaded across its own girth, drawn back-to-front so the coil still stacks |
| the cobra has no hood | the hood was painted in the body's own colour and vanished into the coil behind it | a notched shield with its own lighter face, dark rim, ribs and spectacle mark |
| snakes read as garden HOSE | one flat unbroken highlight down a smooth tube | the dorsal light is broken into scale rows with a seam every fifth segment |
| frogs read as SPIDERS | a small pad and a thin curve for a hind leg | the leg's three real masses: folded thigh, angled shin, long flat foot with splayed toes |
| the rabbit is a green BLOB | a tall ear ellipse centred only 0.78·hr above the head, so at ears=1.6 it reached below the chin and swallowed the head | an ear is anchored by its BASE at the skull and grows upward from there |
| every primate is the same BALL | an ellipse torso | a traced shoulder-to-hip taper (great apes widest, monkeys nearly parallel) + shoulder caps |
| every primate wears a GOWN | the legs were drawn BEHIND the torso and disappeared under it | thigh, shin and long grasping foot, drawn in FRONT |
| the shells are painted ROSES | a flat swirl of two alternating flat colours | each whorl turn is a shaded sphere with a depth rim — a cone seen from the side |
| the starfish is a SPIKE | thin geometric arms | plump arms with rounded tips |
| the anemone is a SHAVING BRUSH | tentacles washed to near-white on pale palettes | a base-to-tip gradient carrying the animal's own colour |

## ★ THE SECOND DUPLICATE REGRESSION — caught by wave 6's sentinel
The first wave-7 audit came back **Howler Monkey = Spider Monkey · Macaque = Baboon**: the
new painters keyed only on their OPTIONS and ignored the species NAME, and 'lesser' was a
silent alias for 'monkey'. Identical options ⇒ byte-identical animals. This is the **flora
leaf-ladder bug (D-ART-8) reappearing in fauna**, and the duplicate sentinel caught it inside
one run. Fixed the proven way: **every wave-7 painter is name-seeded** (`nrng`/`nvar`), so
the species name drives coil tightness, girth, dome height, ear scale, arm reach and shell
whorl — two labels can no longer coincide.

## New body plans the catalog asked for and nothing covered
**amphSalamander** (smooth skin, paddle tail, blunt round head, and external gill fronds for
Axolotl and Olm — a salamander is not a lizard) · **marineStar** · **marineUrchin** ·
**marineAnemone** · **marineShell kind:'snail'** (a snail is an ANIMAL: the muscular foot
glides out from under the whorl and the eyestalks carry the silhouette; a shell alone is a
fossil).

## Coverage after wave 7 — MEASURED, not claimed
| group | routes |
|---|---:|
| fauna (insects·fish·birds·quadrupeds·reptiles·amphibians·rodents·primates·invertebrates) | 241 |
| flora | 43 |
| fungi | 16 |
| microbe | 10 |
| **TOTAL** | **310 of 1,010 (30.7%)** |

Remaining, in review-rank order: the bird long tail · the remaining fish · procedural fungi +
microbe body plans (Nick's audit §12/§13) · flower-head families beyond the daisy · the 43
biome scenes (Phase 6).

**Gates:** vitest 220 ✓ · tsc clean · speciesaudit 1254/1254 · 0 fails · 0 dupes · 0 clipped ·
**overridecheck 310/310 · 0 dead** · slicesmoke PASS · perf painted 1400ms / answerable 2091ms ·
proofsheet · goldenseeds 198,000 cases · codefixtures · audioprofiles · savefixtures ·
validate FINGERPRINT MATCH. `hdart.verbatim.js` UNTOUCHED.
**Ledger:** D-ART-19 … D-ART-23.

---

# WAVE 8 — LANDED 2026-08-01 (THE FISH SYSTEM: 105 species, one traced body)

## The gap was measured, not guessed
Wave 7 ended with a ranked list written from memory. This wave started by **reading the
catalog and diffing it against every override table**: fish were the largest uncovered group
in the game at **106 species — more than the birds (77)**. That reordering is the wave-7
lesson applied to planning, not just to keys.

## One body, parameterised — the wave-4 quadruped pattern, at sea
`fishBody()` traces a single outline whose **profile · length · depth · tail · snout · dorsal ·
pattern** are the species. 105 routes, no per-species painters:
- **profile** fusiform · deep · eel · globe · box · ribbon — the half-height curve *is* the
  silhouette, so a tuna, a tang, a moray and a sunfish share zero code paths visually.
- **tail** forked · lunate · round · point · **shark (heterocercal — the upper lobe is longer)** ·
  fan · none.
- **snout** blunt · jaw · **bill** (marlin/sailfish/swordfish/paddlefish) · shovel (catfish,
  sturgeon) · tube · **hammer**.
- **dorsal** one · **sail** · two · spiny · none · **sharkfin**.
- specials: **lure** (the anglerfish esca on its illicium), **glow** (photophore rows),
  **teeth**, **shark** (five gill slits + swept pectorals).
- always: countershading dark-above/pale-below, the **lateral line**, the **operculum**, and
  patterns CLIPPED to the body so marks are skin and not stickers.

## What the strip caught (three sizing bugs a counting gate cannot see)
| the strip said | the cause | the fix |
|---|---|---|
| the Gar wears a green dinner plate | tail height was scaled from the body's MAXIMUM depth, so an eel — whose depth value describes a thin ribbon — got a tuna's tail | the tail is sized by the body **at the peduncle** (`heightAt(0.14)`; the peduncle itself is literally zero-height on a fusiform body) |
| the Tang's tail is taller than the Tang | 3.35× a deep-bodied fish's peduncle is enormous | **clamped** to 1.30× the body's own maximum height |
| the tail is a dark disc parked behind the fish | `round`/`fan` was a free-standing ellipse touching nothing | a fan **grows from the peduncle** — traced from the body's own edge |
| an eel is a stick | no fin at all on `dorsal:'none'` long bodies | the **continuous median fin** down back and belly, which is the entire read of an eel |
| dorsals invisible | 0.86·depth is a bump the eye skips | 1.34·depth with fin rays; the oarfish's crest runs the **whole** back |

## ★ THE SENTINEL WAS BLIND TO ITS OWN CLASS OF BUG
Wave 8 added `faunaoverrides3.ts` — and `overridecheck` reported **"no change, 310 keys"**.
Its file list was **hardcoded**, so a whole new override file was invisible: 105 unverified
routes, reported as if nothing had happened. That is *precisely* the failure the tool exists
to catch, living inside the tool. It now **reads the directory**, and
`tools/overridecheck.control.mjs` (`npm run overridecontrol`) is a permanent, committed
control set — including **control C: a new override file with a dead key must not be
invisible**.

## Coverage after wave 8 — MEASURED
**415 of 1,010 Earth species (41.1%)** — fauna 346 · flora 43 · fungi 16 · microbe 10.
Up from 310 (30.7%). Excluded by the override law: Seahorse, Angelfish, Lionfish, Flounder,
Halibut, Mudskipper already have bespoke painters.

Remaining, by measured size: **birds 77** · arthropods 67 · worms/cnidaria 22 · the mammal
and reptile remainder · procedural fungi + microbe body plans (Nick's audit §12/§13) ·
flower-head families · the 43 biome scenes (Phase 6).

**Gates:** vitest 220 ✓ · tsc clean · speciesaudit 1254/1254 · 0 fails · 0 dupes · 0 clipped ·
overridecheck 415/415 · 0 dead · **overridecontrol 5/5 fire** · slicesmoke PASS ·
perf painted 1241ms / answerable 1925ms (improved). `hdart.verbatim.js` UNTOUCHED.
**Ledger:** D-ART-24 … D-ART-26.

---

# WAVE 9 — LANDED 2026-08-01 (THE BIRDS + a THIRD kind of dead route)

## Extended, not replaced
Wave 3's `faunaBird` gave every bird THE WING and the reviews scored it well, so wave 9
**extends its spec** (D-ART-14: never override what already excels). Every new axis is
**optional and defaulted**, so the 28 wave-3 birds take the code paths they always took —
verified by strip against Eagle, Flamingo, Heron and Toucan after every change.

| new axis | what it fixes |
|---|---|
| **size** | a hummingbird is not an ostrich. Body scale said so NOWHERE — every bird was one size with different legs. |
| **neck** short · long · **swan** · none | the S-curve *is* the swan |
| **tail** short · fan · long · forked | + peacock **ocelli** on the fan |
| **owl** | the facial disc and **forward-facing eyes** — the one head in the catalog that does not read in profile — plus ear tufts |
| **swim** | THE WATERLINE. It is why a duck reads as a duck and not as a bird standing in a hole. |
| **upright** | the penguin/auk stance: a stiff **flipper**, not a wing, over a pale front |
| **bills** short (finch cone) · chisel (woodpecker) · needle (hummingbird) · duck (spatulate) | |

**73 new routes.** Wave 3's birds are also **name-seeded** now (D-ART-20): Hawk and Falcon
carry identical specs, and wave 7 proved two labels sharing a spec eventually collide.

## ★★ A THIRD KIND OF DEAD ROUTE: SHADOWED
Wave 9 wrote a swan-necked, water-borne `Swan`. Wave 3 already had a plain one — and
`resolveOverride` consults FAUNA_NAME **first**, so **the new painter would never have run**.
Both keys resolve to a real species, so the dead-route check was blind to it by construction,
and the species audit would have reported 1,254/1,254 as always.
`overridecheck` now reports **shadowed routes**, and the wave-3 Swan was retired in favour of
the swan-necked one.

### The instrument's own false positive — again, on its first run
The shadow check immediately flagged **Green Algae [FLORA_DUPES shadows MICROBE_NAME]**. That
is **not** a shadow: `Green Algae` is in *both* the flora and the microbe catalogs, and
`resolveOverride` branches on **kingdom first**, so both routes are live and correct. The
check is kingdom-aware now, which also made two other things more honest:
- **dead** now includes *mis-kingdomed* keys — a flora painter for a microbe is never reached.
- **coverage** counts per kingdom, so a name living in two kingdoms counts in each.

That is now **four** self-inflicted bugs this one tool has surfaced before finding anything
real (38 phantom routes · the skipped private tables · the hardcoded file list · this).
**Read an instrument's first report as a bug report about the instrument.**

### The controls are the deliverable
`npm run overridecontrol` — **six** controls, all firing:
baseline pass · A dead key · B duplicate key · C **a whole new override file** · D **a shadowed
species** · E **a table the tool cannot classify is reported, never skipped silently** · restore.

## Coverage after wave 9 — MEASURED
**488 of 1,010 Earth species (48.3%)** — fauna 418 · flora 45 · fungi 16 · microbe 9.
Nearly half the catalog now runs on corrected morphology.

Remaining, by measured size: **arthropods 67** · worms/cnidaria 22 · the mammal + reptile
remainder · procedural fungi + microbe body plans (Nick's audit §12/§13) · flower-head
families · the 43 biome scenes (Phase 6).

**Gates:** vitest 220 ✓ · tsc clean · speciesaudit 1254/1254 · 0/0/0 · overridecheck 488/488 ·
0 dead · **overridecontrol 6/6 fire** · slicesmoke PASS · perf 1479/2254ms.
`hdart.verbatim.js` UNTOUCHED. **Ledger:** D-ART-27 … D-ART-29.

---

# WAVE 10a — LANDED 2026-08-01 (THE MAMMAL REMAINDER + the first SWEEPING PASS)

## Measuring again changed the plan again
Wave 9 ended pointing at the arthropods (67). Re-running the catalog diff showed something
larger hiding in the "other" bucket: **~95 mammals** — bovids, canids, felids, mustelids,
bears, pigs, equids, the domestics — every one a body plan **wave 4's quadruped system
already knew how to draw**. 82 new routes landed as TABLE work, which is exactly what a good
parameterised system should make a large gap feel like.

## The one painter change: THE BOVID HORN
An antelope IS its horns. Drawn as one generic spike, an oryx, a kudu, an impala and a
pronghorn are all the same goat. New: **straight** (the oryx's metre-long annulated rapiers) ·
**spiral** (the kudu corkscrew) · **lyre** (impala/gazelle: out, then sweeping back up) ·
**prong** (the pronghorn's forward tine) · **shorthorn**.

## ★ THE SENTINEL CAUGHT FIVE OF MY OWN MISTAKES BEFORE THEY SHIPPED
The wave-9 shadow check earned its keep on its first real use: **Red Fox, Arctic Fox, Horse
and Tapir were already in wave 4's QUAD_SPEC**, so my new specs would have been written,
listed and never once drawn. Plus one dead key — *Gemsbok-like Antelope*, a name I invented
rather than read. Five findings, one run, before a single pixel was rendered.

## ★★ THE FIRST SWEEPING PASS — and what 130 species at once made visible
Adding 82 mammals to a system that already had ~48 exposed two flaws that were survivable at
40 species and glaring at 130. Both were fixed in the SHARED painter, so **every quadruped in
the game improved at once**:

| the strip said | the cause | the fix |
|---|---|---|
| every mammal is a LOG ON POSTS | four straight strokes of even thickness | **a leg has a joint**: thick upper limb, a **thin cannon bone** below it, a hoof — and **front and hind bend in OPPOSITE directions** (a hock kicks back, a knee eases forward), which is most of what separates a mammal from a piece of furniture |
| every torso is a SLAB | the underline ran nearly straight from brisket to groin, so the body was a rounded rectangle | a **deep chest** at the shoulder, a **tucked waist** behind the ribs, a **rounded rump** — the shape that makes a wolf read as a wolf at thumbnail size before a single marking is drawn |
| the camel's hump FLOATS | both humps were seated at `topY(0.5)` minus a fixed offset, so each hovered in a gap above the spine — and the rear hump of a Bactrian hovered over a back line it never touched | each hump is seated at the back line **at its own x**, sunk slightly in |

Verified against the species the reviews already scored well — Giraffe, Hippopotamus,
Rhinoceros, Camel, Moose, Wolf, Leopard, Cheetah — all held or improved. **No regression.**

## Coverage after wave 10a — MEASURED
**569 of 1,010 Earth species (56.3%)** — fauna 499 · flora 45 · fungi 16 · microbe 9.
**Past halfway.** Remaining: arthropods 67 · worms/cnidaria 22 · marsupials + pinnipeds +
cetacean remainder (these need real posture painters, not table rows) · procedural fungi +
microbe body plans · flower-head families · the 43 biome scenes.

**Gates:** vitest 220 ✓ · tsc clean · speciesaudit 1254/1254 · 0/0/0 · overridecheck 569/569 ·
0 dead · overridecontrol 6/6 · slicesmoke PASS · perf 1354/2128ms. `hdart.verbatim.js`
UNTOUCHED. **Ledger:** D-ART-30 … D-ART-32.

---

# WAVE 10b — LANDED 2026-08-01 (THE INVERTEBRATES + three instrument bugs,
# one of which had been lying to us all session)

## The last large uncovered block
~67 arthropods and ~22 soft-bodied and radial animals, none of which had a body
plan. **83 new routes**, built as five body-plan painters, because an arthropod is
legible almost entirely from its **tagmata and leg count**:
· **insect** 3 sections · 6 legs · antennae — with the wasp/ant **petiole**, the bee's
**pile**, the mantis's **raptorial strike**, the grasshopper's **jumping femur**, the moth's
**plumed antennae**, and four big wings for butterflies (a butterfly is wings with an insect
attached — sized off the abdomen they came out smaller than the body they hang from)
· **arachnid** 2 sections · **8 legs** · NO antennae — the scorpion's segmented tail and
telson, the tarantula's hair, the harvestman's span (the span IS the animal)
· **myriapod** many segments, a leg pair on each; centipede venom claws, millipede coil
· **crab** one wide carapace, **claws forward** (drawn before the shell they were buried
under it), 8 walking legs, eyestalks, and the hermit's borrowed spiral
· **shrimp** the abdomen **curls** — a shrimp at rest is a comma, never a rod — ending in a
tail fan, with lobster/crayfish chelae
and the soft-bodied ones from how they hold water: worm segments and parapodia, the slug's
foot and the nudibranch's **cerata**, the jelly's bell and **trailing** tentacles, the
ctenophore's iridescent comb rows, coral branching, the sponge's osculum.

## ★★★ THREE INSTRUMENT BUGS, FOUND BY ONE DUPLICATE
The audit reported **Copepod = Tadpole Shrimp**. Chasing it turned up three real defects,
each hidden behind the last:

**1 · THE SCALE-IS-INVISIBLE LAW.** Every one of these painters varied by name in
*overall size* — and **the fit pass (D-ART-15/17) rescales every subject to fill the frame**.
A pure scale difference is erased by the very pass that frames the art. Anti-duplicate
variation must change a **RATIO** — an aspect, an angle, a segment count — never just how big
the thing is drawn. Every invertebrate painter now varies a ratio.

**2 · THE DEGENERATE SALT — and it was in every wave from 7 onward.** The helper computed
`((nameHash ^ salt) >>> 0) / 4294967296`. XOR-ing a small salt only perturbs the LOWEST byte,
which after the divide moves the result by ~1e-7. So a painter that appeared to vary six
independent ways — girth, length, dome, ear, reach, whorl — **varied ONE way, six times**, in
waves 7, 8, 9, 10a and 10b. It also made near-neighbour hashes near-identical animals:
Copepod and Tadpole Shrimp hash 0.27% apart, giving a 0.1% difference in every ratio.
Fixed with a proper **avalanche** (the murmur3 finalizer) in all five copies.

**3 · ★ THE AUDIT WAS READING A STALE BUNDLE — ALL SESSION.**
`speciesaudit.mjs` built *only if `audit.html` was missing*. Once `dist/` existed it never
rebuilt again, so **every audit run since measured whatever code happened to be in the
bundle**, not the code in the repo. It spent this entire batch reporting a duplicate the
source had already fixed — and it would just as happily have reported a clean PASS for code
that no longer existed. *(The strip tool always rebuilt, which is why every visual check in
this session was honest.)*
**Fix:** `speciesaudit` and `speciesexport` now **always build**, plus a **freshness guard**
that exits 2 if the bundle is older than any art source — so a future "optimisation" that
skips the build cannot silently bring the bug back.

> The project's eighth green-while-broken lesson has a ninth sibling: **a check that reads a
> build artefact must prove the artefact is current.** Ours did not, for an entire session.

## Coverage after wave 10b — MEASURED
**652 of 1,010 Earth species (64.6%)** — fauna 582 · flora 45 · fungi 16 · microbe 9.

Remaining: marsupials · pinnipeds · the cetacean and bat remainder (posture painters, not
table rows) · procedural fungi + microbe body plans · flower-head families · the 43 biome
scenes.

**Gates:** vitest 220 ✓ · tsc clean · speciesaudit 1254/1254 · **0 duplicate pairs** ·
0 clipped · overridecheck 652/652 · 0 dead · overridecontrol 6/6 · slicesmoke PASS ·
perf 1321/1973ms. `hdart.verbatim.js` UNTOUCHED. **Ledger:** D-ART-33 … D-ART-36.

---

# WAVE 11 — LANDED 2026-08-01 (THE PLANT SYSTEM + the coverage tool's own lie)

## ★ THE GAP REPORT WAS WRONG, AND IT HAD BEEN STEERING THE PLAN
The scratch script used to pick each wave's target had **the same hardcoded file list**
`overridecheck` shipped with. After waves 8-10 added four new override files it could not see
them, so it reported ~250 already-covered species as uncovered — and wave 11 was about to be
planned from that. Promoted to `tools/coveragegap.mjs` (`npm run coveragegap`), reading the
directory. Corrected, it said something the animal waves had hidden: **the largest uncovered
block in the game was never the animals — it was the PLANTS. 288 of 334.**

## THE PLANT SYSTEM
One plant whose **HABIT · LEAF · FLOWER · FRUIT** are the species — 280 routes.
Habit first, because that is what a plant is legible from before anything else:
**tree** (a tapering trunk that forks into a three-pass crown: a deep mass, a lit upper
surface, then leaves filling it) · **shrub** (many stems from the ground — the whole
difference from a tree) · **herb** · **grass** (filled blades, wide at the crown, tapering,
bending under their own weight) · **cane** (culms with nodes) · **vine** (a sinuous stem with
coiled tendrils) · **succulent** (ribbed column or thick pads; the plant IS its water tank) ·
**fern** (arching fronds with filled pinnae, and a rolled fiddlehead) · **aquatic** (straps
streaming up from a holdfast, with a kelp's gas bladders) · **rosette** · **palm** (no canopy:
a crown of fronds).
Leaves: broad · lance · needle · **pinnate** (leaflets up a rachis) · **palmate** · blade ·
frond · scale · heart · pad. Fruits: berry · drupe · pome · **citrus** · pod · nut · cone ·
**grain** (with awns) · melon · fig · cluster. Flowers: **head** (ray florets round a disc) ·
spike · **umbel** · bell · star · catkin.

## ★★ THE FOURTH BLINDNESS CLASS: THE TABLE WAS NEVER WIRED
`FLORA2_SPEC` was imported into `speciesoverrides.ts` and **never consulted by
`resolveOverride`**. Every key resolved to a real catalog species, so `overridecheck`
reported **927/927 · 0 dead** — while **all 280 routes were unreachable**.
*"The key names a real species"* and *"the router ever looks at this table"* are different
claims, and only the second one makes a painter run.
**Nothing caught it but the duplicate sentinel**, and only because retiring the superseded
anti-duplicate entries regressed **15 duplicate pairs**. `overridecheck` now reports
**unwired tables**, with control F to prove it fires.

### The discovery rule is itself an assumption — three times, then four
1. a hardcoded file list missed `faunaoverrides3.ts` (105 routes unchecked)
2. an `export const`-only scan missed both module-private tables
3. a `*overrides.ts` glob missed `florarost.ts` (280 routes unchecked)
4. and even scanning every file, the tool still could not see whether the router *reads* them
Each fix widened the rule; each time the RULE was the thing that was wrong.

## Coverage after wave 11 — MEASURED
**927 of 1,010 Earth species (91.8%)** — fauna 582 · flora 320 · fungi 16 · microbe 9.
Remaining: ~35 deliberately-excluded excellent species (Elephants, Tiger, Lion, Zebra,
Chameleon, Seahorse, Pangolin…), marsupials/pinnipeds/cetaceans needing posture painters,
11 fungi, 12 microbes, and the procedural body plans.

## ⚠ KNOWN, RECORDED, NOT YET FIXED
Tree crowns read **inconsistently across palettes**: a green oak reads beautifully, a
white/pale palette reads as a mop of pale leaves because the crown's soft masses and its
leaves carry the same hue. Wave 12 should give the crown its own value structure independent
of the species hue. Logged rather than left to be rediscovered.

**Gates:** vitest 220 ✓ · tsc clean · speciesaudit 1254/1254 · **0 duplicate pairs** ·
0 clipped · overridecheck 927/927 · 0 dead · 0 shadowed · 0 unwired · overridecontrol **7/7** ·
slicesmoke PASS · perf 1224/1842ms · goldenseeds 198,000 · validate FINGERPRINT MATCH.
`hdart.verbatim.js` UNTOUCHED. **Ledger:** D-ART-37 … D-ART-39.
