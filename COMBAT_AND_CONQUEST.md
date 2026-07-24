# Celestial Frontier — Combat & Conquest

**STATUS:** matches code as of 2026-07-23 (verified against main.js).
**Purpose:** How creatures fight — the stat budget, seeded duel resolution, innate arts (classes + archetypes), and named Apex Guardians — and how conquest settles a world: the mercy law, re-win prevention, and the depth tax that grades every field wound by distance.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## 1. Overview

Every creature resolves to five stats and a set of **abilities** (a rolled art +,
for fauna, always-on **class** innates). Two combatants run a fully **seeded**
duel (`runDuel`) — same seeds, same fight, every time. Conquest fields a champion
(you, or a Compendium fauna) against a world's **apex native**: an elemental
Titan, a named **Apex Guardian**, or the world's strongest wild fauna. Win and the
world is settled (safe bioscans + hourly Stardust); lose and the **mercy law**
decides whether your champion crawls home wounded or is lost forever. Field wounds
outside battle are graded by the **depth tax** — near-certain survival at home,
genuinely biting at the Frontier.

## 2. Rules & mechanics (the flows + formulas)

### 2.1 `battleStats(g)` — the five-stat budget
Stats: **[Vitality, Ferocity, Resilience, Agility, Instinct]** (`STAT_NAMES`).
```
tier   = min(grade.tier, g._cradle ? 2 : 99)          // Cradle Law: Earth starters clamp at Uncommon
r      = mulberry32(g.seed ^ 0x57A7)                   // seeded, per-creature
budget = 170 + tier*38 + floor(r()*30)
W      = kingdom weights (see §3)
raw[i] = (0.6 + r()*0.8) * W[i]  for i in 0..4
s[i]   = max(8, round(budget * raw[i] / sum(raw)))     // normalize to budget
// modifiers:
size:  s[0] += size*4;  s[3] = max(6, s[3] - size*2)   // bigger = more vitality, less agility
diet:  s[1] += min(10, diet*2)                          // ferocity
bonus: (brood*22 + fed*10) spread evenly across all 5   // bred bloodlines + well-fed beasts
_mult: if >1, s[i] = round(s[i] * _mult)                // region/titan scaling (app-layer)
_wf:   world-field ×1.12 on one stat (DEFENDERS ONLY)   // lava→fer, ice→res, gas→agi, ocean→vit, desert→ins
hurt:  s[i] = max(4, round(s[i] * (1 - min(0.85,hurt)*0.55)))   // persistent wounds bite
```
Returns `{vit, fer, res, agi, ins, tier, total, hex, name, cls, lvl, ab}`.
All wound/_mult/_wf branches are **guarded** so an un-modified genome computes
byte-identically to the v1.0 baseline (the fingerprint stands).

### 2.2 Abilities — `abilityOf(g)` + class innates
- **`abilityOf(g)`**: picks a themed art from `ABILITY_THEMES[abilityTheme(g)]` or an `ARCHETYPES` entry via `hashInt(seed,0xAB1,5) % POOL`. Magnitude `m = clamp(floor(tier/3), 0, 4)` → I–V. Hybrids (70%) inherit the *other* parent's archetype. **Apex** genomes get a "Sovereign" art at full magnitude (m=4) plus a flat `taken ×= 0.90` (a guardian's hide turns a tenth of all harm).
- **Class innates** (`classKit(g)`, fauna only): each fauna rolls a **class** (`classOf`, rarity-gated by the class's `minTier`). A class supplies up to three always-on innate **hook** bundles from `ARCHETYPES`. Slots open with level: `n = 1 + (lvl>=3) + (lvl>=6)`. Hooks merge into `ab` in `battleStats` (`dmg`/`taken`/`first` multiply; booleans OR; numbers add). **Levels add hooks, never raw stats** — power comes through wins.
- **`levelOf(g) = min(9, floor(sqrt(max(0,xp)/6)))`** — quadratic (6·l²): L3 ≈ 7 wins, L6 ≈ 27, L9 ≈ 61. XP awards: duels **+8**, conquests **+20** (+ world tier), guardians **+60**.

### 2.3 `runDuel(mine, theirs)` — seeded resolution
```
A, B  = battleStats of each side
r     = mulberry32(hashInt(A.seed, B.seed, 0xD0E1))     // fully seeded — no Math.random
maxA/B = vit*3;  hpA=maxA, hpB=maxB;  first turn = higher agi
```
Per strike (attacker `att`, defender `def`):
- **shock/stun**: a staggered fighter loses its strike (`skip`).
- **dodge** (`def.ab.dodge`, camouflage): defender slips the blow entirely.
- **crit**: `r() < att.ins/420 + att.ab.critB` → damage ×1.7.
- base damage: `att.fer*(1+ramp)*(0.8+r()*0.5) - def.res*0.45`.
- **strike/ability fields** (all guarded so legacy sets consume the identical rng):
  - `dmg` (smite) ×, `taken` (aegis) ×, **`first`** (ambush) × on the opener only (`fs`),
  - `enrage` (more damage the more attacker has bled), `gambit` (roulette — wild swings),
  - `shred` (rend — foe suffers more as fight wears on), **`execB`** (reckoning — × when foe < 50% max HP, `ex`),
  - `cap` (bulwark — caps any single blow), `thorns` (bleeds attacker), `stun` (staggers next strike),
  - `drink` (thirst — lifesteal on crit), `dbl` (echo — a second strike some rounds).
- Round-end ticks: `regen` (mend), `ramp` (fury builds), `burn` (affliction DoT).
- Cap: **26 rounds**. Winner: whoever drops the other to 0, else higher remaining HP fraction (double-KO → `null`).

### 2.4 Apex Guardians — `guardianFor(pseed)`
```
r = mulberry32(hashInt(pseed, 0x6A2D, 0x11))
if r() >= 0.025 return null                             // ~1 fauna world in 40 is guarded
tr = r();  tier = tr<0.70 ? 12 : (tr<0.95 ? 13 : 14)    // Empyrean 70% / Eternal 25% / Omnipotent 5%
g = makeGenome(hashInt(pseed,0x6A2D,0x22), 'fauna', 1)
g.size=5; g.lumin=true; g.wild=1; g.apex=tier           // titanic, burning bright
g.ep = hashInt(pseed,0x6A2D,0x44) % 16                  // epithet index
```
A named, one-of-a-kind, **summit-grade** apex, deterministic from the world seed
(every explorer meets the same guardian at the same world). Its name is
`speciesName(seed) + ' ' + GUARDIAN_EPITHETS[ep]`. It defends the world in conquest;
defeat it and it joins the Compendium. **Guardian-hood never inherits** (`crossGenome`
builds an explicit field set). It is shown only while the world is **not** conquered —
fallen guardians stay fallen (`guardianFor` is skipped once `conquered.has(pseed)`).

### 2.5 `apexNative(d)` — who defends
Priority: **Titan** (elemental, `_mult = 1.15 + region*0.03`, wears its element via `_wf`) → **Guardian** (`_mult = 1 + region*0.14`) → **strongest wild fauna** (`_mult = 1 + region*0.14`, plus the world's `_wf` if lava/ice/gas/ocean/desert). Outer regions field tougher defenders.

### 2.6 `conquerPlanet(d)` → picker → `runConquestBattle`
1. `conquerPlanet`: `native = apexNative(d)`; if none → "nothing to conquer"; **if `conquered.has(planetSeed)` → "You already hold this world." (re-win prevention).** Else open the champion picker.
2. Picker lists you (`playerCombatant`) + all Compendium fauna with a `winEstimate` per candidate (`A.total/(A.total+B.total)`, clamped 0.05–0.95).
3. `runConquestBattle` runs `fightNow(champ, native)`; `onResolve`:
   - **Win**: `conquered.set(planetSeed, {t:0, tier})`, `gameEvent('conquest')`, a 40%-chance **loot affix** on a worn item, guardian → stored to Compendium, titan → `claimSignature`, Stardust `sd = 8 + tier*5 + (guardian?40:0)`, XP (`guardian?60:20 + tier`). A champion that won at **<55% HP** takes a scar: `hurt += (0.55-frac)*0.7`, capped 0.85.
   - **Loss**: see the mercy law (§2.7).

### 2.7 The Mercy Law (loss handling)
- **You (self-lead)**: `damageExplorer(min(round(16 + native.total/24), hp-1))` — the wound **cannot kill you** (min leaves ≥1 HP). Below a quarter health you **cannot lead at all** (self-lead gate, enforced at pick time).
- **A codex champion** — mercy is **bred-lineage only, once per mend**:
  - `_bred = /\(bred\)/.test(entry.from)` — only bloodlines **you bred** (wild-born hybrids carry `.hybrid` too and are deliberately **excluded**).
  - `_wasCritical = entry.genome.hurt >= 0.85`.
  - `if (_bred && !_wasCritical)` → `hurt = 0.85` ("crawls home Critical", not dead).
  - Else → `removeFromCodex` (**lost forever**).
  - The `!_wasCritical` gate = **once per mend**: a champion fielded while already Critical does not crawl home twice. This one rule also closes the hurt-nudge reroll farm (every retry past the first demands real mending) and the lose-to-heal seam (a 0.9-hurt champion no longer "improves" to 0.85 by losing).

### 2.8 The Depth Tax — field wounds (`depthTax` / `dangerOf`)
The shown danger **%** is position-free and honest (odds never lie); the graded
ramp lives on the **wound**:
```
depthTax(where):
  home galaxy         -> 0.8                              // near-certain survival, naked
  else                -> DEPTH_TAX[min(regionAt(x,y), 5)]

dangerOf(d): dmg = max(1, round((10 + top/22) * depthTax(where)))   // top = strongest wild fauna power
```
Settled worlds are safe (`conquered.has(seed)` → danger 0). Gear counters it:
`scut` reduces field wounds by up to 70%.

## 3. Key tables & numbers (REAL values)

**`DEPTH_TAX`** — indexed by `regionAt` (Solar Reach → the Frontier), six rungs:
```js
const DEPTH_TAX=[1.0, 1.3, 1.6, 1.9, 2.2, 2.5];
//               r0   r1   r2   r3   r4   r5
```
Plus the home-galaxy special case **×0.8**. NOTE: the block comment still reads
"up to ×2.2 at the Frontier" (the pre-v1.5.2 five-rung wording); the **actual 6th
rung (`DEPTH_TAX[5]`) is `2.5`** — the v1.5.2 progression audit split Outer Dark
and the Frontier into distinct rungs ("six regions deserve six rungs"). The array is
the source of truth; the ×2.2 comment is stale.

**`battleStats` kingdom weights** `[vit,fer,res,agi,ins]`:
```
fauna:   [1,    1.15, 0.9,  1.1,  0.85]
flora:   [1.3,  0.6,  1.45, 0.4,  1.25]
fungi:   [1.1,  0.75, 1.1,  0.65, 1.4]
microbe: [0.75, 0.95, 0.75, 1.55, 1.0]
```
Budget `= 170 + tier*38 + floor(r()*30)`. World-field bonus `×1.12` (defenders).
Hurt penalty `×(1 - min(0.85,hurt)*0.55)`.

**`GUARDIAN_EPITHETS`** (16, indexed by `g.ep`):
```
the Undying · the Worldheart · the Stormcrowned · the Pale Sovereign ·
the First Hunger · the Hundred-Eyed · the Last of Its Line · the Skyrender ·
the Deep Warden · the Ash Emperor · the Silent Tide · the Star-Eater ·
the Crownless · the Dawn Stalker · the Hollow Saint · the Gravemind
```
Guardian tiers: 12 Empyrean (70%) / 13 Eternal (25%) / 14 Omnipotent (5%); spawn rate ~2.5% of fauna worlds.

**`ARCHETYPES`** (17 innate arts; `mk(m)` gives magnitude I–V): smite (`dmg`), aegis (`taken`), dot (`burn`), fury (`ramp`), ambush (`first`), eye (`critB`), veil (`dodge`), mend (`regen`), echo (`dbl`), thirst (`drink`+`critB`), thorns (`thorns`), rend (`shred`), reck (`execB`), bulwark (`cap`), shock (`stun`), roulette (`gambit`), enrage.

**Conquest math**: crit `ins/420 + critB`, ×1.7; base `fer*(1+ramp)*(0.8+r()*0.5) - res*0.45`; reckoning triggers under 50% HP; 26-round cap; HP = `vit*3`.

**Creature condition** (`creatureCondition`): <0.05 Healthy · <0.3 Bruised · <0.6 Injured · ≥0.6 Critical (0.85 = the mercy floor).

## 4. Data / save fields

- **`conquered`** — `Map<planetSeed, {t, tier}>`; `t` = last harvest time (0 at settle → immediately harvestable after `HARVEST_CD`), `tier` = world tier for yield. Presence = "held" (blocks re-conquest; makes bioscans safe).
- **`g.hurt`** — persistent wound 0..0.85 on a genome; drives `battleStats` penalty and `creatureCondition`. **Stripped from shared codes** (`normGenome` deletes `hurt`/`xp`/`_mult`/`_wf`) — challengers arrive fresh.
- **`g.xp`** — win-fed; `levelOf` derives level. Exhibit codes may carry a clamped level (`o.x`) for showcase only (`decodeCreature` sets `exhibit:true`, never owned/breedable).
- **`g.apex`** — guardian/titan tier band (12–14); `g.ep` = epithet index; `g.brood`/`g.fed` = breeding/feeding bonuses; `g._cradle` = Earth-starter flag.
- **App-layer battlefield fields** (`_mult`, `_wf`) are applied per-fight, never persisted into codes. On CAPTURE the defeated native's genome is **cloned and `_mult`/`_wf` stripped** before it enters the Compendium (main.js: `const _capG={...native.genome}; delete _capG._mult; delete _capG._wf;`) — so a captured Guardian/Titan fights at its true bred stats, not the defender-only boss multiplier.
- `stats.duels`, `stats.duelwins`, `stats.guardians`, `stats.essenceEarned` track combat/conquest history.

## 5. Determinism (seeded? feeds the fingerprint?)

- **Seeded, replayable**: `battleStats` (`mulberry32(seed^0x57A7)`), `runDuel` (`mulberry32(hashInt(seedA,seedB,0xD0E1))` — **no `Math.random`**, so a given matchup always plays out identically), `guardianFor`, `apexNative` scaling, `abilityOf`, `classOf`/`classKit`. This is part of the seeded law the 49/50-probe fingerprint guards.
- **Guarding for the baseline**: `hurt`, `_mult`, `_wf`, `brood`, `fed`, and class-hook merges are all behind guards so an unmodified genome computes byte-identically to the v1.0 baseline. Never regenerate the baseline to pass — a mismatch means real behavior changed.
- **Non-deterministic (intentional, app-layer)**: which candidate you field, loot-affix *trigger* uses seeded rolls (`mulberry32(hashInt(planetSeed,0x5901/0x5902,…))`) so the spoils are deterministic per world; conquest *outcome* is deterministic given champion + native. The one clock input is `HARVEST_CD` timing and `COSMIC_EPOCH`, neither of which feeds generation.

## 6. Code anchors (functions + ~line numbers)

- `battleStats(g)`: **L11215**. `runDuel`: L11312. `normGenome`/`decodeCreature`/`encodeCreature`: ~L11266-11311.
- `abilityOf`: L10863. `classKit`: L10848. `classOf`: L10821. `levelOf`: L10847. `ARCHETYPES`: L10700. `CLASSES`: L10727. `STAT_NAMES`/`STAT_HUES`: L10614-10615.
- `guardianFor` + `GUARDIAN_EPITHETS`: L1821-1834.
- `apexNative`: L13142. `titanFor` scaling: ~L13138. `winEstimate`: L13175.
- `conquerPlanet`: L13180. `openConquestPicker`: L13187. `runConquestBattle` (win/loss + mercy law): L13214-13339.
- Conquest card / guardian display gate: ~L8102-8116.
- `DEPTH_TAX`: **L12131**. `depthTax`: L12132. `dangerOf`: L12139. `damageExplorer`: L12170.
- `creatureCondition`: L11866.
- CombatCore module banner/API: ~L10609-10613; export/destructure: L11383-11385.

## 7. Open questions / pending (audited invariants)

- **Conquered can't re-win** — enforced twice: `conquerPlanet` early-returns "You already hold this world." on `conquered.has(planetSeed)` (~L13183), and `guardianFor` / the conquest card are skipped for held worlds so a fallen guardian never re-appears. Settled worlds switch to the Harvest button. Verified.
- **Mercy is bred-lineage only, once per mend** — the `_bred` regex (`/\(bred\)/`) plus the `!_wasCritical` gate close the reroll-farm and lose-to-heal seams; wild-born hybrids are deliberately excluded. Verified in `onResolve` loss branch.
- **Both breed parents consumed** — `breedPair` removes both parents win or lose (~L11856); relevant because a bred champion lost to conquest is gone unless the mercy law spares it.
- **Rare-find stardust only for genuinely-new species** — a fallen guardian only pays its Compendium reward / cinematic when `_storeSpecies` actually stores it (new); cross-ref CAPTURE_AND_BIOSPHERE §7.
- **Depth-tax comment drift** — the ×2.2 in the header comment predates the six-rung array; treat `DEPTH_TAX[5] = 2.5` as truth. Flag for a comment fix on the next combat pass (docs-only; no code change here).
- **Pending/uncertain**: `_mult` region scaling for titans (`1.15 + region*0.03`) vs guardians/natives (`1 + region*0.14`) is a first-pass balance ("confirm the win rate by playtest/deep-sim" per the code comment) — the numbers may shift; this doc tracks current values, not a frozen balance target.
