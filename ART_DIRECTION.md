# Celestial Frontier — Master Art Direction

**STATUS:** Everything before the 2026-08-09 GP7 addendum describes the legacy `main.js` / v1.8.9 art contract, last verified against that source on 2026-07-24. The current `port/v2` Arc 1A art/resource overlay matches code as of 2026-08-20 and appears immediately below; the GP7 addendum preserves the earlier executed reset history. ⚠ §6.1 RE-corrected 2026-07-31 (twice in one day): the `BIOME_ATLAS.md` catalog it cites **does exist** and always did — at `tools/BIOME_ATLAS.md`, tracked since 2026-07-21. An earlier correction the same day declared it non-existent after checking only the repo root. It has now been audited against v1.8.9 and promoted to the root as `BIOME_ATLAS.md`.
**The single source of truth for ALL organism, biome, vista, and color art.**
Consolidates every art-direction document + every decision from the 2026-07-20 art
session. When this and a source upload disagree, THIS file wins (it records the
decisions we actually made). Content catalogs (`BIOME_ATLAS.md` at the repo root, plus the
fauna/flora data-pack CSVs) remain the *content* source of truth; this is the *direction* source
of truth.

## 2026-08-20 v2 Arc 1A overlay — current implementation and remaining direction

**Current implementation:** `port/v2` keeps the deterministic 1,500-species Compendium read-only,
but its list is now virtualized: only the visible variable-height window, bounded overscan, and any
focus-pinned row are mounted. Compendium rows and the Planetside roster acquire identity-safe
`leaseThumb` ownership of true asynchronous 132px resources. A complete deterministic genome
snapshot keys each resource; concurrent consumers deduplicate, and stale queued work cancels on
release, filter replacement, row rebind, panel close, or final document teardown. At most one
serial dedicated module worker at a time owns the heavy deterministic painter import, 440px scratch
paint, 132px downsample, and PNG encoding. After app wiring, every default broker pump waits for one
rendering opportunity and then one later task before dispatch; the renderer still owns the broker,
protocol/lifecycle validation, leases, queues, cache publication, and DOM identity checks, with no
synchronous fallback. The worker runs
one job at a time and terminates after active work settles and its queue is empty; a later genuinely
new producer burst owns a fresh instance/import. A pump-generation token invalidates a callback
armed before bfcache suspension or disposal; resume schedules a fresh serviced turn. Device-class
cache, decoded-pixel, byte, queue, active-job, lease, bounded portrait-cache, and worker-lifecycle
caps/evidence are explicit.
The owned `(max-width: 700px)` media-query subscription immediately applies smaller phone limits,
trims both caches, and is removed on final loader disposal.
Only the selected specimen detail publishes an asynchronous 440px DOM source; Back/Close cancel its
owner and remove that source, while the bounded broker cache remains governed separately. A
producer error remains a stable owned error tile, releases cleanly, and the exact key recovers
through a fresh worker lease. Capability/import/protocol/worker failure terminates once and settles
the active plus queued owners exactly once instead of retrying a broken worker for every tile.

The phone and desktop resource path is implemented; the current producer is fail-closed pending a fresh ruler. Every
selected head must own exact-source local certification, and its corresponding PR test-merge CI
must be terminal green; this reference deliberately caches neither live outcome. Exact committed repair
`dea03913014bc58134ebb06ca5b36892210a7571` passes the full Glass
matrix; its following exact Compendium run `20260817150005919-93781-b6643ba7a6` is preserved as a
truthful 75/76 result solely red at `desktop/warm-plateau`. It proves neither a product leak nor a
clean plateau because the old sequence destructively trimmed the desktop cache before the warm
observation and measured refill, while its heap ruler omitted embedder/backing ownership. The
repaired seam observes full native warm-cache state before cap control; records used, embedder,
backing-store, and aggregate heap; proves stable unique keys plus unchanged job/disposal/worker
counters over the last three cycles of one retained window; replays raw capsules; and binds complete
measurement inputs plus the exact built owner-to-worker-to-painter graph. Da0's historical budget embeds
paired `20260820-arc1a-baseline3-21af3fa`, collected by `21af3fa2…` against legacy product
`3844701…`, and candidate2/3/4 from clean `21af3fa2…` product/collector source under producer
`291b794e…`; all share measurement authority `bb03a3af…` and exact Edge 151.0.4129.86.
Strict ceilings exceeded the three-run maxima; the baseline preserved four faults and breached 14
phone / 13 desktop fields. Commit `da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` locally certified
that exact ruler and passed its Chrome Smoke, full Glass, persona, root-layout, and preview gates.
PR run `32334254714`, attempt 1, nevertheless retained a no-retry phone Planetside
`product-unanswerable` red: the target missed 2,000 ms while the root heartbeat remained timely.
Source inspection identified zero-delay successor-pump starvation as the bounded repair hypothesis;
the partial CI report did not retain a worker phase. The serviced-turn/bfcache repair changes producer
authority to `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`. Clean seam commit
`f47cd381…` collected paired baseline4 against legacy product `3844701…`; independent one-attempt
candidate5/6/7 used `f47cd381…` product/collector source and bound producer `1c8200d7…`. All four
shared measurement authority `bb03a3af…` and exact Edge .86. All three candidates completed 78/78 outcomes
with zero retries. That historical `bb03a3af…` ruler placed strict ceilings above their replayed
maxima; the baseline retained four faults and breached 14 phone / 13 desktop fields. The frozen
shared-timer repair moves measurement authority to `f9710bdf…`. Exact paired baseline5 plus
candidate8/9/10 historically activated budget/test `8ffd0d8e…` / `121ab8cd…` for producer
`1c8200d7…`; each candidate was one-attempt/no-retry and replayed 78/78, all 40 ceilings exceeded
their maxima, and the four-fault baseline breached 14 / 13 fields. Those facts remain truthful only
for that exact producer.

Exact clean `c095500…` passed Compendium and one-attempt Smoke, then its first full Glass run preserved
one genuine compact-phone product red: Chrome 152, all 12 rows and 58/58 controls executed, zero
instrument failures/retries, and a 12.5px Survey/Planetside rectangle overlap. The bounded art-surface
repair keeps Survey at a 44px floor, Planetside at a 72px scrollable floor, and their existing 8px gap
by deriving the lower maximum from the shared bottom anchor. It does not alter portrait art, ownership,
or Glass predicates. The existing Planetside development-release bullet now names the result.
Built producer authority is `e59685b1…` (index `ca76da4c…`, owner
`assets/main-Ccq4RHJt.js` / `9260e359…`, worker/painter unchanged), so budget/test `70c40013…` /
`7e8f03d5…` are `calibration-required` pending baseline6/candidate11/12/13 and activation.
Baseline3 and candidate2/3/4 remain truthful inputs to the old `bb03a3af…` ruler; the candidate
runs bind old producer `291b794e…`, while the paired baseline does not carry a candidate producer
field. Every selected head must own exact-source local certification, and its
corresponding PR test-merge CI must be terminal green; this reference deliberately caches neither
live outcome.
The Arc-local Edge 151 authority still does **not** repin the global Gate-A Edge 150
browser. Calibration review PNGs do not satisfy the selected-head HUMAN row; a fresh phone/desktop
list, focus-pinned, and detail set still requires HUMAN review. Arc 1B
scene-resource ownership/disposal and live HD planet replacement remain open.

**What remains planned:** V2 has no Cargo, Shipyard, ship portrait, crafting, research, or
ship-upgrade presentation yet. Legacy v1.8.9 does have deterministic additive ship art in
`shipImage()`—the scout gains visible drive, array, extractor and scoop details—but that one base
silhouette is a reference, not proof that the v2 distinct-hull target is built.

Ship art is driven by one pure `ShipVisualState` projection shared with the reach ladder—art never
writes progression. Four chassis stages must pass the same two-second silhouette test as organisms:
**Scout / Chemical**, **Jump / Interstellar**, **Array / Survey Cruiser**, and
**Intergalactic / Frontier**. Built Auto-Extractor and Corona Scoop systems are legible hardpoints,
not extra chassis tiers. The legacy `ascCh` completion fallback must resolve to an honest veteran
refit state even when an old save has no drive item; it must not show a bare scout with full reach or
claim that a missing named system is installed. Shipyard may add one bounded Pixi preview for engine,
beacon and dish motion, but it pauses while hidden or under reduced motion and destroys its owned
textures, filters and particles on close. Dense inventory rows remain static DOM images.

The visual ladder respects player mastery: every stage first communicates the capability the player
earned, then adds craft and ornament. Optional systems remain recognizable without turning rarity
into power, hiding a mechanical requirement behind decoration, or making veterans re-earn access.
No blanket repaint of the 1,250 portraits is authorized by this arc; the existing scoped visual-review
rulers remain in force.

**Later experience surfaces, also planned rather than live:** the first complete journey must make
the next possibility visible before its rules are explained: an opportunity on a world, a finite
resource or companion lead, a Shipyard before/after state, and a farther destination that the new
capability reaches. A future optional Outpost/project layer uses the same grammar—one readable
purpose, finite inputs, a visible world/ship change and no background-maintenance treadmill. The
Expedition Chronicle/Museum is a player-curated display of receipt-backed discoveries, companions,
ship refits, missions and Guardian trophies; it is not a second event store, a rarity wall or a
retention dashboard. Human review must judge those surfaces at phone, desktop and sustained-use
scales: no automated art count can decide whether a build feels earned, a personal record feels
meaningful, or a dense history remains restful to read.

---

## 0. Source documents (Nick's uploads, all folded in here)

1. **Earth Bestiary Art-Direction Review (pages 1–12)** — first fauna critique.
2. **Unified Art-Direction Bible** (`01`) + **Fauna A–M** (`02`) + **Fauna N–Z** (`03`)
   + **Flora A–Z** (`04`) + **Procedural** (`05`) — the 5-file bible; per-entry
   {group, base rig, required anatomy, species cues, avoid, priority}.
3. **Head & Face Supplement** (`06`) — heads as a first-class identity system.
4. **Complete Art-Source Review & Fix Plan** — card-by-card review; the P0 wrong-class
   bindings + validation-gate idea.
5. **Deterministic Cosmic Color Atlas** — the "Color DNA" upgrade recorded in the existing biome catalog (§6.1).
6. **Procedural Organism Integration & Flora Addendum** — curated-ecosystem procedural.
7. **Flora Review & Recommendations** — botanical specificity second pass.
8. **Biome Vista Integration & Color Application** — vistas as living ecosystems.

Counts referenced: ~1046 fauna, 569 flora, 758 procedural traits, ~450 core biomes
(93 Earth + 315 non-Earth + 43 live implementations + additional).

---

## 1. Core principles (the north star)

- **2-second silhouette test.** Hide the label at thumbnail size: broad biological
  group readable in <2s; ≥3 named-organism identity traits; how it moves/grows/feeds;
  Earth-grounded vs procedurally alien.
- **Earth = real anatomy first.** May simplify muscle/joint/texture/exact color. May
  NOT remove: correct limb count, the defining head/bill/snout/shell/fin/wing/leaf/
  root, correct posture, the signature silhouette, or the sessile-vs-mobile difference.
- **Anatomy ≠ VFX.** A glow can't replace a missing organ.
- **One dominant visual idea.** Secondary traits support it; don't stack every effect.
- **Effect intensity scales with rarity** — but rarity affects UI/effects ONLY, never
  the physical body/planet color (corrected from the earlier "rarer = more saturated").
- **Plant stat is a SECONDARY layer** (pose/accent/aura), never replaces botany.
- **Keep the minimalist painterly style.** Accuracy comes from silhouette, head shape,
  appendage structure, and species anatomy — NOT from added realism or texture noise.
- **Style constants to preserve:** near-black navy card, warm serif headings, restrained
  colored halo, soft rim light, subtle ground shadow, limited controlled palette.

---

## 2. Decisions LOCKED this session

| Decision | Choice |
|---|---|
| **Earth fauna depth** | **Everything** (full per-species) — known, finite, scrutinized. |
| **Earth flora depth** | **Everything** (full per-species) — same reasoning. |
| **Procedural (fauna+flora)** | **Systematic**: body/growth families + hero + BIOME-INHERITED palette & physics. A *curated ecosystem*, never a random part-mixer. No per-individual tuning. |
| **Phase 4 (biome/color/vista)** | **IN** this build (v1.6), not deferred. |
| **Architecture** | Everything hangs off the **Biome Profile** (see §3). |
| **Execution of "everything"** | Marquee-first, then continue class-by-class to full coverage. Genuinely-similar real species (sparrows, small rodents) converge to correct-class + accurate color — that's fidelity to the reference, not a shortcut. |

**Determinism split (critical):** Earth-name-gated art (fauna rigs, flora rigs) and the
color atlas (pure lookup, render-only) are **fingerprint-safe → no re-pin**. The
**procedural rebuild changes procedural art, which IS the 50-probe fingerprint → it
needs a Nick-authorized baseline RE-PIN.** That is the ONLY hard gate remaining.

> **`P.hue` AUDIT RESULT (2026-07-20): RENDER-ONLY.** Every reader of `P.hue`/`seaHue`/
> `landHue`/`iceAmt`/`spotHue` is a rendering function (`surfaceColor`, `gasPalette`,
> `_hdDeckScene`, the sprite painter); NOTHING generative (`planetSpecies`, `realmBiome`,
> `classifyRealm`, `climateBand`, `planetDescriptor`) reads it. So the whole Phase-4 color
> rework is fingerprint-safe **as long as color resolves at render time and
> `planetParams`' RNG stream is left untouched** — confirming the split above.
>
> **v1.6 BUILT (2026-07-20):** `COLOR_ATLAS` (`resolveBodyPalette`/`resolveVistaTint`/
> `resolveMapDot`, pure lookup, physical hexes are swappable defaults for the authored
> atlas) · `BIOME_PROFILES` (§3, 43 live biomes, main.js ~694) · flora
> per-species differentiation (§5). Gated by `tools/{coloratlas,biomeprofile,render}-audit`.
> vista integration BUILT (`_hdVistaEco` in `hdVista`: biome-native flora+fauna rig
> silhouettes + atmosphere fx, driven by `BIOME_PROFILES[opts.wb]`, render-only).
> REMAINING: the procedural coherence rebuild — and per the DETERMINISM finding (the
> fingerprint pins `hdGenesFor` genes, not pixels), its DRAWING-layer improvements are
> **render-only → likely NO re-pin**; re-pin only if gene-layer coherence fields are added.
> Vista follow-ups: cut the repeated river motif; feed `colorDNAFor` into layer palettes.

> **★ v1.6 FINAL-REVIEW STATE (2026-07-20) — THE ART SYSTEM AS BUILT (all render-only, fp 50/50):**
> - **BOX-FIT** (`_fitBeast`/`_fitPlant` in the portrait painters): every organism is measured
>   (`_beastBBox`, getImageData) + rescaled to a per-FAMILY occupancy target (`_FIT` table,
>   review §6.1). Card = normalized readability. Fixes universal "too big / too small".
> - **VISTA REAL-SCALE** (`_vistaSizeScale`, size gene → 0.5–1.8×, multiplies each
>   `_hdPlaceBeast` scale): in-scene creatures scale by REAL size (whale looms, beetle a
>   speck) — the deliberate opposite of box-fit. Camo cut so the world's roster reads.
> - **FAUNA RIGS** (17 + legacy): all Earth species classify to a rig (`_earthArt` →
>   `_beastFamily`); marker work per Nick's reviews — cetacean heads (sperm block / beluga
>   melon / orca tall dorsal / dolphin rostrum), fusiform whales, shark torpedo, manta wings,
>   octopus asymmetric arms, Giant Conch spiral shell, coral colony masses (brain/staghorn/
>   table/fan/bubble), owl facial disc, walrus tusks, frog crouch, bison/moose front mass,
>   lion mane (FELINE-ONLY — the equine mane must NOT get the ruff, was the zebra bug),
>   kangaroo hopper, gorilla shoulders, chameleon compact-on-perch, fox bushy tail.
> - **FLORA**: `_earthFlora` classifier + `_hdPlantBare` forms (tree tforms weep/baobab/
>   acacia, conifer cforms spire/layered/bushy/dense/round/columnar, flower fforms, cactus
>   rosette, banana, corn cob, water-lily float, cattail, etc.).
> - **PROCEDURAL**: `_procFamily(G,seed)` (in `hdBeastBare`, render-only) routes non-Earth
>   genomes to coherent families (serpent/jelly/sessile-radial/ceph/insect/crust/fish-swimmer)
>   so the pool is real clade diversity, not one bead-chain. Land grazers keep the alien plan
>   body. `hdGenesFor` sets `R._earthName` ONLY for Earth genes (fingerprint-safe guard so
>   legacy Earth never mis-routes). Procedural flora growth families assigned in `hdPortraitFlora`.
> - **DETERMINISM**: ALL of the above is render-only. `R._earthName` guard is Earth-only, which
>   the procedural fingerprint probe never exercises → fp stays 50/50. NO re-pin used.
> - **PASS 3 CORRECTIONS (2026-07-21, render-only, fp 50/50):** BISON no longer double-humped —
>   the camelid dorsal-fat `hump` is now camel/dromedary/bactrian ONLY; bison/zebu carry a
>   WITHERS hump (drawing both read as "a camel with multiple bumps"). New `lowHead` flag
>   (bovines) drops head carriage off the hump; `heavyLeg` legs shortened (0.52→0.42) &
>   thickened (ungulate legW 0.030→0.044); withers hump made dominant + fore-shoulder mass so
>   fore-quarters out-bulk the rump. MOOSE antlers rebuilt as broad flat palmate blades w/ finger
>   tines (not branched) + overhanging bulbous muzzle + throat bell + big ears (all gated on
>   orn==='palmate' = moose-only). CHAMELEON: tightly coiled spiral prehensile tail, tall
>   backswept casque, zygodactyl grasping mittens on a perch, higher body arch — no longer a
>   generic lizard. WALRUS: `walr`(=tuskM)-gated LOW horizontal body (seals still rear up),
>   heavy fore-shoulder mass, clear planted fore flipper, broader muzzle + thicker long tusks.
>   CORAL: brain = rounded grooved MOUND (narrowed so box-fit stops flattening it), bubble =
>   full packed polyp cluster. CEPH: squid + cuttlefish rebuilt HORIZONTAL (torpedo/broad mantle
>   tail-left, fins, arms + 2 long feeding tentacles right); `giantC` flag → giant squid gets
>   much longer tentacles + bigger bulk; octopus arms thicker + unevenly spaced/varied-length.
> - **PASS 4 CATALOG-INTEGRITY (2026-07-21, render-only + Earth-only classifier, fp 50/50):**
>   the Full-Earth-catalog review found the real remaining risk was NAME->RIG ROUTING, not
>   morphology. Fixed all P0 wrong-class bugs: `\bboa\b` (Boar/Jerboa were snakes), `\basp\b`
>   (Wasp was a snake), `\bfly\b` (Flying Squirrel was an insect via "fly"), `\bhog\b`
>   (Hedgehog was an ungulate); +20 missing fish names (gar/bowfin/sculpin/mudskipper/
>   fangtooth/… were mammal-fallback quadrupeds) with `\bplaty\b`/`\bmolly\b` guards; generic
>   & aquatic insects (+ a !bat guard so "Insect-Eating Bat" reaches the bat rig); water
>   flea->crust; chiton->new sessile plated form; tardigrade->new arachnid water-bear form.
>   NEW `_rigBat` (mammalian torso + membrane on finger struts + ears + feet; fruit/micro
>   sub) replaces the legacy insect-like winged blob. Dragonfly/damselfly rig rebuilt (4
>   broad wings + segmented abdomen). CAMEL/TALL-HEAD CUTOFF fixed: ungulate head carriage
>   was drawn so high that long necks + tall horns clipped the 300px silhouette-canvas top
>   (box-fit can't recover a source clip) — lowered head/neck + trimmed tallest horns.
>   FLORA: Date Plum->fruit tree (was 'palm' via "date"), Water Hemlock->flower (was
>   'conifer' via "hemlock"). GATE: `tools/rig-audit.js` expected-class table now 170
>   sentinels covering every P0 name — build FAILS on any wrong-class regression.
> - **REMAINING (last art batch, all render-only):** deeper vista-painter integration
>   (coral-shallows reef treatment; bioluminescent/ember RIM light + contrast for jungle/
>   abyssal/ash fauna; stronger contact shadows/occlusion) · procedural WITHIN-clade variation
>   (feeding heads / foot types / propulsion, orientation clarity) · cedar/juniper organic
>   shaping · barrel-cactus-fruit form + source-vs-harvest-item decision.

---

## 3. The unifying architecture — the Biome Profile

Color, flora, fauna, procedural, and vistas are **one system**. Build a **Biome Profile
registry**: one record per biome —

```
BiomeProfile {
  colorDNA          // from the Cosmic Color Atlas (§6)
  nativeFloraFamilies   // which plant rigs grow here
  nativeFaunaFamilies   // which creature rigs live here
  proceduralPools       // biome-native generation pools
  niches            // canopy / ground / burrow / shore / flight / open-water / cavern / thermal / cloud
  weatherStates
  hazards
}
```

Everything then reads from it:
- **Vistas** compose a scene from the profile (color atlas paints every layer; flora
  masses + fauna silhouettes + a procedural cue fill fg/mid/bg).
- **Procedural gen** starts from the profile (planet → biome → chemistry → niche →
  family → anomaly), inheriting the biome's palette + physics.
- **Map dots & portraits** use the same Color DNA.

**Key synergy:** the vista occupancy layer REUSES the card rigs (`hdBeastBare` fauna,
`_hdPlantBare` flora) as tiny silhouettes → cross-view coherence for free.

---

## 4. FAUNA

### 4.1 Rig library — BUILT (17 rigs, in `hdBeastBare`, dispatched on `G.rig`, gated on `_earthName`)

`_rigBird` (raptor/owl/wader/waterfowl/songbird/ratite/penguin/parrot) · `_rigFish`
(bony/shark/ray/seahorse/puffer/bill/sunfish/angler/flat) · `_rigMarine` (whale/dolphin/
seal/sirenian) · `_rigInsect` · `_rigArachnid` · `_rigCrust` · `_rigSessile` (star/urchin/
cucumber/sponge/squirt/coral/anemone/bivalve) · `_rigPrimate` (ape/monkey/lemur) ·
`_rigJelly` · `_rigMammal` (feline/canid/ungulate/bear/rodent/mustelid/rabbit/marsupial/
hopper) · `_rigReptile` (lizard/croc/chameleon) · `_rigSerpent` (smooth, hood/viper/rattle)
· `_rigAmphibian` (frog/salamander/axolotl) · `_rigTurtle`. Elephant/rhino/giraffe keep distinct renders; winged (bat) stays on the legacy path.

**v1.6 additions (task D, 2026-07-20):**
- **`_rigGastropod`** (`G.rig==='gastropod'`) — creeping foot + eye-stalk tentacles + shell by `gshape`: coiled spiral (snail) / spire (conch/whelk) / low cone (limpet) / none (slug). Replaces the old legacy shelled-body path for snails.
- **`_rigCeph`** (`G.rig==='ceph'`) — the cephalopod SPLIT, by `cephk`: octopus (domed mantle + 8 arms) / squid (torpedo mantle + fins + 2 clubbed tentacles) / cuttlefish (broad finned mantle) / nautilus (coiled chambered shell + tentacle bunch). Replaces the single legacy `G.ceph` octopus.
- **`_rigSessile` coral architectures** — `G.coralA`: brain / staghorn / table / fan / bubble / branch.
- **`_rigMammal` cat sub-rigs** — `G.fsub`: heavy (lion/tiger) / speed (cheetah) / mountain (cougar, xlong tail) / lynx (bob tail + ear tufts). Feline body sharpened (deeper chest, thicker legs, fuller lion mane).
- **`_rigMarine` cetacean heads** — `G.headSquare` (sperm blunt forehead) / `G.melon` (beluga/pilot) / `G.dorsalTall` (orca).
- **BUGFIX:** the plan-based `shelled`/`tent`/`crys` body add-ons in `hdBeastBare` are now gated on `!G.rig` (they were double-drawing a stray dome/mantle on rigged species). Fingerprint-safe (procedural sets neither `rig` nor `ceph`).

### 4.2 Head system — BUILT (Head Supplement `06`)

Head-first order: body plan → head silhouette → muzzle/bill → eyes → ears → ornament →
neck merge. Family-distinct skulls/muzzles/ears; **antler ≠ horn ≠ ossicone ≠ hump**
(deer branched / moose palmate / bovid curved / ram spiral / okapi ossicone; camel
1-hump dromedary / 2-hump bactrian; bison hump; equine mane). Bird beaks, fish snouts/
rostra/cephalofoil, croc snouts, amphibian gills carry head cues from their rigs.

### 4.3 P0 — WRONG-CLASS BINDINGS (verified real, fix FIRST, ~1hr, fingerprint-safe)

| Label | Collision | Fix |
|---|---|---|
| Swallowtail | "swallow" (bird) | `swallow\b` + add to insect |
| Rhino Beetle | "rhino" (mammal) | guard rhino `!beetle` |
| Crown-of-Thorns | "crow" (bird) | `\bcrow\b` + add to sessile-star |
| Spider Monkey | "spider" (arachnid) | guard spider `!monkey` |
| Whelk | "elk" (ungulate) | `\belk\b` |
| Black Widow | none → mammal | add `widow` to arachnid |
| Blue Tang | none → mammal | add `\btang\b` to fish |
| Vervet | none → mammal | add to primate |
| Periwinkle | none → mammal | add to gastropod |
| Barnacle | routed to mobile crustacean | route to sessile cone |

*(Angelfish "lure" claim in the review is WRONG — ours renders as a normal fusiform
fish, no lure.)*

### 4.4 VALIDATION GATE (permanent battery check)

Promote `rig-audit.js` to a build gate: a `class → allowed-rig` table that FAILS the
build on any wrong binding (insect w/ 4 vertebrate legs, fish w/ paws, sessile that
walks, gastropod w/ a vertebrate neck…). Kills this bug class permanently.

### 4.5 MISSING rigs / sub-rigs to build

- **Gastropod** (foot + coiled shell + head tentacles, NO legs, no mammal neck) — snails
  currently use the legged "shelled" body.
- **Coral colony architectures** (brain mound-w/-grooves / staghorn branching / table
  plate / fan / bubble / elkhorn) — currently one tentacle-tube.
- **Cephalopod split** (octopus mantle+8 arms · squid torpedo+fins+8+2 · cuttlefish
  fin-skirt · nautilus coiled shell) — currently octopus template for all.
- **Cat sub-rigs** (heavy big-cat / speed cheetah / mountain snow-leopard / short-tail
  tufted lynx / small cat) — heads must change with sub-rig, not just color.
- **Cetacean head/dorsal differences** (orca tall fin+saddle · sperm square head ·
  beluga melon+no-dorsal · humpback long flippers · bottlenose rostrum · right-whale jaw).

### 4.6 Species-trait approach (the "everything" marathon)

Class-by-class, hero species first (the review's mandatory-3-traits table = the
checklist: moose/giraffe/lion/cheetah/polar-bear/flamingo/spoonbill/hammerhead/
manta/axolotl…), then the tail. Proof-sheet each class. Presentation polish (context
shadows fly/swim/sessile, scale cue, light edge/roughness material separation) last.

---

## 5. FLORA

### 5.1 Status: growth-form DONE → full per-species PENDING

Built: `_earthFlora(name)` classifier + `_hdPlantBare` form dispatch (tree/palm/conifer/
shrub/herb/flower/grass/cactus/fern/vine/seaweed/crop/root/moss/trap) + plant-stat
accent layer. Decision: take Earth flora to **full per-species**.

### 5.2 Required flora rig families (~20, Flora Review §6)

broad-canopy deciduous · columnar conifer · open-canopy savanna tree · swollen-trunk
tree · palm · round shrub · flowering shrub · vine/climber · reed/sedge/cattail · crop
grass · broadleaf herb · root crop · cactus column · cactus pad · succulent rosette ·
fern · moss/lichen mat · kelp/seaweed ribbon · floating aquatic pad · carnivorous trap.

### 5.3 Per-species botanical fixes (Flora Review §4)

**Trees:** willow droops (pendulous curtains) · redwood columnar trunk-dominant (not a
Christmas tree) · scots pine open tufted crown · douglas fir dense conical · blue spruce
compact · baobab swollen iconic trunk · acacia flat-topped savanna · oak heavy gnarled ·
birch slim/airy · olive twisted/irregular · fruit trees orchard-shaped w/ blossom/fruit.
**Flowers:** rose layered bloom+thorns · sunflower big disc+ray petals · tulip cup ·
orchid asymmetric exotic · lavender vertical spikes · daisy white petals+disc · iris
sword leaves. **Herbs:** basil round clusters · rosemary woody needles · mint opposite
leaves · sage gray broad leaves. **Crops:** wheat awned head · barley long awns · rice
drooping panicle · corn thick stalk+ear. **Roots:** carrot feathery top+orange root ·
ginger reed+rhizome. **Cactus:** saguaro trunk+arms · prickly pear stacked pads · aloe
radial rosette. **Aquatic/moss:** kelp ribbon blades · sea lettuce sheets · sargassum
bladders · cattail brown cigar head · duckweed floating mat · water lily/lotus floating
pad context · sphagnum bog mat · reindeer lichen branching coral-pale · spanish moss
draped strands · liverwort flat thalloid · horsetail jointed/segmented. **Vines:**
grape lobed leaves+clusters · ivy small leaves along stem · morning glory trumpet flowers.
**Carnivorous:** flytrap open jaws · pitcher tube+lip · sundew sticky glands.
**Harvest identity:** every plant should imply its harvest part (leaf/flower/fruit/seed/
root/sap/pod/stalk/frond/spore). **Stat language** (Vitality full/fleshy · Ferocity
thorned/serrated · Resilience woody/dense · Agility light/airy · Insight luminous/
patterned) stays a secondary layer, never replaces species identity.

---

## 6. BIOMES & COLOR (Phase 4)

### 6.1 Content: the biome catalog (43 live + 93 Earth + 315 non-Earth + additional)

> ✔ **`BIOME_ATLAS.md` EXISTS — see the repo root. RESOLVED 2026-07-31 during port Phase 0.**
>
> ⚠ **This block previously said the opposite, and that is the lesson worth keeping.** Earlier the
> same day it read *"`BIOME_ATLAS.md` DOES NOT EXIST — corrected 2026-07-31 … It never was,"* on the
> reasoning that a doc citing a document nobody has checked for manufactures confidence nothing
> supports. The reasoning was right; the check was not. It looked in the repo root only. The file
> had been sitting at **`tools/BIOME_ATLAS.md`**, tracked in git, since 2026-07-21 — 734 lines,
> 45 KB, generated 2026-07-20. **A correction written so that nothing lies introduced a new false
> statement, and it survived a day because nobody re-checked the correction either.**
>
> **What it contains, and the provenance split that matters:** §1 enumerates the 43 live biomes with
> signature colors — re-verified 2026-07-31 by extracting every `sig` from `BIOME_PROFILES` and
> diffing: 43 of 43 match exactly. §1.1 (added during the audit) is a source-generated per-biome
> catalog merging `BIOME_PROFILES` with `BIOME_SETS`. §§2–4 hold the **93 Earth + 315 non-Earth +
> Additional** design-pack content — which comes from uploaded CSVs and **cannot be regenerated from
> `main.js`**. That is why the file was worth recovering rather than rewriting, and it is also the
> source of the "93 + 315" figures quoted in §6.1's own heading: they are *design scope*, not
> shipped content. Do not cite them as source facts.
>
> **The rest of the split still stands:** biome *rules* live in WORLD_GENERATION.md §3
> (`biomeFor`, `biomeForLanding`, `BIOME_SETS`); the *visual* contract is §3 of this file (the Biome
> Profile) plus §7 (vistas); the *content catalog* is BIOME_ATLAS.md. `validate` reports
> *"43 live biomes, all covered; sigs + families valid"*, gated by `tools/biome-audit.js`.

### 6.2 Color: the Deterministic Cosmic Color Atlas = color-resolution source of truth

- **Color DNA, not one hex.** A planet resolves from FIXED LOOKUP TABLES keyed by
  physical props: host-star class, atmosphere/cloud chemistry, surface material, liquid,
  ice, biosphere pigment, biome coverage, weather, artificial, rarity(UI only).
- **Physical color ≠ theme color** (two fields). Fire theme ≠ orange base. Acid ≠ auto
  neon-green. Sulfuric-acid clouds read cream from orbit.
- **Rarity → UI/effects ONLY** (border/ring/halo/particles), never the physical body.
- **Stars follow temperature** (red-orange → warm-white → white → blue-white). No
  green/purple/rainbow main-sequence stars.
- **Gas giants from cloud chemistry**, not hydrogen. **Multi-biome = coverage-weighted
  blend** (not first-listed biome). Mix in linear-RGB / OKLCH, not naive sRGB average.
- Ready-made hex libraries: stars §6, atmospheres §9, cloud condensates §9.3, surfaces
  §10, liquids §11, biosphere pigments §12, revised multi-hex live-biome palettes §13,
  Earth-family §14, theme accents §16.
- **Build as `COLOR_ATLAS`**: pure deterministic lookup functions (`resolveBodyPalette`,
  `resolveVistaTint`, `resolveMapDot`). Deterministic BY CONSTRUCTION (no `mulberry32`
  in the color path).
- **Map-dot:** segmented (center=orbit_primary · lower-left=surface/liquid · upper-right=
  atmosphere/cloud · outer ring=body class · notch=habitability · thin glow=rarity UI).
- **⚠ Audit first:** is `P.hue` render-only (→ fingerprint-safe) or does it seed gen
  (→ re-pin)? Determines whether Phase 4 color is free.

---

## 7. VISTAS — living ecosystems (Biome Vista Integration)

Current vistas read as beautiful-but-sparse backdrops. Fix = **ecological occupancy**.

- **Assembly stack:** sky/star-light → atmosphere/haze → far terrain → midground terrain
  identity → biome-defining flora masses → fauna silhouettes → procedural/anomaly cue →
  gameplay-readable foreground.
- **5 ecology layers per landing:** A atmosphere · B geology · C flora identity · D fauna
  identity · E procedural extension.
- **Density (curated, not clutter):** 2–4 flora families + 1–3 fauna cues + 0–2 procedural
  per scene, across fg/mid/bg scale tiers.
- **Color on ALL layers** (sky/atmosphere/terrain/water/flora/accent/hazard), not a full-
  screen multiply. Tint max: Earth-like 5–12% · unusual atmosphere 10–20% · extreme
  elemental 15–30% · anomalous/void/prismatic 20–35%. Palette usage ~60–70% primary /
  20–30% secondary / 5–10% accent / 0–5% emissive.
- **Cut the repeated white river/path motif** (it's in nearly every terran scene). Add
  biome-specific fg anchors (rock/crystal/driftwood/geyser/fungal cap/lava shelf) +
  atmosphere fx (marsh mist, salt shimmer, ash, cryo steam, acid halo, abyssal beams).
- **Physics respected:** NO terrestrial trees/walking animals on gas giants — floating/
  sail/gasbag life only. Venus reads cream/tan/sulfur, not green. Lava life at margins.
- **Per-biome "assembly kit" + "native ecosystem sheet"**: canonical flora families,
  fauna families, procedural families, accent palette, weather + hazard states.
- **REUSE the card rigs** as vista silhouettes → cross-view coherence.

### 7.1 v1.7 vista/material art (2026-07-23)

- **Seeded river courses** (`rvQ`); roads pick the **opposite bank** from the river mouth
  (`_rivMouthX`).
- **Titan contact skirt** grounding the titan into the terrain; **at-sea titans get a
  mirrored reflection**.
- **Space-era skyline haze skirt** — the skyline is seated into the ridge, not floating.
- **Fauna ground-leveling** — the sprite's true lowest opaque row is measured in
  `hdBeastBare` so creatures stand on the ground, not hover above it.
- **`_MAT_ART`** — bespoke per-material icon registry (all 47 materials), superseding the
  old 4-archetype recolor.
- **`partIcon`** — tier-dress + function-emblem motifs for crafted parts.
- **`shipImage` / `paperdollAvatar`** — 2x backing store for crispness.
- **Star thumbnails** — MAG (field loops), PROTO (dusty disk + jets), and swollen RG/SG
  giants.
- **GAS BIOMES ARE ALIVE** — `_hdDeckScene` now paints a gas giant's real aerial ecosystem:
  floating cloud-gardens (its `af` flora via `_hdPlantBare`), gas-bladder colonies +
  aeroplankton, and its real AIR CREATURES as flying silhouettes drawn from `hdBeastBare`
  (same genome as their Compendium portrait). `openLandingVista` threads `airGenes` /
  `aerFlora` through `xtra` → `showVistaBox` → `_hdDeckScene`. Gated on **any aerial life**
  (was gated on the ~always-zero macrofauna air-count, so gas giants looked lifeless).
- **VISTA FLORA = THE REAL SPECIES** — extracted `_floraSpx(g)` + `hdFloraBare(g,seed)` (the
  flora parallel to `hdBeastBare`) out of `hdPortraitFlora` (byte-identical refactor). The
  vista's plant canvases are now the world's ACTUAL terrestrial flora species when it carries
  flora genes (a desert draws its cacti, a jungle its broadleaves, a meadow its ferns) — the
  same art as their Compendium page. Flora-less worlds keep the tuned generic dressing
  (fallback). Coherence: the plant on the planet is the one in your Compendium, matching how
  creatures already share `hdBeastBare` across portrait/card/vista.
  **2026-07-25 ROOT-CAUSE FIX (Gold review Gate 1 — "desert CACTI panel draws ferns"):** the
  promise above was silently broken from day one — `floraGenes` mapped the genomes through
  `hdGenesFor`, which is the FAUNA phenotype resolver; its return carries no `.form`/`.color`/
  `.seed`, so `_floraSpx` defaulted every field and EVERY vista plant rendered as `FAM[0]`
  (fern) in default colors. Fixed: the vista receives RAW flora genomes (`hdFloraBare`/
  `_floraSpx` read the genome directly — same contract as `hdPortraitFlora`); the identical
  wrong wrap was removed from `tools/sheets/floravista.js`, whose forced-cactus audit had been
  masking its own test. RULE: `hdGenesFor` output feeds `hdBeastBare` ONLY; flora painters take
  the raw genome.
- **THE LANDING ROLL (vista side)** — the touch-down REGION is rolled per landing and the
  vista's fauna are picked to MATCH it: species whose rig family belongs in the rolled biome
  (BIOME_SETS fauna list), seeded-shuffled per landing so repeat descents meet different
  locals. A terran world whose roll came up a SEA region shows the shore/sea scene. (Generation
  side of the roll: WORLD_GENERATION.md `biomeForLanding`.)
- **RIVERS ON SETTLED WORLDS** — on iron/town worlds (the only ones with roads) the seeded
  river now keeps to its OWN bank the whole way down (spring pulled to the mouth side,
  meanders damped, bowing outward only) so it never crosses the road or the field quads; wild
  worlds keep full meander freedom.

---

## 8. PROCEDURAL — curated ecosystem, not a part-mixer (⚠ RE-PIN gated)

Current: procedural fauna = 2 base outcomes (beaded quadruped / beaded swimmer);
procedural flora = one canopy-tree, palette-swapped. The fix:

- **Generation order:** planet class → biome → chemistry/atmosphere → habitat niche →
  base body family → movement/growth family → surface/tissue → head/reproductive
  structure → accent → behavior/rarity/anomaly. Violating the order = arbitrary.
- **More flora families** (Addendum §4): arboreal (canopy/columnar/umbrella/crystal/
  bulbous/floating/candelabra) · shrub-colony · vertical (reed/spire/lantern/whip/cane/
  mineral-stalk) · ground-mat (moss/lichen/pad/thorn-cushion/vine-net/root-lattice) ·
  water-buoyancy (float-pad/raft/bladder/ribbon-kelp/cloud-kelp/gas-sac) · hazard-anomaly
  (flame-frond/frost-fern/acid-bladder/prism-frill/void-filament/lumen-tree).
- **More fauna archetypes** (§5.1) beyond quad/fish/bug — the full ecological body set.
- **Biome inheritance is rule #1:** body color from biome+ecology; accent expresses
  role/danger/bloom/toxin/anomaly; emissive sparse; **rare ≠ rainbow**. Palette stack:
  biome-primary → biome-secondary → ecological material → species accent → rarity/anomaly.
- **Biome adaptation** (geode→crystal plates+cave eyes · marsh→long legs+broad feet ·
  desert→heat-dissipating+pale · acid→float sacs+droplet membrane · lava→heat shield+
  obsidian scales+ember seams · cryo→compact insulation · abyssal→pressure+sparse lumens).
- **Anomaly sparse & additive**, applied only after core ecology is valid.
- **Generator fields** to add — flora: `flora_family, growth_habit, habitat_niche,
  harvest_part, surface_material, reproductive_structure, biome_palette_family,
  accent_function, anomaly_flag`; fauna: `body_family, limb_family, head_family,
  surface_covering, diet_type, movement_type, habitat_niche, biome_palette_family,
  defense_feature, anomaly_flag`. Build **biome-native preset pools** so gen starts from
  a local rule set, not the universal library.
- Goal: *"every generated organism should look surprising, but inevitable for its world."*

---

## 9. DETERMINISM RULES (hard constraints)

- **Never break determinism.** All world/genome/descriptor content derives from seeds
  (`mulberry32`, `hashInt`, `cellRng`). No `Math.random`/`Date.now` in domain modules.
- **Art is NOT fingerprinted** — canvas rendering isn't in the 50-probe fingerprint. So
  Earth-name-gated organism art + the color-atlas lookup (if render-only) are FREE.
- **Procedural (un-named) art IS the fingerprint.** Changing it → Nick-authorized
  baseline re-pin (single-key only, prove other probes byte-identical, inline note).
- **`P.hue` audit** decides if Phase-4 planet color is render-only (free) or seeds gen (re-pin).
- **GOTCHA:** never write `\b` in a `node -e` JS string literal — JS turns it into 0x08
  BACKSPACE = silently dead regex. Edit regexes with the Edit tool, or convert via an
  explicit char-code map (`[...s].map(c=>c.charCodeAt(0)===8?"\\b":c)`).
- After every edit batch: `node tools/validate.js` must stay **FINGERPRINT 50/50**.

---

## 10. BUILD ORDER & STATUS

**DONE this session (all fingerprint-safe, 50/50 held):** 15 fauna rigs + family-distinct
heads · flora growth-form rebuild + plant-stat · the biome catalog (§6.1; now at the repo root) · full proof-sheet set
(fauna per-type, flora Earth+procedural, all vistas) · classifier collision hardening.

**PENDING, in order:**
1. **P0 wrong-class fixes + validation gate** (§4.3–4.4) — ~1hr, unblocks fauna.
2. **Missing fauna rigs** (§4.5: gastropod, coral architectures, cephalopod split, cat
   sub-rigs, cetacean heads).
3. **`COLOR_ATLAS` module + `P.hue` audit** (§6) — the deterministic color foundation.
4. **Biome Profile registry** (§3) — the connective tissue.
5. Then in sequence: **Earth fauna "everything"** (§4.6) · **Earth flora full per-species**
   (§5) · **vista ecosystem integration** (§7, reuses rigs) · **procedural curated
   rebuild** (§8) — the last one on Nick's **re-pin go-ahead**.
6. **Phase 8**: copy/de-dash + full QA battery + 6k beta + deploy v1.6, once art is locked.

---

## 11. KEY CODE MAP (line #s drift; function names stable)

- **Classifiers:** `_earthArt(name)` ~L4378 (fauna → rig+dials; keyword branches, ORDER
  matters, use `\b` boundaries) · merged into genome in `hdGenesFor` ~L4451 at the
  `if(g._earthName){…Object.assign(R,rec)}` gate · `_earthFlora(name)` ~L5740 (flora → form).
- **Fauna rigs:** `hdBeastBare` ~L5243; `if(G.rig==='…')` dispatch chain; the 15
  `_rig*` functions (see §4.1) each return `{hp,hips,shoulders,feetMax,noEye}`.
- **Flora:** `_hdPlantBare(seed,sp)` ~L5488 (dispatches on `sp.form`); `hdPortraitFlora`
  ~L5763 injects `_earthFlora` + plant-stat accent.
- **Biomes/vistas:** `BIOME_SETS` ~L10763 (43 live biomes × 8 types; corrected 2026-07-31 from a stale ~L7477) · `BIOME_PROFILES` ~L694 · `hdVista(opts)`
  ~L6260 (960×430 surface scene) · `_hdDeckScene` (gas giant) · `_hdAbyssScene` (deep).
- **Tools (`scratchpad/` + `tools/`):** `classify-audit.js`, `rig-audit.js` (→ the gate),
  `shot-cat.js "Name,…" LABEL out.png`, `shot-flora.js`, `shot-proc.js`, `shot-proc-flora.js`,
  `shot-vista.js "types" LABEL out.png`, `shot-bestiary.js`, `build-biome-atlas.js`.
  Output → `tools/uisheets/`.
- **Battery:** `node tools/validate.js` (build + fingerprint 50/50) · `smoke.js` ·
  `systems-check.js` · `balance-sim.js` · `uilayout.js`.

---

*This file is the standing art spec. Update it as decisions change; prune per-section
"pending" items as each ships. Prune the whole build-order/status once v1.6 deploys.*

## 2026-07-24 additions (v1.7 universe-crispness + catalog polish — verified in main.js)
- **Planets**: noise-edged polar caps (sea-ice vs land-snow, real iceAmt weight, narrow
  ramp), atmospheric LIMB HAZE on airy types (kills ortho streaks), HD masters for the
  focused world (768 phone / 1024 desktop; 512 default), coastline variety (beach/
  wetland/cliff by shore noise), seeded cloud WIND (fronts stretch along the flow),
  DRIFTING upper cloud deck (own noise stream, motion-gated), gas VORTEX storms,
  venus layered circulation + vortices. Ring shadows both ways (planet↔rings), ring
  2nd gap ~1/3 seeds + particle grain, 512 ring masters.
- **Stars**: _starSurf granulated surfaces inside the corona when zoomed (per-class:
  B/A tight granules, M/K mottled + flare arcs, RG/SG huge cells + limb prominences,
  WD near-smooth); binaries/trinaries included; heat-gated by on-screen size.
- **Moons**: 160px HD close masters (non-overlapping rejection-sampled craters, bowl
  shading to the light, soft rims, terrain mottling; icy frost, volcanic elbow-fissures
  + caldera glows); far 28px masters kept; moons −10% (pick floor intact).
- **Deep space**: baked cinematic BLACK HOLE (Doppler disc, horizon-hugging lensed halo,
  photon ring, turbulence streaks, star-smear lensing, feathered horizon); QUASAR
  tapered/knotted asymmetric plasma jets + disc hint; WORMHOLE 192; NEBULAE 256 with
  multi-scale structure (dust lanes, newborn clusters, illuminating star, shock shell +
  filaments, carved cavities). Galaxy masters stay 512 BY DESIGN (cache memory; the zoom
  transition hands off to vector-sharp live rendering).
- **Earth catalog — RECIPE-AUTHORITATIVE PELTS** (the one-by-one pass, in progress):
  only species whose _earthArt recipe declares stripes/mottle wear them; stray pattern
  GENES are muted on Earth species; thresholded marks at real frequencies (narrow
  stripe bands ~30%, rosette cells ~25%) over a CLEAN recipe base (dark wash 0.26→0.08).
  _earthBlend children keep parental pelt MARKS in their own colors (breeding cohesion).
  Procedural aliens keep soft gene-driven hides. WINGED plans 7/14: wings dominate,
  airborne tucks to 2-leg flight stance, grounded keeps limbs.
- **Lighting verified**: baked light re-aims at the star per frame; star-tinted lit
  overlay; terminator sweeps with orbit; city lights night-side only.

## 2026-07-25 GOLD MASTER verdicts (Part II of `GOLD_MASTER_2026-07-25.md` — the program of record)

Nick's compiled Gold assessment of the 52-sheet CF-v17-COMPLETE-REVIEW package. **Decision:
Near-Gold, hold for one focused correction pass** — accepted, with two proof-sheet pushbacks.

**APPROVED AS GOLD (do not reopen):** procedural-creature architecture + soft-mass blending +
materials/finishes + aquatic conversion + body plans · large-planet direction · black-hole and
quasar direction · gas-deck vistas. This is the first external GOLD on the creature renderer.

**GOLD BLOCKERS (wave 1):**
1. **Flora canopy union** — the #1 blocker, both Earth and procedural flora. Adopted pipeline
   (review's, verbatim): control lobes → offscreen mono mask → overlap union → blur/expand →
   threshold to ONE continuous silhouette → low-freq seeded edge distortion → unified gradient
   fill → internal shadow pockets/branch gaps → species crown rule. Acceptance: at 100%/200%
   the construction circles must not be individually visible. Lifts all 334 flora + every
   canopy-heavy vista at once (matches our SOFT-MASS queue item #1).
2. **Earth-flora identity organs wave 2** — kill the repeated templates (straight-stem+leaves,
   dot-vine, circle shrub, generic fruit tree, repeated crop stalk, same kelp blade, same
   root-crop top). Every named plant gets a readable identity organ (R2 continuation).
3. ~~liveview ring seam~~ — **PUSHBACK: sheet defect.** The game renders rear-half → planet →
   front-half + BOTH ring shadows (927e41b); the liveview MOCK uses a crude rect clip with no
   shadow passes (tools/sheets/liveview.js). Fix = rebuild the sheet's ringed giant on the real
   draw grammar so reviews stop re-flagging it (2nd review to trip on this).
4. ~~deepspace heading overlap~~ — **sheet cosmetic**: the BH label (~600px at 12px mono)
   overruns the wormhole column at x=520. Shorten/stack labels; also add a TRUE RELATIVE SCALE
   star row (equal-size cells keep hiding the in-game class scaling — 2nd re-flag).

**HIGH PRIORITY (wave 2):** selective fauna identity pass — frogs (dart warning patches, glass
transparency, tree toe-pads, bullfrog bulk), bird sub-rigs (raptor/parrot/waterfowl/wader/
perching/seabird/flightless/hummingbird; eagle hook+talons, puffin bill, swan neck), ungulate
horn anchors (kudu spiral, impala lyre, gerenuk neck, pronghorn, warthog/boar/peccary), small
mammals (pika ≠ ungulate, meerkat upright, sloth hang, red-panda mask+rings), turtle feet
(splayed, rooted under shell edge, non-circular) · R4 spike/fur polish (vary spacing/length,
group anatomically, blend roots, curve feathers; sharp triangles ONLY for hard materials;
organic organs inside translucents) · moon geology (directional crater light, shadowed inner
walls, asymmetric ejecta, broken rims, scale hierarchy; icy branching fractures; volcanic dark
basalt/calderas/ash; dedicated SMALL-SIZE masters so distant moons keep one readable feature) ·
wormhole throat depth + molecular-cloud punch (star occlusion, rim light, protostar hints) ·
open-sea landing variation (horizon/waves/islands/clouds/fauna depth/lighting/weather per salt).

**POLISH (wave 3):** break coast halos into shore types · cloud fronts/broken fields/storm
shadows · class-specific star surface behavior + white-dwarf density · 4-wing vs 2-wing
silhouettes · then ONE full regression proof set → Gold retest checklist (§10 of the review).

**2026-07-25 vista gene-plumbing review fixes**: the sub-surface scenes never received the world's
own life in the LIVE game — `_hdAbyssScene` was called without `genes` (the proof sheets passed
them, masking the gap: certs showed populated abysses the game could not render) and `_hdReefScene`
received the LAND herd (land beasts painted swimming while the world's real fish stayed invisible).
`openLandingVista` now builds `xtra.aquaGenes` (aqua-classed fauna through `hdGenesFor`) and both
scenes consume it. `aerFloraG` also de-wrapped from `hdGenesFor` (raw genomes — same contract as
`floraGenes`). And `_vistaSalt` now advances a session `_descSeq` per descent: the old
`stats.landings` term only moved on a world's FIRST landing, so the per-landing region re-roll
never fired on the exact flow it was built for (re-landing the same world). LESSON: audit the GAME
call site, not just the proof sheet — a sheet that passes the parameter the game omits certifies
art the player never sees.

## 2026-07-30 WHEN art is generated is an art-direction constraint (v1.8.5)

*Scope note: the top-of-file `matches code as of 2026-07-24` marker stands — this addendum was
verified against the art **scheduling** path only, not re-verified against every generator.*

Painterly masters are expensive on purpose, and this file has always governed *what* they look
like. v1.8.5 established that **when** they are synthesised is also a direction constraint, because
it can cost the player the only control on screen:

- A brand-new expedition queued one HD upgrade **per body** in Sol plus the galaxy face — each a
  300–800ms main-thread block (`n2` → `fbm` → `renderPlanetSprite` / `makeGalaxySprite`) — entirely
  **behind the full-screen naming modal**. On a 4×-throttled phone the naming screen was painted at
  393ms and could not answer a tap until **6440ms**.
- **THE LAW:** HD synthesis yields to any blocking full-screen surface. `_hdLater()` re-polls while
  `_introUp()`. Full statement and measurements in UI_PRESENTATION.md § *THE ART-HOLD LAW*.
- **This does not weaken the art.** Nothing about the masters changed — the low-res placeholder was
  already the house pattern, and the HD upgrade still lands, just not while the player is locked out.
  Determinism is untouched because sprites derive from seeds, never from when they are drawn
  (DETERMINISM.md § *WHEN art is drawn is not fingerprint input*); fingerprint stayed MATCH 50/50.

**Carry this into the v2.0 port rubric.** The 1.9MB inline script already costs ~2s of V8 compile at
4× throttle, and PixiJS texture uploads are the same class of cost as canvas noise loops: budget art
generation against *time-to-answerable*, not against frame rate alone. A texture the player is
waiting behind is worse than a texture that arrives a frame late. `tools/bootperf.js` is the
instrument, and its `--assert` mode should survive the port.

---

## 2026-08-09 GP7 execution addendum — current `port/v2` state

This addendum is the current execution record for the port; it does not retroactively rewrite
the legacy `main.js` status above.

> **2026-08-09 status correction — GP7 is a frozen baseline, not the current
> literal certification.** PR #7 merged into `develop` at `52467ba`. Nick's
> strict-conformity recheck opened GP7.1 remediation: make only named,
> evidence-backed morphology repairs, then re-render and freshly rejudge the
> full catalogue. Its first all-fresh baseline is now 1,250 current portraits /
> 196 hash-bound packets = 318 FAIL / 301 POLISH / 631 PASS; it is a repair
> input, not a certification. A second named repair pass has produced a new r3
> 1,250-portrait / 196-packet evidence capture, but it is deliberately
> unjudged. The ledger itself cannot certify pixels; see
> `port/v2/reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md`.

- **Current coverage is exactly 1,250 organisms:** 631 Earth fauna, 332 Earth flora,
  27 fungi, 20 microbes, and 240 procedural identities, all exportable as native 440×440 art.
- **Nick's independent full-catalogue audit** found **381 GOLD / 810 POLISH / 59 FIX** and
  called the build a Gold Candidate. All 59 FIX rows were addressed. His patch review then
  returned **15 PASS / 25 PASS-WITH-POLISH / 19 STILL-FIX / 1 REGRESSION**; the 20 remaining
  rows were reworked with targeted, render-verified changes.
- **GP7 is frozen as evidence; GP7.1 permits named repairs only, never a global body pass.** GP7 judged 503 changed rows and 62 unchanged
  controls with the same strict ruler. Eligible-row demotions were **62/160 (38.8%)** for the
  edited drift set versus **21/32 (65.6%)** for control, a **−26.8-point** net demotion gap;
  rescues were **104/343 (30.3%)** versus **4/30 (13.3%)**. This calibration is the evidence
  for targeted progress. The carried 1,250-row band merge mixes rulers and is not a catalogue score.
- **Procedural correction closed at 57/57 PASS** in the GP7 drift set. Morphology work stayed
  pair-specific: honest colour exposed 9 hard look-alike pairs, shape axes reduced that to 2,
  and the Wild Thyme/Mite corrections brought the final **hard-pair count to 0**. The broader
  confusable list remains a watch-list; zero hard pairs does not mean zero visual similarity.
- GP7 measurement and the complete-catalogue package remain preserved as historical evidence.
  PR #7 is merged; the GP7.1 remediation/evidence batch may use a new
  `openai/windows` to `develop` draft PR, but it remains unmergeable until the
  fresh full-catalogue evidence package and certification exist.

## 2026-08-10 full-catalogue reset — current authority

Nick reopened the full 1,250-organism review after Fruit Bat exposed a false
acceptance. The GP7 execution addendum above is retained as history, but its
bands are not a current score or certification. The live ruler, root-cause
record, and procedure are in
`port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`.

Foundation defects were corrected before restarting judgement: bred
`_earthBlend` genomes store the selected Earth parent's set-qualified owner;
fauna reaches the inherited HD scaffold while flora/fungi/microbe use the exact
named owner; caches use the full deterministic genome state (not seed alone);
and review references are keyed by catalogue set plus species so cross-kingdom
duplicate names cannot receive the wrong contract. `npm run hybridcheck` guards
the final browser route/cache outcome across every kingdom and injected failures.

The art direction is now explicitly anatomical and topological: silhouette and
proportion first; connected skeleton/growth structure second; continuous
membrane, skin, fur, bark, or tissue over that structure; shared light,
occlusion, outline weight, and material response last. Horns, tusks, wings,
tails, flowers, fruit, roots, and hybrid traits must grow from the organism,
never read as stickers or paper pieces. PixiJS may improve resolution,
filtering, compositing, and animation only after the deterministic Canvas2D
source geometry reads correctly; a texture upload cannot repair bad anatomy.

The first negative-control family is now frozen under that ruler. Refine2d
remained four-for-four FAIL because jointed digit/thumb/foot/rear-membrane reads
did not survive delivery size. Independent refine3 review returned PASS for Bat,
Fruit Bat, Insect-Eating Bat and Vampire Bat at native 440px, unlabeled gameplay
300px and actual unlabeled 132px, with exact repeat hashes and unchanged nearby
controls. This is a four-row family result only; the durable record is
`port/v2/reference/BAT_FAMILY_RESET_REVIEW_2026-08-10.md`.

The clean reset r1 review is now frozen at commit `bc26e8`. Its official 181
families / 233 packets bind all 1,250 exact identities to 440px, unlabeled 300px,
actual unlabeled 132px, labelled old/current, and exact set-specific `mustRead`
or procedural-plan hashes. The complete fresh result is **516 PASS / 14 POLISH /
720 FAIL** and is not certification-eligible. No final all-PASS collection or
certification ZIP exists.

Nick's 2026-08-10 request for a full current-generation ZIP is fulfilled as a
separate review handoff from clean evidence commit `79ce144`: 1,250 current
native portraits, 196 catalogue strips, 466 official layout sheets, and 234
representative hybrid assets, for exactly 2,146 PNGs. The 472,304,848-byte ZIP
has SHA-256 `18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5`
and is explicitly `CURRENT-ONLY / UNREVIEWED / NOT CERTIFIED`. It carries no
verdicts, cannot substitute for the absent Wave 2e pre-edit baseline, and is not
the final all-PASS certification ZIP.

The independent Platinum review of that exact archive is now the governing
current-generation repair input. It is preserved verbatim at
`port/v2/reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md`
(SHA-256 `5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2`).
It did **not** certify Platinum. Sugar Glider and Flying Squirrel require distinct
whole-form glider anatomy; Colugo requires a limited topology polish; five fauna
hybrid rows fail on scaffold replacement, Chameleon remains HOLD, Elephant needs
polish, and three non-fauna rows need stronger progressive drift. Sea Turtle,
Great White Shark, the four reviewed bats, Flying Fish and Flying Gurnard remain
protected. The old archive and its verdict stay sealed rather than being rewritten.

The bounded repair contract is lineage-specific, not a new global body pass. Seven
named reviewed fauna lineages (Fruit Bat, Eagle, Wolf, Elephant, Chameleon,
Dragonfly and Octopus) use their modern whole-form owner for bred stages; Sea
Turtle and Great White Shark remain on the frozen compatibility route. Apple,
Vanilla Orchid, Oyster Mushroom and principal microbe Amoeba use anchor-aware bred
branches with their pure named form protected. Hybrid schema v4 expands the matrix
to 13×5 /251 assets and exact-controls both the migrated and frozen fauna routes.
Clean source `03ea297` supplied the 2,163-PNG successor. Its exact external review,
preserved as `Celestial_Frontier_Current_Platinum_Repair_All_Pass_Review_2026-08-11.md`
at SHA-256 `1c6c49e74270e9c69800de5b10b031aacf73a7a30937350086e97bc712823b3f`,
returns **PASS with optional polish only / APPROVE**. The sealed archive retains its
generated UNREVIEWED preparation fields, and this bounded judgment is not the formal
1,250-row certification ledger.

Hybrid route/cache ownership is technically correct, and the prior focused
Apple and Vanilla continuity blockers were independently closed under the earlier
bounded ruler; the Platinum review supersedes that result for whole-matrix scope. Vanilla r6
passes at `floraoverrides2.ts` SHA-256
`5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`:
its pure portrait is byte-exact, all five stages remain recognizably Vanilla,
their joins are continuous, and child-genome drift increases meaningfully as the
anchor falls. The r6 root validates 234/234 assets and both browser orders.
`hybridcheck` binds five exact ID+kingdom+name focused lineages across all four kingdoms and rejects
fourteen injected negative controls, including focused-species substitution, Vanilla stage collapse and protected-route controls. The earlier
dirty matrices and prior `FAIL_BYTE_IDENTICAL_STAGES` result are diagnostic
history. This focused PASS is not a claim that every possible bloodline or the
full catalogue is certified. The graphics upgrade remains staged: correct
anatomy and lineage continuity, then a resolution-aware portrait seam, then a
bounded Pixi living preview, then any later mesh/skeletal production pipeline.

## 2026-08-10 reset Wave 1 — 177 scoped targets independently PASS

Wave 1 is bounded to **177 r1 non-PASS identities**: root 38 (2 fungi + 8
microbes + 28 procedural), fish 59, trees 48, and fauna2 32. Independent
source-frozen review closed all four groups at 440/300/132: **177/177 scoped
PASS**, with named protected controls and deterministic repeats. This is not a
new catalogue score; the changed rows and remaining 1,073 rows require a later
complete clean collector run.

The art-direction law earned by the tree work is strict: **one whole form, one
winning route**. A named replacement painter must own silhouette, attachments,
material and identity cues together, then return before an older generic body.
A cue placed after that early return is dead; a second same-target overlay after
the whole form creates pasted seams even when both fragments are individually
correct. Prove dispatch ownership before drawing. Delete or narrow a shadowed
same-target branch only after target/control hashes prove it owns no pixels.

The flora stale cleanup was deliberately pixel-neutral: `strictSignature` and
`resetTreeSignature` are mutually exclusive for their 39 overlapping names;
impossible Apricot/Plum arms inside the Cherry/Peach/Pear-only branch and
unreachable Lime/Orange alternatives after dedicated citrus returns were
removed. All 58 tree target/control rows stayed byte-identical at 440/300/132
(0/174 drift), and all 332 Earth-flora native portraits stayed byte-identical.
Historically, Apple's integrated hybrid variation was independently PASS under its
bounded tree-continuity ruler: all five stages are
distinct with strictly increasing pure-distance, while all 58 tree rows remain
exact across the three delivery sizes. The judge evidence is
`C:\Users\Nick\.codex\visualizations\2026\08\09\019fe72d-20c7-73a0-bac7-d2c64d10673d\flora-tree-focus\evidence-apple-continuity-judge`.

## 2026-08-10 reset Wave 2a — anatomy-first family batches

Wave 2a continues the same literal, source-frozen ruler. Mammal A was
independently **4/4 PASS** under that bounded ruler (Colugo, Sugar Glider, Fur Seal, Sea Lion): gliding
membranes, plume/fur, limb contacts and pinniped flippers now read as integrated
whole-form anatomy at 440/300/132, while 71 protected controls remain exact. The later
Platinum family-comparison ruler reopened Sugar Glider and Colugo and added Flying
Squirrel; that broader result does not erase the historical evidence, but it governs
the current repair.

The INVERT winning route independently closes **13/13 PASS**: seven worm forms
(Earthworm, Flatworm, Ice Worm, Lancelet, Marine Worm, Polychaete Worm, Scale
Worm) and six sessile/benthic forms (Barnacle, Coral, Cold-Water Coral,
Deep-Water Coral, Sea Cucumber, Sponge). The governing art rule is body-plan
truth before decoration: annulation, parapodia/scales, cirri, branching tissue,
polyps, oscula and tube feet must belong to the continuous body or colony, not
sit on top as icons.

S1–S3 is independently **15/15 PASS**. Its first result was 11 PASS / 4 FAIL;
bounded R2 changed exactly Caddisfly, Diving Beetle, Firefly and Water Beetle and
closed all four at 440/300/132. All 22 protected rows remain byte-identical at
every scale, and the 156 current/repeat PNGs are complete and deterministic.
Wave 2a is therefore 32/32 scoped PASS and is committed/pushed as `00e499c`. That scoped
closure still cannot be converted into a new catalogue score without the full
1,250 collector.

## 2026-08-10 reset Wave 2b — 51 scoped whole forms independently PASS

Wave 2b closed exactly **51/51 scoped PASS** under the same 440/300/132,
protected-control, deterministic-repeat and author-separated ruler. This remains
scoped repair evidence, not a new 1,250-row tally:

- **Mammal B — 25/25 PASS.** The first independent round failed closed at
  19 PASS / 6 FAIL. Bounded R3 repaired Brown Bear, Grizzly Bear, Bobcat, Lynx,
  Serval and Sand Cat; the second judge returned 6/6 PASS. Frozen sources are
  `quadrupedoverrides.ts`
  `288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE`
  and `mammaloverrides.ts`
  `2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA`.
  The sealed r3 evidence has exact current/repeat surfaces and keeps the retained
  19 PASS targets plus 75 controls byte-identical.
- **Bird B1 — 21/21 PASS.** The first judge returned 17 PASS / 4 FAIL; bounded
  R2 repaired Secretary Bird, Rhea, Seriema and Hummingbird, and the second judge
  returned 4/4 PASS. Frozen sources are `faunaoverrides.ts`
  `783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10`
  and `birdoverrides.ts`
  `B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF`;
  432 evidence PNGs are exact and all 51 protected rows stay byte-identical.
- **Invert I — 5/5 PASS.** Banana Slug, Chiton, Comb Jelly, Portuguese
  Man-of-War and Isopod all pass. The first candidate correctly failed because
  Banana Slug's four tentacles and tip eyes did not survive 132px; a Banana-only
  refinement closed it while the other four targets plus 20 controls remained
  exact. Frozen `invertoverrides.ts` SHA-256 is
  `9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D`.

The earned direction is broader than adding detail: distinctive anatomy must
survive the actual card size. If a required shoulder hump, bobtail, facial ruff,
ear/head proportion, foot/tentacle or organ topology disappears at 132px, the
row remains FAIL even when native pixels changed. Reopen only that named row,
freeze every accepted neighbour, then require a second independent verdict.
Final integrated Wave-2b gates are green with all five source SHAs unchanged,
and the bounded checkpoint is committed/pushed as `9c148f0`. Full recertification, the
image-inclusive ZIP, reset PR and release remain OPEN.

## 2026-08-10 reset Wave 2c — 56 scoped whole forms independently PASS

Wave 2c is exactly **56/56 scoped PASS**: Mammal C 13/13, Bird B2 28/28 and
Invert II 15/15. It remains bounded repair evidence rather than a new 1,250-row
tally, and every changed delivery surface received an author-separated verdict.

- **Mammal C — 13/13 PASS.** The initial preview was 0/13 candidate-ready
  because rigid tube joins and pasted attachments required continuous whole-form
  rebuilds. R2 reached 8/13; R3 reached 11/13, and R3/R4 kept Red Panda and
  Tasmanian Devil open until hidden leg roots and the organic clipped chest band
  belonged to the body. R5 closed both before final independent judgment.
- **Bird B2 — 28/28 PASS.** The first independent shared judgment returned
  25 PASS /3 FAIL. Eider Duck needed a genuinely low-in-water posture, Rail a
  rump-rooted cocked tail and downcurved probe, and Avocet a continuous recurved
  bill. The bounded repair changed only those three; final A/B review returned
  3/3 PASS and preserved the other 25 targets +72 controls.
- **Invert II — 15/15 PASS.** The first author preview failed closed on five
  shrimp/amphipod forms; its bounded R2 made them candidate-ready. The first
  independent shared judgment still returned 13 PASS /2 FAIL on Krill and
  Tadpole Shrimp. The final repair made Krill's conspicuous stalked compound eyes
  and Tadpole Shrimp's dense organic leaf-limb field survive 132px; the second
  judge returned 2/2 PASS.

The admissible shared evidence root is
`port/v2/apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10`; manifest
SHA-256 is
`BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`.
It binds 249 rows =56 targets +193 protected controls, 747 surfaces per run and
1,494 physical PNG hash/dimension checks. Current/repeat is exact on 747/747
surfaces; all 579 protected surfaces match the shared baseline; all 168 target
surfaces changed. Final R2 changed only Eider Duck, Rail, Avocet, Krill and
Tadpole Shrimp (15 surfaces), while the other 244 rows /732 surfaces remained
exact. Three 139-file input snapshots have zero drift and all three negative
controls were rejected.

Final source SHA-256 values are `quadrupedoverrides.ts`
`45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59`,
`mammaloverrides.ts`
`50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2`,
`faunaoverrides.ts`
`D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5`,
`birdoverrides.ts`
`C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21`
and `invertoverrides.ts`
`6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0`.

The integrated gate set is green with all five hashes unchanged: typecheck and
artunused pass; Vitest is 238 passed /1 skipped across 23 files; speccheck is
418 declared /0 unread /0 inert; overridecheck is 1,014/1,014 live and
1,010/1,010 Earth; speciesaudit is 1,250/1,250 with zero failure, duplicate pair
or clipping; hybridcheck passes and rejects 11 injected failures; hybridmatrix,
speciesstrip, fullresetlayout and fullresetreview selftests pass; coveragegap is
1,010/1,010 with zero remaining; `git diff --check` passes. The scoped Wave-2c
checkpoint is committed/pushed as `dc015cf`. Full recertification, ZIP, reset
PR, merge, release and deployment remain OPEN.

## 2026-08-10 reset Wave 2d — 50 scoped whole forms independently PASS

Wave 2d is exactly **50/50 scoped PASS** under the same author-separated,
source-frozen 440/300/132 A/B ruler: Mammal D 16/16, Bird B3 27/27, and Invert
III 7/7. This remains bounded repair evidence; the frozen full-reset r1 ledger
is still **516 PASS /14 POLISH /720 FAIL** and no post-wave 1,250-row tally
exists.

- **Mammal D — 16/16 PASS.** The first shared preview failed closed on Fisher's
  tail, Marten's ears, Wolverine's claws, Sea Otter's body rotation, Hyrax's ear
  scale, and Mole's snout/forepaw separation. R2 changed those six. The first
  independent final judgment still rejected Civet's round muzzle; Civet-only R4
  supplied the continuous long pointed muzzle and closed the lane while the
  other 303 shared rows /909 surfaces stayed exact.
- **Bird B3 — 27/27 PASS.** The first author screen was 11 ready /16 blocked.
  R2 changed exactly those 16 and retained only Pheasant, Quetzal, and Macaw for
  tails/streamers that remained too short. R3 changed exactly those three; the
  independent final judge accepted all 27 with 100 lane controls exact.
- **Invert III — 7/7 PASS.** The first screen retained only Camel Spider's paired
  chelicerae/open gape and Tarantula's cheliceral bases, down-folding fangs, and
  short palps. R2 changed exactly those two; the final independent judge accepted
  all seven.

The final evidence root is
`port/v2/apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10`; manifest
SHA-256 is
`DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`.
It binds 304 rows =50 targets +254 protected controls, 912 surfaces per run,
exact A/B, 762/762 baseline-exact protected surfaces, 150/150 changed target
surfaces, Civet-only 3/3 final drift, and 909/909 other retained surfaces. Four
negative controls were rejected. The pre-edit seal is
`7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F`.

Final sources are `faunaoverrides.ts`
`63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2`,
`birdoverrides.ts`
`48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7`,
`quadrupedoverrides.ts`
`544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1`,
`mammaloverrides.ts`
`776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E`,
and `invertoverrides.ts`
`2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677`.

The deferred routing cleanup is now closed with fresh pixel-neutral proof:
Mammal C's `marsupial-c1` dispatch is explicit, Skua's impossible Snow-Petrel
colour arm is removed, and exact Invert-II non-hue options shadowed by named
early returns are removed. All 254 protected rows remain exact. This reinforces
the direction rather than changing it: remove unreachable configuration only
after the winning route and before/after pixels prove that it owns no visible
result.

The final integrated Wave-2d gates are **green** with all five source hashes and
the 139-input aggregate unchanged: typecheck/artunused; 238-pass/1-skip Vitest;
speccheck 419/0/0; coveragegap 1,010/1,010; artaudit 23/0; tokencheck selftest
16/16; overridecheck 1,014/1,014 routes +1,010/1,010 species; speciesaudit
1,250/1,250 with zero failure/duplicate/clipping; hybridcheck and its 11
negatives; hybridmatrix/speciesstrip/fullresetlayout/fullresetreview selftests;
and `git diff --check`. The checkpoint was committed/pushed as `2ed0f28`. Full
recertification, the image-inclusive ZIP, reset PR, merge, release, and
deployment remain OPEN.

## 2026-08-10 reset Wave 2e — 47 static whole-form candidates; visual review not begun

Wave 2e is exactly Mammal E 13 + Fauna E 21 + Invert IV 13. Its static source
checkpoint is `5db9039`, merged to `develop` through PR #8 at `bb1a980`; the
parent is the frozen Wave-2d checkpoint `2ed0f28`. The four frozen source
SHA-256 values are:

- `quadrupedoverrides.ts`
  `AE8E3830EF57233EB43ABE0F594E335A050A1DB3375F08781FF61549B0C6D288`
- `mammaloverrides.ts`
  `74BBD77CD8BA8E3C22D503AD42FB667EDB74AF6ED3C73551ED283223B28CF80B`
- `faunaoverrides2.ts`
  `30B2E3E2BCDA4865EE81625805384B373423274E0634F8A50F8E4D5A20483378`
- `invertoverrides.ts`
  `6785058479456FF35EE3C44D9FC8F8A9A5467B7F61BBF3153854F93B090A5C1C`

No Wave-2e visual PASS, POLISH, or FAIL verdict is recorded. The documented
pre-edit root
`port/v2/apps/game/smoke/wave2e-shared-preedit-baseline-2026-08-10/baseline`
is ignored by Git and is absent from the Mac worktree and all tracked refs.
Consequently its claimed 288-row roster (47 targets +241 protected controls),
864 PNGs, seal
`BC424C8FC8D19DDC7A23F81A946CDE99AF2A7FED759129E132233E23C598AA37`,
and index
`2AE4FDB1D443698A092304C22573D8604C07D5B42752E967549D6B038FCD26E3`
cannot be independently verified here. Wave-2e-scoped post-edit old/current A/B
capture and comparison remain fail-closed until that exact evidence and its
scoped capture/control recipe are recovered from the Windows workspace, or an explicitly authorized
reconstruction from `2ed0f28` reproduces both frozen hashes.

The only Mac-side code change is a tooling repair: pinned Rolldown 1.2.1/Oxc now
parses each complete TypeScript art source as an AST and
only literal string property/array nodes become keys. Every such key is validated regardless of
length or alphabet, and malformed CANON keys cannot disappear. This replaces the scan that misread
the 21 inline `faunaESquamata(..., 'Name')` plan literals as duplicate keys or truncated on
hand-lexed grammar boundaries. Its controls require specific exit-1 findings
for genuine duplicates, accept matching inline/ternary value strings, keep
routes after template/regex, control-head/member-call, Unicode-identifier and
ASI traps visible. Full-source declaration traversal covers parenthesized,
annotated, comment-separated and later `const` declarators; post-declaration
writes/aliases and malformed route-table source exit 2. Painter values must be
statically callable (and quadruped specs objects) through immutable, unwritten exact
local/import bindings; supported factories must return a direct callable expression.
Neither `null!`, mutable aliases, nor truthy objects count as painters. The coverage denominator
is one exact four-kingdom `_EARTH_NAMES` AST with its read-only consumer pinned. Wiring is measured only
from supported route-selection initializer AST shapes and their exact precedence/executable
guard/call/fallback/furniture consumer chains and returned-canvas `fitInk` path inside parsed
`resolveOverride`; disconnected consumers, always-false predicates, discarded/inert
syntax, and later count-summary mentions cannot mask a disconnected table. Computed
route members/methods outside exact audited consumer nodes fail closed. Recursive
`.ts`/`.mts`/`.cts`/`.tsx` discovery rejects untracked executable imports/re-exports;
normalized full-path plus actual-export ownership prevents nested same-basename/export
impersonation. Shadow direction follows resolver precedence, and helper binding/implementation
drift, direct trusted-global escape, and incomplete kingdom-qualified route coverage fail.
The sentinel assumes standard unmodified platform intrinsics and approved dependency implementations;
it is not a visual verdict.
All four art-source hashes remain exact;
no Wave-2e painter was changed. Full shared A/B review, recertification, its
certification image-inclusive ZIP, reset PR, merge, release, and deployment remain OPEN.
