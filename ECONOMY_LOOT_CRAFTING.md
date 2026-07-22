# Celestial Frontier — Economy, Loot & Crafting

**STATUS:** matches code as of 2026-07-20 (verified against main.js).
**Purpose:** The material economy — mining dead worlds into Cargo, spending it at the Shipyard (Fabricator + Research), crafting the gear/relic ladder, the item tooltip card, and the v1.6 AFFIX/LOOT core that imbues worn gear with seeded bonus stats.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## 1. Overview
Dead worlds carry elements; life carries legends. This system is the **engineer's track** — parallel to the Prime Codex — turning ore into capability rather than story.

The loop:
1. **Land** on a lifeless world → **field samples** (free first-footfall trickle) + a **ground survey** that opens the Mine button.
2. **Mine** in finite bursts → elements land in your **Cargo** (`cargo`).
3. **Spend** at the **Shipyard** (right rail): the **Research Bench** buys ship capabilities (scanners, hull, lab, drive ladder), the **Fabricator** crafts a 3-tier item ladder (parts → components → ship systems / explorer gear), and nine **Signature Relics** unlock as you master the elements.
4. **Equip** gear on the paperdoll's nine sockets; effects fold through `_equipBonus`.
5. **Loot:** winning a conquest can **imbue a worn piece** with a seeded **affix** — the loot chase begins at the point of a sword.

Two currencies feed it: mined **elements** (hard, finite per world) and **☄ Stardust** (`essence`, soft — harvested hourly from settled worlds; documented for the collection side in `PROGRESSION.md`).

## 2. Rules & mechanics

### Cargo & materials
- `cargo` — `Map<elementSymbol, qty>` (save `cargo`). Rendered as a Diablo-style bag under the paperdoll.
- Element identity: `ELEM_NAME` (42 symbols → names). Which elements a world holds comes from `DEPOSIT_PROFILES[ptype]`; `depositsFor(seed, type, tier)` picks the seeded subset; rarer worlds reach further up `RARE_VEIN`.
- Ice/gas/exotic classes: `ELEM_ICES`, `ELEM_GAS`, `ELEM_EXO`.

### Mining
- **Finite reserves.** `reserveFor(seed, tier) = round((420 + rand·0..380) · (1 + tier·0.35))` total pulls, seeded per world (`hashInt(seed,0x2E5,3)`). `mineX` (save `mx`) tracks pulls taken; a world mined to `R` is **mined out forever**.
- **Deterministic by pull index.** Each pull `n` is seeded `mulberry32(hashInt(ps, 0xE1F, n0+i+1))` — pull #n is identical for every explorer (no reroll exploits). Each pull hauls from **two** of the world's veins, quantity `max(1, round((1 + rand·3 + floor(tier/3)) · mult))`.
- **Biome vein trickle:** on a biome-vein world (`BIOME_VEIN = {geode:Nd, carbon:Pm, glass:Vg, magmasea:Pz}`), a plain pull pays +1 of that exotic at `roll < 0.25`. The roll is consumed either way (index parity).
- **Rich strike:** `roll < 0.05 + tier·0.01 + _equipBonus('strike')` opens a rare pocket (biome exotic if present, else climbing `RARE_VEIN`).
- **Yield multiplier:** `mineYieldMult() = 1 + _equipBonus('yield')` multiplies every haul.
- **The burst.** One ⛏ press = one **burst** of up to **`MINE_BURST = 10`** pulls, ~1.6 s apart (~16 s), then the drills stand down and want another press. `mineToggle` starts `_mineRun = {seed, pulls, t}`; `mineStop` clears it. Auto-stops when the vein empties, the card changes worlds, or the card closes. Parking a card AFK can no longer drain a finite reserve. Burst size is the future upgrade knob.
- **Auto-Extractor (ship system).** `minePending(ps)` accrues **1 load / 10 min** since last collection, **capped at 30**, collected on your next Mine press at that world. Every auto load feeds the same counters as a hand pull (`stats.mines`, achievements, ledger). Never multi-world, never truly offline beyond the cap.
- **Field samples:** first footfall on any world (home aside) grants up to two of its elements + a few ☄ Stardust, richer on rarer worlds.

### The Stardust harvest (settled-world faucet)
- `doHarvest(d)`: a conquered world yields **`6 + tier·4` ☄** once per **`HARVEST_CD = 3600e3` (1 hour)**. Between harvests the card reads "Settled — replenishing"; `fmtRemain` shows the countdown.

### Shipyard: Research + Fabricator
- One panel (right-rail 🛠) holds the ship portrait, the **Research Bench**, and the **Fabricator**, recipes **folded by category**.
- **Research** (`TECHS`, owned in `techOwned`, save `tech`) costs elements + Stardust (`sd`), some gated by a `req` prereq:
  - `scan1` Deep Scanners {Fe6,Si4} sd20 — orbital vein reveal.
  - `hull1` Reinforced Hull {Ti5,Fe8} sd40 — bioscans wound 25% lighter.
  - `lab1` Xenobotany Lab {C6,P3,H2O4} sd60 — flora meals grow +1 more stat.
  - `drive1` Fusion {H8,He3,Fe4} sd40 → `drive2` Antimatter {He3,Pt,U} sd120 → `drive3` Warp Fold {Pz,Ir,U} sd300. `driveMult()` = 1/2/4/8 (+ `_equipBonus('speed')`).

### Crafting / blueprints
- `ITEMS` is the master recipe list; `ITEM_BY` indexes it by id. Three rungs: **T1 parts** (elements → plates/wire/chips/weave…) → **T2 components** (parts → coils/cores/hull segs…) → **T3 ship systems** (`cat:'sys'`, build once) and **explorer gear** (`cat:'gear'`).
- `_canCraft(it)`: passes only if the Signature blueprint is held (`it.sig && !primeFill[it.sig]` fails), the `req` rung below is owned, `essence ≥ it.sd`, and every `cost` (elements) and `parts` (items) is in stock.
- `craftItem(id)`: spends cost/parts/sd, mints the item, fires the right sting/toast, and **auto-equips into an empty matching socket** (`it.slot && !equip[it.slot]`). Systems build once (guarded). Crafting `autoext` restamps every mined world's timestamp so it doesn't pay a retroactive windfall.
- **Recipes are fixed and identical for every explorer**; nothing waits on a timer.

### Signature Relics — the Pathfinders' Trail
- Nine `cat:'relic'` items (`rl-stone`…`rl-prism`), one per socket, each `sig`-gated on `primeFill` (mastering that element recovers the blueprint). Endgame-tier gear whose **power is decoupled from rarity** — effects live inside the wired `eff` keys, same as any gear.

### Gear sockets & effects
- Nine sockets (`EQ_SLOTS`): helmet, ears (earpiece), necklace, suit, gloves, legs, boots, tool, module. `equip` = `Map`-like object slot→id (save `eq`); `items` = owned counts (save `items`).
- `_equipBonus(key)` is the ONE reader every system consults: it sums, over all worn gear, the item's `eff[key]`, **plus that slot's live affix** (see below), plus built ship-system effects. Effect keys: `yield, strike, scut, land, land100, landfam, struts, contact, heal, speed, auto`.

### The item tooltip card (`#itemcard`)
- One painterly stat card for every hold item, matching the world/creature card language. Element `data-mat` and gear `data-item` clicks in the cargo grid call `openItemCard`.
- `renderItemCard()` branches:
  - **Raw element:** `_matUses(key)` lists where it's **Found in** (`Nd`=Geode, `Pm`=Carbon, `Vg`=Glass deserts, `Pz`=Magma seas) and what it **Crafts** (recipes whose `cost` names it).
  - **Gear/part:** `_itemStats(it)` renders `eff` in plain words; header shows `_ITEM_KIND` label, tier, socket, held count; a worn piece with an affix shows a gold **spoils-of-conquest** line via `_slotAffix` + `_affLabel`, and an Equip/remove button.
- `openItemCard` / `closeItemCard` toggle the `#itemcard` element (created and appended at load).

### The AFFIX / LOOT core (v1.6)
- **Per-instance gear bonuses.** `equipAff` = `{slot → {k, v, forId}}` (save **`ea`**) — a seeded affix bound to *that exact item in that slot*.
- `AFFIX_DEFS` (6 kinds): `yield` (10–35%), `strike` (2–6%), `scut` (8–25% lighter bioscan wounds), `contact` (+4–12 first-contact/capture), `land` (+4–12 descent safety), `heal` (8–20% flora healing). `pct:1` kinds store a fraction (2-dp), `pct:0` kinds store an integer.
- `rollAffix(seed, tier)`: `r = mulberry32(hashInt(seed, 0xAFF1, tier+1))`; pick a def; magnitude `mag = lo + (hi−lo)·(0.4+0.6·r)·(0.7+0.3·t)`, where `t = min(1, tier/6)` — **deeper worlds roll stronger**.
- `_slotAffix(slot)` returns the affix **only while its exact piece is still worn** (`forId === equip[slot]`) — swap the piece out and the bonus goes dormant. `_affLabel` formats the "✦ +N% …" line. `_equipBonus` folds a live affix into the worn total.
- **First faucet — conquest spoils.** On a conquest win, if you have any worn gear, a **40%** seeded gate (`mulberry32(hashInt(planetSeed,0x5901,2)) < 0.4`) imbues a **random worn piece**: `slot` chosen by `hashInt(planetSeed,0x5902,3)`, `aff = rollAffix(planetSeed, worldTier)`, `aff.forId = equip[slot]`, `equipAff[slot] = aff`. Toasts "✦ Spoils of Conquest — your \<gear\> takes on this world's character."

## 3. Key tables & numbers (REAL values)
- **`MINE_BURST = 10`** pulls per press; interval **1600 ms** (~16 s/burst).
- **Reserve:** `round((420 + 0..380) · (1 + tier·0.35))` pulls per world.
- **Rich strike:** `0.05 + tier·0.01 + _equipBonus('strike')`. **Biome trickle:** `< 0.25`.
- **Auto-Extractor:** 1 load / 600000 ms, cap **30**.
- **`HARVEST_CD = 3600e3`** (1 h); harvest yield **`6 + tier·4` ☄**.
- **`AFFIX_DEFS`** (k · range · unit):
  | k | lo | hi | unit |
  |---|----|----|------|
  | yield | 0.10 | 0.35 | % mining yield |
  | strike | 0.02 | 0.06 | % rich-strike |
  | scut | 0.08 | 0.25 | % lighter wounds |
  | contact | 4 | 12 | flat first-contact/capture |
  | land | 4 | 12 | flat descent safety |
  | heal | 0.08 | 0.20 | % flora healing |
- **Affix magnitude:** `lo + (hi−lo)·(0.4+0.6·r)·(0.7+0.3·t)`, `t = min(1, tier/6)`.
- **Conquest imbue gate:** 40%.
- `ELEM_NAME` — 42 symbols. `RARE_VEIN = [Ag, Au, Pt, Ir, U, Nd, Pm, Vg, Pz]` (index climbs with world rarity). `BIOME_VEIN = {geode:Nd, carbon:Pm, glass:Vg, magmasea:Pz}`.
- `DEPOSIT_PROFILES` per ptype: rocky/metal/lava/ice/desert/gas/venus/dwarf/moon (see code — the seeded palette each world type mines from).
- **Item ladder headcount:** 9 T1 parts, 6 T2 components, 4 T3 ship systems, ~20 gear pieces across 9 sockets, 9 Signature relics.

## 4. Data / save fields
- **`ea`** — `equipAff` (the affix core): each slot's `{k, v, forId}`. On load: kept only if `k ∈ AFFIX_DEFS`, `forId` is a string, and `equip[slot] === forId`; `v` is coerced and **clamped 0..the affix's own `def.hi`** (v1.6 fix — was a flat 0..5 that silently truncated legit `contact`/`land` rolls above 5).
- **`cargo`** — element→qty. **`items`** — item id→qty. **`eq`** — slot→item id. **`tech`** — `techOwned` set.
- **`mx`** — `mineX` (pulls taken per world, uncapped by design). **`minedw`** — `mined` (last-mine timestamp per world; the Auto-Extractor accrual anchor). **`mines`**, **`minedout`**, **`crafts`** — lifetime counters.
- **`essence`** / **`essenceEarned`** — current / lifetime ☄ Stardust; **`harvests`** — harvest count.
- **`prime`** — `primeFill` (Signature blueprints; gates relic recipes).
- `equipAff` (and the affix roll) is **app-layer only — it never rides share codes.**

## 5. Determinism
- **Mining is fully seeded by (worldSeed, pull index)** — pull #n is byte-identical for every explorer; reserves are fixed per world. No `Math.random` in the yield path.
- **Affix rolls are SEEDED** by `planetSeed` (+ tier salt `0xAFF1`); the 40% imbue gate and the chosen slot are likewise seeded off `planetSeed` (`0x5901`/`0x5902`). Same conquest ⇒ same imbue, deterministically.
- **But loot does NOT feed the 49-probe fingerprint.** The fingerprint covers world/genome/descriptor **generation**; cargo, gear, crafts and affixes are **player save state**, tied to *your* equip and progress, and never travel through share codes (`normGenome` strips nothing here because it's not on the genome at all). So the loot core can evolve without a re-pin — the seeding is for cross-device *reproducibility of the same player action*, not content parity.

## 6. Code anchors (functions + ~line numbers)
- `ELEM_NAME` — **13368**; `DEPOSIT_PROFILES` — **13374**; `RARE_VEIN` — **13385**; `depositsFor` — **13386**; `BIOME_VEIN` — **13402**.
- `reserveFor` — **13422**; `mineYieldMult` — **13429**; `minePending` — **13431**; `mineWorld` — **13438**.
- `MINE_BURST` / `_mineRun` — **13511 / 13510**; `mineStop` — **13512**; `mineToggle` — **13515**.
- `HARVEST_CD` — **13013**; `doHarvest` — **13340**; field samples — **7810–7817**.
- `TECHS` — **13530**; `driveMult` — **13539**.
- `_itemStats` — **13726**; `_matUses` — **13741**; `#itemcard` element — **13747**; `renderItemCard` — **13749**; `openItemCard`/`closeItemCard` — **13780/13781**.
- `ITEMS` — **13925**; relic block — **13990–14002**; `ITEM_BY` — **14004**; `EQ_SLOTS` — **14007**; `items`/`equip`/`itemCount` — **14018–14020**.
- Affix core: `equipAff` — **14043**; `AFFIX_DEFS` — **14044**; `rollAffix` — **14052**; `_affLabel` — **14059**; `_slotAffix` — **14063**; `_equipBonus` — **14067**.
- `_canCraft` — **14088**; `craftItem` — **14096**; `equipItem` — **14133**.
- Conquest-spoils faucet — **13247–13258**.
- Save (`ea`/cargo/items/eq/tech) — **10081–10082**; affix load/validate — **10170**.

## 7. Open questions / pending
- ✅ **FIXED (v1.6, 2026-07-20):** the affix `v` load clamp was a flat `0..5`, but `contact`/`land` roll integers up to 12 — so a legit `land 12`/`contact 12` was silently **clamped down to 5 on reload** (data loss). The load path now clamps to each affix's own `def.hi` (`AFFIX_DEFS.find(d=>d.k===a.k)`), so flat affixes survive to 12 and pct affixes (≤0.35) are unaffected. Save writes `ea` raw, so the roundtrip is lossless. Guarded by the smoke suite's save/load leg.
- Burst size is documented as "the future upgrade knob (rigs/recipes may extend it)" — no recipe extends `MINE_BURST` today; pending design.
- Only **one** affix faucet exists (conquest spoils, 40%). Additional faucets (rich-strike loot, guardian drops) are open design space; the core supports them.
- `_equipBonus('scut')` is clamped 0..0.7 at the callsite; affix + gear + hull stacking should be re-checked against that ceiling when new scut sources ship.
