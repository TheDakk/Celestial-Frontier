# The 77-row re-audit, verified against CURRENT renders (2026-08-03)

Three agents re-checked every open row of `nick-audit-recheck.json` by *rendering the
species and looking at it* — no verdict here came from reading source. That matters,
because the recurring failure on this project is a spec field that is set, documented, and
never read: `snout:'hammer'` and the `jumper` femur both existed in code and were invisible
on screen.

**9 of 77 confirmed genuinely fixed** · **11 fixed in wave 26** · **57 open**

Work this file by SYSTEMIC GROUP, not top to bottom. Almost every remaining row belongs to
a family defect, and one fix clears the family — wave 26 closed eleven species with three
changes.

---

## ✅ Confirmed fixed (verified by eye, not assumed)

Shiitake · Death Cap · Destroying Angel · Jelly Fungus · Vampire Squid · Water Strider ·
**Tardigrade · Green Algae · Snow Algae** (the last three confirm D-CAT-1's roster dedupe
from the render side, not just from the roster count).

## ✅ Fixed in wave 26

Crocodile · Alligator · Caiman · Gharial (limbs) · Ostrich · Emu · Rhea · Cassowary
(ratite build) · Grasshopper · Locust · Cricket (jumping femur).

---

## ✅ Fixed in wave 28

**Group A (perching birds)** — Eagle, Harpy Eagle, Vulture, Hoatzin, Macaw, Kakapo, Parrot.
New axes: `talons`, `bald`, `crop`, `wingClaw`, `parrotBill`, `zygo`; plus the rows finally
set the `wings`/`headMass` axes that already existed.
**Group C (bee wings)** — the folded wing was shorter than the abdomen AND drawn before it.
Now longer, deferred until after the body, with a hindwing.
**The cephalofoil** — `snout:'hammer'` widened the jaw by 1.4% of body length; it now draws
the real transverse bar with the eyes at its tips.
**The Narwhal's tusk** — restored via a `tusk` axis on `faunaCetacean`.
Measured: confusable pairs **1,253 → 1,119**; hard pairs still 0.

## ★ SYSTEMIC GROUPS — do these first, biggest first

### ✅ A · DONE (wave 28) — The perching-bird torso is shared by every large bird (6+ species)
Eagle, Harpy Eagle, Vulture, Hoatzin, Macaw and Kakapo are one plump ovoid with one folded
wing panel and one pointed tail wedge, differing only in bill and colour. `BirdSpec` already
has `headMass` and `wings:'soaring'` and almost none of these rows set them.
- **Eagle** — set `wings:'soaring'`, `tail:'fan'`, `headMass:1.5`; deepen the chest so the
  breast reads keeled rather than as a round egg.
- **Harpy Eagle** — `headMass:1.8`, `wings:'soaring'`; needs a new `talons` axis.
- **Vulture** — `wings:'soaring'` plus a new `bald` axis: bare pinkish head/neck skin
  distinct from the plumage, with a pale ruff where it meets the body.
- **Macaw** — ⚠ REGRESSION: its parrot bill and zygodactyl feet have collapsed back to the
  shared raptor hook and flat toes. Needs a `bill:'parrot'` case (deep, culmen curving past
  the jawline, pale cere) and an explicit rear-pointing toe.
- **Hoatzin** — needs `crop` (bulge at the neck base) and `wingClaw`; set `tail:'long'`.
- **Kakapo** — heavy hooked bill, facial disc, thick feathered tarsi, reduced wing.
- **New axis needed for the group:** `talons` (3 curved claw hooks per foot, tarsus ~3× wider).

### ✅ B · DONE (wave 29) — The insect body plan
⚠ **Wave 23's `broad`/`eyes`/`shield` axes did NOT fix this.** They separated the species
enough to clear the hard-pair ratchet while leaving the family reading as one plan at
different lengths — the gate went green and the thing it guarded was still wrong. `broad`
scales segment HEIGHT, so it makes beads taller, not bodies flatter.
- **Cockroach** — needs the three beads fused into ONE flat oval carapace (~2.4:1) with a
  separate pronotal shield, riding low to the ground.
- **Giant Water Bug** — same fusion; set `broad:2.2, shield:true`, plus paddle hind tibiae.
- **Mantis** — needs `face:'triangle'` and a `prothorax` axis (stretch the thorax to ~2.2×
  along the body, narrow to ~0.55 of abdomen width) so the neck-like segment reads.
- **Mosquito** — needs a `proboscis` axis (straight needle ~1.6 head diameters, angled down)
  and a tapering abdomen.
- **Cicada** — abdomen should be a tapering cone, not a sphere; forewing ~1.4× abdomen length.
- **Grasshopper/Locust/Cricket** — femur fixed in wave 26, but all three still need
  `face:'slant'` (a down-tilted wedge head, not a glossy sphere).

### ✅ C · DONE (wave 28) — Every bee's wing is clipped to the abdomen (4 species)
Bee, Bumblebee, Orchid Bee, Black Fly. The wing never breaks the body silhouette. Draw the
forewing anchored at the thorax and extending ~0.5 body lengths PAST the abdomen tip, with a
shorter hindwing offset ~15°. Additionally: **Bumblebee** needs the abdomen to be the
dominant mass (~1.4× thorax) and the whole body shortened to ~1.6:1; **Orchid Bee** needs a
`corbicula` (flattened hind tibia with a pollen mass); **Honeybee** needs a visible pollen
pellet and a stinger.

### ✅ D · DONE (wave 30) — Only two limbs are drawn
**Komodo Dragon** and **Alpine Salamander** each show one fore and one hind limb with no
far-side pair — the same omission wave 26 fixed in `faunaCroc`. Komodo also needs a
shouldered monitor torso (shoulder mass ~0.25, hip ~0.75) and clawed 5-toe feet. Alpine
Salamander additionally has an off-body paddle lobe floating at the tail base that belongs
to the aquatic form.

### ✅ E · DONE (wave 30) — Turtles are one asset recoloured (3 species)
**Snapping**, **Softshell** and **Tortoise** all have a domed scute shell on a plastron slab
with **two floating wheel-like discs** for legs. All three need four columnar limbs meeting
the plastron with no gap. Then differentiate: Snapping wants a big hooked head, 3 carapace
keels, a serrated rear rim and a long rough tail; Softshell wants a *leathery* flat shell
with the scute grid deleted and a tubular snorkel snout; Tortoise wants a tail nub.

### F · The two isopods are shrimp (2 species)
**Isopod** and **Giant Isopod** route to `shrimpBody`, which cannot produce a plated animal.
They need a flattened plated body: broad low dorsal oval (~2.2:1) with 7 overlapping tergite
bands, a head shield, a solid triangular pleotelson, 7 stout pereopods per side, short
antennae, no uropod fan.

---

## ★ REGRESSIONS — ✅ ALL CLEARED (waves 28-30: Narwhal tusk, Macaw bill, Beach Morning Glory flowers, Cinnamon bark, Orca markings)

- **Narwhal — the tusk is GONE.** It was rerouted to `faunaCetacean`, whose options are only
  `{dorsal, blunt, hue, long, bulk}`, so the species lost its single identifying feature.
  Needs a `tusk` axis (straight taper forward ~0.45 body length, spiral grooves) and a melon
  forehead so it stops matching the Orca profile.
- **Macaw** — bill and feet regressed to the shared raptor assets (see group A).
- **Beach Morning Glory** — the white shapes Nick objected to were DELETED rather than
  reshaped, so it now has no flowers at all.
- **Cinnamon** — the trunk renders grass-green. `PlantSpec` has `hue` (foliage) and `fhue`
  (fruit) but no bark colour, so the trunk takes the foliage hue. Needs a `bark` axis
  defaulting to brown for `habit:'tree'`.
- **Orca** — the row sets `hue:[26,28,34]` (near-black) and it renders mid-teal, so
  something downstream is overriding the cetacean hue. Also needs its white eye patch,
  ventral field and saddle, and a taller dorsal.

## ★ SET BUT NEVER READ — ✅ both fixed (cephalofoil wave 28, jumper femur wave 26)

- **`snout:'hammer'`** widens the jaw by `depth*0.2` — about 1.4% of body length, invisible.
  A hammerhead's cephalofoil should be a transverse bar ~0.45 of body length across, with
  the eyes at its outboard tips. **The hammerhead is the animal; right now it is a mackerel.**
- **`jumper`** — fixed in wave 26, recorded here because it is the same shape of bug.

## ★ DUPLICATE ASSETS — ✅ Black Pepper separated (wave 29)

**Black Pepper is geometrically the same asset as Beach Morning Glory**, only tinted. The
`[SAME]` ratchet misses this because colour separates them — a reminder that the gate
measures pictures, not construction.

---

## Everything else (single-species work, lower leverage)

Dragon Fruit (needs ribbed forking cladodes and a trellis) · Ivy (broad lobed blades, not
narrow finger-fans; needs a substrate to grip) · Mustard (needs branching racemes and
siliques) · Peanut (must fruit BELOW ground, and is far too tall) · Sargassum (needs a
branching thallus with paired air bladders) · Whale Shark (blunt terminal-mouth face,
heterocercal tail) · Woodpecker (chisel bill, zygodactyl feet, clinging pose on a trunk) ·
Acai (needs a palm crown) · Angel's Trumpet (flowers must HANG) · Black Pepper (pendulous
catkin spikes) · Yeast (discrete budding cells, not one mound) · Chanterelle (wavy margin,
decurrent ridges) · Earthstar (broad rays splayed onto the ground) · Morel (irregular
silhouette, varied pits) · Cave Cricket (routed to a LARVA plan — wrong body plan entirely) ·
Chicken (wattles; tail should sweep up) · Rooster (wattles, hackle cape, sickle tail) ·
Bladderwrack (dichotomous forking, paired bladders) · Buckwheat (open alternate leaves,
branched panicles) · Cardamom (`habit:'rosette'` is wrong for a ginger) · Horned Lizard
(`stout` inflates instead of flattening) · Sturgeon (mouth floats off the snout; needs
scute rows and barbels) · Flying Squirrel (needs a `patagium` — also unlocks Sugar Glider
and Colugo) · Scorpionfly (rostrum, upcurled tail) · Poison Dart Frog (real folded hind
limb, toe pads) · Right Whale (bowed gape, callosities; a highlight arc floats off the head) ·
Albatross (tubenose bill, gliding pose) · Parrot (zygodactyl feet, graduated tail).


---

## ★ THE PROCEDURAL SIDE (checked wave 28)

Rendered a spread across kingdoms and heat levels and looked at it: **procedural is in good
shape.** Coherent, varied, genuinely alien — a plated crested quadruped, a berry vine, a
bracket fungus, a diatom-like microbe. This is the half of the engine that always scored
well (~97% under Nick's strict bands) and nothing here regressed.

⚠ **The one real gap: procedural organisms have NO MATERIAL LAYER** — and wave 29 found out
why it is not a routine fix.

**Procedural FUNGI and MICROBES** route to owned painters (`resolveProcedural` picks from
13 fungal and 13 microbial families), so they CAN take materials the ordinary way.

**Procedural FAUNA and FLORA do not.** They fall through to `hdart.verbatim.js` — 5,236
lines auto-lifted byte-for-byte from main.js v1.8.9, carrying a sha256 and a DO-NOT-EDIT
banner. Adding a material there would break the parity contract and be reverted by the next
lift. So the two halves of the catalogue cannot be brought level by editing a painter, and
this is **not a worklist item — it is a fork in the road**:

  1. **A post-pass layer.** Let the verbatim engine paint, then lay fur/scale/venation over
     the finished portrait in an owned pass. Cheap, reversible, keeps parity intact. Weakest
     result, because the material would have no access to the body's surface coordinates —
     it would be decoration ON the animal rather than skin, the exact thing waves 4–7 were
     built to stop.
  2. **Route procedural through owned body plans.** The alien families become real
     `Tube`-based bodies like the Earth painters, and inherit every material for free. Best
     result, largest change, and it retires a chunk of the verbatim engine — which is a Phase
     6 decision, not an art decision.
  3. **Leave it.** Accept that aliens read flatter than Earth species.

⚠ This is the same decision as the art upgrade, arriving from the other side: the verbatim
engine is exactly where "generated" and "authored" meet. Worth settling together.