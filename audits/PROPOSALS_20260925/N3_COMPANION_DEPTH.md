# N3 — Companion depth (program Arc 5): taste, care, healing, bond, missions

Proposal by Claude, 2026-09-25. Writing only, no code. Completion-ledger item N3
(`audits/OPERATING_MODEL_20260925/COMPLETION_LEDGER.md:29`). Ends in one recommended default Nick can accept with "yes".

## 1. What exists today

**Decisions already made. This proposal must not contradict them.**
- A catalogue species is not a living companion. Care, injury, bond and assignment belong to the individual (`port/DECISIONS.md:216-229`).
- Breeding is nonlethal and does not consume either parent. Both parents go into active-play Recovery: 8 minutes after a success, 2 after a failure. Recovery blocks breeding, combat and dispatch. Parents at `hurt >= 0.3` cannot breed (`port/DECISIONS.md:303-333`).
- Missions (`port/DECISIONS.md:231-239`) run on the persisted active-play clock. Their result is sealed at dispatch and claimed exactly once. By default they never kill a companion, and they return "materials, gear, blueprints, lore and mementos".
- No dark patterns (`port/DECISIONS.md:258-265`): no streak decay, no expiring missions, no manipulative notifications. "Bond grows from varied meaningful play, not attendance maintenance."
- Care, feeding, injury and mission return can each pick a variant of the creature's call. There is no idle polling and no "absence distress" (`port/DECISIONS.md:283-291`).

**Code that is live in v2**
- **Four companion writers are live:** Feed, Breed with Recovery, Rename and Field Scout (`port/V2_PROGRAM_ROADMAP.md:2531-2545`).
- **Feed** has no dice roll. It adds exactly +1 `fed` (capped at 200), consumes one flora and heals nothing (`port/v2/packages/domain/acquisition/src/feed.ts:31-34,130-143`).
- **`fed` already makes a companion stronger in combat:** +10 raw bonus per point, with a soft knee (`main.js:15516`, lifted verbatim). v2 combat reads it (`port/v2/apps/game/src/arc6-combat-action.ts:222-229`).
- **Wounds are one-way today.** v2 combat can wound a companion up to `hurt 0.85` (`port/v2/packages/domain/combatcore/src/combat-settlement.ts:134-135,517-541`). A wounded companion fights at up to 47% below strength (`main.js` battleStats wound clause). Nothing in v2 heals. A companion wounded past 0.3 therefore can never breed again.
- **The save shape is mostly ready.** `CreatureInstanceV1` already has `bond: CompanionBondV1 | null`, with up to 128 memories and 128 memento IDs. It also has `assignment: {kind:'mission', missionId} | {kind:'recovery', readyAtActivePlayMs}` (`port/v2/packages/domain/acquisition/src/model.ts:128-163,671-702`). The compact ownership delta already carries both fields (`model-v2-delta.ts:59-62,311-316`). Every existing companion has `bond: null`.
- **Availability is already worked out from the clock:** `projectCompanionAvailabilityV1` locks `breed`/`combat`/`dispatch` and treats a Recovery as done once `activePlayMs >= readyAtActivePlayMs`. Mission assignments never expire on their own (`companion-availability.ts:14-32,90`).
- **The clock:** F4 persists `activePlayMs` together with SessionRNG and its per-domain draw counts (`port/v2/packages/persistence/src/active-play.ts:20-28`). Weekly Charters are the model for how to use it. Moving the device clock can't reset or advance anything (`port/v2/apps/game/src/weekly-charters.ts:1-17`, 4 active hours per week). Capture uses 20-minute active cycles (`packages/domain/acquisition/src/snapshot.ts:19`).
- **Legacy tastes are deterministic already.** `faunaTastes` seeds `mulberry32(seed ^ 0xFEED)`: 2 liked flavours and 1 disliked (`main.js:16421-16426`). v2 already has `floraStat` (`explorer-meal.ts:10,243`). What used randomness in legacy is the meal outcome itself: a roll picks from an event bank and can poison, and poison can kill (`main.js:16455-16513`). Legacy XP ledger: first welcome meal +1 XP, each first taste +2 XP.
- **The XP curve** is `level = floor(sqrt(xp/6))`, capped at level 9 / 486 XP (`main.js:15109`). Reference awards: duel +8, conquest +20, Guardian +60, successful breed +2 (+5 for a first lineage).

**Open, and blocked only on decisions** (`EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md:1090-1110`): mission catalogue, durations, party rules, risk and reward bands, stories and mementos, recall and full-inventory behaviour, bond thresholds and unlocks, and which legacy feed stakes survive.

**Defect found while reading (likely; confirm with a test).** Feed refuses when `creature.assignment !== null` (`feed.ts:130`). The Compendium Feed status works the same way: any non-null assignment shows "This companion is recovering." (`compendium-feed.ts:299-305`). Neither checks the active-play clock. A parent whose Recovery has already finished still carries the old `recovery` bytes. It therefore seems unable to be fed again until it breeds again. Stage 1 fixes this by projecting availability first, as Breed does.

**Boundary kept.** Captured Guardians and Titans live in the separate `arc6.guardian-companions` overlay. They are not candidates for care or missions (`BREEDING_AND_SHARING.md:130-137`). This proposal keeps that boundary.

## 2. The decisions Nick must make

1. **What feeding risks.** Do companion meals keep legacy poison and random events, or become deterministic by taste?
2. **How wounds heal.** Which actions mend `hurt`, how fast, and on which clock?
3. **Bond.** What grows it, how many levels there are, what each level unlocks, and whether it ever touches combat stats.
4. **The shape of a mission.** Types, target worlds, party size, concurrent slots, and durations in active-play minutes.
5. **Mission stakes.** Rewards and caps measured against the existing economy, wound bands, the failure outcome, recall, and what happens when the inventory is full.
6. **What ships first.**

## 3. Options

### Option A — Legacy-faithful care (port the v1 feed rolls)
- **Player:** a meal is a gamble. The event text varies, a disliked or rare flora can poison, and poison wounds. Death would be removed and poison would stop at Critical.
- **Cost:** medium. Needs a new SessionRNG domain and receipt for every meal, and the legacy event banks rebuilt. Missions would still need design afterwards.
- **Save/clock:** a new RNG draw domain, and Feed policy v2. Healing still has no home.
- **Risk:** it punishes care, against D9/D13's attachment direction. It also makes feeding the only way to heal, which is the v1 trap ("feed it flora it ♥ loves", `main.js` conquest toast).

### Option B — Deterministic care, bond built from firsts, compact missions (recommended)
- **Player:** each companion has visible likes and dislikes that you discover by feeding it. A loved meal grows it more and mends wounds. Rest heals fully while you play. Bond rises only from new shared experiences and never decays. Missions let a companion work while you explore. They show their duration and risk up front, and results are revealed on return.
- **Cost:** Stage 1 (care and bond) is small to medium: one policy table, one Rest action, one bond projection. Stage 2 (missions) is medium to large: one new carrier plus dispatch, claim and recall transactions.
- **Save/clock:** `bond` and the `mission` assignment already exist in the carrier. Only one new namespace is needed, for mission records. Every timer is an `activePlayMs` boundary.
- **Risk:** missions add a material source, so they must stay a trickle (Codex's instrument proves it). Gear and blueprint rewards wait on N2.

### Option C — Care and bond only; missions after N1 and N2
- **Player:** as B Stage 1, but no missions for now.
- **Cost:** smallest.
- **Save/clock:** no new namespace.
- **Risk:** missions remain the one D10 promise still missing, and "companions do something while I explore" stays absent from the beta that D19 says must be feature-complete.

## 4. Recommended default (Option B, shipped in stages)

**Tastes.** Tastes derive from the genome, as legacy does: 2 loved flavours and 1 disliked, with no new save field. A flavour stays hidden on a companion's card until you have fed that companion a flora of that flavour. The discovery is stored as a bond memory `taste:<flavour>`.

**Feed policy v2: deterministic, no roll, no companion poison.**

| Taste | `fed` gain | Wound mended | First-time XP (paid once, keyed on the bond memory) |
|---|---|---|---|
| Loved | +2 (+3 if flora rarity ≥ 4) | −0.25 `hurt` | +1 for the first welcome meal, +2 for each newly discovered flavour |
| Neutral | +1 (same as today) | −0.10 `hurt` | +2 for each newly discovered flavour |
| Disliked | 0; the flora is still eaten | none, and no harm | +2 for each newly discovered flavour |

- The 200 `fed` cap is unchanged, so the most combat power care can add is the same as today (the soft-knee bonus). Loved food only gets there faster.
- XP from care is capped at 11 per companion for its whole life.
- Explorer meals keep their own poison, unchanged. Iron Gut keeps its combat effect.
- Feed and Breed treat a finished Recovery as available, which fixes the §1 defect.

**Rest heals.** Rest is a home "mission" with no risk and no reward. It takes 2 active minutes per 0.1 of `hurt`, rounded up, so at most 20 minutes (Critical 0.95 → 20, Injured 0.35 → 8). When it finishes, `hurt` returns to 0. Rest blocks breed, combat, dispatch and feed, like any assignment. It does not use a mission slot. Nothing heals while the game is closed.

**Bond grows only from distinct firsts.**
- A companion's memories are unique keys, and each key counts once for the companion's whole life. Bond never goes down. Its level comes from the number of memories.
- Memory sources: each taste discovered (up to 5); the first meal; the first return from each mission type; each new world a mission returns from; the first Long mission; the first recovery from Injured or worse; the first child; the first Scout interception. Later, via N1/Arc 6: each distinct Guardian victory, the first duel win and the first conquest.
- Renaming and repeated identical actions grant nothing.

| Level | Name | Memories | Unlock (sidegrades only; bond never multiplies combat stats) |
|---|---|---|---|
| 0 | Wary | 0 | — |
| 1 | Familiar | 3 | Greets you with its "selected" expression when you open its card; ♥ on known likes |
| 2 | Trusted | 8 | Can take Long missions |
| 3 | Devoted | 15 | Half the wound chance on missions |
| 4 | Kindred | 25 | Pick a preferred mission type (+1 material there); memento shelf and Chronicle page |
| 5 | Soulbound | 40 | Its own bonded call variant (Arc 8) and a portrait frame |

To reach Soulbound, a companion needs about 28 distinct worlds or combat firsts. That rewards varied play, not attendance.

**Missions (Stage 2).**
- Party of 1. Two field slots at once; Rest does not use one.
- Target: any world you have already landed on (Atlas "Visited"), identified by its canonical address.
- Two field types:
  - **Prospect** returns materials from that world's canonical deposit list. It does not drain the world's finite Mine reserve.
  - **Survey** returns an authored lore line and a small amount of Stardust. It never reveals a species you have not yet seen.

| Duration | Active-play minutes | Prospect materials | Survey Stardust | Companion XP | Wound chance, shown before dispatch |
|---|---|---|---|---|---|
| Short | 10 | 3 | 0 (lore only) | +2 | 0% |
| Standard | 25 | 8 | 1 | +4 | 10%: Bruised (0.15) |
| Long (Trusted+) | 60 | 18 | 3 | +8 | 20%: Bruised, or Injured (0.35) |

- **Outcome.** The whole result is drawn once at dispatch from the new SessionRNG domain `companion-mission`, sealed in the receipt, and shown only on return.
- **Wounds.**
  - A wound also halves that mission's materials.
  - A wound is never Critical and never fatal.
  - A companion with a good trait fit (from its ability theme and realm, per a table Codex tunes) has its wound chance halved. This stacks with Devoted.
- **First Long return per world:** also grants one memento, a cosmetic entry in `bond.mementoIds` shown in the Chronicle.
- **Recall.** You can recall at any time. The companion comes home unhurt with nothing, and the sealed result is thrown away unseen.
- **Rewards are never lost.** A finished mission never expires. If a reward can't fit in the inventory, the claim waits until it can.
- **While away,** a companion cannot breed, fight, be dispatched again or be fed. Rename and Scout designation still work, because they only change identity. An away Scout does not intercept hostile Discover Life harm.
- **Economic ceiling.** Two Long missions at once give at most 36 materials and 6 Stardust per active hour. For comparison, Weekly Charters pay about 16 Stardust per active hour and each Research costs 20–300 Stardust. Codex sets the final rates and must show that mission income stays at or below 15% of an actively mining player's hourly material income.

**Ships first:** Stage 1 (taste, Feed v2, Rest, bond levels 0–5), then Stage 2 (Prospect and Survey missions). Gear and blueprint mission rewards, parties of 2, and combat-bond memories wait for N2 and N1.

**Save/clock impact.**
- `bond: null` counts as level 0 with no memories.
- Old saves load unchanged.
- The only new namespace is `player/arc5.missions` v1. When it is absent, nothing is away.
- Rest reuses `{kind:'mission', missionId:'rest:…'}`. Older builds already accept that shape and just show the companion as locked.
- Feed moves to policy v2. Old receipts replay under v1.
- Every "ready at" is `activePlayMs + duration`, checked against `MAX_ACTIVE_PLAY_MS` as Breed does.

## 5. Staged engineering plan

**Lane split.** Claude owns UI, presentation, game wiring and the pure planners. Codex owns the economy and loot rate tables and the instruments. Every stage uses the existing receipt/CAS path (the exact-five carriers and the F4 receipt): no retry, no optimistic publication, and a convergence reload whenever it's unclear whether a write landed.

| Stage | Work | Owner |
|---|---|---|
| 1a | Lift `faunaTastes` verbatim with a parity test; add the taste projection (known vs hidden, from bond memories) | Claude |
| 1b | Feed policy v2 (table above), projecting availability before the assignment check (the §1 fix); first-award XP keyed on bond memories | Claude |
| 1c | Rest action and its finish (`hurt → 0` at the active-play boundary, applied by the next receipt write, as Recovery does); bond memory writer and level projection | Claude |
| 1d | iPhone-first Compendium detail: taste chips, condition with a "Rest (8 min of play)" button, bond meter with the next unlock, Guide text, draft release notes (New Features & Systems) | Claude |
| 1e | Instruments: outcome tests through the real UI (a loved meal mends; a disliked meal is harmless); a clock-skew guard (device clock moved ±1 day grants and advances nothing, like `harvestclock-check`); the Recovery-then-Feed regression; negative controls in both directions | Codex |
| 2a | Mission rate table (materials, Stardust, wound bands, trait fit) and the economy-share instrument (the ≤ 15% rule) | Codex |
| 2b | `player/arc5.missions` carrier; dispatch, claim and recall transactions; sealed receipt; SessionRNG domain; exactly-once claim across double-click, two tabs and reload | Claude (domain and wiring), Codex (review and instrument) |
| 2c | Mission board sheet with Away/Ready badges, disclosure before dispatch, return reveal using the D15 return expression and its text counterpart, Chronicle entries | Claude |
| 2d | Instruments: double-claim and two-tab test, a reload-reroll attempt, full-inventory claim, and the clock guard extended to missions | Codex |
| 3 | Gear and blueprint rewards (after N2), combat-bond memories and parties of 2 (after N1); optional weekly-Charter "mission" event | Both, after those calls |

Each stage ends with validate/smoke green, and Guide, release notes and the docs (`EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` §7, `BREEDING_AND_SHARING.md`, ROADMAP) updated in the same batch.

## 6. The one-line question for Nick

**N3: accept the default — taste-based Feed with no roll and no companion poison (loved +2 fed and mends), Rest heals on the play clock (up to 20 minutes), bond levels 0–5 grow only from distinct firsts and unlock sidegrades (never combat stats), and 10/25/60-minute active-play Prospect/Survey missions with 2 slots that pay materials, XP, lore and a little Stardust; care and bond ship first, missions second? (yes / change X)**
