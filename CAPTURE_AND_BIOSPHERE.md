# Celestial Frontier — Capture & Biosphere Yield

**STATUS:** matches code as of 2026-07-23 (verified against main.js).
**Purpose:** How a surveyed world's revealed life earns Compendium pages — the three capture verbs (Tame / Scavenge / Sample), their rarity-and-gear odds, and the Biosphere Yield system that makes every world's life a finite, epoch-recovering resource.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## 1. Overview

A ground survey **reveals** a world's roster but does not catalogue it. Each
species must then be **caught** to earn its Compendium page, via one of three
verbs mapped from the four kingdoms:

| Kingdom(s)        | Verb          | Event fired        |
|-------------------|---------------|--------------------|
| Fauna             | 🐾 **Tame**    | `tamed`            |
| Flora + Fungi     | 🌿 **Scavenge**| `scavenged`        |
| Microbe           | 🔬 **Sample**  | `sampled` (+ `scavenged` — sampling counts for scavenge charters) |

A catch is a per-attempt roll: odds fall with rarity, crafted gear sharpens the
hand, depth resists, and a miss "costs only the story" — except that **every
attempt (hit or miss) spends one unit of the world's Biosphere Yield**, a finite
pool that only regrows as the cosmic year turns. When the pool is empty the world
reads **Worked Out**. The buttons appear on the "Life forms" fold of the world
card, only while grounded and only while something remains uncaught (`main.js`
~L8067-8077 render the buttons + the attempts-left digit).

## 2. Rules & mechanics (the flows + formulas)

### 2.1 `captureOdds(g, d, kind)` — success per attempt
```
tier   = ringGrade(g, describeSpecies(g).grade, d.where).tier      // grade after the ring-spectrum clamp
base   = TAME_ODDS[min(tier, 14)] || 0.02
if kind==='scavenge': base = min(0.95, base * 1.6)                 // growths yield more easily
if kind==='sample':   base = min(0.90, base * 1.5)                 // microbes are gentle
base  *= 0.9 ^ _captureRing(d.where)                               // depth resists (mild, compounding)
gear   = min(0.25, _equipBonus('contact') * 0.015)                // the real lever: up to +25pp
return clamp(base + gear, 0.02, 0.95)
```
- `kind` here is the odds-key `'tame' | 'scavenge' | 'sample'` (from `_captureKind().odds`). The `'tame'` path takes the raw `TAME_ODDS` curve with no verb multiplier — Tame is the hardest verb.
- **Gear is the design's main lever** (Nick): every point of `contact` equipment bonus adds 1.5pp, capped at +25pp. `contact` gear is surfaced in the loadout as "+N% first contact".

### 2.2 Depth ring — `_captureRing(where)` (0..5)
```
no where/gal                                    -> 0
home galaxy, star within ASC_RING_R of Sol       -> 0   (the Ascension "Neighborhood" slice)
home galaxy, elsewhere                            -> 1
foreign galaxy                                    -> 2 + clamp(regionAt(x,y), 0, 3)   // 2..5
```
Multiplier applied to base odds = `0.9 ^ ring`, so the Frontier (ring 5) multiplies
base odds by `0.9^5 ≈ 0.59`. Mirrors `gradeCapAt`/`ringGrade`'s distance ladder.
`ASC_RING_R = GR * 0.25`.

### 2.3 `_captureKind(kind)` — the verb map
Returns `{pred, verb, odds, ev, empty}`:
- `fauna`  → `{pred: g.kingdom==='fauna', verb:'🐾 Tame', odds:'tame', ev:'tamed'}`
- `microbe`→ `{pred: g.kingdom==='microbe', verb:'🔬 Sample', odds:'sample', ev:'sampled'}`
- default (flora/fungi) → `{pred: g.kingdom==='flora'||'fungi', verb:'🌿 Scavenge', odds:'scavenge', ev:'scavenged'}`

### 2.4 `tryCapture(d, kind)` — one attempt
1. Build `pool` = revealed species matching `K.pred` **and** not already in `codex` (by `codexId`).
2. Empty pool → toast `K.empty` (e.g. "Every beast here already walks your Compendium."), no attempt spent.
3. If `d.planetSeed != null` and `bioLeft(d) <= 0` → **Worked Out** toast, no attempt spent, no roll.
4. Pick a random uncaught species: `pool[(Math.random()*pool.length)|0]` (app-layer, unseeded).
5. **Spend one attempt:** `bioX.set(planetSeed, [_bioUsed+1, COSMIC_EPOCH]); queueSave()` — happens hit or miss (guarded on `planetSeed != null`).
6. Roll: `ch = captureOdds(g, d, K.odds)`; if `Math.random() < ch` → `discoverSpecies(g, planetName, where)` + `gameEvent(K.ev)` (Sample also fires `scavenged`). Else a "it slipped away" toast quoting the odds and remaining attempts.
7. `_panelKey = null` refreshes the card so the attempts-left count updates either way.

`discoverSpecies` routes through `_storeSpecies` (which returns null if already catalogued), plays the rarity sting, and only awards **Rare Find** stardust (`grade.tier - 3`) and the cinematic for a **genuinely new** tier-5+ specimen. It then auto-crossbreeds the new arrival with a random existing species.

### 2.5 Biosphere Yield — the finite pool
Every Tame/Scavenge/Sample spends one **attempt** from a per-world pool, like a
mineral vein. Success-per-attempt is gear (`captureOdds`); **attempts are the
world's abundance**.
```
bioPool(d):
  if planetSeed==null or no species -> 0
  r = mulberry32(hashInt(planetSeed, 0xB105, 5))                  // seeded per-world wobble
  return clamp(3 + round(species.length * 1.2) + round((r()-0.5)*4), 3, 16)

_bioUsed(seed):                                                    // epoch recovery
  e = bioX.get(seed)
  if e and e[1] < COSMIC_EPOCH: bioX.set(seed, [0, COSMIC_EPOCH]); return 0   // new epoch → pool refreshed
  return e ? e[0] : 0

bioLeft(d): planetSeed==null ? 99 : max(0, bioPool(d) - _bioUsed(planetSeed))
```
- **Pool size**: 3..16, driven by roster richness (`species.length * 1.2`) plus a seeded ±2 wobble so no two worlds feel identical.
- **Worked Out** (`bioLeft <= 0`): the biosphere is spent for now; the card shows a red "worked out" tag and Tame/Scavenge/Sample refuse with a toast.
- **Epoch recovery**: `_bioUsed` compares the stored `epochStamp` to the live `COSMIC_EPOCH`. When a newer epoch has arrived since your last visit, the pool is **reset to zero-used** (fully recovered) and re-stamped. Because `planetSpecies` re-rolls its roster per epoch, a returned world holds a **refreshed AND evolved** biosphere. `passiveDrift()` (fired on epoch change) also evolves the wider Compendium roster.
- **Worlds with no `planetSeed`** (e.g. special/hardcoded cards) return `bioLeft = 99` — effectively unlimited.

### 2.6 The cosmic clock — `COSMIC_EPOCH`
Advanced in the main loop (`frameInner`, ~L16423): `newEpoch = EPOCH_BASE + floor(perfTime / EPOCH_TICK)` with `EPOCH_TICK = 1200` (~20 minutes of play per epoch). On change it sets `COSMIC_EPOCH`, runs `passiveDrift()`, and saves. `EPOCH_BASE` is loaded from the save (`data.epoch`). This is the one clock-driven value in the game — it does not feed generation within an epoch (see §5). `EPOCH_TICK` (main.js) is the single cadence knob; it was slowed from 240 (~4 min) in v1.7 as an anti-farm balance change — biosphere pools now recover ~every 20 minutes of play.

## 3. Key tables & numbers (REAL values)

**`TAME_ODDS`** — per-attempt base Tame odds by rarity tier (15-grade ladder), authored from the pack's success curves and shifted up because Biosphere Yield makes attempts finite (the pack assumed unlimited tries):
```js
const TAME_ODDS=[0.60,0.45,0.36,0.27,0.19,0.13,0.09,0.06,0.04,0.025,0.015,0.010,0.006,0.004,0.0025];
//                t0   t1   t2   t3   t4   t5   t6   t7   t8   t9    t10   t11   t12   t13   t14
```
- Verb multipliers: Scavenge ×1.6 (cap 0.95), Sample ×1.5 (cap 0.90), Tame ×1.0.
- Depth: base × `0.9^ring`, ring 0..5.
- Gear: `+min(0.25, contactBonus × 0.015)` — up to +25pp.
- Final clamp: `[0.02, 0.95]`.

**Biosphere pool**: `clamp(3 + round(len×1.2) + round((r-0.5)×4), 3, 16)`.
**Recovery**: any epoch newer than the stored stamp → full reset.

## 4. Data / save fields

- **`bioX`** — `Map<planetSeed, [attemptsUsed, epochStamp]>`. In-memory pool ledger.
- **`bx`** — the save field: `bx: [...bioX]` (array of `[pseed, [used, stamp]]`), written in the save blob (~L10081). Load (~L10155) coerces each entry: `used` clamped `[0,999]|0`, `stamp` clamped `[0,1e9]|0`; malformed entries are skipped. `bioX.clear()` on new-game reset (~L10300).
- **`epoch`** — save field carrying `COSMIC_EPOCH`; loaded into `EPOCH_BASE` and `COSMIC_EPOCH` (~L10112).
- **`surveyedSet` / `stats.surveys`** — which worlds have been auto-scanned (survey ≠ catch).
- **`codex`** — the Compendium; `codexId(g)` is the catch/dedupe key. A species is "caught" iff `codex.has(codexId(g))`.
- Absent `bx` (older/fresh saves) ⇒ `bioX` empty ⇒ every visited world reads full pool — safe default.

## 5. Determinism (seeded? feeds the fingerprint?)

- **Rosters, genomes, grades**: fully seeded (WorldGen → Genome → Descriptors). `captureOdds`, `ringGrade`, and `bioPool` are **deterministic** given the world + gear (`bioPool` uses `mulberry32(hashInt(seed,0xB105,5))`; no `Math.random`).
- **Which species is picked, and hit/miss**: use `Math.random()` on purpose — these are **app-layer, non-deterministic, and do NOT feed the fingerprint**. Nick's law: "a miss costs only the story"; the seeded rosters stay law, capture outcomes do not.
- **`COSMIC_EPOCH`** is the sole clock-derived value (`perfTime`). It does not participate in the 49/50-probe determinism baseline: the baseline is captured at a fixed epoch, and per-epoch roster re-rolls are deliberate evolution, not a broken seed. Biosphere recovery keys off it but is a save-state concern, not a generation-fingerprint one.

## 6. Code anchors (functions + ~line numbers)

- Capture buttons + attempts-left digit on the card: ~L8067-8086.
- `autoScanWorld(d)` (survey reveals, does not catalogue): ~L8745.
- Capture comment block / design intent: ~L8660-8668.
- `TAME_ODDS`: **L8669**.
- `_captureRing(where)`: L8672.
- `captureOdds(g,d,kind)`: L8682.
- `_captureKind(kind)`: L8694.
- Biosphere Yield block + `bioX`: ~L8702-8708.
- `bioPool(d)`: L8709. `_bioUsed(seed)`: L8716. `bioLeft(d)`: L8721.
- `tryCapture(d, kind)`: L8722.
- `discoverSpecies` (rare-find stardust gate): L8781.
- Verb dispatch (`tame`/`scavenge`/`sample` click handlers): ~L8370-8372.
- Save write `bx`: ~L10081. Load `bx`: ~L10155. Reset: ~L10300.
- `COSMIC_EPOCH` declared: L8530. Advanced in `frameInner`: ~L16423.
- `passiveDrift()` (epoch roster evolution): L8837.

## 7. Open questions / pending (audited invariants)

- **Flora consumed on eat** — feeding is fauna-only husbandry; the flora item is spent on the meal (see BREEDING_AND_SHARING / husbandry, ~L11827). Capture does not itself consume inventory; it consumes a **biosphere attempt**.
- **Both breed parents consumed** — `breedPair` removes both parents from the codex, win or lose (~L11856). Unrelated to capture but part of the collection economy the Compendium shares.
- **Rare-find stardust only for genuinely-new species** — enforced: `discoverSpecies` early-returns when `_storeSpecies` finds the species already catalogued, so the tier-5+ stardust bonus and cinematic never re-fire on a duplicate catch (~L8784-8797).
- **Conquered can't re-win** — capture is unaffected by conquest, but note settled worlds mark `conquered` and their surveys are always safe (cross-ref COMBAT_AND_CONQUEST §7).
- **Pending/uncertain**: the biosphere-recovery "evolved on return" promise relies on `planetSpecies` re-rolling per epoch — verify that the roster the player re-scans post-recovery actually differs (the recovery path resets the *pool*; the *roster* refresh is a separate epoch-keyed generation, asserted by comment but worth a targeted test). No cap on how far a single epoch can be skipped — a long absence recovers in one step, by design.
