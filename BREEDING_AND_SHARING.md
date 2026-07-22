# Celestial Frontier — Breeding & Sharing

**STATUS:** matches code as of 2026-07-21 (verified against main.js).
**See also:** `LINEAGE_AND_BREEDING.md` — the v1.6 Earth-lineage layer on top of `breedPair`:
a child of an Earth parent keeps that parent's Earth RIG + wears the child's alien palette
(`_earthBlend`); the Earth-anchor strength drifts alien organically by the MATE's alienness
(`_anchorVal`, set in `crossGenome`; no toggle); and the specimen card carries an expandable
**Lineage** ancestry panel (parents + per-trait attribution, from the keyed inheritance coin +
`_pa`/`_pb`). All render-only / Earth-gated → determinism-safe.
**Purpose:** The husbandry loop (breeding, feeding, healing) that grows creatures and the player, and the cross-device code system (world codes, creature codes, champion codes, discovery records) that lets anyone regenerate the exact same life on any device.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## 1. Overview
Two coupled systems:

- **Husbandry** — three flows over one picker (`openPicker`, ~L11946):
  - **Breed** (`breedPair`, ~L11845): pair two same-kind creatures into a hybrid bloodline; **both parents are consumed win or lose**.
  - **Feed** (`feedPair`, ~L11893): feed a flora to a fauna for permanent bloodline growth; **the flora is always consumed on eat**; a toxic roll wounds (or kills) the beast.
  - **Heal** (`healExplorer`, ~L12181): the player eats a flora to restore HP and permanently grow one battle stat; **flora consumed**; a toxic roll wounds the player but **never kills** them.
- **Sharing / codes** — deterministic, paste-anywhere strings:
  - **`CF1-`** world codes (`encodeWhere`/`decodeWhere`, ~L10370) — land a friend on your exact world.
  - **`CFB-`** creature codes (`encodeCreature`/`decodeCreature`, ~L11266) — summon your exact creature as a duel challenger. A **champion** variant carries level.
  - **Discovery records** (`recordCreature`, ~L11665) — a keepsake wrapping flavor + stats + `CFB-` code.

## 2. Rules & mechanics (flows + gating)

### Breeding (`breedPair`, ~L11845)
1. `odds = breedOdds(a, b)`. If `roll >= odds` → **fail**: remove both parents, return `{ok:false, odds}`.
2. On success: `child = evolveGenome(crossGenome(a.genome, b.genome), 1)`; `child.brood = a.brood + b.brood + 1`.
3. De-collide the seed against existing `codex` ids (LCG step until unique); store via `_storeSpecies` named "A × B (bred)".
4. **Remove both parents regardless of outcome** — the union always consumes them.
5. Two Legendary-tier (tier ≥5) parents unlock the `bredlegend` achievement.
- Live `roll = Math.random()`; during training `roll = -1` (guaranteed success). `stats.breeds`/`breedwins` tracked; fires `gameEvent('bred', {ok})`.

### Feeding (`feedPair`, ~L11893)
1. **Flora consumed first** (`removeFromCodex(floraEntry.id)`) — always.
2. Taste: `faunaTastes` → the beast `loved`/`neutral`/`disliked`s the flora's stat flavour (`floraStat`).
3. Poison chance `pois` = `0` if the beast has **Iron Gut** (`ab.gutsy`), else `clamp((disliked?0.16:0.05) + tier*0.05 − res/800, 0.02, 0.5)`.
4. `roll < pois` → **toxic**: wound `dmg = clamp(0.16 + severity*0.22 + tier*0.045, 0.1, 0.92)` added to `genome.hurt`. If `hurt + dmg >= 1` the beast **dies** (removed from codex). Poison wounds, it doesn't execute — only a beast already spent dies.
5. Otherwise a `FEED_EVENTS[pref]` event applies `fed` delta to `genome.fed` (loved meals of tier ≥4 get +1). Loved/neutral meals also **mend** existing `hurt`; a bad disliked meal can add a small wound.

### Healing the explorer (`healExplorer`, ~L12181)
1. **Flora consumed** (`removeFromCodex`).
2. `pois = clamp(0.08 + tier*0.07, 0.05, 0.6)`. `healBase = round(12 + tier*9 + pois*30)`; actual `heal = healBase * (1 + _equipBonus('heal'))` (Field Medkit boosts mending but the bonus **never** sharpens poison — `dmg` keys off the unboosted base).
3. `stat = floraStat(genome)`; `gain = 1 + tier + (Xenobotany Lab ? 1 : 0)`.
4. `roll < pois` → **toxic**: `dmg = ceil(healBase*0.6)`, but clamped to `hp − 1` — **eating medicine NEVER kills the explorer** (the wave-off law; the heal button was historically the #1 killer). Returns `brink` if hp hits 1.
5. Success: `hp += heal` (cap `HP_MAX`), `pstats[stat] += gain` (cap 330); `vit` gains recompute `HP_MAX`.
- Live `roll = Math.random()`; training rigs heal `0.95`. Fires `gameEvent('healed', {ok})`.

### Sharing flows
- `shareCreature(entry)` (~L11642) → plain `CFB-` battle code (xp stripped on decode).
- `shareChampion(entry)` (~L11654) → `encodeCreature(entry, true)`; shows `Level N`; carries xp; **exhibition only**. The `🏆 Champion` button appears only when `levelOf(entry.genome) > 0` and the creature is in the player's own codex (~L8948).
- `recordCreature(entry)` (~L11665) → discovery-record keepsake (flavor + stats + plain `CFB-` code) for Legendary+ finds.
- `shareWhere(d)` (~L10408) → `CF1-` world code; a hosted page shares a full deep-link (`#CF1-…`), a local `file://` shares the bare code. `travelToCode` (~L10433) decodes and is **gated by `ascAllows`** (Chapters travel lock) and `withinReach`.

## 3. Key tables & numbers (REAL values)
- **`breedOdds(a,b)`** = `clamp(0.95 − (tierA+tierB)*0.06 + stardustBonus(), 0.08, 0.97)`. Min 8%, max 97%.
- **`stardustBonus()`** = `min(0.15, floor(essenceEarned/50) * 0.01)` — up to +15pp breeding odds.
- **`levelOf(g)`** = `min(9, floor(sqrt(max(0, xp)/6)))`. **Level cap = 9**, reached at `xp = 6*81 = 486`.
- **Champion xp clamp on decode** = `clamp((+o.x)|0, 0, 6*81)` = **0..486** → arrives at ≤ L9, then flagged `exhibit=true`.
- **`floraStat(g)`** = `STAT_KEYS[hashInt(g.seed, 0xF0, 7) % 5]` — deterministic stat flavour (vit/fer/res/agi/ins).
- **`faunaTastes(g)`** = shuffle of `STAT_KEYS` via `mulberry32((seed ^ 0xFEED))`; `likes = [0,1]`, `dislikes = [4]`.
- **`FEED_EVENTS`** (~L11873): loved `fed` +2/+2/+3/+2 · neutral +1/+1/+1/0 · disliked −1/−1/0/−2.
- **`creatureCondition`** thresholds: <0.05 Healthy · <0.3 Bruised · <0.6 Injured · else Critical. `hurt` persists 0..0.85 (feedPair caps mend-side at 0.95 on death check).
- Player `pstats` cap **330**; `HP_MAX = max(20, round(vit*2))`.
- `normGenome` clamps: `brood`≤200, `fed`≤200; `apex` honored only 12..TIER_MAX, `par` only 8..11.

## 4. Data / save fields
Per-creature genome fields that persist (in `codex` entries, save `codex[]`):
- **`fed`** — bloodline nourishment (feed growth); **`brood`** — bred-generation depth; **`hurt`** — wound fraction 0..0.85; **`xp`** — leveling (drives `levelOf`).
- Player: **`pstats`** (vit/fer/res/agi/ins), **`hp`**/`HP_MAX`, `essence`/`essenceEarned` (drives `stardustBonus`), `stats.breeds/breedwins/feeds/feedfails`.
- **Code payloads** (not saved — transient strings):
  - `CFB-` = base64url of `{g:genome, n:name, x?:xp}` (x only on champion, only if xp>0).
  - `CF1-` = base64url of `{t, g:[galaxy fields], s?:[star], p?:pseed, n?:name}`.
- **Anti-cheat on decode** (`normGenome`, ~L11275): every trait coerced to a sane non-negative int; `parents`, `hurt`, `xp`, `_mult`, `_wf` **deleted**. Imported creatures arrive fresh at level 1 — **except** the champion path, which re-applies clamped xp and sets `exhibit=true` (duel-only, never owned or bred).

## 5. Determinism
**Share codes MUST be deterministic / cross-device** — the whole "same universe on every device" promise depends on it, and it's a hard rule (no `Math.random`/`Date.now` in anything that feeds generation).

- A code carries the **seed**, not rendered output. Everything downstream — portrait, battle stats, tastes, flora stat flavour, ability — is a **pure function of that seed** via `mulberry32`/`hashInt` (`floraStat` uses `hashInt`, `faunaTastes` uses `mulberry32(seed^0xFEED)`), so the recipient regenerates a byte-identical creature.
- **Duels are deterministic:** `runDuel` (~L11312) seeds its RNG with `mulberry32(hashInt(seedA, seedB, 0xD0E1))` — the same matchup plays out identically on every device (the tutorial even advertises this).
- Codes **deliberately don't carry runtime randomness** — no `Math.random` state, no battlefield modifiers (`_mult`/`_wf`), no injuries (`hurt`). The **only** leveled state that travels is champion `xp`, and it's clamped to the L9 ceiling and marked exhibit-only so a shared champion can't be farmed as an owned/breedable creature.
- `CF1-` world codes store galaxy/star coords + seed; the world is regenerated from seed on arrival — the code is a pointer, not a snapshot.
- Note: breeding/feeding/healing **outcomes** use live `Math.random()` for the roll (they're player actions, not shared content), so they are intentionally *not* reproducible — only the shareable artifacts (codes) are deterministic.

## 6. Code anchors (functions + ~line numbers)
- `encodeCreature` L11266 · `normGenome` L11275 · `decodeCreature` L11296 (champion xp clamp + exhibit L11308) · `runDuel` L11312 · `levelOf` L10847
- `shareCreature` L11642 · `shareChampion` L11654 · `recordCreature` L11665 · Champion button gate L8948 / dispatch L8980
- `breedOdds` L11695 · `stardustBonus` L11694 · `breedPair` L11845 · `faunaTastes` L11859 · `creatureCondition` L11866 · `FEED_EVENTS` L11873 · `feedPair` L11893
- `openPicker` L11946 · picker resolve (breed/feed/heal) L11987–12078
- `floraStat` L12101 · `healExplorer` L12181 · `damageExplorer` L12170 · `STAT_KEYS`/`STAT_META` L12091
- `encodeWhere`/`decodeWhere` L10370/10379 · `shareWhere` L10408 · `travelToCode` L10433 (ascAllows gate L10436)

## 7. Open questions / pending
- **Champion xp ceiling vs `levelOf`:** decode clamps xp to `6*81 = 486` (= exactly L9 threshold). Correct, but the magic number `6*81` is duplicated across `levelOf` and `decodeCreature` — a change to the level curve must touch both.
- **`exhibit` creatures are duel-only** — confirm every ownership path (feed/breed/scout/conquer champion) rejects `entry.exhibit`; the flag is set on decode but this doc doesn't audit every consumer.
- **Discovery record gating:** `recordCreature` is described as "Legendary+"; the function itself doesn't enforce a grade floor — the gate lives at the call site (verify).
- **Iron Gut interaction:** a `gutsy` beast has `pois = 0` in `feedPair`, so it can never be wounded/killed by food; intended, but means such beasts also never trigger the `disliked` wound path.
