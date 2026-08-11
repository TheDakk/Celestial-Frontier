# Celestial Frontier — Breeding & Sharing

**STATUS:** legacy mechanics below match `main.js` as of 2026-07-31; the v2 art
integration note below matches the reset source as of 2026-08-11. Carries v1.8.6
and v1.8.7 (external rounds 8 and 9) updates — see the ⚠ notes inline.
**See also:** `LINEAGE_AND_BREEDING.md` — the v1.6 Earth-lineage layer on top of `breedPair`:
a child of an Earth parent keeps that parent's Earth RIG + wears the child's alien palette
(`_earthBlend`); the Earth-anchor strength drifts alien organically by the MATE's alienness
(`_anchorVal`, set in `crossGenome`; no toggle); and the specimen card carries an expandable
**Lineage** ancestry panel (parents + per-trait attribution, from the keyed inheritance coin +
`_pa`/`_pb`). All render-only / Earth-gated → determinism-safe.
**Purpose:** The husbandry loop (breeding, feeding, healing) that grows creatures and the player, and the cross-device code system (world codes, creature codes, champion codes, discovery records) that lets anyone regenerate the exact same life on any device.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

> **2026-08-11 v2 reset/Platinum correction:** genetics already wrote `_earthBlend` and
> `_anchorVal`, but a name alone could not identify one of the four duplicate
> cross-kingdom Earth records, and the v2 art override could claim a child through
> generic procedural routing before lineage rendering. The typed facade now records
> `_earthBlendKingdom` at the deterministic lineage choice. Fauna returns to its HD
> scaffold except for the exact reviewed set Fruit Bat, Eagle, Wolf, Elephant,
> Chameleon, Dragonfly and Octopus, whose marked hybrids use their lineage-owned
> modern painters; Sea Turtle and Great White Shark remain protected on the reviewed
> legacy route. Flora/fungi/microbe use the exact set+name owner. Portrait/thumb caches
> canonicalize the complete genome so different inherited traits, owners, Earth
> scaffolds and anchors cannot share a texture. `npm run hybridcheck` drives
> production browser pixels across every kingdom, parent orders, multi-generation,
> duplicate-name and injected-failure cases. The live schema-v4 guard requires
> 13 exact ID+kingdom+name five-stage lineages /251 assets across all four kingdoms,
> including Amoeba as the principal microbe row. The former 12-lineage /234-asset
> schema-v3 evidence remains sealed history, superseded for the broader Platinum ruler.
> The focused Apple and Vanilla continuity blockers are independently closed:
> Vanilla r6 passes at source SHA-256
> `5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`,
> preserved its byte-exact pure portrait, and produced five unique, integrated,
> progressively drifting stages in the historical 234/234-asset matrix stable in both browser
> orders. Green Algae's earlier stop was a real schema-v2 harness contract bug,
> not transient provenance; schema v3 repairs current-catalogue vs retained-
> legacy-route ownership without undoing D-CAT-1, and its sentinels are green.
> The source-`03ea297` successor's external review returned **PASS with optional
> polish only**. Its sealed UNREVIEWED fields remain preparation metadata; the
> representative matrix still does not prove every possible bloodline, and formal
> reset certification remains open under `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`.

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
2. On success: `child = evolveGenome(crossGenome(a.genome, b.genome), 1)`; `child.brood = Math.min(200, a.brood + b.brood + 1)`.
   - ⚠ **v1.8.6:** the sum was previously uncapped, so two 200/200 parents produced a child reading `brood 401` that silently snapped back to 200 on the next reload. Never a stat exploit — `battleStats`, `normGenome` and `_sanitizeSavedGenome` all already clamped at 200 — purely a card quoting a number the game does not honour. Clamped at the point the value is *made*, so live, saved and imported now agree.
3. De-collide the seed against existing `codex` ids (LCG step until unique); store via `_storeSpecies` named "A × B (bred)".
4. **Remove both parents regardless of outcome** — the union always consumes them.
5. Two Legendary-tier (tier ≥5) parents unlock the `bredlegend` achievement.
6. **The union's XP goes to the CHILD** (v1.8.3): `awardXP(born.id, 2)` + `awardXPPair(born.id, [a.name,b.name].sort().join(' × '), 5)`, run *after* `_storeSpecies` — both parents are gone by then (step 4). See PROGRESSION.md § Creature XP & leveling.
   - **The lineage key has been wrong twice, in opposite directions.** Before v1.8.3 both awards landed on `aEntry` and vanished with it, and the key was `[a.kind,b.kind]` — always `'Fauna+Fauna'` — so the bonus paid once per *parent* rather than once per cross. v1.8.3 then keyed it on `[a.id,b.id]`, which looks right and is worse: `codexId` is `'s'+seed`, i.e. **per individual**, and both parents are consumed one line above. **That key can never repeat**, so from v1.8.3 to v1.8.5 "a first-of-its-kind lineage" fired on *every* successful breed — the one-shot ledger worked perfectly and guarded nothing.
   - v1.8.6 keys it on the parents' **names**, which outlive the parents, matching what the code's own comment always said it meant: *a first for the PAIRING*. Never affected the numbers (7 XP is `levelOf` 1, mechanically identical to 0) — the toast was simply lying every time.
   - ⚠ **This still wants a multi-session probe.** One session cannot distinguish "pays once per pair, ever" from the old behaviour; that is exactly why the defect survived a round of external testing and was eventually found by *reading* the key rather than exercising it.
- Live `roll = Math.random()`; during training `roll = -1` (guaranteed success). `stats.breeds`/`breedwins` tracked; fires `gameEvent('bred', {ok})`.

### Feeding (`feedPair`, ~L11893)
1. **Flora consumed first** (`removeFromCodex(floraEntry.id)`) — always.
2. Taste: `faunaTastes` → the beast `loved`/`neutral`/`disliked`s the flora's stat flavour (`floraStat`).
3. Poison chance `pois` = `0` if the beast has **Iron Gut** (`ab.gutsy`), else `clamp((disliked?0.16:0.05) + tier*0.05 − res/800, 0.02, 0.5)`.
4. `roll < pois` → **toxic**: wound `dmg = clamp(0.16 + severity*0.22 + tier*0.045, 0.1, 0.92)` added to `genome.hurt`. If `hurt + dmg >= 1` the beast **dies** (removed from codex). Poison wounds, it doesn't execute — only a beast already spent dies.
5. Otherwise a `FEED_EVENTS[pref]` event applies `fed` delta to `genome.fed`, **clamped to 0..200** (loved meals of tier ≥4 get +1). Loved/neutral meals also **mend** existing `hurt`; a bad disliked meal can add a small wound.
   - ⚠ **v1.8.6:** the increment was previously uncapped — 120 loved meals drove the live value to `fed 240` against the 200 ceiling every consumer honours, so the card read a number that snapped back after a reload. The `delta` re-derived on the next line is taken *after* the clamp, so the "+n" the toast reports stays truthful once the ceiling is reached. Same class of divergence as `child.brood` above, fixed the same way: clamp where the value is made.

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

## ⚠ v1.8.4 — `fed` does not travel, and the preview stopped pretending it does

`crossGenome`'s field set has no `fed`. `breedPair` sums `brood` across both parents but nothing
carries `fed`, so **a hybrid of two well-fed parents starts at `fed = 0`** — up to ~2,000 power of
investment, silently gone.

That is arguably a design choice. What was unambiguously a **bug** is that the v1.8 breeding
preview quoted a range built from `battleStats` totals, which *include* the `fed` bonus the child
cannot inherit — measured at up to **6.2× overstated**. The v1.8 promise was "ranges only, never
the roll"; the range itself was wrong.

**Now:** the band is computed from stats with `fed` stripped from both parents, and when either
parent carries `fed` the card says so outright — *"fed bloodline does not carry over"*.

⏳ **OPEN DESIGN QUESTION (Nick's call, not changed):** *should* a child inherit some `fed`?
`brood` is summed, so the inconsistency is real. It interacts with the `fed` ceiling added in the
same release (see PROGRESSION.md). Deliberately left alone rather than changed quietly.

---

## ⚠ v1.8.7 — round 9: the lineage key, third revision

`awardXPPair`'s key is now built from the **genome**, not the display name:

```js
const _lin=(e)=>{ const g=(e&&e.genome)||{}; return String(g._earthName || speciesName((g.seed>>>0)||0)); };
awardXPPair(born.id, [_lin(aEntry),_lin(bEntry)].sort().join(' × '), 5, 'a first-of-its-kind lineage');
```

v1.8.6 keyed on `aEntry.name` / `bEntry.name`, which fixed the real bug but left the ledger
**bypassable by a UI action**: `entry.name` is assigned directly by the rename handler, so renaming
either parent re-armed the +5. The value is trivial against the 486 XP ceiling — the objection is
that a one-shot ledger should not be resettable from the interface. `_earthName || speciesName(seed)`
is the same string the Compendium shows but is *derived*, not stored, so it cannot be edited.

**The semantics, because they are not obvious and the key has now been wrong twice:**
`speciesName` is seeded per **individual**, so this groups Earth-descended creatures (a "Wolf × Bat"
pairing repeats and pays once) while every *procedural* pairing is genuinely unique and pays every
time. That is correct for this game's fiction — each catalogued procedural creature **is** its own
species — and both parents are consumed regardless, so no pairing can be farmed either way.

⚠ Worth stating plainly, because it changes what "fixed" means here: CF1802-16's real defect was
that the bonus fired on **every** breed including repeated Earth pairings. That is closed. It was
never true that *all* pairings should be rationed.
