# Celestial Frontier — Codebase Reference (v1.0)

> A complete technical reference for the game, written so any future session can pick up
> full context without re-reading the 7,000-line source. When in doubt, the source file is
> the source of truth — this document mirrors it as of v1.0.

---

## 1. What the game is

**Celestial Frontier** (subtitle *Cosmic Codex*) is a single-file, offline-capable
HTML/Canvas game about exploring a deterministic, procedurally generated, effectively
infinite universe. The player is an **explorer** running an **expedition**: they zoom
from the open universe → into a galaxy → into a star system → down onto a planet
surface, surveying worlds, cataloguing alien life, breeding hybrids, conquering planets,
and assembling the **Prime Codex** (9 legendary "Signatures") to win.

- **Genre:** procedural exploration / creature-collection / light tactical combat.
- **Tone:** awe-driven, "pure dopamine," endless exploration; you *cannot* truly finish it.
- **Platform:** runs as a single `.html` file in any modern browser, desktop or mobile.
  Designed mobile-first (the player tests on iPhone).
- **Persistence:** browser `localStorage` only (per-device, per-browser). No server.

### Win / end condition
Complete the **Prime Codex** by claiming all **9 Signatures**, then choose an **ending**
(there are multiple ending paths, e.g. a Prismatic ending requiring conquest + a sapient
find + a deep Compendium). The universe remains open and playable after winning.

---

## 2. Files & build/test workflow

| File | Purpose |
|---|---|
| `celestial-frontier.html` | **The entire game.** ~8,000 lines, ~462 KB. Single file: `<style>` + markup + one big `<script>` (starts ~line 948, ~7,050 lines of JS organized into SOLID modules — see §3). |
| `original/celestial-frontier-v1.0.html` | Pristine pre-refactor v1.0 build (source of the determinism baseline). |
| `tools/` | Verification toolkit (`npm install` once; see `tools/README.md`). |
| `celestial-frontier-codebase-reference.md` | **This file.** |

### Working method (important for future edits)
Edit the extracted script, not the html in place, and validate before shipping:

1. `node tools/extract.js` — pulls the `<script>` body out to `main.js`.
2. Edit `main.js` via exact, unique string matches (a bad match must never
   silently corrupt the file).
3. `node tools/validate.js` — reassembles the html from `main.js`, then runs
   `node --check`, CSS brace balance, duplicate-id check, the
   no-`Math.random`/`Date.now`-in-domain-modules grep, a headless **jsdom boot**
   (zero errors required), and a **49-probe determinism fingerprint** that must
   match the v1.0 baseline (`tools/baseline.json`) byte for byte.
4. Ship the updated `celestial-frontier.html` only when everything passes.

**Encoding caution:** the source mixes encodings — some unicode is stored as literal
backslash-u escape *text* in JS strings (renders at runtime), some as real UTF-8 chars
(—, ·, ❤, emoji). In Python here-docs, a single `\uXXXX` decodes to a real char; double
`\\uXXXX` stays literal. Prefer HTML entities (`&middot;`, `&mdash;`) in static markup to
avoid escape-text rendering bugs. Use `cat -A` to see true bytes before matching.

---

## 3. Core architecture

### Module structure (SOLID restructure, June 2026)
The script is one strict-mode IIFE organized into three strata (full map in the
`ARCHITECTURE` comment at the top of the script):

1. **Domain modules** — banner `@module <Name> [domain]` — pure, deterministic,
   no DOM/clock/`Math.random()`. Each is a revealing-module IIFE that returns a
   frozen API object, destructured back into script scope so call sites keep
   their original names (`const {mulberry32,…}=Rand;`). In dependency order:
   `Rand` (PRNG/hash/noise) → `PlanetGen`, `Naming`, `WorldConfig` (anchors),
   `StarCatalog` → `WorldGen` (cell-based generation) → `SurveyPhrases`,
   `SpeciesTraits` → `Genome` → `EncUtil` (b64/SVG-URI) → `Genetics`
   (evolve/cross) → `Ecology` (biospheres/civs) → `Descriptors` →
   `CombatCore` (battle stats, abilities, duels, CFB-codes).
2. **Art & service modules** — `@module <Name> [app]` — deterministic canvas/SVG
   art and self-contained services: `ThumbArt`, `GalaxyArt`, `SpeciesArt`,
   `Fx` (bursts/shake/fanfares), `SaveSystem` (save/load/reset/wipe),
   `Renderer` (the four `draw*` passes).
3. **App sections** — `@section <name>` — UI panels, input, progression wiring
   and shared mutable state. Cross-section mutable bindings (e.g. `essence`,
   `hp`, `pstats`, settings flags) deliberately live in plain script scope: a
   destructured module export would not propagate reassignment, so a module may
   only own a `let` that no other section reassigns.

Names not in a module's `API:` list are module-private (interface segregation).
To export another name, extend all three: the banner `API:` line, the
`Object.freeze({...})` return, and the destructuring line after the IIFE.
Extension points are data registries (open/closed): trait tables,
`ABILITY_THEMES`, `GRADE_TIERS`, `REGIONS`, `SIGS`, `ACH`, `EVENT_DEFS`,
`MODE_PAINTERS` (mode → draw pass).

### Rendering
- **Canvas2D** full-screen (`#cosmos`), redrawn every frame via `requestAnimationFrame`
  (`frame` → `frameInner`). `DPR = Math.min(devicePixelRatio||1, 3)` caps mobile GPU cost.
- Four zoom **modes** held in `st.mode`: `'universe'` → `'galaxy'` → `'system'` → `'surface'`.
  Each has its own draw function: `drawUniverse`, `drawGalaxy`, `drawSystem`, `drawSurface`
  (plus `drawBackdrop`), dispatched per frame via the frozen `MODE_PAINTERS` registry.
  `checkTransitions` handles zoom-driven mode changes; pinch/scroll
  zoom via `zoomAt` / `zoomLimits`.

### Determinism (the heart of the game)
Everything is generated from seeds, so the universe is identical on every device and
shareable by code. Core PRNG helpers: `mulberry32(seed)`, `hashInt(...ints)`,
`cellRng(cx,cy,salt)`. Spatial generation is **cell-based**: `galaxiesInCell(cx,cy)`,
`starsInCell`, `fineStarsInCell` generate content on demand per grid cell (infinite world,
low memory). Object descriptors (`planetDescriptor`, `starDescriptor`, `galaxyDescriptor`,
etc.) are pure functions of position/seed.

### Key constants (§ verify in source before relying on)
| Const | Value | Meaning |
|---|---|---|
| `UCELL` | 400 | universe grid cell size |
| `OBS_R` | 5200 | observable radius |
| `GR` | 1200 | galaxy radius scale |
| `SYS_R` | 320 | system radius |
| `HOME_GAL_SEED` | 999 | home (Milky Way) galaxy seed |
| `HOME_POS` | {x:90,y:-60} | home galaxy position |
| `SOL_SEED` | 424242 | our solar system seed |
| `PLAYER_SEED` | 0x50A1E5 | stable seed → deterministic duels vs the player |
| `HARVEST_CD` | 3600e3 | 1-hour stardust-harvest cooldown (ms) |
| `SAVE_KEY` | `'cfcc_save_v1'` | localStorage key |
| Earth | planet seed **133** | home world, conquered from game start |

---

## 4. World generation

- **Galaxies:** `galaxiesInCell`, `galaxyProfile`, `galaxyName`, `makeGalaxySprite`,
  `slimGal`. Special objects: quasars, wormholes (`galaxyWormhole`), supernova sites
  (`supernovaSites`), dwarf galaxies, CMB backdrop.
- **Stars:** `starsInCell`, `starName`, `starClass`/`spectral` (real spectral classes
  M/K/G/F/A/B/O, plus remnants: white dwarf, neutron star, magnetar, red giant, brown
  dwarf, black hole). `starDescriptor`, `supernovaDescriptor`, `protostarDescriptor`.
- **Planets:** `planetParams(seed)` returns a `P` object with `type` (lava/venus/ice/
  ocean/desert/gas/rocky/terran…), `sizeMul`, `hue`, `ring`, `moons`, plus type-specific
  fields. `planetDescriptor` builds the survey card text (atmosphere, climate, water,
  gravity, magnetism, seasons, weather — all deterministic helper fns).
- **Moons:** count **scales with planet size** — `base = round((sizeMul-0.85)*3.1)`, `+4`
  for gas giants, `+1` for ice/ocean/terran, then a size-scaled random bump, **capped at
  16**. Gas giants get ~8–13 (Jupiter-like). Sol giants are hand-set (Jupiter 8, Saturn 7,
  Uranus 4, Neptune 4). Moons are named with **Roman numerals** via `roman(n)` (e.g.
  "Jupiter VIII"); labels capped to first 10 to reduce clutter.
- **Sol system:** hand-authored via `SOL_MOONS` and explicit planet objects (Earth=133).
  The game opens here (Phase A).

---

## 5. Life: fauna / flora generation

### Kingdoms
Four kingdoms: **Microbe, Flora, Fauna, Fungi**. A world's biosphere is rolled by
`planetSpecies` / `biosphere` / `realmBiome` / `classifyRealm` based on planet type.

### Genome
`makeGenome` builds a genome; `crossGenome(a,b)` breeds two (preserving kingdom via
`pick(a.kingdom,b.kingdom)`); `evolveGenome` mutates. Genome fields include:
`seed, kingdom, color, form, body, loco, trait, size, diet, head, limbs, skin, tail,
pattern, eyes, behavior, habitat, detail, accent, lumin, gen, heat, parents, mutation`.

Trait arrays drive description & art: `FA_HABITAT`, `FA_LOCO`, `FA_BODY`, `FA_SKIN`, etc.
`describeSpecies`, `faunaDesc`, `speciesName`, `sapienceTier` (intelligence),
`ecologyRole`, `realmModifiers`.

### Art
`speciesPortrait(g)` renders per-kingdom SVG art (microbe = cell cluster, flora =
stalk+fronds+bloom, fungi = mushrooms, fauna = assembled anatomy). Cached in
`speciesArtCache` (**capped at 1,200** with eviction). Reveal cards show a **biome-colored
glow** behind the portrait (ability-theme color for fauna, nourished-stat color for flora).

### Rarity grades
`GRADE_TIERS` (15 tiers, `TIER_MAX = 14`): **Common, Uncommon, Notable, Rare, Exotic,
Legendary, Anomalous, Unique**, then the **deep spectrum** added in v1.3: **Mythic
(~1/22k), Celestial (~1/91k), Primordial (~1/333k), Transcendent (1/1M)**, then the
**summit grades**: **Empyrean (~1/3.3M), Eternal (~1/11M), Omnipotent (~1/33M)** —
all but unrollable; in practice they belong to max-boost bloodlines and Apex Guardians.
High-tier palette (v1.3 deep pass): aqua Mythic `#3fe8c8`, starlight Celestial `#a8c8ff`,
ember Primordial `#ff8a4a`, white-light Transcendent `#f4f8ff`, dawnfire Empyrean
`#ffc24f`, twilight Eternal `#9a8aff`, Omnipotent `#ff7ae8` (static fallback). Tier ≥ 12
renders with the **iridescent foil** CSS (`.gbadge.irid` shimmer badge; `.iridframe::after`
animated prismatic ring on the specimen card — see the style block's v1.3 section).
Specimen cards (`showReveal`) wear a `.gbadge` grade badge; the character sheet shows
"Highest grade ever reached" (a statistic, not an achievement — the summit is deliberately
chased, not checklisted) and "Apex Guardians felled".
`rarityRoll` / `speciesGrade` / `colorGrade` assign grade; higher tiers play bigger
stings, tinted FX bursts, and grant stardust bonuses (§9). All bands past Unique were
**carved out of the top of the old Unique band**, so under the same seed a v1.2 grade
either holds or climbs — determinism never downgrades a creature (verified over 60M
seeds by `tools/rarity-sanity.js`). Spectral designations beyond Prismatic fuse the
tier's finish with the domain's hue word ("Radiant Fire", "Primordial Black") and wear
the tier's hex from `GRADE_TIERS`. Boost clamps (`colorGrade`, `spectral`) cap at
`TIER_MAX`, so heavily boosted bloodlines (size + glow + wild + deep generations) can
breed past Unique. No "own all 15 tiers" achievement exists by design — `tiers12`
(any 12 distinct) is the collection ceiling.

### Apex Guardians (v1.3)
`guardianFor(pseed)` (Genome module): ~1 in 40 worlds passes the gate
(`mulberry32(hashInt(pseed, 0x6A2D, 0x11)) < 0.025`); rulers split Empyrean 70% /
Eternal 25% / Omnipotent 5%. The guardian is a titanic luminous fauna genome with
`apex:<tier>` (forced grade — `speciesGrade` short-circuits on `g.apex`) and
`ep` (epithet index into `GUARDIAN_EPITHETS`; `faunaDesc` appends it to the name,
e.g. "Nyxora the Stormcrowned"). `apexNative` returns the guardian (flag
`guardian:true`) as the conquest defender of any unconquered fauna-bearing guarded
world; victory stores the guardian in the codex (`stats.guardians++`, achievements
`guard1`/`guard5`, +40 stardust spoils, 👑 cinematic). Guardian-hood never inherits:
`crossGenome` builds an explicit field set (no `apex`/`ep`), and `evolveGenome` only
ever runs on world-roster or crossbred genomes. `normGenome` clamps imported `apex`
to genuine summit values (12–`TIER_MAX`) so hand-edited CFB codes can't mint fakes
beyond what determinism already allows. Probe `guardians` pins the first rulers.

---

## 6. Player stats, combat & abilities

### Player battle stats (`pstats`)
Five stats, all start at **50**: **Vitality (vit), Ferocity (fer), Resilience (res),
Agility (agi), Insight (ins)** — see `STAT_META` for names/colors/descriptions. Stats grow
by **eating flora** (`healExplorer`): each plant nourishes one stat (`floraStat(g)` picks
which) by `1 + tier`. Loaded values clamped 1–330.

- `HP_MAX = hpMaxFromVit()` = `max(20, round(vit*2))` (=100 at start). `recomputeHPMax`
  heals by headroom gained when vit rises.
- `STAT_KEYS = ['vit','fer','res','agi','ins']`.

### Duel combat (`runDuel(mine, theirs)`)
Deterministic per matchup. HP pool = `vit*3`. Per round: initiative by **agi**; damage
≈ `fer*(1+ramp)*(0.8+rand*0.5) − res*0.45`; crit chance = `ins/420 + ability.critB`.
Ability hooks read on the combatant: `dmg, taken, dbl, critB, regen, ramp, dodge, first,
gutsy, drink, burn` (burn = damage-over-time). `battleStats(g)` derives a creature's stats
from its genome and honors `g.brood`, `g.fed`, `g._mult`.

### Abilities (`ABILITY_THEMES`)
**11 biome themes** — fire, frost, storm, tide, stone, venom, void, sand, chem, psionic,
wild — each with a label/color and a list of abilities (~15+ total, e.g. Cinderburn=burn,
Frostbite, Rime Mend=regen, Static Field=critB…). `HAB_THEME` maps habitat→theme;
`abilityTheme(g)` applies loco overrides (gliders→storm, swimmers→tide,
floaters/drifters→psionic, burrowers→stone); `abilityOf(g)` returns the resolved ability
+ theme color/label.

### Where combat happens
- **Duels:** `fightNow`, `startDuelWithCode`, `duelSideCard`, `encodeCreature`/
  `decodeCreature` (CFB- codes to fight a friend's creature).
- **Conquest:** `conquerPlanet` → `runConquestBattle` vs the world's `apexNative`. Win →
  the world is added to `conquered` (Map keyed by planet seed → `{t, tier}`).

---

## 7. Progression systems

### Compendium (species catalogue — formerly "Codex")
The `codex` Map stores discovered species. `discoverSpecies`, `autoScanWorld`,
`_storeSpecies`, `renderCodex`, `removeFromCodex`. **Renamed to "Compendium"** in UI
(button, headers, prose). NOTE: "Prime Codex" (win track) and "Cosmic Codex" (app title)
are intentionally **kept** as "Codex."

### Star Atlas (bookmarks)
The `logMap` Map. `addToLog`, `renderLog`. Every survey card (galaxy/star/planet/moon/etc.)
has a uniform **bookmark row**: **+ Add to Star Atlas**, **☆ favorite**, **⌂ home** — the
icons auto-add to the Atlas on tap. Entries can be favorited/home-set from the Atlas list
too. (Favoriting unlocks the **Curator** achievement.)

### Breeding & feeding
- `breedPair` — cross two same-kingdom specimens; **consumes both parents** on success
  and failure. Odds via `breedOdds` (boosted by stardust). Works on **all kingdoms**.
- `feedPair` — feed flora to a fauna specimen; `faunaTastes(g)` gives liked/disliked
  stats; preference affects outcome (loved/neutral/disliked events, poison risk).
  Feed is **fauna-only**.

### Stardust economy (`essence`)
The soft currency that boosts breeding odds (`stardustBonus`, `breedOdds`). Faucets:
- **Harvesting** conquered worlds (`doHarvest`, 1-hour cooldown via `HARVEST_CD`).
- **Spoils of Conquest** — winning a world grants `8 + tier*5` stardust.
- **Rare Find Bonus** — discovering Legendary+ (tier ≥ 5) species grants `tier−3`.
Loaded value clamped 0–1e9.

### Ranks (`RANKS`, `rankInfo`)
By expedition score: **Cadet(0) → Scout(30) → Pathfinder(90) → Voyager(220) →
Pioneer(460) → Star Cartographer(900) → Mythic Wayfarer(1700) → Void Sovereign(3000) →
Cosmic Luminary(5200) → Eternal Frontier(8200)**. Rank-up plays a sting + gold FX burst.

### Frontier expansion (`REGIONS`)
The reachable universe expands as you claim Signatures. Tiers: **the Solar Reach → the
Local Cluster → the Near Field → the Deep Field → the Outer Dark → the Frontier**.
`currentRegion`, `reachRadius`, `withinReach`, `charterBlock` (gates travel beyond reach).

### The Prime Codex (win track) — `SIGS`
**9 Signatures**, each with a `verb` shown on locked slots:
| id | Signature | How | Verb |
|---|---|---|---|
| stone | Stone | conquer a rare rocky/metal/mineral world | Conquer |
| ocean | Ocean | conquer a living ocean world | Conquer |
| flame | Flame | conquer an extreme volcanic world | Conquer |
| sky | Sky | conquer an aerial/gas-giant ecosystem | Conquer |
| life | Life | conquer a complex land biosphere | Conquer |
| mind | Mind | conquer a world with a sapient native | Conquer |
| prism | Prism | conquer a unique prismatic lifeform's world | Conquer |
| star | Star | **find** an extreme star / stellar remnant | Find |
| void | Void | **find** a black hole / void / galactic anomaly | Find |

Logic: `worldSignature`, `speciesSignatures`, `primeCheckWorld`, `primeCheckSpecies`
(species signatures require the world to be **conquered**), `claimSignature`, `primeCount`,
`renderPrime`, `checkFrontier`, `chooseEnding`/`renderEnding`/`openFrontier`.

### Achievements
`unlock(id)`, `checkAch`, `ACH` list (categories: Cataloguing, Breeding, Rarity, Worlds,
Stellar, Exploration…). Shown in the stats panel as collapsible category groups.

---

## 8. UI layout & panels

### Topbar (unified across desktop & mobile)
Brand hidden; breadcrumb hidden. Layout (flexbox, `--topbar-h` and `--row1-h` measured
live by `syncTopbarH` + ResizeObserver):
- **Row 1:** nameplate (rank pill, opens stats) … search box (grows to fill) + 🔔 bell.
- **Row 2:** HP bar (heart + bar + "X/Y HP").
- **Right rail** (anchored to bottom of row 1, `--row1-h`): **Prime Codex** → **Compendium**
  → **Star Atlas**.
- **Left rail** (anchored below full topbar): **Traveler's Beacon** → **Cosmic Events**.

### Key panels / modals (and their elements)
| Element id | What |
|---|---|
| `#panel` | Survey card (scrollable; bookmark row; conquer/share buttons; "locked" pin hint at top-left). |
| `#stats` | Expedition stats (rank, score, **clickable** battle-stat rows, collapsible **Statistics** + **Achievements**, rarity ladder). Opens **over the HP bar** (z-index 22, above topbar). |
| `#codex` / `#codexbtn` | **Compendium** (species). |
| `#log` / `#logbtn` | **Star Atlas** (bookmarks). |
| `#primebox` / `#pcdxbtn` | **Prime Codex** modal (× and backdrop close). |
| `#events` / `#eventsbtn` | **Cosmic Events**. |
| `#daily*` / `#dailybtn` | **Traveler's Beacon** (random destination every 5 min). |
| `#tray` / `#bell` | **Notifications** tray (z-index 40, above rail; 66vh tall). |
| `#searchin` / `#searchres` | Search ("Search discoveries or paste code"); results z-index 40. |
| `#setpanel` / `#setbtn` | **Settings** (see below). |
| `#guidebox` / `#helpbtn` | **Guide to the Universe** — searchable, browsable manual of every system (see "Guide, tooltips & Field Training" below) + credit footer "Celestial Frontier · v<GAME_VERSION> (build <sha>) · Developed by Dakk". |
| `#tipbubble` (JS-created) | Tooltip bubble for `[data-tip]` elements. |
| `#tutbox` / `#tutspot` (JS-created) | Field Training instruction card + spotlight ring. |
| `#namebox` | **Intro / name prompt** ("Celestial Frontier" title, ringed-planet icon, **BEGIN THE EXPEDITION**). Doubles as the **rename dialog** (explorer via Settings → Display → Explorer name or the character sheet's ✎ link; species via card Rename) — rename modes show a **Cancel** button and dismiss on Escape; only the initial naming is mandatory. |
| `#duelbox`, `#pickbox`, `#sharebox`, `#reveal`, `#endingbox` | Duel loader, breed/feed picker, share-code, reveal card queue, ending screen. |

### Settings toggles (persisted; Display / Graphics / Audio tabs)
Display: **Text size** (`fsMode`), **Text tone** (`toneMode`), **Font** (`fontMode`),
**Explorer name** (`#renameopt` → `askExplorerName(false)` — rename anytime, purely
cosmetic: the name feeds no seed, hash or code payload), **Tooltips** (`tipsOn`).
Graphics: **Visual effects** (`fxOn` — particle bursts/cinematics/travel tunnel),
**Screen shake** (`shakeOn`). Audio: **Sound** (`sndOn`), **Notifications**
(`notifOn` — silences toast *popups* but still logs to the bell tray). Plus
**Reset Game → Erase Everything**.

### FX system (`fxBurst`, `fxShake`)
DOM-particle confetti bursts (gold/green/purple/red palettes, capped & self-cleaning) and a
CSS screen-shake. Gated by `fxOn`/`shakeOn`. Hooked into conquest wins, signature claims,
rank-ups, breeding, feeding, eating flora, harvests, rare discoveries (tinted), damage,
and death.

### Escape / dismiss
Global **Escape** first cancels an open rename dialog (`#namebox`, only when
`!_nameInitial` — the first naming stays mandatory), then closes the topmost
dismissible overlay (reveal → pickbox → duelbox → sharebox → primebox → guidebox →
setpanel). All modals also close on backdrop click. Outside-tap closes
Compendium / Star Atlas / Cosmic Events / Settings.

### Guide, tooltips & Field Training (v1.1)
- **Guide to the Universe** (`?` button, `@section guide`): a data-driven manual —
  `GUIDE` holds 9 categories × 26 topics `{id, t, k, body}` with live search
  (title/keyword/body), category drill-down, topic cross-links via
  `<span data-gt="id">`, and a deep-link API `openGuideTopic(id)`.
- **Tooltips** (`@section tooltips`): any `[data-tip]` element shows a one-line
  text-only bubble (`pointer-events:none`) — hover (650 ms) / focus on desktop,
  **long-press (600 ms) on touch**; the long-press suppresses the following tap
  action. Gated by `tipsOn` (Settings toggle, saved as `tips`) and **suppressed
  during Field Training** (the guidance card keeps a single voice). `data-guide`
  attributes remain in the DOM but are currently unused (the in-bubble Guide
  link was removed — not tappable on touch).
- **Release notes** (`@section release-notes`): `GAME_VERSION` + `RELEASES`
  (newest first; categorized sections). Returning saves whose `rn` field ≠
  `GAME_VERSION` get a one-time "latest" popup (`#relbox`, styled like the
  intro card) ~900 ms after boot; dismissing marks it seen. Fresh expeditions
  read the same bulletin between naming and Field Training. The "latest" view
  is **pinned to the entry matching `GAME_VERSION`** (not `RELEASES[0]`), so
  unshipped v-next bullets piling up on top never reach players early. The
  Guide footer credit (`#gcredit`) is the permanent link to the **cumulative**
  history. **House rule: `GAME_VERSION` bumps only when Dakk says so** — but
  every player-visible change is appended to the v-next entry as it is built.
- **Update watch** (same section): `tools/deploy.js` stamps `BUILD_ID` with the
  git sha and publishes `version.json` beside the game. Live sessions poll it
  every 10 min and on `visibilitychange` (iOS Safari resurrects stale tabs);
  a newer build shows a gold **⬆ refresh pill** (`#updatepill`) + toast —
  deferred while Field Training is active. Refresh is safe (`beforeunload`
  saves). Inert for `dev` builds, `file://`, or offline — the game stays
  fully offline-capable. The Guide footer shows `v<GAME_VERSION> (build <sha>)`.

### v1.2 systems (June 2026)
- **Cinematics** (`@section cinematics`): `cinematic({kicker,title,sub,hex,tier})`
  — full-screen tier-scaled celebration overlay (`#cinema`: rotating rays,
  gradient title), queued so shows never stack, tap-to-dismiss, gated by `fxOn`,
  `fxShake` + double burst at tier ≥ 6. Fired from: tier ≥ 5 discoveries
  (`autoScanWorld` + `discoverSpecies`), bred newborns (picker), conquest wins
  (`runConquestBattle`), and first-time event witnessing (events click).
- **Creature injuries**: `genome.hurt` (0–0.85) persists via the codex save
  (rides inside the serialized genome — no schema change). Sources: winning a
  conquest below 55% HP (`hurt += (0.55-frac)*0.7`), a disliked meal whose
  event has `fed<0` (`hurt += 0.12+tier*0.05`). Healing: feeding — loved mends
  `0.22+tier*0.05`, neutral `0.1`; wounds never heal on their own. Effects:
  `battleStats` scales all five stats by `1-min(0.85,hurt)*0.55` — **guarded
  behind `if(g.hurt)` so unhurt genomes stay byte-identical to the v1.0
  fingerprint**. `creatureCondition(g)` → Healthy/Bruised/Injured/Critical,
  shown on specimen cards, Compendium rows and the conquest picker.
  `normGenome` deletes `hurt` (injuries don't travel in CFB codes); hybrids
  are born unhurt (crossGenome never copies it). Friendly duels stay harmless.
- **Field Training** (`@section tutorial`): an 18-step, event-gated tutorial for
  brand-new expeditions only (`tut` save field; absent = veteran, never shown;
  reset → training again; reload mid-training restarts it). Game systems report
  through one funnel — `gameEvent(type, detail)` (no-op unless training is
  active) — emitted from: survey render, `addToLog`, Atlas/Compendium/tray/
  character-sheet toggles, `showReveal`, feed/breed/heal picker outcomes,
  `fightNow` resolution, and `runSearch`. Each step's `when(type, detail)`
  matcher gates advancement, so the player really performs each action:
  find & survey Earth → chart it (this is how Earth enters the Atlas now —
  `startNewGame` pre-charts it only for veterans) → open Atlas → receive a
  **training cache** (3 random fauna + 3 random flora, `from:'Training Cache'`)
  → open Compendium → specimen card → feed → breed → training duel → scripted
  hazard nip → heal → tray → search → character sheet → horizons → finale.
  **The whole thing is a sandbox**: key rolls are rigged for smoothness
  (`_tutRig`: guaranteed breed/heal success, safe feed), and the finale
  restores a snapshot (stats counters, pstats, achievements, essence), removes
  every species catalogued during training, refills HP, and guarantees Earth
  charted + home (`_tutEnsureEarth`). Skippable with confirm; `tutAbort()` on
  game reset. **Training is toast-quiet** (v1.1 post-launch): while
  `body.training` is set, `toast()` logs to the bell tray only (the tray step's
  payoff), the rank-up fanfare is suppressed (its sandbox promotion is revoked
  at cleanup anyway), tooltips hold, and the focus-lockdown gate replays its
  card **nudge** for blocked wheel events (throttled 500 ms) — blocked scrolls
  used to fail silently.

---

## 9. Audio
Web Audio oscillators — hand-rolled, asset-free. `ac()` resumes the context
(persistent gesture + visibilitychange re-arm for iOS backgrounding).
`playRaritySting(tier)` (discoveries & celebrations; pitch/steps/harmonics/
drone climb with tier), `playFailTone()`, `playFanfare()`, `playThud()`, plus
the v1.1 core-loop pair: `playSurveyPing()` (one soft sonar blip on every
canvas tap-lock — the *act* of surveying) and `playWhoosh()` (filtered-noise
sweep on `travelTo` and the system→surface landing transition). All gated by
`sndOn`. `Math.random` in the whoosh's noise buffer is fine — audio is
presentation, the determinism ban covers domain modules only.

---

## 10. Save format (`localStorage['cfcc_save_v1']`)

Written by `doSave` (debounced via `queueSave`, 900 ms). Fields (v1):

```
v, epoch, view, hp, pstats, fs, snd, fx, shake, notif, tips, notifs, me, essence,
conq, breeds, breedwins, feeds, feedfails, harvests, essenceEarned, names,
shares, jumps, anomalies, anomKey, events, duels, duelwins, surveyed, gals,
surf, starK, ptypes, evts, evann, ach, home, prime, frontier, ending, guide,
tut, codex (array of {g:genome, f:from, w:where})
```

v1.1 additions are **optional & backward compatible**: `tips` (tooltips toggle;
absent = on), `tut` (Field Training complete; **absent = treated as done**, so
pre-tutorial saves never see training), and `rn` (last release-notes version
seen; **absent = '1.0'**, so updated saves get the bulletin exactly once).

`loadSave` restores all of the above. **Hardened against tampering/corruption** (v1):
names re-sanitized via `cleanName`, every counter coerced to a finite number, `essence`
clamped 0–1e9, `conquered` timestamps clamped to "now" (prevents frozen harvest
cooldowns), HP/pstats clamped, notifications capped at 60. `resetMemoryState` clears all
live state; `wipeSaveAndReload` does a robust **in-place reset** (works even where iframe
navigation is blocked) — clears save, rebuilds the opening Sol/Earth expedition, re-prompts
for a name.

---

## 11. Security & robustness (audited at v1.0)

- **No untrusted HTML injection:** all user/code-supplied names pass through
  `cleanName` (strips `< > & " '`, 24-char cap). Share codes (`CF1-`, `decodeWhere`) and
  duel codes (`CFB-`, `decodeCreature`) sanitize embedded names on decode.
- **Save hardening:** see §10 (coercion + clamps + sanitize).
- **No economy exploits found:** flora consumed on eat; both breed parents consumed;
  feed multiplier normalized & capped; rare-find stardust only on genuinely new species;
  conquered worlds can't be re-won; duel codes touch only cosmetic counters.
- **Performance:** art cache capped (1,200); DPR capped (3); notifications capped (60);
  survey panel rebuilds only on content change; frame loop has error recovery; FX
  particles & event timers are cleaned up.

---

## 12. Test suites (all must pass)

The original v1.0 assertion suites (`phaseAtest` … `finaltest`, `esc_check`) were lost
with the previous working environment. They are superseded by `tools/validate.js`
(see §2 and `tools/README.md`): syntax check, CSS brace balance, duplicate-id check,
domain-determinism grep, headless jsdom boot with zero errors, and a 49-probe
fingerprint over the deterministic core (world-gen, descriptors, genomes, duels,
share codes) that must match the v1.0 baseline byte for byte.

When an edit intentionally changes behavior a probe captures, regenerate the baseline
**deliberately and say so** (don't weaken the intent of a check). A browser smoke test
(Playwright) exercising every panel, the settings toggles, Escape handling, search, the
heal picker and the reset flow remains the highest-value addition if sustained work
resumes — the jsdom boot covers load-time wiring, not interaction flows.

---

## 13. Development history (feedback rounds, condensed)

- **Foundations:** Prime Codex win condition; reset/save robustness; mobile pinch/tap.
- **Phase A/B/C:** Sol/Earth opening; stepped REGIONS frontier expansion; difficulty curve;
  fog-of-war.
- **Rounds 1–9:** achievements tray; conquest-gated signatures; reset confirm; mobile
  header overlap fixes (`--topbar-h`); Primer rewrite; survey-panel scroll; hazard flavor;
  explicit flora-grown player stats; biome-themed D&D-style abilities; feeding preferences;
  breed-all-kingdoms; mobile topbar cleanup; outside-tap close; Title-Case actions.
- **Round 10:** clickable stat descriptions; collapsible "Statistics"; reworded/added stats.
- **Round 11:** mobile topbar reflow (`display:contents`); Codex → **Compendium** rename;
  Prime Codex moved to the right rail.
- **Round 12:** in-place reset fix; layout parity; HP/search tuning.
- **Round 13:** unified layout on all platforms; **FX system** (bursts + shake); stardust
  faucets (spoils + rare bonus); portrait biome glow; Title-Case toasts.
- **Round 14:** intro title "Celestial Frontier"; signature verbs (Conquer/Find); Effects
  toggle; help credit; Primer em-dashes.
- **Round 15:** uniform **☆/⌂ bookmark icons** on all survey cards; Curator achievement.
- **Round 16:** search/tray z-index; "Search discoveries or paste code"; split Effects &
  Screen-shake toggles; **size-scaled moons** + Roman numerals; locked-pin hint to top-left.
- **Round 17:** search box grows to fit text.
- **Round 18:** tray above rail + taller; stats panel over the HP bar; **Notifications**
  toggle (silences popups, keeps tray); intro modal redesign (icon, background, gradient
  title, de-italicized lore).
- **v1.0 hardening (round 19):** save-restore sanitization/coercion/clamps; Prime Codex
  backdrop close; global **Escape** closes overlays; full security/perf audit.
- **Final:** intro button → **BEGIN THE EXPEDITION** ("Survey" kept as the game's verb).
- **SOLID restructure (June 2026):** script reorganized into domain/app modules with
  a verification toolkit (`tools/`) — behavior identical, 49-probe fingerprint pinned.
- **v1.1 (June 2026):** **Guide to the Universe** (searchable 26-topic manual replaces
  the Primer); **tooltip system** (`data-tip`/`data-guide`, Settings toggle, long-press
  on touch); **Field Training** — an 18-step, event-gated, fully sandboxed new-player
  tutorial (Earth charting, training cache, feed/breed/duel/heal practice, scripted
  hazard, cleanup that restores the record). New optional save fields `tips`, `tut`.
  jsdom smoke suite drives the entire tutorial end-to-end.
- **v1.1 continued:** **Release Notes system** (one-time update bulletin via save
  field `rn`; cumulative history behind the Guide footer version line; content in
  `RELEASES`, version bumps only on Dakk's call); tutorial card moved top-center
  with **focus lockdown** (per-step `allow` lists; capture-phase gate on
  pointerdown/click/touchstart/wheel; open dialogs always usable); tooltips made
  text-only with longer delays (650 ms hover / 600 ms long-press). Smoke suite:
  72 checks.
- **v1.1 post-launch, Emerson playtest round (July 2026):** desktop hint copy
  corrected (hover *previews*, click surveys); planet pick floor 14→16 px and
  **moon picks gated to `c.z > minWH/420`** (the moon-label zoom) so sub-pixel
  moons stop stealing nearest-wins taps aimed at their planet; **training
  quiet pass** (toasts tray-only + no rank-up fanfare + tooltips held during
  training; wheel-block nudge feedback); **player rename surfaced** (Settings →
  Display row, Guide mention, larger ✎ link, Cancel/Escape on the rename
  dialog); survey-card `.k`/`.tag` labels moved to a brighter `--label` color
  (8:1 on the glass panel; tone-aware) and the stale `.krow` fs-lg/fs-xl
  selectors fixed so those labels finally scale with A+/A++; new
  `playSurveyPing`/`playWhoosh` core-loop SFX; release-notes "latest" view
  pinned to the `GAME_VERSION` entry; `RELEASES` gains the working v1.1
  "Field Reports" entry. An adversarial review round then hardened the batch:
  the locked-Guide message stays a visible pop-up during training (the one
  exception to the quiet pass), rename-cancel flushes queued toasts (and
  `flushToasts` re-checks the training gate at fire time), moon picks use
  true-apparent-size targets below the label zoom instead of vanishing (a
  visible desktop gas-giant moon stays clickable), travel-skip taps are
  disarmed so they can't survey-lock (and ping) the arrival scene, and
  `#namebox` joined the `body.training` yield rules. Smoke suite: 91 checks
  (training-quiet, pinned bulletin, rename flow, locked-Guide feedback).

---

## 14. Glossary of in-game terms

| Term | Meaning |
|---|---|
| **Expedition** | a playthrough (the player's run). |
| **Survey** | examining/cataloguing a world (the core action verb). |
| **Compendium** | the catalogue of discovered species (was "Codex"). |
| **Star Atlas** | the player's saved bookmarks of places. |
| **Prime Codex** | the 9-Signature win track. |
| **Cosmic Codex** | the app's title/subtitle. |
| **Signature** | one of 9 legendary milestones that complete the Prime Codex. |
| **Stardust** (`essence`) | soft currency; boosts breeding odds. |
| **Traveler's Beacon** | a fresh random destination every 5 minutes. |
| **Pathfinder** | the in-lore order of explorers; also a rank; "Pathfinder's Primer" = help. |

---

*Generated for continuity. If the source and this document disagree, trust the source —
then update this file.*
