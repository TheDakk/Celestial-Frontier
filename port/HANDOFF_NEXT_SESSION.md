# ★ COLD-START HANDOFF — read this first

# ★★★ START HERE — 2026-08-06, HEAD `d8e76aa` + uncommitted, GOLD PASS 4 RUN

⚠ **Repo root is `C:\Projects\Celestial-Frontier`, not `C:\Projects`.** Tools run from `port/v2`.
Everything below the 2026-08-04 banner is HISTORY — accurate about its waves, superseded on
every number. **No painter was touched this session; the art is exactly as waves 51–57 left it.**

## ★★★★ THE CHEAP RE-CHECK WORKS. ITS HEADLINE WAS THE RULER, AND THE CONTROL PROVED IT.

`reference/GOLD_PASS_4.md` is the full write-up. In one paragraph: the drift-scoped re-check ran
as designed — **148 drifted assets, 32 strips, 1.17M tokens, 6m26s, zero errors** against the
full sweep's ~15M-and-a-dead-session — and reported **FAIL 660 → 694**, with **40 of 44 band
crossings running one way.** That is the D-ART-150 shape, on assets six waves had just improved.
So a control was built and run (`tools/rejudgecontrol.mjs`, 56 untouched family-matched assets,
same judge, 0.72M):

| set | n | FAIL% before | after | shift | demoted, of those with room to fall |
|---|---|---|---|---|---|
| drift (edited) | 148 | 62.2 | 85.1 | **+23.0** | **70%** (39/56) |
| control (untouched) | 56 | 67.9 | 91.1 | **+23.2** | **78%** (14/18) |

★ **Waves 51–56 moved no band. The whole +34 was the ruler** — this harness grades ~23 points
harder than gold pass 3 (one pass not two, side-by-side strip not isolated PNGs, an explicit
"be your own skeptic"). **`694` is not a catalogue score**; `goldpass4-results.json` mixes 148
new-ruler rows with 1,102 old-ruler ones and now says so in its own header. **D-ART-158.**
★ The payoff: the offset is now *measured*, so **gold pass 4 IS a valid baseline for the next
delta** — same harness, apples to apples — **as long as the control is re-run every time.**
`rejudgemerge.mjs` now refuses to present a delta at all without `--control`.

## ★★★ WHAT THE PROSE SAYS — IT SURVIVES A MOVED RULER, AND IT CONTRADICTS US TWICE

**1. THE FELID CHASSIS IS NOT FIXED.** The wave-51 handoff and the live-state memory both record
the chassis as "largely fixed" after D-ART-153/152/154. With all eleven big cats side by side the
judge writes *"Leopard: pixel-for-pixel the Jaguar cell in a paler tan"*, *"Bobcat: identical
chassis to the Lynx cell"*, *"Cougar: indistinguishable from the Caracal cell in a different
tint"*. **30 of 84 re-judged fauna (36%) carry shared-chassis language.** The neck fix landed and
is visible; the body is still one barrel. Three recurring sub-defects, each ONE painter lever:
**the tail is a short hook on every felid** (a cat's tail is a body-length rope), **the muzzle is
a long blunt snout** ("tapir-like", 44% of fauna verdicts name the skull), and **Bobcat/Lynx feet
still read as hooves** despite wave 49. Corroborated from outside the drift set: untouched
Anteater/Pangolin/Otter are "the same barrel-plus-peg-legs chassis".

**2. ★ FLORA IS ONE GROWTH FORM WITH AN ORNAMENT ON TOP — AND IT IS THE BIGGER LEVER.** I opened
`smoke/rejudge/9-herbs-and-spices/strip-01.png` and looked: all nine herbs are one dead-straight
stem, a symmetric leaf ladder, and a tiny flower perched exactly on the apex — on three of them a
literal thin white crescent. Across 64 flora verdicts: **leaf shape wrong 78% · habit wrong
(upright where the species is a mat/sprawl/arch) 50% · the inflorescence is a speck-or-arc at the
tip 39% · same ladder body as its neighbours 34% · the named harvest item absent 19%.**
★ **"The flower is an ornament stuck on the apex, not a structure with size" is one painter
change touching hundreds of assets** (Angelica's umbel = "a thin white crescent 20px wide";
Canola's flower mass = "a single thin yellow arc"; Fireweed's spike = "a 5px stub"). Flora is the
largest bucket and this matches the family sweep's independent "four growth-form templates".

**3.** The one genuine rescue in 148: **Ice Algae FAIL → PASS**, wave 56, visible *through* the
ruler shift.

## ★★ WAVE 58 — FLORA GROWTH-FORM ARC (COMMITTED: `071cfa7`, `6dfc468`, `c469c08`)
Nick's goal: **100% PASS — zero POLISH, zero FAIL — at the SHIPPABLE bar** (not the strict
art-director bar that whipsawed the ruler). Method proven: **cluster by botanical family, add the
missing read-cues, one edit clears the cluster.** All in `floraoverrides2.ts` (painter) +
`florarost.ts` (specs); every new axis defaults OFF so unset plants are byte-unchanged (D-ART-14).
tsc + vitest green on every commit. **~55 flora species converted.** The reusable vocabulary now:

| axis | what it draws | used by |
|---|---|---|
| drawFlower head/spike/umbel/**cross**/**cone**/**bell** rebuilt | inflorescence with real SIZE (was a speck/crescent) | all flowering herbs |
| `toothed` | serrated leaf margin (incl. a toothed heart) | mints, nettles, brassicas |
| `square` | squared reddish mint stem | mints |
| `whorl` | flower rings up the stem (verticillaster) | mints |
| `flower:'cross'` + `pods` | 4-petal corymb + siliques | brassicas |
| `flower:'cone'` | raised bristly disc + backswept rays | Chamomile, Echinacea, Black-Eyed Susan |
| `flower:'bell'` | tall raceme of flared tubular bells | Foxglove, Gentian, Monkshood |
| `leaf:'trefoil'` | three leaflets from one point | Alfalfa, Clover, Fenugreek |
| `tassel` | drooping green axil strings | nettles |
| `root` (taproot/forked/rhizome) | the harvested organ at the base | Licorice, Ginseng, Ginger, Turmeric |
| `leafArr:'basal'` | rosette + bare flowering stem | Sea Lavender |
| fruit **shapes** (pear/spiky/star/crown/hairy) | species fruit, not one sphere | 12 fruit trees (Pear≠Apple) |
| `fruit:'grain'` rebuilt | bristling awned cereal ear | Wheat, Barley, Rye, Oats, Millet, Sorghum, Rice |
| `creep` | low creeping groundcover mat (shrub) | Bearberry, Crowberry, Cranberry, Lingonberry, Bilberry, Huckleberry |
| `leaf:'arrow'` + rosette jitter | sagittate blade on erect stalks; de-mirrored fan | Arrowhead, Taro, Wild Taro, Pickerelweed |
| `leaf:'crinkle'` | huge puckered cabbage/rhubarb blade | Sea Kale, Wild Rhubarb |
| `dense` (shrub) | filled rounded twiggy bush | Tea, Tea Tree, Tamarisk, Bay Laurel |
| `root` applied | taproot/tuber at base | Prairie Turnip, Wild Yam, Cassava |
| seaweed `holdfast` + forms | grip + kelp float / wrack bladders / flat blade | Kelp, Bull/Giant Kelp, Bladderwrack, Dulse, Wakame |
| palm rebuild + `pseudostem` | single trunk + fronds; banana false-trunk | Coconut, Date, Papaya, Pandanus, Banana, Plantain |
| conifer spire | conical tiered evergreen | Spruce Tips, Cedar, Redwood, Hemlock, Pine Nuts, Pinyon Pine |

★★ **FLORA SHARED-CHASSIS PHASE IS ESSENTIALLY DONE — 18 cue-clusters, ~90 species.** What REMAINS
in flora is a **bespoke tail** (~15–20 species, each its own fix, no cluster): Solomon's Seal
(arching stem + hanging bells), Bergamot (monarda firework tubes), Vanilla Orchid & Water Spinach
(trailing succulent vine), Miner's Lettuce (perfoliate saucer), Angel's Trumpet (huge pendulous
trumpet), Fiddlehead Fern & Tree Fern (crozier / fibrous trunk), Wild Chive tubular leaf, the
LOW-CUSHION alpines (Purple Saxifrage, Bitterroot), Coralline Algae (crusty pink), Roselle
(calyces), Dragon Fruit / Barrel Cactus (ribbed succulent). Re-pull prose from
`goldpass3-prechassis.json` (`defect`/`readsAs`).

## ★★★ FAUNA PHASE — UNDERWAY (wave 59, 8 clusters committed)
Same method, in the fauna painters. Landed & committed:
- **Sharks** (`faunaoverrides3.ts` fishBody): big opaque first+second dorsal, SHARP grey/white
  countershade (shark-only), hammerhead cephalofoil seated into the head (was a stranded bar).
- **Snakes** (`faunaoverrides2.ts` reptSnake): new `gauge` (Vine/Whip/Racer/Tree now whip-thin,
  not "the same fat doughnut"); new `collar` (grass snake's neck band).
- **Corvids** (`birdoverrides.ts`): black bills for Crow/Raven (were the default yellow → jackdaw
  read), Magpie's white pied bib.
- **Wetland birds** (`faunaoverrides.ts` inline): Heron/Flamingo/Stork/Ibis/Crane/Spoonbill were
  defined with NO `neck` — added neck:'swan'/'long' (the S-kink was simply absent).
- **Wader bills** (`faunaoverrides.ts` faunaBird): new bill shapes `probe`/`downcurve`/`upcurve`
  → Snipe, Godwit, Curlew, Avocet, Oystercatcher, Ibis.
- **Bivalves** (`faunaoverrides2.ts` marineShell): new `clam`/`mussel` kinds — two valves + hinge
  seam, not the one scallop bowl.
- **Small rodents** (smallRodent): `earShape:'nub'` (existed, zero writers) for Vole/Water Vole/
  Prairie Dog/Ground Squirrel — buried ears not rabbit ears.
- **Clownfish** (fishBody): new pattern:'clown' — three white black-edged bands.
- **Gastropods** (marineShell): new `limpet` (ribbed cone) + `cowrie` (glossy toothed egg) kinds,
  off the shared abalone dome.
- **Echinoderm trio** (marineStar): Sand Dollar → `disc` (flat 5-petal test); Brittle Star arms
  thinned — both off the starfish 5-arm body.
- **Worm trio** (wormBody): Flatworm → broad flat ribbon; Leech → inchworm arch + sucker — off
  the earthworm S-curve.
- **Tube worms** (marineAnemone `worm`): a bundle of ringed tubes with scarlet plumes, off the
  anemone cone.
- **Felid tails** (quadrupedoverrides): Jaguar/Leopard/Cougar `tailScale` 1.7–1.8, Snow Leopard
  plume→long 2.1 — the "short hook" was the top felid defect (tail branch respects tailScale
  since D-ART-136; the specs just never set it).

★★ **~14 fauna clusters landed, all eye-verified, tsc+vitest green, ~32 commits this session.**

## ★★ GOLD PASS 5 MEASURED IT (2026-08-07): FAIL 660 → 589, REAL (control-stable). `reference/GOLD_PASS_5.md`.
Then waves 61–62 (committed): gp5's 14 regressions fixed (conifer-tall gate, Lychee, Bilberry,
Arrowroot, aromatics-dense) · cereal head sub-types (panicle/club) · round clover trefoil ·
**cetacean rebuild** (peduncle + scaled flukes + orca blade — was a broken render) · **pinnipeds
lose the standing legs** (flipper family skips the leg loop; trailing hind fans + fore-paddle) ·
**primate species features** (muzzle/mask/nose/throat/earTufts/armLen/tailLen/tailRinged — all 9)
· **peacock train** (erect ocelli fan) · gull hook + puffin kit · lionfish/surgeonfish/parrotfish
signatures · tarantula fur + lobster chelae · blind/cave fish eyeless · monitor/komodo tongue + heavy limbs
+ tegu blocky skull. ~60 more assets touched since gp5, all committed.
★ WAVE 66b (committed): Krill stalk-eyes FLIPPED to the head (were on the tail — a sign-bug) ·
Barnacle cirri fan · Sugar Kelp ONE ribbon / Dulse red hand (flowerN = blade count in the
flat-seaweed branch). REMAINING FAILs now: bird pose axis (Bittern/Albatross/Skua/Petrel),
Weaverbird nest, Snow Petrel, Water Flea shell, Bull Kelp single stipe+bulb, cushion alpines,
sorrel de-dupe, Wild Thyme mat, Sea Fennel fingers, Vanilla Orchid/Water Spinach trail,
Chanterelle dish, Shiitake cracks, Reindeer Lichen trunks, procedural bridge + 60 → then gp6
re-measure + control → then the POLISH→PASS sweep.
★ WAVE 66 (committed): Bergamot firework head · Angel's Trumpet pendulous horns · Solomon's Seal
stem:'arch' (bells dangle BENEATH the arching cane) · Miner's Lettuce leaf:'perfoliate' saucers ·
Catfish barbels (attached, snout-rooted) · Mite/Harvestman `fused` one-piece bodies · Copepod
eggSacs. STILL OPEN on the FAIL list: Bittern/Albatross/Skua/Petrel FLYING-vs-freeze poses (needs
a bird pose axis — the painter only stands), Weaverbird nest, Snow Petrel, Krill abdomen-eye bug,
Water Flea translucent shell, Barnacle cirri, remaining flora singles (Vanilla Orchid, Water
Spinach trail, cushion alpines Purple Saxifrage/Bitterroot, sorrel trio de-dupe, Wild Thyme mat,
Sea Fennel succulent fingers, kelp singles: Bull Kelp bulb float, Sugar Kelp one-ribbon, Dulse
hand-blade), Chanterelle funnel dish, Shiitake crack visibility, Reindeer Lichen bare trunks,
procedural naming bridge + 60, THEN re-measure (artlock --driftdump → gp6 + control), THEN the
POLISH→PASS sweep from goldpass5-results.json prose.
★★★ THE ROAD FROM HERE (Nick's standing orders: 100% PASS — clear FAILs, then sweep POLISH/PASS):
1. ✔ **THE BARREL BODY — DONE IN WAVE 65** (committed): the RADV machinery was already there;
   the residue was per-species DEPTH. Slender cats slimmed (Leopard .1268→.1080, Cougar .1120,
   Snow Leopard .1140, Cheetah .1050 — Jaguar/Lion keep their mass); lean canids slimmed
   (Coyote .1040, Jackal .1010, AWD .1030, Dingo .1090 — Wolf keeps his); **Capybara/Agouti/Mara
   moved from the smallRodent ball to the QUADRUPED table** with real plans (blunt brick barrel /
   roached slender / long deer legs) — "same picture" dead; Pangolin mat:'scale' not banding.
   All rendered + kept. What remains of the old chassis story is only eye-verification at the
   next measure.
2. **Remaining fauna singles**: Bittern freeze-pose, Albatross/Skua/Petrel flying posture,
   Weaverbird mask+nest, Snow Petrel; Catfish/Pangolin/Giant Anteater/River Otter ("Other or
   uncertain"); Agouti/Capybara/Mara rodent chassis; Conch flared lip; Water Flea/Copepod/Krill/
   Mite/Barnacle/Harvestman singles.
3. **Flora bespoke tail** (~15: Solomon's Seal arch, Bergamot firework, Angel's Trumpet,
   Miner's Lettuce perfoliate, Vanilla Orchid, cushion alpines, sorrel de-dupe, kelp singles).
4. **Procedural 60** — ⚠ BLOCKED on the naming bridge (procedural gp names `fauna-h1-s3` vs
   render names `f0·6#126` — adopt `filename` as the key, old open item #7). The fish fixes
   (peduncle, eyeless, dorsal) already flow to procedural swimmers via the shared fishBody.
5. **RE-MEASURE** with the calibrated harness (artlock --driftdump → rejudge + control), THEN
6. **The POLISH→PASS sweep** (579 POLISH rows carry per-asset prose in goldpass5-results.json).

★ WAVE 64 (committed): **ALL 13 MICROBE FAILS ADDRESSED** — extremophile habitat wrappers
(acid-red water+crust, ice facets+brine, hot-pink crowded brine, methane bubbles, root nodule
with bacteroids, exactly-four tetrad, red-tide bloom field, iron-oxidizer bean+twisted ribbon,
bioluminescent glowing cells in dark water) + bespoke Dinoflagellate (girdle groove + 2 flagella),
Euglena (teardrop + 1 flagellum + eyespot), Radiolarian (glassy 3-D spined sphere). Plus
Cordyceps insect host (curled caterpillar). Shared procedural painters untouched.
★ WAVE 63 (committed): fungi identities — Lion's Mane full icicle cascade · Coral Fungus one
dense clump · Earthstar thick tan opened rays (was routed with NO species hue) · Mildew = powder
ON A LEAF · Yeast = budding cells · Jelly Fungus deep brain folds · Maitake ruffled 3-ring
rosette. STILL OPEN in fungi: Chanterelle funnel+dished centre, Shiitake crack visibility,
Porcini stem girth, Cordyceps insect host, Reindeer Lichen trunks, bracket-check.
★ REMAINING fauna clusters from the gp3/gp5 prose, in rough order: the deep felid/canid BARREL
BODY (the last chassis lever — Tube cross-section per D-ART-152); Insects (Wasp waist renders OK
now — check Caddisfly antennae, Dobsonfly mandibles, Thrips, Water Beetle); Ice/cave inverts
(Fiddler Crab has no crab, Cave Cricket is faunaLarva with no legs, Copepod=Amphipod recolour,
Krill face-on-tail, Mite, Water Flea); remaining birds (Bittern freeze pose, Albatross flying,
Skua flash, Snow Petrel, Weaverbird mask+nest); Cichlid dorsal, Reef Fish bands; procedural (60,
untouched); fungi bespoke (Lion's Mane icicles, Chanterelle, Coral Fungus, Earthstar rays,
jelly/maitake/mildew/mold/yeast blob-chassis, Porcini stem, Shiitake cracks, Cordyceps,
Reindeer Lichen trunks); microbes (13, all bespoke cells/habitats: eyespots/pseudopods/girdle
groove/brine channels/nodule/tetrad packet etc.).

## ★★★ THE HARD CORE THAT REMAINS: THE MAMMAL QUADRUPED CHASSIS (~70 FAIL)
Big cats (bodies ~11), Bears (8), Dogs (8), Rodents-mammal (Agouti/Capybara/Mara), Primates (9),
Marine mammals (10: pinnipeds need FLIPPERS not dog legs, whales need real cetacean bodies —
Orca renders BROKEN). These share the quadruped/mammal chassis in `quadrupedoverrides.ts` +
`mammaloverrides.ts`, the defect the ENTIRE project history is about (the pony; gp4 still says
"Leopard = the Jaguar cell in a paler tan"). ⚠ Bears ALREADY have back:'humped' but read as a
"sheep chassis" — it is a GESTALT problem (small head, stilt legs, short muzzle, hoof-not-paw
feet), NOT one table value. This is the ~50-FAIL hard core; do it with tint-renders, family by family, NOT a sweep (D-ART-83).

★★ **WAVE 60 — the careful mammal-chassis levers (all rendered + kept, byte-safe):**
- **`FAMILY.headScale`** (NEW, optional, default 1 = byte-unchanged): ursid 1.3 — bears got their
  big head and stopped reading as sheep. This axis is the template for any family whose head is
  mis-proportioned (primates, pachyderm if needed).
- **Felid skull shortened**: len 1.95→1.68, muzzle 0.46→0.40, cranium 0.72→0.80 — cats now read
  with a short round face, not a long snout (gp4 sub-defect #2). Closes 2 of 3 felid sub-defects
  with the wave-59 tail. **The deep third — the "one barrel body" — is NOT done** and is the
  single biggest remaining chassis lever (felid waist/chest/rump vs the Tube cross-section).
- **Fox tails** tailScale 1.7 (Red/Arctic Fox) — full brush not a thin pipe.
★ STILL OPEN in the chassis: the "pony/barrel body" shared by canids+felids (the deepest, needs
the Tube cross-section per D-ART-152); **pinnipeds** (Seal/Sea Lion/Fur Seal render as 4-legged
loaves — the flipper foot is fine but the 4-corner LEG LAYOUT must be restructured so the body
rests and the hind flippers trail); **whales** (Orca renders BROKEN, need real cetacean bodies —
a separate painter, not the quadruped); **canid paws** (check D-ART-132 — do dogs still draw
hoof-blocks?); primate features (separate painter: Baboon muzzle, Gibbon/Spider arms, Lemur
ringed tail, Proboscis nose, Howler pouch). Dog/wolf head should be broad+blocky. ⚠ DO NOT parameter-sweep it (D-ART-83); use the
tint-render method (memory: "tint it flat and render") and the established model. The three gp4
one-lever felid sub-defects: tail = body-length rope not short hook; muzzle shorter; paw not hoof.
Remaining tractable non-chassis fauna clusters (do these the flora way): Reef fish (clownfish
bands, lionfish quills, parrotfish beak, surgeonfish scalpel), Seabirds (FLYING posture + gull
hook + puffin bill), Gamebirds (bare facial skin, peacock train, rooster comb), Gastropods
(abalone ear-shell, conch spiral, limpet cone), the Starfish/Earthworm/Anemone recolour trios,
Ice-and-cave insects (12), Primates faces. `reference/LONGTAIL_WORKLIST.md` orders them.
Then fungi (18 FAIL) + microbe (13). ⚠ Still **eye-verified only** — run the full measurement
pass (cheap re-check + control, D-ART-158) after the fixing is broadly done to get the real
PASS-rate.

★ **Remaining flora FAILs, roughly in yield order** — these are increasingly BESPOKE, not cluster
wins: Bergamot (monarda firework tubes), Brooklime (aquatic sprawl), Cloudberry (low + lobed leaf
+ amber berry), Devil's Claw (grappling-hook pod), Miner's Lettuce (perfoliate saucer), Solomon's
Seal (arching stem + hanging bells), Mugwort (silver leaf underside + purple stem), Sesame/Flax
(upright ribbed capsules), Milkweed (warty follicle pod), Steppe Tulip (single upright cup +
basal straps), Water Hemlock (purple-streaked stem). PLUS **~149 flora FAILs OUTSIDE the drift
set** whose fresh prose I have not pulled (they didn't move since the gp3 baseline) — get them
from `goldpass3-prechassis.json` (`readsAs`/`defect`/`fix`).
⚠ **NOT yet re-judged — all eye-verified only.** Measure with the cheap re-check + **control**
(D-ART-158) once the flora arc is broadly done, NOT per-edit (~1.9M tokens/run).
★ Then **mammal chassis**, then the **144-bucket tail** (`reference/LONGTAIL_WORKLIST.md`).
⚠ **Honest scale:** 100% PASS across 1,250 is a MULTI-SESSION arc — ~660 FAIL + every POLISH that
must also climb. The levers are few (~15 cues); the tail under them is real per-family table work.

## OPEN, IN ORDER (revised by the above)

1. **The flora inflorescence + growth form.** Biggest measured lever in the catalogue, now
   diagnosed rather than guessed. Start with "a flower head is a structure with size", then the
   habit axis (mat / sprawl / arch / basal rosette vs the one upright stem).
2. **The felid/mammal body**, which D-ART-152's asymmetric `Tube` was supposed to unlock but has
   not yet delivered — plus the three one-lever sub-defects above (tail, muzzle, paw).
3. The rest of the 2026-08-04 list below (88 both-FAIL assets, broken procedural renders — but
   note **D-ART-155 corrected the "fit-pass clip" diagnosis: it is a painter defect**, the
   `[SHAPE]` backlog, the `familycards` regex).

⚠ **Uncommitted at hand-off:** `tools/rejudgecontrol.mjs` (new), `tools/rejudgecards.mjs`
(--control/--drift/--out), `tools/rejudgemerge.mjs` (control-aware, refuses a bare delta),
`reference/GOLD_PASS_4.md`, `goldpass4-*.json`, `control-sample.json`, `DEVIATIONS.md`
(D-ART-158). Nick had not said ship.

---

# ⚠ HISTORY FROM HERE — END OF 2026-08-04, HEAD `6190bb6`, WAVE 51 LANDED

⚠ **Repo root is `C:\Projects\Celestial-Frontier`, not `C:\Projects`.** Tools run from `port/v2`.
Everything below the 2026-08-03 banner is HISTORY — accurate, superseded on every number.

## ★★★★ THE HEADLINE: THE PONY WAS ONE HARD-CODED LINE, AND IT IS FIXED

Twelve canids and thirteen felids read as one pony. Two audits, 431 per-asset verdicts and a
tint render had all hunted it in the **limb** — the part the body occludes, where every fix is
invisible (D-ART-149). It was never there. It was:

```
headX = shoulderX + neckLen*0.55, headY = shoulderY - neckLen*0.86
```

**a fixed 57° up-and-forward neck for every mammal in the catalogue** — a browsing ungulate's
carriage worn by every cat, dog and bear. Nothing occludes it; it is the first thing anyone
reads. It is now `carry` on the family body plan (plus a per-species override), expressed as a
swing of the same-length vector so `carry: 1` lands on the identical point and **every family
left at 1 is byte-unchanged** (D-ART-14). **68 species moved; all 68 were rendered and looked
at; the bless was verified against the git copy of the lock** — exactly 68 changed in `fp` and
`sil`, none outside, none missed. See **D-ART-153**.

⚠ The first values were too aggressive — the D-ART-141 shape again, right about the defect and
wrong about the remedy. At carry ≈ 0.02 the neck leaves the silhouette entirely and a
long-bodied mammal becomes a featureless tube: artlock returned **7 newly confusable pairs**
(Mole ≈ Mudminnow, Stoat ≈ River Otter, Coati ≈ Civet). Floor raised to 0.22–0.32, and
`procyonid`/`burrower` — never part of the pony complaint — returned to 1. Result: **0 newly
confusable, net 884 → 882.** The gate found this; no amount of looking at cats would have.

## ★★★ WHAT IS STILL BROKEN, AND THE ONE THING THAT BLOCKS IT — D-ART-152

**The bodies are still one barrel.** A haunch and a shoulder lobe were added to `ventral()`,
rendered, and changed almost nothing — then reverted **byte-identically**, which is what makes
this a measurement and not a guess. The reason is structural and is the most useful thing this
wave produced: `ventral`/`dorsal` are **not an outline**. They feed `RAD = (ventral−dorsal)/2`
and an AXIS at their midpoint, and `Tube` sweeps **one scalar radius** — a circular
cross-section. Every unit the belly is pushed down raises the back by half and grows the radius
by half. **An asymmetric mass is inexpressible in this parameterisation.**

★ **So the haunch is a TORSO-ENGINE item, not a table item: `Tube` needs a radius that varies
with phi as well as u. Do NOT retry it by tuning coefficients in `quadrupedoverrides.ts`.**
Same shape as D-ART-149, where the knee was lowered, rendered and reverted because occlusion
and not joint height was binding.

## ★★★ HOW TO RE-CHECK CHEAPLY — DO NOT RE-RUN THE FULL SWEEP (D-ART-157)

⚠ **The full family sweep is a DISCOVERY tool, and it is done.** It cost ~15M tokens / 867
agents and hit the session limit on every run. It was worth it once — to find the shared-chassis
defect (D-ART-147) — but re-running it to MEASURE PROGRESS is what kept blowing the budget.
**For a progress delta, use the drift-scoped re-check instead:**

```
node tools/rejudgecards.mjs        # 1 contact strip per family, ONLY drifted assets (~148, not 1250)
# then the goldpass4-rejudge-cheap workflow: one agent per strip (~32), no verify pass
node tools/rejudgemerge.mjs        # folds fresh verdicts into the carried baseline, prints the delta
```

Why it is cheap, and why it is correct: artlock's fingerprint already names what changed since
the baseline (`reference/drift-since-baseline.json`, from a lock diff, no model), and **an asset
whose pixels are byte-identical cannot have a different verdict** — so the unchanged ~1,100 keep
their band for free and only the ~148 that moved are sent to a model. ~15M tokens → a few
hundred K. The one-time authoritative sweep (`goldpass3`, with its adversarial verify pass) is
kept ONLY for a final certification.

⚠ **FREEZE THE ART DURING A JUDGE RUN.** The gold-pass-3 baseline is smeared because judging and
editing overlapped for hours — early batches saw pre-wave-51 art, late batches saw post-wave-56.
Export once, judge once, touch no painter until it finishes. The cheap re-check makes this easy
(a run is minutes). Baseline archived at `reference/goldpass3-prechassis.json`.

### the old full-sweep chain (certification only, not for deltas)
`tools/familycards.mjs` → 197 batches BY FAMILY → judge each → adversarial verify →
`tools/goldassemble.mjs` → `tools/goldcompare.mjs`. `goldassemble` reports its own join
failures/missing/duplicates rather than defaulting them to a band. The batch list is EMBEDDED in
the workflow script (a resume must NOT re-send `args` — a truncated 5KB array killed a run once).
⚠ Launch it FRESH for a re-judge, never `resumeFromRunId` — cached agents replay the OLD art.

★★ **DO NOT QUOTE A DELTA AGAINST 431 — D-ART-150 FIRED AGAIN, HARDER.** At 1,182 of 1,250
judged the raw count is **616 FAIL / 505 POLISH / 61 PASS**, and it is **not comparable**.
Restricted to the same species judged in both passes, the sets nobody touched all got worse by
about the same amount:

| set | gp2 FAIL% | gp3 FAIL% | delta |
|---|---|---|---|
| flora | 52.2 | 61.1 | **+8.8** |
| fungi | 38.5 | 50.0 | **+11.5** |
| microbe | 55.0 | 65.0 | **+10.0** |
| procedural | 15.4 | 28.9 | **+13.5** |
| fauna | 32.1 | 55.6 | +23.4 |

**The ruler moved ~+10 points.** And fauna's extra ~+13 is *also* not a regression: this pass
batched BY FAMILY precisely to make chassis defects visible, and that effect lands almost
entirely on fauna. **The two passes differ in TWO ways at once — harshness AND batching — so
neither direction can be read as progress or regression.** What IS trustworthy: the per-asset
prose, the chassis verdicts, and the verification.

## ★★★ THE FINDING THE FAMILY BATCHING BOUGHT — IT IS CATALOGUE-WIDE

**137 of 150 judged families reported ONE SHARED CHASSIS**, and most of the 13 that escaped say
the same thing at smaller scale — "five chassis each stamped twice with only the hue changed".
**This is not a mammal problem.** Flora is about *four templates* (a stalkless cabbage
disc-pile, a rigid pinnate ladder on one dead-straight stem, a vase of splayed twigs, a skewer
stack); procedural fungi read as "a shaded ball with things stuck on it"; procedural microbes
as "a placeholder icon sheet of sphere, chain, rod and outline oval". **D-ART-147 was right and
the payoff is much bigger than the canids** — alphabetical batching could not see any of it.

★ **The verification stage is sound, and was itself checked.** 146 verified, only 2 overturned
(Fennec Fox, Rhinoceros — both refuters decoded pixels and measured crops). A 1.4% overturn
rate looked like deference, so per D-ART-140 one upheld FAIL was opened and looked at by hand:
Cattail's brown spike really is a thread, not the fat velvet sausage that IS the species. The
FAILs are real.

## HOW TO RUN THE GATES

```
npx vitest run · npx tsc --noEmit -p apps/game · node tools/speccheck.mjs
node tools/tokencheck.mjs · node tools/overridecheck.mjs
npm run artbattery -- --touching=<classes>      # 6 stages, artlock is stage 6
```

⚠ Declare the classes that **MOVED**, not the file you edited. ⚠ A bless claims **a person
looked** — prefer `--bless="Name,Name"` and **verify what it wrote against the git copy of the
lock, not the tool's own summary** (D-ART-146).
⚠ `speciesstrip.mjs` writes **relative to `apps/game/smoke/`** — pass `chassis/x.png`, never an
absolute path. Naming a species that does not exist draws an empty red box and looks exactly
like a broken render: **"Red Deer" and "Dhole" are NOT catalogue species** (it is "Deer", and
there is no dhole). Check the export directory before reporting a blank tile as a bug.

## OPEN, IN ORDER

1. **The torso engine — a phi-varying radius in `Tube`** (D-ART-152). This is the gate on the
   haunch, the shoulder, and "where the limb leaves the silhouette" for ~140 mammals at once.
   It is the biggest remaining lever in the catalogue and it is now diagnosed, not guessed.
2. **Finish the sweep**, then `goldassemble` → `goldcompare --md=reference/GOLD_PASS_3.md`.
   Report the control table above alongside any headline number, always.
3. **The shared growth-form templates in FLORA.** The family sweep says four templates cover
   most of it — which makes flora's 170+ FAILs **one painter job, not 170 table rows.** Flora
   is the largest bucket and no plan has ever scoped it.
4. **The 88 both-FAIL assets** (`reference/AUDIT_JOIN_2026-08-03.md`) — certain work, no
   adjudication needed.
5. **Broken procedural renders** — `fauna-h1-s3` / `h1-s5` are headless fish torsos,
   `fauna-h0-s15` is cornered with a stranded fragment. **A bug, not a judgement.** Diagnosed
   as the FIT/framing pass, not the painter; it is *not* in `packages/art/src`.
6. **The `[SHAPE]` backlog — 97 pairs under 2.0.** Ice Algae ≈ Snow Algae **0.00**, Sea Lettuce
   ≈ Green Algae **0.12**, Duck ≈ Eider Duck 0.44, Eel ≈ Dragonfish 0.50.
7. `familycards.mjs` leaked one verdict as a family key — its `NOT_A_FAMILY` regex misses
   `POLISH`, so Lion's Mane got its own one-asset "POLISH" family. One word in a regex.

---

# ⚠⚠ EVERYTHING BELOW THIS LINE IS HISTORY (2026-08-03 and earlier)


# ★★★ START HERE — END OF 2026-08-03 (session 2), HEAD `6f72c70`, WAVES 48–50 LANDED

⚠ **Repo root is `C:\Projects\Celestial-Frontier`, not `C:\Projects`.** Every path is relative
to it. Everything below the WAVES 35–47 banner is HISTORY — accurate, but superseded.

## ★★★★ DO THIS FIRST — THE FULL SWEEP, ON NICK'S INSTRUCTION

The catalogue moved in waves 48–50, so **431 is already stale in exactly the way 473 was.**
Nick asked for a fresh session and another full sweep. Run it in this order and change nothing
about the harness until it has run once:

```
cd port/v2
node tools/speciesexport.mjs                 # re-render all 1,250 (rebuilds the bundle first)
node tools/familycards.mjs                   # ★ BY FAMILY, NOT ALPHABETICAL — see below
                                             #   153 families · 197 batches of 14
# then one agent per batch: read every PNG, judge against the reference row AND
# against the others in the batch; adversarially verify every FAIL.
# JOIN ON `species`, VERBATIM, AT EVERY HOP — never on model-authored prose.
node tools/goldcompare.mjs --md=reference/GOLD_PASS_3.md
```

★★ **THE ONE THING THAT MUST BE DIFFERENT THIS TIME: BATCH BY FAMILY (D-ART-147).**
Gold pass 2 batched alphabetically, produced 431 correct per-asset verdicts, and **missed the
largest defect in the catalogue** — twelve canids on one pony chassis — because no family ever
appeared side by side. `tools/familycards.mjs` is written and tested for exactly this; each
packet leads with *"DO THESE SHARE ONE BODY?"*. **Do not fall back to `auditcards.mjs`.**

⚠ Also expect the calibration problem again (**D-ART-150**): quote a delta against 431 **only
after checking a slice nobody edited.** Waves 48–50 touched birds (21 bills, 3 raptors),
carnivore feet, and two flatfish — so **flora, microbes and fungi are the untouched control.**
If they move, the ruler moved.

★ The wave-49 CHASSIS MODEL is already established — **start from it, do not re-derive it.**
See the family-chassis section below; a tint render already proved the body occludes the whole
upper limb, and a trial parameter fix already failed and was reverted.

## ★★★ THE LIVE NUMBER: 431 FAIL / 748 POLISH / 71 PASS of 1,250

`reference/GOLD_PASS_2_2026-08-03.md` · per-asset rows in `goldpass2-results.json`.
The catalogue was re-rendered and re-judged in full (248 agents, 0 errors, 1,250 unique
species). **Do NOT quote "473 → 431" as progress — it is an artefact (D-ART-150).** The sets
nobody touched got WORSE (flora +6.3 pts, procedural +4.6) and only 14 of 99 old PASSes
survived, so the two passes judge to different lines. **431 is the new baseline; compare to it
with this harness.** What survives the correction is real: **fauna 277 → 198.**

## ★★★ THE TOP ITEM, AND NEITHER AUDIT'S FAIL LIST CONTAINS IT

**Twelve canids are ONE ANIMAL in twelve colours, and it is a pony. Twelve felids are that
chassis with spots.** See `reference/nick-onebyone/` (Nick's engine package, committed) and its
`visual_evidence/focused_family_reviews/02_felids.jpg` + `03_canids.jpg`. It is a defect of the
**scaffold**, so no per-asset count captures it — my 431-row pass graded most of them POLISH
(**D-ART-147**: alphabetical batching meant no family ever appeared side by side; **batch by
family next time**).

★ **The model is already established — start from it, do not re-derive it** (D-ART-149).
A tint render (limb flat blue, foot flat red, across felid/canid/equid/ursid; the method from
wave 44) showed: **the body occludes the entire upper limb. Only the lower ~35% of each leg is
visible, and that section is a straight vertical tube in every family.** All `crouch` folding
happens inside the silhouette. It is also inverted — `kneeY = 0.70 − crouch·0.34` puts a cat's
knee at 38% of the way down and a horse's at 63%. Lowering the knee was tried and **changed
almost nothing** (occlusion, not joint height, is binding) and was reverted.
**So the chassis fix must change what is VISIBLE**: body depth / topline / where the limb
leaves the silhouette, and the skull. Wave 49 shipped only the paw — the one part the body does
not occlude. **The feet are fixed; the chassis is not.**
⚠ Do not parameter-sweep 140 mammals (D-ART-83), and note artlock reports **zero** drift for
feature-scale work (D-ART-110), so this is eye-verified only.

## THE SHAPE OF THE REMAINING 431

| class | FAIL | | theme | n |
|---|---|---|---|---|
| **flora** | **170** | | missing feature | 411 |
| **fauna** | **106** | | colour / palette | 345 |
| quadruped | 46 | | flat / no material | 321 |
| procedural | 37 | | shape / silhouette | 238 |
| species | 26 | | pose / stance | 145 |
| invert | 25 | | proportion, occlusion, duplication | 84 / 78 / 73 |
| bird | 21 | | | |

**Waves 48–50 landed against this table** (not yet re-measured — the counts above are the
2026-08-03 pass): `bill:'stout'` wired for 21 birds · the carnivore paw rebuilt (60+ mammals) ·
`faunaFlatfish` given real axes (Flounder/Halibut) · Hawk/Falcon/Osprey separated. **Re-render
and re-judge before quoting 431 again** — and **batch by FAMILY this time** (D-ART-147).

★ **Flora is now the largest bucket (170) and its FAIL rate went UP.** This has been a fauna
arc; `PLAN_100_PERCENT.md` scoped nothing for flora. And `colour` + `flat/no material` have
overtaken `shape` — with anatomy improving, **the SURFACE is now what fails**, which is the
material-pivot condition the mammal audit was waiting for.

## THE TWO AUDITS, JOINED — `reference/AUDIT_JOIN_2026-08-03.md`

Nick's engine (347 PASS / 758 HOLD / 145 FAIL) vs mine (71 / 748 / 431), joined on species,
1,233 of 1,250. **875 (71%) agree "not shippable as PASS"; only 58 assets are clean by both.**
FAIL sets overlap on **88 — start there, no adjudication needed.**
- **His is better at systemic defects** (family chassis, silhouette duplicates) and carries
  `sha256`/`previous_sha256` per asset plus per-part sub-scores (torso/head/eyes/legs/tail) —
  **adopt both**; mine emits one prose field and had to prove "did this move" by stashing a diff.
- **Mine is better at per-asset severity.** 4 of his HOLDs adjudicated by rendering, my FAIL
  upheld 4/4 (Agouti and Capybara are the SAME PICTURE; Bonefish reads as a swordfish; Baboon
  has zero snout projection). He reports 0 procedural FAILs; `fauna-h1-s3` is a **headless fish
  body** — an anterior clip. A broken render is a bug, not a stylistic call.

## NEW INSTRUMENTS THIS SESSION — AND THEIR LIMITS

- **`tools/tokencheck.mjs`** — dead-VALUE gate (D-ART-145). 15 DEAD, 14 alias-suspect today.
  Suspects, not verdicts: an `else` that IS the token's drawing is legitimate. **Render first.**
- **`artlock [SHAPE]`** — colour-blind silhouette pairs (D-ART-148). `shapepairs.json`, 100
  pairs under 2.0. **Reported, NOT gated** — turn it into a ratchet only after the backlog is
  worked down (D-ART-97). Top rows are verified real: Flounder ≈ Halibut **0.00**, Ice Algae ≈
  Snow Algae 0.00, Hawk ≈ Falcon 0.06, Sea Lettuce ≈ Green Algae 0.12.
- **`tools/goldcompare.mjs` / `tools/auditjoin.mjs`** — the two joins, both keyed on species.

## OPEN, IN ORDER
1. **The family chassis** (above) — biggest single lever in the catalogue.
2. **The 88 both-FAIL assets** — certain work.
3. **Flora, 170 FAILs** — unscoped by any plan; needs its own arc.
4. **The `[SHAPE]` backlog** — now 96 pairs under 2.0 (wave 50 cleared 4). The remaining
   near-identical constructions start: Ice Algae ≈ Snow Algae **0.00**, Sea Lettuce ≈ Green
   Algae **0.12**, Eel ≈ Dragonfish 0.50, Small Fish ≈ Lanternfish 0.50, Anaconda ≈ Whip Snake
   0.56, Arowana ≈ Knifefish 0.56. **The wave-50 recipe applies to most of them:** the pair is
   one painter called with only a hue difference, and the axes usually already exist.
5. **Broken procedural renders — 13 of the 37 procedural FAILs, and it is a BUG, not a
   judgement.** `fauna-h1-s3` and `fauna-h1-s5` are headless fish torsos; `fauna-h0-s15` is a
   body shoved into the bottom-right corner with a detached fragment stranded at the left.
   ★ **Diagnosis so far: it is the FIT/framing pass, not the painter.** `snout:'blunt'` and
   `profile:'fusiform'` show up in `tokencheck`'s DEAD tier and are RED HERRINGS — the else
   branch *is* the blunt snout, correctly (Tuna, Sardine, Herring all use it and render fine).
   The verifier's own note says "a clip, not an absent head-blob". The fit pass is **not in
   `packages/art/src`** — find it upstream (it is referenced by comment in five painters as
   "the shared fit pass, wave 6"; D-ART-34 says it erases absolute size). Nick's engine scored
   all 240 procedural assets PASS and never looked for this: **a coherence check does not ask
   whether the picture is intact.**
6. **Chanterelle** — the funnel's dished centre reads as a black hole. (`gills:'ridge'` is a
   dead value but a latent trap only; the ridges draw off `cap:'funnel'`.)
7. **Naming, so passes can join** — 240 procedural assets cannot join between my own two passes
   (`fauna-h0-s0` vs `f0·6#126`), and 17 Earth names need normalising (`Aye Aye`/`Aye-Aye`).
   **Adopt `filename` as the key, as Nick's package does.**
8. Carried from waves 35–47: the elephant ear fan, rodent incisors, G7 butterfly wings,
   `earShape:'nub'`, the mustelid trio, and the 4 remaining constant procedural painters
   (`fungiCup`, `microbePlates`, `fungiEarthstar`, `microbeCiliate` — D-ART-143).

## HOW TO RUN THE GATES
```
npx vitest run · npx tsc --noEmit -p apps/game · node tools/speccheck.mjs
node tools/tokencheck.mjs · node tools/overridecheck.mjs
npm run artbattery -- --touching=<classes>      # 6 stages, artlock is stage 6
```
⚠ Declare the classes that **MOVED**, not the file you edited. ⚠ A bless claims **a person
looked** — prefer `--bless="Name,Name"` over a whole class, and **verify what it wrote against
the git copy of the lock, not against the tool's own summary** (D-ART-146).

---

# ⚠⚠ EVERYTHING BELOW THIS LINE IS HISTORY (waves 35–47 and earlier)

It is accurate about what those waves did and **superseded on every number**. In particular the
**473 / 590 / 187** baseline it quotes is dead — it was re-measured (431 / 748 / 71) *and* the
two passes were shown not to be comparable (D-ART-150). The "step 1 is a re-measure" instruction
below **has been carried out**. Read the live section at the top of this file for current state;
read below only for the *why* behind a past wave.

## ★★★ THE ARC IS NOW "DRIVE THE CATALOGUE TO ZERO FAIL". THE PLAN IS A FILE.

**Read `port/v2/reference/PLAN_100_PERCENT.md` first.** It holds the measured shape of the
work — FAILs by set, by painter class, by theme — the honest scoping of what "100%" can mean,
and the four-stage route. Everything below is the short form.

### ⚠ STEP 1 IS A RE-MEASURE, NOT A FIX
The 473 FAIL / 590 POLISH / 187 PASS baseline is **stale** — measured before waves 38–47, which
changed the ear painter, the horn painter, the pose axis, six occluded faces, the
snake/lizard/turtle painters, four procedural family painters and the truffle. **The catalogue
has not been re-rendered since.** Fixing against it is fixing against a photograph of a build
that no longer exists — exactly what killed `visualaudit.json`, `mammalaudit.json` and the
962-row queue.
⚠ **Fix the harness before re-running:** the code pass's verification never ran because its
hunt→verdict join keyed on a free-text `claim` the verifier rephrased. **Join on an identifier,
never on model-authored prose.** The gold pass joined on `species` and worked.

### Then, cheapest-first (full reasoning in the plan file)
1. **`missing feature` — 309 of 473 rows, the largest bucket by far.** This is the
   D-ART-100/D-ART-137 family: a field set, documented, and never read — or read and then
   OCCLUDED. These clear in bulk; one painter fix clears every species that sets the field.
2. **`duplication` — 98 rows.** The procedural half is diagnosed; see below.
3. **`colour` — 78 rows.** Black Truffle was one and the fix was one line: **it was routed
   bare, with no `speciesHue`, so it inherited a generic palette and painted chalk-white.**
   Grep for other bare routes — mechanical, one line each.
4. **`shape / silhouette` — 188 rows,** many of which resolve as a side effect of 1–2.

## Still open, with measurements

**A — Procedural de-duplication: HARD pairs 19 → 3. Drive to 0.** (D-ART-143)
Earth has **zero** pairs under artlock's 0.6 line; procedural had **nineteen**, seven at
distance 0.00 — byte-identical pictures from different seeds. Nothing watches it because
`[SAME]` is Earth-only *by design*.
★ The cause was not the family picker. Wave 20 made the SELECTOR spread evenly and nobody asked
whether the families it picks can draw more than one thing — **7 of 26 family painters draw one
fixed picture.** Four are fixed (`tardigrade`, `microAlgaeCell`, `fungiMorel`, `fungiTruffle`);
**four remain**, all in `proceduralfamilies.ts`:

| painter | rng calls |
|---|---|
| `fungiCup` | 1 |
| `microbePlates` | 1 |
| `fungiEarthstar` | 2 |
| `microbeCiliate` | 2 |

Method: vary a **RATIO** off `seeded(g, salt)` — never a canvas scale, the fit pass erases
absolute size (D-ART-34). Each also owns an Earth species, so declare `--touching=…,species`
and re-render that species. Measure with the `lock.fp` + `dist()` walk in the wave 46 commit.

**B — The four painters above are also gold-pass FAILs.** `Earthstar` renders as a fuzzy ball
with spikes (seen at the end of wave 47). Fix the variation and the read in the same edit.

**C — Known-open from earlier waves**, all itemised further down this file: the elephant fan
(needs the head-frame model established with the tint trick BEFORE any outline work), rodent
incisors (ship paired with a Water Vole / Freshwater Crab separation), G7 butterfly wings +
abdomen-rooted legs, `earShape:'nub'` rolled out one row at a time, the mustelid trio.

## What wave 47 changed that you should know about
`artclass.mjs` was classing **15 assets as `verbatim-*`** — the class the lock forbids anyone to
move — and **13 of them were FAILs**, i.e. defects nobody could legally fix. **All 15 were
misclassified**; every one routes to a painter we own. Three separate causes, each a different
surface form of the same key (packed object rows, a U+2019 apostrophe, the array route lists).
**Assets classed verbatim: 15 → 0.** All 1,250 now route to painters we own, so nothing in the
catalogue is off-limits any more. See D-ART-144 — including the part where my first fix was
*worse* than the bug and only a both-directions negative control caught it.

## What the day was, in one paragraph
Two full audits were run and then worked to completion. **The gold pass** rendered and judged
all 1,250 assets (`reference/GOLD_PASS_2026-08-03.md`, per-asset verdicts in
`goldpass-results.json`): **473 FAIL / 590 POLISH / 187 PASS**. **The code pass** audited every
line of owned art source (`reference/CODE_PASS_2026-08-03.md`, findings in
`codepass-findings.json`). Waves 35–45 then closed almost all of both. **Three stale audit
files are dead** — `visualaudit.json`, `mammalaudit.json` and the 962-row strict queue — and
say so at the top of the gold pass.

## ★ DO THIS FIRST, BEFORE ANY NEW WORK
**Re-render all 1,250 and re-judge.** Waves 38–45 moved a large fraction of the catalogue and
the last complete look was the gold pass that started it. Re-run the same harness (the script
is preserved; slices are in `reference/goldpass-slices.json`). Expect the counts to have moved
a lot — and treat the new numbers, not the old ones, as truth.
⚠ **When you do, fix the harness bug first:** the code pass's verification never ran because
its hunt→verdict join keyed on a free-text `claim` string that the verifier rephrased. The
gold pass joined on `species` and worked. **Join on an identifier, never on model-authored
prose.** Everything in `codepass-findings.json` is therefore hunt-stage only.

## ★ THE FOUR THINGS THAT ARE ACTUALLY OPEN
Each is recorded with its measurement — none is an open question.
1. **G9, the elephant ear fan.** Six attempts across two waves, all reverted. ★ The next
   attempt must NOT touch the outline first: **establish the head-frame model** (`headY`, the
   `ang` tilt, where the Tube's mass sits) using the **tint trick** — paint the fan a flat
   colour and render it (`smoke/wave44/diag*.png` show how). The last attempt's render
   *contradicted its own arithmetic*, which means the frame is misunderstood, and parameter
   search is proven not to converge here.
2. **The rodent incisors.** The chisel replacement is written and measured: it costs exactly
   ONE pair (Freshwater Crab ≈ Water Vole, 1.45) *regardless of enamel colour*, so the cause
   is the accent's AREA. **Ship it paired with a Water Vole / Freshwater Crab separation** (the
   crab's claws are its signature and are not prominent) and the net is negative.
3. **G7's butterfly wings** (both sweep one side; should be two pairs off the thorax) and
   insect legs that root on the abdomen.
4. **`earShape:'nub'`** — the axis exists with zero writers. Roll it out **one row at a time**,
   each derived from its own reference row. ★ Pika is the sharp case: tall ears make it a
   rabbit, nub ears make it a prairie dog; it needs a THIRD trait (round, tailless,
   blunt-faced), not a different ear.

## ★ THE FIVE LAWS THIS DAY PAID FOR (full text in `port/v2/DEVIATIONS.md`)
- **D-ART-139** — a gate that has never seen its highest-priority input has never run.
  `overridecheck`'s shadow check could not parse `CANON` for TWO stacked reasons; 28 dead
  routes had shipped, incl. the documented Insect-Eating Bat hazard.
- **D-ART-140** — suspect a NEW SCAN before you suspect the code. Four instrument-first lies
  in one day. A suspiciously large finding count is a bug report about the instrument.
- **D-ART-141** — on a dark animal, **the only light element is structural**. Three fixes were
  right about the defect and wrong about the remedy; artlock caught all three.
- **D-ART-142** — a pose is an AXIS, not a painter. Whether a shape can be re-posed cheaply
  depends on whether it was built as a **solid** or an **outline**. Wave 4 paid for wave 40;
  the remaining hand-drawn outlines (elephant fan, cobra hood) are where the next posture
  request will hurt.
- **D-ART-83, re-learned the hard way** — I rolled one new ear token to ELEVEN species because
  it was anatomically right for all of them, and artlock refused it four ways. **A global pass
  wearing an anatomy argument is still a global pass.**

## ★ HOW TO RUN THE GATES
```
npx vitest run · npx tsc --noEmit -p apps/game · node tools/speccheck.mjs
node tools/overridecheck.mjs        # now catches CANON shadows; negative-controlled
npm run artbattery -- --touching=<classes>      # 6 stages, artlock is stage 6
```
⚠ Declare the classes that **MOVED**, not the file you edited — `artclass` labels an asset by
the painter that draws it, so one file can move several classes. artlock will tell you which.
⚠ `--bless --class=X` re-blesses ONE class, and a bless is a claim that **a person looked**.

---

## ★★ WAVE 35 (2026-08-03) — history from here down

**The live queue is `port/v2/reference/mammal-species-fixes.md`, then `reaudit-worklist.md`.**
Wave 35 closed that file's entire top section — the wrong-family chassis (Cheetah, Panda, the
three hyenas via a new `hyaenid` family, Sloth, both tapirs) and **all six** of its listed
cross-species painter bugs (banded tail, tuft tail, horn/tusk anchors, limb-exit occlusion,
shaggy rim, `nosePad`). New axes: `skull?: MammalFamily`, `back:'roached'`, `trunk: number`,
`tailTip` on plain tails — which leaves **Hippopotamus, Walrus, Raccoon and Aardvark as
one-line table edits.**

- ⚠ **D-ART-137 — `if (earShape === 'hidden') return;` returned from the WHOLE painter.** The
  eye, face marks, horns, trunk and tail were skipped for Sloth, Mole, Seal, Fur Seal, Sea
  Lion and Walrus. Six eyeless animals and a tuskless walrus, with every gate green — artlock
  had blessed the broken render as its own baseline. **A fix can be right about the thing it
  names and wrong about where it stops**, and only a render tells you which.
- ⚠ **D-ART-138 — `npm run artbattery` invoked artlock with no arguments**, so stage 6 read
  "declared: (nothing)" and failed on every legitimate change. It forwards args now:
  **`npm run artbattery -- --touching=quadruped`**.
- ★ **The worklist prescriptions are agent-written and are not always right.** Two of wave
  35's rendered wrong (the Panda's prescribed band leaves a white chest). Render first.
## ★ WAVE 36 (2026-08-03) — the ear system, on Nick's catch

He spotted the donkey's ears on the wave-35 proof sheet. The ear was broken three ways:
the size ladder was **inverted at the top** (Donkey/Wild Ass at `'huge' × earScale 1.70` =
1.96·headR, LARGER than the Fennec Fox at 1.50); the **root separation scaled with the
ear's own size**, so a long pair pushed itself apart until the two merged into one mass;
and the ear was **filled at 0.52 of the coat, which is a hole, not an ear** — the back of a
real ear is coat-coloured and the dark part is the concha inside it. That last one is why
53 `'large'`-eared species all wore the same dark cap.
Also fixed: `tail:'bushy'` was a straw broom (110 straight fixed-width strokes reaching 90%
of the tail's width out of it — the same three faults wave 35 fixed in the shaggy rim, in a
second place), and the elephant's ear fan, whose comment claims it is drawn behind the head
and never was.

⚠ **The lesson worth carrying: `earScale` was being used to force a read that the ear's
TONE was preventing.** The 1.70 was a workaround for a fill bug two layers down. When a
per-species multiplier has to go far past its ladder, suspect the thing it is compensating
for.

**Still open:** the hyena bodies are half-fixed, because fore and hind limbs are always the
same length (a listed structural limit), so a falling topline can only ever be faked.

---

**Written 2026-08-02 at the end of waves 4–21.**
The live work is **THE PROPORTION ARC** — making every organism in the Earth catalogue look
like the real thing, on Nick's instruction. Waves 4–21 have landed. ★ EARTH COVERAGE IS 1010/1010 — Bucket A is closed.

### What waves 20–21 changed that the rest of this document predates

- **The roster is DEDUPED: 1,014 records → 1,010 organisms** (D-CAT-1, Nick's explicit call).
  Four organisms were filed in two kingdoms each. The fix lives in the OWNED wrapper
  `packages/domain/descriptors/src/apphooks.ts`, never in `apphooks.verbatim.js`, which is
  byte-locked and auto-lifted — an edit there breaks the parity contract and the next lift
  silently reverts it. **Earth names shifted for every flora and microbe** as an accepted
  cost; fauna and fungi did not move. `baseline.json` was NOT regenerated — the one probe
  that cannot be byte-equal is compared through a narrow mask with six negative controls.
  Painted assets are now **1,250**.
- **`npm run artbattery` is now SIX stages, and artlock is one of them.** It never was
  before, despite this document calling it the gate (D-ART-109).
- **The material layer reaches past the mammals** — birds have feathers, fish have scales
  that actually show, arthropods have shell. No painter was rewritten: `ellipseTube` and
  `profileTube` in `torso.ts` give an ellipse- or profile-bodied painter the same surface
  coordinates the mammals earned in wave 4.
- ⚠ **artlock CANNOT see a material change** (D-ART-110). Its fingerprint is 16×16 RGB at
  eps 0.9, which is right for catching a global palette pass and structurally blind to fine
  texture — feathering 105 birds moved 11 assets. **Review material work by eye with
  `node tools/speciesstrip.mjs "Crow,Beetle,Salmon" out.png` and Read the PNG.** An artlock
  green means the palette held, not that the material is right.

---

## ★★ THE ONE THING THAT CHANGES EVERYTHING — READ THIS FIRST

**YOU CAN SEE THE ART.** The previous four handoffs said the opposite, in bold, and it was
wrong. The exported portraits are PNG files on disk and the **Read tool renders them**:

```
Read C:/Projects/Celestial-Frontier/port/v2/apps/game/smoke/species-fullsize/earth-fauna/Cheetah.png
```

One look found four defects that four waves of geometry reasoning had missed. **Subagents can
see them too** — that is how 1,113 organisms were audited this session.

Every real catch in this arc came from looking at a picture. Not one came from an instrument.
**Look before you reason, and look again before you claim anything is fixed** (D-ART-88).

---

## READ IN THIS ORDER

1. **this file**
2. `port/v2/DEVIATIONS.md` — the laws. Start at **D-ART-89 … D-ART-99**; they are this
   session's and they are the expensive ones.
3. `port/PROPORTION_ARC.md` — the arc plan
4. `ROADMAP.md` · `PROCESS_LAWS.md`

Do **not** read `port/MORPHOLOGY_PASS.md` end to end. Grep it.

---

## THE SAFETY NET — RUN IT, AND UNDERSTAND WHY IT IS SHAPED THIS WAY

`node tools/artlock.mjs --touching=<class>` fingerprints all 1,250 rendered assets and answers
the two questions no other gate here could. **It is stage 6 of `npm run artbattery` as of
wave 21** — for waves 4–20 it was documented as part of the gate and was not actually in it,
so it only ever ran when someone remembered to type it (D-ART-109).

⚠ **Its blind spot, know it before you trust it:** the fingerprint is a 16×16 RGB grid at
eps 0.9, so it sees a palette or proportion pass and CANNOT see surface texture at all
(D-ART-110). Material work needs an eyeball pass, not a green tick.

- **[DRIFT], scoped by painter class.** Nick: *"It only needs to apply to the organisms that
  we're dealing with in that class… we just want to make it so that the global passes don't
  retroactively affect all the earth work we put in."* Declare what you are editing. Drift
  inside the declared classes is the work; **drift outside them is the failure**, because that
  is exactly what a global pass looks like. Declare nothing and nothing may move.
  - `procedural` is **advisory** — that library is meant to keep changing while we iterate on
    the generator, so it never fails the gate.
  - `verbatim-*` is the opposite: those species are drawn by `hdart.verbatim.js`, which nobody
    may edit, so **any** movement there is a real bug.
  - `--bless --class=quadruped` re-blesses ONE class. That is the mechanism that lets you run
    an intentional retroactive pass over one family without unpinning the rest of the Earth
    catalogue.
- **[SAME], Earth only.** `WATCH 2.5` orders the worklist; `HARD 0.6` is the same picture with
  two labels. Today: **~4,350 watch pairs, 33 hard.** What is GATED is narrower than what is
  printed, and deliberately so — see **D-ART-97**. The watch count is reported but only a pair
  the change pushed below the **confusable line 1.5** fails, because 1% of entirely unrelated
  pairs already sit under 2.6 and counting crossings of that band measures noise. The first
  version of this ratchet failed wave 6 over *Bullfrog ≈ Cat at 2.4*.

Calibrated against ground truth, not guessed: Nick's audit engine independently listed 22
template-sharing clusters (115 pairs); at WATCH=2.5 this catches 95 of them while flagging
0.9% of all other pairs. `--selftest` holds 9/9 on the decision layer. ⚠ D-ART-81: that says
nothing about the fingerprint sensor — the sensor's control is that a bless-then-rerun reports
zero drift, which it does.

**It has already earned its keep twice**: it caught wave 6 making every felid share a face
(D-ART-96), and then its own first threshold turned out to be measuring noise (D-ART-97). A
failing gate must print the exact rows it means, or it just gets argued with.

**NEVER bless to turn a red report green.** A blessing is a claim that a person looked.

---

## WHAT LANDED THIS SESSION

- **`torso.ts` — the torso is a SOLID.** A generalized cylinder (spine + radius profile).
  Silhouette, shoulder/haunch mass, foreshortening and per-point lighting all come from it.
  `smoothTop()`/`traceBody()` deleted; the whole class of cusp/seam/tangent bugs is unreachable.
- **`skin.ts` — the coat is a SKIN.** Marks authored in (u along spine, phi around girth):
  real tapered stripe bands, Voronoi giraffe patches with pale seams, zebra bands crossing the
  belly, rosettes, brindle, shaggy with a broken silhouette, and **countershading on every
  mammal** — which alone did more than any marking.
- **Family body plans.** 11 families carrying only what is anatomically true of all members
  (mass distribution, cannon-bone thinness, crouch, and the foot: hoof / cloven / paw /
  plantigrade sole / soft pad). 116 species tagged. Every per-species NUMBER untouched.
- **`tools/artlock.mjs` + `tools/artclass.mjs`** — the safety net above.
- **`tools/auditcards.mjs`** — builds the per-organism work packets for a visual audit.
- **Skull families (wave 6).** Per-family face length, forehead "stop", jaw depth and — the one
  that matters most — EYE PLACEMENT: forward and central on a predator, high and far back on a
  grazer. The neck also moved BEHIND the torso, removing the last visible seam on the animal.
- **`reference/visualaudit.json`** — 1,111 rows, one per non-quadruped organism, each judged by
  an agent that opened the picture: severity, what it *reads as* to a stranger, the defect, and
  a concrete fix. ⚠ Its severity scale is HARSHER than Nick's (agents were told to be demanding
  art directors, and any missing must-read counts as a blocker) — 964 "blockers" is not
  comparable to his 115 FAILs. The per-row text is the value, not the label.
- **`reference/nick-audit-recheck.json`** — a verdict on every non-mammal row of Nick's own
  audit against the current render: **16 fixed · 54 partly · 23 not fixed.**

---

## ⚠ THE TWO WORKLISTS THE NEXT SESSION SHOULD DRIVE FROM

1. **`reference/visualaudit.json`** (mine, above) — non-quadruped organisms only. The 141
   quadruped-routed mammals were deliberately excluded because waves 4–5 were rewriting them;
   **they still need their own visual pass against the new render.**
2. **Nick's anatomy-first audit** — he uploaded
   `Celestial_Frontier_Anatomy_First_Audit_Engine_Package.zip` (xlsx + per-species CSVs +
   contact sheets). It was run against the **pre-wave-4** export, so **some of it is already
   fixed and it has NOT yet been re-checked one-by-one against current art — Nick explicitly
   asked for that comparison and it is the top outstanding request.** Its headline finding
   (global passes gave unrelated species the same scaffold) drove wave 5. Its remaining
   uncorrected items: specialist insects, specialist fish, crocodilians, flightless birds,
   the 19 iconic flora, 10 fungi, 4 microbes, and 4 canonical-ownership duplicates
   (Tardigrade, Reindeer Lichen, Green Algae, Snow Algae).

Both agree on the same top defects, which is the strongest signal available here.

---

## ★ THE STRATEGIC QUESTION, ASKED AND ANSWERED (2026-08-02)

Nick asked whether this is the Pixi engine and whether it is the best we can do. Two facts to
carry forward, because they should shape what the next session even attempts:

- **The species art is NOT Pixi.** Pixi renders the galaxy/world scene (`apps/game/src/main.ts`).
  Every organism portrait is plain `CanvasRenderingContext2D` — procedural 2D drawing rasterised
  to a data URL and cached. Swapping in Pixi/WebGL would change nothing about how these look;
  the ceiling is the DRAWING APPROACH, not the renderer.
- **The same engine scores 97.5% on procedural and 5.7% on Earth** under Nick's strict bands
  (234/240 vs 58/1010). That gap is the whole story: a generator is good at coherent variety and
  bad at hitting a specific named target. We are asking one system to do both.
  **The obvious split — authored assets for the 1,014 fixed Earth species, the runtime generator
  for the aliens — is the highest-leverage decision available and has not been made.** It also
  maps exactly onto the protect-Earth / iterate-procedural split Nick already asked the safety
  net to enforce.

---

## THE STRUCTURAL QUEUE — WHERE IT STANDS

Nick set this order on 2026-08-02: fix the structural findings (the ones a
future material/texture pass provably cannot fix), and defer the surface ones.

1. ✔ **Wrong-class routing and ownership blockers** (wave 8). The bats were
   rendering as bees; the tardigrade's eight legs read as four. Both fixed.
   ⚠ NOT done, and deliberately: Green Algae / Snow Algae / Reindeer Lichen /
   Tardigrade still exist as TWO CATALOG RECORDS each. The painters are right
   per kingdom; collapsing the records is a data change touching species counts
   and saves. **Nick's call.**
2. ✔ **Birds** (wave 8). The songbird blob is gone — see below.
3. ✔ **The unmodelled families** (wave 9): marsupial, procyonid, xenarthran,
   pinniped, burrower, plus 'claw' and 'flipper' feet. 21 species off 'generic'.
4. ✔ **The named regressions** (wave 9): the rectangular tail base, the
   elephant's Asian topline and knee-height trunk, the walrus's legs.
5. ✔ **The unrouted — DONE.** 1010/1010. Every Earth organism has a real
   painter and nothing falls to the verbatim engine. The arc opened at 930.

**BUCKET A IS CLOSED.** All five structural items are done. What remains before
the material decision: the 72 mammal heads that are still generic (TABLE work —
inverted or missing family traits, itemised per animal), the ONE hard look-alike
pair (Water Mint ≈ Chicory, needs a bare-branching-stem axis), and the
non-mammal audit backlog.

**Then the material pass** — see the strategic note above. The gate for it is
 in reference/mammalaudit.json: 0 → 1 of 144 so far, so anatomy is
still binding. When it climbs, pivot.

---

## OPEN, IN PRIORITY ORDER

1. **★ HEADS: 72 of 144 unique** — measured three times now: **20/141 → 52/144
   → 72/144**. Half the mammals have a head that could not be swapped. The
   72 that could are itemised with a reason each in `reference/mammalaudit.json`;
   the recurring ones are inverted or missing family traits (an arctic fox with
   pointed ears and a long muzzle, an aardvark with no rabbit ears) rather than
   a shared token — i.e. TABLE work now, not painter work.
   ⚠ **surfaceOnly is 1 of 144.** Anatomy is still the binding constraint and
   the material pivot is NOT due. **That is the number that decides it.**
   ⚠ artlock reports ZERO drift for feature-scale work (D-ART-103) — verify ears,
   eyes and muzzles by opening a native-size PNG, and run `--expect` whenever you
   edit spec rows (D-ART-104).
2. **ONE hard look-alike pair left: Water Mint ≈ Chicory** (was 33 at the start
   of 2026-08-02, then 19 after the birds, 9 after the fish, 1 after the
   invertebrates). Their reference rows are far apart — a square stem with a
   single round lilac pompom versus stiff wiry NEAR-NAKED branching stems with
   sky-blue ray flowers sitting almost directly on them — but the flora painter
   has **no axis for a bare branching stem**, so both still draw the same leaf
   ladder. That is a painter job, not a table job, and it was left rather than
   bodged. The next tier under it: Crow ≈ Frigatebird, Grasshopper ≈ Thrips,
   Loon ≈ Cormorant, Electric Eel ≈ Lungfish.
   **The recipe is proven four times now** — read the mustReads, add the missing
   spec axes, re-derive each row from its own reference — and
   `node tools/speccheck.mjs` now guards the step that kept going wrong.
