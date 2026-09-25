# N1 — the combat decision model (Arc 5.5 [HUMAN] gate)

Proposal by Claude, 2026-09-25. Writing only; no code changed. Ledger item N1
(`audits/OPERATING_MODEL_20260925/COMPLETION_LEDGER.md:27`). Nick answers in one line (§6).

## 1. What exists today

**The fight is one seeded auto-duel.** The player picks one fighter, reads a forecast, and presses
Challenge. Nothing the player does after that changes the result.

- Fighter choice: the explorer, one eligible owned fauna companion, or one captured Guardian/Titan
  (`COMBAT_AND_CONQUEST.md:217-274`, the v2 decision contract; `port/V2_PROGRAM_ROADMAP.md:2670-2701`).
- Opponent: only the world's apex native: Titan, then Apex Guardian, then the strongest wild fauna
  (`COMBAT_AND_CONQUEST.md` §2.5). It is one fight per world, and a conquered world cannot be won again.
- Resolver: `runDuel` in `port/v2/packages/domain/combatcore/src/combatcore.verbatim.js:751-833`,
  a verbatim, parity-locked copy of v1. Its RNG is seeded only by the two creatures' genome seeds
  (line 753). **The same pair always fights the same fight.** A rematch differs only if stats changed.
- Abilities are passive hooks (`dmg`, `taken`, `first`, `dodge`, `stun`, `regen`, `burn`, `execB`,
  `shred`, `cap`, …), not player actions (`COMBAT_AND_CONQUEST.md` §2.2-2.3).
- Forecast: 160 seeded replays, shown as Favored / Even / Dangerous / Overwhelming with up to three
  reasons (`port/v2/apps/game/src/combat-card.ts:28-70`, `:150-208`).
- The call site: `port/v2/apps/game/src/arc6-combat-action.ts:548-555`. It runs one duel, then
  `planCombatSettlementV1` seals one receipt through one CAS (`combat-settlement.ts:24-36`, `:624`).
- **Defeat stakes are still the v1 mercy law.** The explorer stops at 1 HP. A bred companion crawls
  home Critical once. **A wild-caught or unbred companion is permanently lost**
  (`combat-settlement.ts:525-551`; card copy `combat-card.ts:238-249`). The code comment at
  `combat-settlement.ts:43-44` says non-punitive recovery "remains a HUMAN gate". That gate is this decision.
- Presentation: the timed Combat Chronicle with HP meters, log, Skip and Share
  (`combat-chronicle.ts:21-30`). Behind `?battle2=1` it also has the painted stage
  (`combat-battle-scene.ts:1-3`, `battle2-wiring.ts:2-4`). The stage's turn machine already draws a
  "command window (cursor + confirm)" (`battle2/choreography.ts:1-2`, `:48-49`). **Today that cursor is
  decoration.** No player input reaches the resolver.
- Missing: party, stances or tactics, retreat once a fight starts, friendly duels (v1 had them, at +8 XP;
  v2 copy says "unavailable": `release-content.ts:901`), and other encounter types. The habitat compiler
  already knows three kinds: `'wild' | 'guardian' | 'duel'` (`battle-habitat.ts:32`). `&duel=1` is a
  dev harness only (`battle2-matchup.ts:45`).

**Rules this proposal must keep** (from `port/DECISIONS.md`):
- §9 (line 216): combat targets one exact owned individual, never a catalogue species.
- §10 (line 231): no default permanent loss of a bonded companion. Any irreversible mode needs
  explicit, informed consent.
- §13 (line 258): no hidden odds, no punishment for breaks, no dark patterns.
- §16 (line 303): Recovery runs on active-play time. It blocks breed, combat and dispatch, and wall time
  never advances it.
- D-ARC6-AFFIX-1 and D-ARC6-GUARDIAN-REWARD-1 (lines 387-411) belong to N2 (Codex). This proposal does not decide them.
- D6 (`audits/MAILBOX/DECISIONS.md`): battle2 becomes the default only after the iPhone probe and the
  v2 certificate. N1 must work on the plain Chronicle too.
- The counterplay contract (`COMBAT_AND_CONQUEST.md:217-274`): every shown threat has a legible
  answer with a trade-off. No control may exist that the resolver ignores. A deliberately
  disconnected option must fail a test.

## 2. The decisions Nick must make

1. **Party size.** How many fighters, and do they fight together or one after another?
2. **Player choices.** What does the player decide, and when? Before the fight only, or also during it?
3. **Retreat.** Can a fight be left once it starts, and what does leaving cost?
4. **Defeat stakes.** Does v2 keep v1's permanent loss of unbred companions, or does defeat mean Recovery?
5. **Encounter types.** Which fights exist besides world conquest, and in what order do they ship?

## 3. Options

### Option A — "Prepared duel" (smallest)
Keep the 1-on-1 auto-duel. Before the fight, add one **stance** for the fighter and an optional
**withdraw threshold** (for example, "pull out below 30% HP"). Defeat becomes Recovery.
- *Player:* a real pre-fight choice, but nothing happens during the fight. Companions still matter one at a time.
- *Cost:* small. One new pure resolver, one card control, one additive receipt field. About 1 batch.
- *Determinism/save:* all inputs are sealed before the fight. No in-flight state is saved.
- *Risk:* thin. Players may still read the fight as "stats win". Weak Arc 5.5 human evidence.

### Option B — "Plan, then watch, with Break choices" (recommended)
A **party of up to 3** fights as a **relay**: one fighter at a time, and the defender's damage
carries over. Before the fight, the player sets the order and one stance for each fighter. During the fight,
the fight pauses at a few **Breaks**, and the player chooses **Hold, Swap or Withdraw**.
- *Player:* read the threat, build a team, answer it, and make a small number of tense decisions
  mid-fight. It reads well on a phone: three portraits, one sheet at each Break.
- *Cost:* medium. A new relay resolver that can pause, an append-only decision list on the open
  receipt, card and Break UI, and battle2 swap beats. The stage stays 1-on-1, so there is no new rig work.
  About 3-4 batches plus Codex's instrument.
- *Determinism/save:* the fight is a pure function of (sealed plan + decisions so far). A reload
  re-simulates to the same Break. There is no reroll, and closing the tab cannot escape the fight.
- *Risk:* the saved open-fight state is new. Stance numbers need a balance instrument so that no
  stance dominates.

### Option C — "Turn-by-turn commands" (Pokémon-style)
Every turn, the player picks an action from 3-4 moves. The timing bar becomes a real input.
- *Player:* the most control. It is also the slowest on a phone and the most tiring, and every
  fight becomes long.
- *Cost:* large. Abilities are passive hooks today, so every creature would need an authored move list.
  It needs a new damage model, new balance for 631+ fauna, and saved in-flight state on every turn.
- *Determinism/save:* this is possible, but the save state is heaviest. It breaks v1 combat parity
  entirely.
- *Risk:* high. Content debt is huge, and it contradicts "readable decisions, not an overloaded
  action bar" (`COMBAT_AND_CONQUEST.md:251-253`).

## 4. Recommended default (Option B, concrete)

**Party.** Up to **3 fighters**. Any mix of the explorer and eligible companions is allowed; a
companion in Recovery is not eligible. The fighters go in the chosen order as a relay. The defender
keeps its lost HP between fighters. A fighter who comes in starts at its own current health. Turn order is
decided again by Agility. One fighter is still allowed, and it plays exactly like today.

**Stances** are chosen per fighter before the fight. The default is Balanced, which changes nothing.
There are three alternatives. Each one answers a threat the dossier names, and each has a trade-off:

| Stance | Effect (placeholder numbers; Codex's instrument tunes them) | Answers | Gives up |
|---|---|---|---|
| Press | +15% damage dealt, +10% damage taken | sustain (mend/thirst), fury ramp, enrage: end it fast | exposed to burst, execution |
| Guard | −15% damage taken, −10% dealt, blunts the opener | burst/crit, ambush opener, reckoning | a long fight feeds regen, burn, rend |
| Evade | +8 points dodge, −10% damage dealt | stun/shock control, one huge blow | burn and rend still land |

The defender dossier on the card turns the defender's real hooks into short, plain threat lines,
for example "Hits in bursts — Guard blunts it." These lines come only from resolver facts. No
invented type chart is allowed.

**Breaks** are decisions made during the fight. A Break happens **once per fighter**, when its HP first falls to one-third or
less, and also **before the next fighter comes in**. The fight waits; there is no timer. The choices are:
- **Hold:** keep fighting.
- **Swap:** the current fighter leaves with the HP it has left, and the next fighter comes in.
  A fighter who swaps out does not come back into this fight.
- **Withdraw:** the whole party retreats.

A "Let it play" toggle on the card resolves every Break as Hold. That choice is sealed in the
receipt, so auto players keep today's one-press fight.

**Retreat rule.** You can decline before commit, as today. Withdraw is always offered at every Break,
so a fight can never trap you.
- Withdraw gives no conquest, no reward and no XP.
- A fighter who fell goes into Recovery.
- A fighter who withdrew below 55% HP takes the existing hard-won scar.
- The defender is back at full strength next time.

**Defeat stakes (nonlethal).** A fallen companion is never removed.
- It gets the existing wound (`hurt`) and **Recovery** in active play, reusing the §16 carrier.
- The explorer keeps the 1 HP mercy floor, and it still cannot lead below 25% HP.
- Recovery length is Codex's economy call. The suggested default is **10 minutes** of active play after defeat and **4** after withdrawing.
- Permanent loss is removed from the default. A named, opt-in, consent-per-fight mode is **not built** unless Nick asks for it.
- Companions already lost in saved games stay lost. History is not rewritten.

**Dice.** The fight's RNG is seeded by the world, the defender and each fighter's creature seed.
It has no attempt counter. The same plan always gives the same fight, and reload cannot reroll it. A different
plan gives a different fight. Retrying costs Recovery time, so scouting a fight has a real cost.
The forecast still shows odds sampled over 160 seeds for the plan the player has chosen.

**Encounter types, in shipping order:**
1. **Conquest** (the existing apex native, including Guardians and Titans) gets the full model. It ships first.
2. **Friendly duel.** This restores v1: your companion against another owned companion, or against a
   wild fauna on the current world. There are no stakes and no Recovery. The winner gets +8 XP, as in v1.
   Codex decides the cap on repeats.
3. **Guardian phase.** At 50% HP, a Guardian or Titan changes to a telegraphed second behavior. The change is
   announced at the Break before it, and the player answers with Swap or Hold.

**Not now:** several enemies at once, several fighters on stage at the same time, per-turn move
menus, timed or reflex inputs, and permanent-death modes.

**What ships first:** Conquest with party, stances, Breaks, Withdraw and nonlethal Recovery. It must work
on both the plain Chronicle and battle2. Then Nick's playtest (the [HUMAN] gate).

## 5. Staged engineering plan

Owners: Claude owns combat presentation, battle2 and the Chronicle, and takes the combat resolver (ledger N1).
Codex owns economy, loot and the instruments.

| Stage | Work | Owner | Proof (outcome, not code path) |
|---|---|---|---|
| S0 | Record the answer as `port/DECISIONS.md` §20. Rewrite `COMBAT_AND_CONQUEST.md` §0. Mailbox note to Codex | Claude | docs agree; handoff in ROADMAP |
| S1 | Pure `runEncounterV1` in `packages/domain/combatcore` (new file; the verbatim `runDuel` is untouched): relay, stance modifiers applied to existing hook fields, Break points, a pure function of (plan, decisions) | Claude | **Parity control:** one fighter + Balanced + Let-it-play equals verbatim `runDuel` on the full fixture set; one mutated modifier fails it. Pinned replay |
| S2 | Settlement plan v2 schema: party, stances, decisions. Open-encounter record (additive, absent = none) on the same CAS/tab lease. Defeat means Recovery (a `combat-defeat` reason on the §16 carrier) | Claude; Codex reviews reward carriers | v1 receipts replay unchanged; reload resumes the same Break; a stale tab cannot decide twice; no companion removed on defeat; old saves load byte-safe |
| S3 | Card: 3-slot party picker, stance control, threat dossier. Break sheet (Hold/Swap/Withdraw). battle2 swap exit/enter beats. Chronicle party rows and bench HP. The decorative command cursor shows only at a real Break. Guide, Training and release copy | Claude | Real-UI outcome tests (smoke/`simrun dom`): each control changes the sealed receipt; a disconnected stance fails. Phone layout at 320-430 px; reduced motion; screen-reader Break sheet |
| S4 | Balance instrument (decision matrix): across fixture matchups, each threat has at least one answer that beats Balanced by a set margin, and no stance is best everywhere. Forecast phone-tier budget. XP split and Recovery lengths | Codex | Instrument negative-controlled both ways; numbers committed with evidence |
| S5 | [HUMAN] gate: Nick plays 6 scripted scenarios on the dev URL (burst Guardian, regen Titan, stun fauna, …) and says why he chose each answer | Nick | Arc 5.5 exit, recorded in the audit |
| S6 | Friendly duel (encounter type 2) | Claude (UI), Codex (XP cap) | real duel outcome test pays exactly +8 once (`duelxp` law) |
| S7 | Guardian phase (encounter type 3) | Claude | telegraph shown one Break earlier; fixture matrix |

**Risks.**
- Saved open-fight state is new. It stays append-only and receipt-bound, and a reload re-simulates it.
- Balance could make one stance always best. Codex's S4 instrument must pass before S5.
- Three fighters make the forecast cost about 3× per stance change. S4 sets a budget for it.
- Removing permanent loss changes a v1 invariant. That is allowed by the version-scope rule (CLAUDE.md), but it needs this explicit yes.

## 6. The one-line question for Nick

**N1: yes to "plan, then watch"?** It means a party of up to 3 fighting as a relay, and one stance each
(Balanced/Press/Guard/Evade). The player gets a Hold/Swap/Withdraw choice when a fighter drops to one-third health.
A defeated companion goes into Recovery instead of being lost. It ships first on conquest, then friendly duels, then Guardian phases.
