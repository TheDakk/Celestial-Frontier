# Celestial Frontier — Player Progression

**STATUS:** matches code as of 2026-07-20 (verified against main.js).
**Purpose:** How the explorer and their creatures grow over a run — creature XP/leveling, the player character sheet (`pstats`/paperdoll), the standing-rank milestone ladder, and the Compendium collection track.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## 1. Overview
Progression runs on three parallel tracks, none of which touch world/creature *generation* (the fingerprint law):

1. **Creature levels (XP).** Individual **Fauna** in your Compendium earn XP by winning fights and level up (cap **L9**). Levels wake **innate class arts**, never raw stats.
2. **The explorer (`pstats`).** *You* are a battler too — five stats grown by eating flora, shown on the character sheet paperdoll with nine gear sockets.
3. **Standing rank (milestones).** A lifetime score over everything you've done climbs the rank ladder (Cadet → Eternal Frontier → infinite ✦ levels), unlocking nameplate colors and gating nothing — pure prestige.

A fourth, collection-side track is the **Compendium** (the species catalogue) and its **Binder** sets/Paragons, which pay one-time ☄ Stardust bounties.

Depth (frontier region / world tier) is the master difficulty dial: farther worlds grant more XP, hide rarer finds, and tax your wounds harder.

## 2. Rules & mechanics

### Creature XP & leveling
- XP lives on the creature's genome as `g.xp`. Level is a pure function of it (`levelOf`):
  `level = min(9, floor(sqrt(xp / 6)))` — i.e. **level L requires 6·L² XP**. Cap **L9**.
  - **Retune confirmed:** the curve is **6·l²** (halved from the old **12·l²** — same shape, half the XP per level, so leveling comes twice as fast).
- Only catalogued **Fauna** earn XP (`awardXP` bails on non-Fauna). `g.xp` is hard-capped at 1e6.
- **XP faucets (victories only):**
  - Friendly **duel** win: **+8**
  - **Conquest** win: **+20 + world tier**
  - **Guardian/Titan** conquest win: **+60 + world tier**
  - Cataloguing a **genuinely new species** teaches your standing **Field Scout** creature **+2** (a single-catalogue path to XP that needs no fight).
- **Level-ups wake innate arts, not stats.** `classKit` grants `1 + (lvl≥3) + (lvl≥6)` innate-art slots → **1 / 2 / 3 arts** at levels 1 / 3 / 6. A level-up at 3 or 6 toasts "A new innate art awakens!"
- Levels are *your* creature's story: a **shared code arrives at level 1** (`normGenome` strips `xp`); an **exhibit** code may carry `xp` clamped to `6·81 = 486` (exactly the L9 threshold).

### The explorer as a battler — the character sheet
- `pstats = {vit, fer, res, agi, ins}`, each starting **50**, clamped **1..330**.
  - **Vitality** → HP pool, **Ferocity** → attack, **Resilience** → defense, **Agility** → initiative, **Insight** → crit.
- `HP_MAX = max(20, round(vit·2))`; `recomputeHPMax` tops you up when Vitality grows.
- **Growth = eating flora.** `healExplorer` mends HP *and* raises one stat: `floraStat(g)` picks 1 of the 5 deterministically from the plant's genome seed; the gain is `1 + floraTier + (Xenobotany Lab ? 1 : 0)`. A toxic meal (poison roll) heals nothing and can gut you to the brink but **never kills** the explorer.
- **Player battle profile** (`playerBattleStats`): tier = `clamp(floor((total−250)/130), 0..TIER_MAX)`; fixed ability **Frontier Resolve** (regen 0.04, taken ×0.9). Power = sum of the five stats.
- **The paperdoll.** `paperdollAvatar()` renders the full-body explorer figure; the nine gear sockets pin to it via `DOLL_ANCHORS` (fractional x,y). `playerAvatar()` is the gold-helmeted battler portrait used in duels. `playerCombatant()` fields you with genome `{seed: PLAYER_SEED}`.
- **`PLAYER_SEED = 0x50A1E5`** — a stable seed so *duels against you* are deterministic and reproducible on every device (your avatar/genome never drift).

### Milestones — the standing-rank ladder
- `rankInfo()` scores your whole record: `surveys·4 + codex.size·2 + best·12 + unlocked.size·6 + hybrids + galSeen.size·3`.
- `RANKS` thresholds (score → title): Cadet 0 · Scout 30 · Pathfinder 90 · Voyager 220 · Pioneer 460 · Star Cartographer 900 · Mythic Wayfarer 1700 · Void Sovereign 3000 · Cosmic Luminary 5200 · **Eternal Frontier 8200**.
- Past the summit the ladder never ends: a new **✦N** level every **3000** score beyond 8200.
- Each rank permanently unlocks a **nameplate color**; the default follows current rank, Eternal Frontier unlocks the iridescent foil.
- Discrete **achievements** (the `unlocked` set via `checkAch`, e.g. `harvest10` Quartermaster, `essence500` Stockpiler, `brink`, `fieldmedic`, `gambler`) are the finer-grained milestones layered on top.

### Compendium collection progression
- The species catalogue is the **Compendium** (`codex`, keyed by species id; `_storeSpecies` dedupes — only a genuinely *new* species is "fresh").
- **Rare-find ☄ Stardust:** on the **first** catalogue of a Legendary+ specimen (`grade.tier ≥ 5`) you earn **`tier − 3`** Stardust, a ✦ Rare Find cinematic, and a rarity sting. Tier ≥ 4 throws a color burst. (Never re-paid — dedupe gates it.)
- **Binder** sets pay a **one-time** ☄ bounty on completion; the **Fifty Paragons** are named one-of-a-kind legends on fixed worlds.
- **First Arrival:** reaching a system no record precedes you in pays **+2 ☄**.

### How depth affects progression
- **Conquest XP scales with world tier** (`+tier` on both the +20 and +60 awards) — "leveling finally opens up with distance."
- **The Depth Tax** (`DEPTH_TAX = [1.0, 1.3, 1.6, 1.9, 2.2, 2.5]` by frontier region; home galaxy ×0.8): grades the *wound you take*, not the shown danger %. Creature POWER rolls stay position-free by design (fingerprint law) — the ramp lives app-side on the injury (`depthTax` → `dangerOf` damage).
- **Rarity is a ladder of distance:** the reachable grade band widens ring by ring (Neighborhood→Legendary, home galaxy→Mythic, then Celestial/Primordial/Transcendent, Deep Field→summit grades), so the strongest catalogue entries and the best rare-find payouts live farthest out.

## 3. Key tables & numbers (REAL values)

### XP curve (6·l²) — thresholds to reach each level
| Level | XP needed (6·L²) | Cumulative note |
|------:|-----------------:|-----------------|
| 1 | 6   | first win or two |
| 2 | 24  | |
| 3 | 54  | +1 art slot |
| 4 | 96  | |
| 5 | 150 | |
| 6 | 216 | +1 art slot (3 total) |
| 7 | 294 | |
| 8 | 384 | |
| 9 | 486 | **cap** (exhibit-code xp clamp = 486) |

### XP awards
| Source | XP |
|--------|----|
| Friendly duel win | +8 |
| Conquest win | +20 + world tier |
| Guardian / Titan win | +60 + world tier |
| New species catalogued (to Field Scout) | +2 |

### Explorer stats
- `pstats` start **50** each, clamp **1..330**. `HP_MAX = max(20, round(vit·2))` (base 100).
- Flora meal stat gain: `1 + floraTier + (lab1 ? 1 : 0)`.
- Player tier: `clamp(floor((total−250)/130), 0..TIER_MAX)`.

### Rank ladder (score thresholds)
0 Cadet · 30 Scout · 90 Pathfinder · 220 Voyager · 460 Pioneer · 900 Star Cartographer · 1700 Mythic Wayfarer · 3000 Void Sovereign · 5200 Cosmic Luminary · 8200 Eternal Frontier · then ✦N every +3000.

### Depth tax by region
`[1.0, 1.3, 1.6, 1.9, 2.2, 2.5]` (Solar Reach → the Frontier); home galaxy override ×0.8.

### Rare-find stardust
First catalogue of tier ≥ 5 → **`tier − 3`** ☄ (Legendary=5→+2, up through the summit grades). First Arrival → +2 ☄. Harvest (settled world, hourly) → `6 + tier·4` ☄.

## 4. Data / save fields
- **Creature XP:** stored *inside* each Compendium entry's genome — `codex` saves as `{g, f, w}` (genome / from / where), so `g.xp` rides along. No separate xp field.
- **`pstats`** — saved verbatim as `pstats` (each key coerced/clamped 1..330 on load).
- **`me`** — explorer name; **`nh`** — nameplate hue.
- **`essence`** (current ☄) + **`essenceEarned`** (lifetime, drives breeding-odds bonus and Stockpiler ach); **`harvests`**, **`guardians`**, **`paragons`**, **`br`** (best rank).
- **`scout`** — the Field Scout creature id (target of the +2 catalogue XP; must resolve to a Compendium fauna on load).
- **`ach`** — the unlocked achievement set; ranks are *derived* (`rankInfo`), not stored.
- Related economy/gear fields (`ea`, `cargo`, `items`, `eq`, …) are documented in `ECONOMY_LOOT_CRAFTING.md`.

## 5. Determinism
- **XP → level is a pure deterministic derivation** (`levelOf`), no randomness. Same xp ⇒ same level everywhere, forever.
- **Anti-cheat / cross-device parity:** `normGenome` strips `xp` from any imported genome — **shared codes arrive at L1**; only an **exhibit** code may carry xp, clamped ≤ 486.
- **`PLAYER_SEED = 0x50A1E5`** fixes your battler genome so duels against you replay identically on any device.
- **Not part of the 49-probe fingerprint.** Levels, `pstats`, ranks and the Depth Tax are all *player save state* / app-side wound math — the fingerprint covers world/genome/descriptor **generation**, which is deliberately position-free. Progression can evolve without a re-pin.

## 6. Code anchors (functions + ~line numbers)
- `levelOf` — **10847**; `classKit` (art-slot count) — **10848**; `awardXP` — **11439**.
- `PLAYER_SEED` — **11187**; `playerBattleStats` — **11188**; `statBlockHTML` — **11196**; `playerCombatant` — **11211**.
- `playerAvatar` — **10893**; `paperdollAvatar` — **10945**; `DOLL_ANCHORS` — **11176**.
- `pstats` — **12099**; `hpMaxFromVit` — **12100**; `floraStat` — **12101**; `recomputeHPMax` — **12104**; `healExplorer` (stat growth) — **12181** (gain at **12205**).
- `RANKS` — **9780**; `rankInfo` — **9783**.
- Rare-find stardust / cinematic — **8790–8796**; Field Scout +2 XP — **8800**; Set-complete bounty — **9283**; First Arrival +2 — **9490**.
- `DEPTH_TAX` / `depthTax` — **12131–12137**; `dangerOf` — **12139**.
- Compendium `discoverSpecies` — **8781**; character-sheet doll render — **~16220**.
- Save (codex/pstats/essence) — **10096 / 10186 / 10120**; load scout — **10228**.

## 7. Open questions / pending
- "Milestones" has no single named subsystem in code — this doc reads it as the **RANKS standing ladder + achievements**. Confirm that's the intended scope (vs. e.g. a future dedicated milestone board).
- Field Scout XP path (+2) requires a scout to be *set* and to be a different fauna than the fresh catch; a run with no scout set banks nothing from cataloguing — intended.
- XP has a 1e6 hard cap but L9 is reached at 486; everything above 486 is inert. Fine today; note if a soft "prestige past 9" is ever wanted.
- Depth Tax tops out at ×2.5 (Frontier). No open balance flag, but it's the main survivability knob — watch alongside gear scut/hull.
