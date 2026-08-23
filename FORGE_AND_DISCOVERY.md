# Celestial Frontier — v1.7 "The Forge & Discovery"

**Status:** DESIGN / planning doc for the v1.7 arc. Its core proposals — cosmic materials, stellar
extraction, cosmic gear — are now **IMPLEMENTED** (2026-07-23); the **authoritative spec is
`MATERIALS_AND_GEAR.md`**. This doc is retained for the arc's design rationale.
**Relationship to v1.6:** v1.6 "The Living Frontier" (the painterly art overhaul) shipped first. This
arc extends the same painterly engine + ARPG presentation from *living* things to the **made** things
(gear, materials, the ship) and reworks **world rarity into a landing discovery**.
**Legacy status verified:** 2026-08-13 — core proposals are present in the v1.8.9 source;
see `MATERIALS_AND_GEAR.md` for the spec of record and the 2026-08-22 overlay below for the
current separate v2 boundary.
**Current v2 overlay matches code as of:** 2026-08-23.

> **2026-08-22 Arc 1C v2 Forge/Shipyard boundary — current implementation:** clean
> product/ruler `a4de5007ffc9131b8bc952a0a4cb469d9139039e` implements the read-only
> ship foundation, not the Forge loop. Pure, recursively frozen `ShipVisualState` derives from
> normalized `items`, `ascCh`, and livery seed `0x5111`; it delegates stage selection to
> `ascStageOf`. Exact installed-system order is `jumpdrive,array,igdrive,autoext,cscoop`; exact
> visible hardpoint ids are `array`, `autoext`, and `cscoop`. The generic
> `legacy-charter-refit` provenance is terminal-only and never invents an absent named drive.
>
> The desktop right rail and phone 5×2 nine-control dock open **Shipyard — Inspection**. It
> presents four deterministic code-native SVG silhouettes, owned systems and fitted/open
> hardpoints through one disposable DOM/SVG preview owner. It creates no Pixi preview, second
> renderer, `RenderTexture`, animation, material receipt, recipe, research project, fabrication
> job, upgrade or Cargo mutation. The panel explicitly keeps Fabrication, Research and upgrades
> unavailable.
>
> The real SceneMemory route includes Shipyard open/close with zero settled previews and the
> named transactional `SurfacePlanetTextureAttachment`. Historical activation/certification source
> `59530da3bf40965adf9c54f169b310e11ccdd0f8` bound the original 250 ms budget SHA-256
> `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`; local run
> `20260822-arc1-local-certification` passed 42/42 and its named verifier under Edge
> `151.0.4129.101`, but that certificate remains historical. Clean cross-host SLA repair
> `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` binds active budget SHA-256
> `5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501`; local one-attempt/no-retry
> run `20260823-pr33-cross-host-sla-certification` passed exact 42/42 and its named verifier under
> the same Edge `.101`. Raw/gzip SHA-256 are
> `d16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960` /
> `7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a`. Hosted run
> `32618995487` remains terminal-red at 40/42 and establishes no hosted authority. Product behavior
> is unchanged. This documentation descendant is not the exact certified head. Hosted
> terminal-green integration, Cargo/Inventory/Forge writers, Fabrication/Research/upgrades,
> richer inventory, HUMAN silhouette judgment, release and deploy remain open.

> **2026-08-13 v2 presentation decision:** the original discovery rationale is now the
> binding port behavior. V2 never renders a survey row titled **Spectral class**. A
> planet has no player-visible rarity before successful landing; after landing its card
> uses the plain ten-tier grade (for example, **Rarity: Legendary**) with no spectral
> color-word. This is a presentation filter only: internal deterministic `spectral()`
> designations remain available for art/hue parity, and real astronomical spectral
> classifications (G/K/M and stellar-remnant types) remain part of star identity. The
> later universal-rarity decision remains design context, but it does not restore a
> Spectral-class survey row. The older
> world-only ladder and “remove star rarity” passages below are preserved as superseded
> design history, not current v2 instructions.

> **2026-08-13 v2 next-arc overlay — historical pre-Arc-1C boundary:**
> Legacy v1.8.9 already gives one deterministic scout hull additive Jump Drive, Array,
> Intergalactic Drive, Auto-Extractor and Corona Scoop details. V2 currently has none of
> the Cargo, Shipyard, crafting/research, upgrade or ship-art surfaces, so the older art is
> precedent rather than a live port feature. The approved port derives one pure
> `ShipVisualState` from the same normalized item/`ascCh` facts used for reach: four
> silhouette-readable chassis (Scout/Chemical → Jump/Interstellar → Array/Survey Cruiser
> → Intergalactic/Frontier), with extractor and scoop as optional hardpoints. The legacy
> completed-`ascCh` fallback maps to an honest veteran refit when drive items are absent;
> visuals never award or revoke reach.
>
> Shipyard begins with deterministic static composition and may own one bounded Pixi
> preview for motion. That preview pauses hidden/reduced-motion and disposes its textures,
> filters and particles on close. The adjacent collection/inventory asset law is equally
> strict: virtualize the possible 1,500 creature rows, deliver asynchronous 132px
> thumbnails, reserve the 440px master for detail, and require a repeated-cycle browser
> memory plateau with a failing unbounded/no-disposal control. The player-facing ladder
> teaches mastery through readable capability—each chassis says what exploration power
> was earned, each hardpoint says what optional tool was built, and rarity/cosmetics never
> pretend to be mechanical strength. These are approved next-arc constraints, not release
> notes or claims about the current development build.

The arc has two headline pillars plus supporting streams:

1. **Discovery** — world rarity becomes a *landing payoff*, not an orbital label (the "Spectral" rework).
2. **The Forge** — a real materials/elements economy + painterly item/gear/ship art + ARPG item windows.

Plus **audio** as a parallel track.

---

## PILLAR 1 — World rarity as a landing discovery (the "Spectral" rework)

### The problem (Nick, 2026-07-21)
From the space/orbit view, a world's rarity ("Spectral class") is shown *before you land*. It spoils
the discovery, it doesn't carry enough meaning, and the "Spectral" + color-word + star-class jargon is
distracting. **A player shouldn't know a planet is special until they land and discover it.**

### The design (the core idea)
**A world's rarity is discovered on the ground, exactly like its life forms.** Today you survey a
world's biosphere and catalogue its species by *landing*; the world's rarity should reveal on that same
beat — part of the same discovery moment, not a label you read from orbit.

- **Orbit shows NO rarity.** Identity, life-signature count, and the one-line environment summary only —
  exactly as today, minus the rarity row. Nothing pre-labels the world.
- **Landing reveals it.** When the player grounds and discovers the world, the rarity appears on the
  card as a discovery **callout / flourish** — the same grammar as cataloguing the life forms:
  *"Oh — this one's Rare."* You earned the reveal by going there.
- **Repurposed wording, plain language.** Drop the "Spectral class" wrapper, the per-domain color word
  ("Sapphire", "Red-Gold", …), and the ★ glyphs. The world just states its grade as a callout, in the
  new ladder below. (The color still drives the planet's *art/hue* — it simply stops being *text*.)

### The world rarity ladder (FINAL — Nick, 2026-07-21)

| Rarity score (tier) | Landing callout |
|---|---|
| 0 | *No callout — ordinary world* |
| 1 | Uncommon World |
| 2 | Notable World |
| 3 | Rare World |
| 4 | Exotic World |
| 5 | Legendary World |
| 6 | Mythic World |
| 7–9 | Unique World — *One of a Kind* |
| 10+ | Primordial World |

**Progression:** Ordinary → Uncommon → Notable → Rare → Exotic → Legendary → Mythic → Unique → Primordial

Notes:
- This is a **world-specific** ladder — it deliberately diverges from the 15-name creature ladder
  (`GRADE_TIERS`): creatures keep Common/…/Anomalous/Unique/Mythic/Celestial/Primordial/…/Omnipotent;
  worlds collapse the summit (7–9 = "Unique", 10+ = "Primordial"). The underlying deterministic tier
  (`rarityRoll`) is unchanged — only the *world display* re-buckets and re-labels it.
- Tier 0 is silent by design: an ordinary world gets no callout, so a rarity callout always *means*
  something.

### ★ V1.7 UNIVERSAL RARITY — canonical decisions (Nick, 2026-07-22)
**Canonical spec:** the "V1.7 Universal Rarity, Color, and Modifier Specification" markdown is the source
of truth. It supersedes the 9-step world ladder drafted below. Key locked decisions:
- **10 tiers, one ladder for everything** (flora/fauna/planets/stars): Common · Uncommon · Notable · Rare ·
  Exotic · Legendary · Mythic · Celestial · Primordial · Transcendent. Canonical colors per the spec §16.
- **NO all-caps** (Nick): rarity labels + discovery callouts use normal capitalization ("Legendary World",
  "Celestial star discovered"), never "LEGENDARY WORLD DISCOVERED".
- **NO glyphs** (★/✦/✧) anywhere — the grade word carries the rarity.
- **Collapse, don't remap (Nick):** keep `rarityRoll`'s raw 0–14 score UNCHANGED; read the score directly
  AS the tier (0–9), clamp 10–14 → 9 (Transcendent), rename scores 0–9 to the ten new names, and DELETE
  the old Anomalous/Unique/Empyrean/Eternal/Omnipotent names. No mapping table. → universe + power UNCHANGED
  (entities keep their raw roll), old share codes unaffected (same creature, new label) → SURGICAL re-pin.
  Consequence accepted: old score-6 (~2%, was Anomalous) now reads Mythic; score-7 (~0.8%, was Unique) now
  reads Celestial — slightly more common than the names imply; roll-tuning is a separate later pass if wanted.
- **Unique = one-of-one DESIGNATION overlay** (authored, `unique_key`), NOT a rarity tier (spec §4/§11.10).
- **Stars keep a rarity** (spec §14/§18) — the unified clean presentation ("Celestial star" + type "red giant")
  fixes the old double-"class" confusion; this reverses the "remove star rarity" side-note below.
- **Rarity color = badge/label/frame/glow only**, never recolors the entity's art (a Rare ocean world stays
  blue-oceaned; its badge is Sapphire).
- **PHASE A = the vocabulary** (names/colors/no-glyphs/no-caps/direct-score, one surgical re-pin) ships FIRST,
  after v1.6. **PHASE B = the generation-modifier system** (spec §7–§11: Hollow/Shattered worlds that reshape
  terrain, anchor-tier resolver, world envelopes, Unique registry) is a separate, larger, universe-affecting
  effort — its own design + re-pin.

### ONE rarity language, game-wide (Nick, 2026-07-22 — expands the core flow)
The unified vocabulary is **universal**, not worlds-only: drop the ★/✦/✧ glyphs **everywhere** and use
the **same standard rarity words across every entity — creatures, plants, fungi, microbes, stars,
planets.** A Legendary creature reads exactly like a Legendary world: just **"Legendary,"** no stars.
(This supersedes the earlier scoping that kept creature ★ glyphs — creatures + plants are now IN.)
- Specimen cards: `LEGENDARY ★★★★` → `Legendary` (glyphs removed; grade word kept).
- OPEN DECISION: creatures currently use the **15-tier** `GRADE_TIERS` ladder (Common…Omnipotent);
  worlds use the cleaner **9-step** ladder. Decide whether creatures adopt the collapsed 9-step naming
  too (truly identical) or keep 15-tier granularity but simply lose the glyphs. Either is fine — Nick's
  call. Determinism note: dropping glyphs is a **display-layer** change (fp-safe); *renaming/re-bucketing*
  grade words touches `speciesGrade`/`describeSpecies` text → part of the bundled v1.7 re-pin.

### Historical “remove the stars” side-note — superseded by the later universal-rarity decision
This is a small consequence, not part of the main planet vision — it can be parked without affecting
anything above. Stars carry TWO overlapping "class" ideas today: their real astronomical **type**
(`starClass` — red dwarf, blue giant, neutron star, black hole, with flavor descriptions) AND a rarity
overlay (`spectral` — "Solar Yellow", "Prismatic Solar", …). The overlap is confusing, and you can't
*land* on a star to discover its rarity, so the reveal-on-landing model doesn't apply to them. Decision:
**keep the star's real type/identity, drop the rarity overlay.** Stars still render their color and read
as "a dying red supergiant"; they just carry **no rarity grade**.
> ⚠️ CONFIRM WITH NICK: this reads "remove rarity labeling from stars," and also "drop the ★ glyphs from
> the world callouts" (his ladder is words-only). Creature grades are **out of scope** for this change
> unless Nick says otherwise — they keep their names + ★ glyphs.

### Historical determinism / re-pin analysis
- **Hiding rarity in orbit** = a *display gate* in the card-render layer → **fingerprint-safe, no re-pin**
  (the descriptor data is unchanged; the UI just doesn't show it until landing).
- **Renaming the labels** (Spectral → world callouts) and **removing star rarity** change
  `planetDescriptor` / star-descriptor **text**, which IS fingerprinted → **this is a Nick-authorized
  RE-PIN.** Bundle it with the materials re-pin below — one re-pin covers the whole arc.

---

## PILLAR 2 — The materials & elements economy (Nick, this session)

### The idea
All the major real elements/materials of the universe should **exist and matter in crafting** — not as
flavor text, but as first-class, mineable materials. Today crafting runs on the 4 exotics
(Neodymium / Promethium / Voidglass / Prismatium) + basic ore; the words *rock, iron, silver, gold,
aluminum, copper, titanium, carbon* appear only as flavor. Promote them.

### The materials (first-class craftables)
Common → rare, extending the existing `cargo`/`ELEM_NAME` element system:
- **Common:** Rock, Iron, Aluminum, Carbon
- **Uncommon/mid:** Copper, Silver, Titanium
- **Rare:** Gold
- **Exotic (existing):** Neodymium, Promethium, Voidglass, Prismatium

Each material gets:
- a **seeded source** — a world-type / biome vein, the way the four exotics already gate to world types
  (Geode → Neodymium, Carbon world → Promethium, Glass desert → Voidglass, Magma sea → Prismatium);
- a **painterly icon** (see Pillar 3);
- a **real role in recipes** — every craftable/gear piece should consume real materials.

### Tie-in to Pillar 1 (this is the payoff loop)
**World rarity decides what you can mine there.** Common worlds yield rock/iron; higher-rarity worlds
yield the rarer metals (titanium/gold) and exotics. So the landing rarity reveal isn't just a badge —
it's the signal that tells the player *"this world is worth mining, and here's what for."* The Spectral
mechanic stops being decoration and becomes the **spine of exploration → materials → crafting**.

### Determinism / saves
- New materials in world-generation veins are **fingerprinted → RE-PIN** (same re-pin as Pillar 1).
- New material keys in `cargo` = **new save fields** — must default safely when absent (rule 5).

---

## PILLAR 3 — Craftable, gear & ship art (painterly)

Extend the [[celestial-frontier-hd-engine-law]] to the made things.
- **Every craftable** (part / component / ship system / explorer gear / signature relic) and **every
  material** gets a painterly canvas master through the HD engine — same standard as the bestiary
  (144px+ masters, proof-sheeted), retiring the emoji/simple `partIcon`/`elemIcon` art.
- **Ship progression art:** the ship already gains each built system; deepen this into **discrete
  painterly hull tiers** that read as a real glow-up as you build outward and progress — not just
  bolt-ons. Ship "pictures upgrade as you progress." Here, “already” refers to the legacy additive
  `shipImage()` implementation; the distinct v2 silhouettes and their lifecycle remain open.
- All render-only → **fingerprint-safe** (layers on after the Pillar-1/2 re-pin, with no further
  determinism risk).

---

## PILLAR 4 — ARPG item windows (Diablo 2 / Path of Exile style)

`renderItemCard` (`#itemcard`) is already the seed: it shows a tier-colored name, kind/tier/slot,
description, stats, the v1.6 affix (✦), and material "Found in / Crafts" rows. Bring it to full ARPG
fidelity:
- **Hover on desktop + tap on mobile** (mobile-first — iPhone has no hover, so tap stays primary and
  hover is the desktop enhancement).
- **Affix value ranges** shown (D2/PoE style), rarity/tier coloring, and **compare-to-equipped deltas**.
- Consistent card grammar with the specimen cards we already ship.

---

## PILLAR 5 — Audio (parallel track)

Its own discipline, scoped separately from the visual work: SFX for the core loop (mine, craft, catch,
duel, land, reveal) + ambient/biome music. The engine already has `snd`/`vol`/motion settings to hang it
on. To be spec'd on its own.

---

## Sequencing & risk

1. **Historical v1.7 sequence:** materials economy + world-rarity rework first. The planned bundled
   re-pin covered material veins and descriptor wording. For current v2, the Spectral-row retirement
   is presentation-only and stars keep plain surveyed rarity; do not use this old sequence to remove
   deterministic descriptor data or real stellar classification.
2. **Art + ARPG windows SECOND** — all render-only → fingerprint-safe, layers on with zero determinism
   risk once the spine is pinned.
3. **Audio** — parallel, independent.
4. **Mobile-first throughout** (rule 10): tap-primary, hover as desktop enhancement.

## Historical open decisions — resolved/superseded where noted above
- Confirm "remove the stars" = drop rarity labeling from **stars** + drop **★ glyphs** from world
  callouts; creature grades unchanged.
- The two summit world names are Nick's already (Unique for 7–9, Primordial for 10+) — confirm nothing
  above Primordial needs its own word.
- Final material list + which world-type/rarity each vein gates to (draft above; needs a full recipe map).
- Ship hull tier count (how many discrete progression stages).

---

*Related: [[celestial-frontier-hd-engine-law]] · ART_DIRECTION.md · RARITY_AND_GRADES.md ·
WORLD_GENERATION.md · ECONOMY_LOOT_CRAFTING.md · LINEAGE_AND_BREEDING.md*
