# Review 1 of 4 — Technical, Security, Bugs, and Exploits

**Lens:** senior gameplay engineer + adversarial QA  
**Build:** Celestial Frontier v1.8.2 “Steady Hands”  
**Verdict:** **9.7/10 technical core**

---

# Scope

This review focused on:

- procedural determinism
- generation validity
- combat fairness
- rarity invariants
- saving and corruption recovery
- stored markup/code execution
- crafting and salvage exploits
- breeding and duplication abuse
- affix persistence
- share-code abuse
- universe-generation integrity

---

# Stress Results

| System | Fresh volume | Failures |
|---|---:|---:|
| Initial creatures | 100,000 | 0 invalid |
| Hybrids | 60,000 | 0 invalid |
| Breeding determinism | 60,000 | 0 mismatches |
| Exact mirror duels | 50,000 | 0 exceptions |
| Random ability duels | 100,000 | 0 exceptions |
| Star systems | 10,000 | 0 invalid |
| Planets | 28,237 | 0 invalid |
| Affix rolls | 1,000,000 | 0 invalid |
| Rarity seeds | 60,000,000 | 0 downgrades |
| Creature-code round trips | large core sample | 0 failures |

## Creature tiers across 100,000 initial specimens

- Tier 0: 19,090
- Tier 1: 24,767
- Tier 2: 23,341
- Tier 3: 16,153
- Tier 4: 8,942
- Tier 5: 4,467
- Tier 6: 2,208
- Tier 7: 761
- Tier 8: 225
- Tier 9: 40
- Tier 10: 6

Maximum ordinary sampled Power was 597.

---

# Combat Fairness

## Exact mirrors

- Side A: 24,940 wins
- Side B: 24,916 wins
- Draws: 144
- Errors: 0

## Random ability-bearing combat

- Side A: 49,880
- Side B: 49,886
- Draws: 234
- Errors: 0

There is no evidence of a renewed first-slot bias.

---

# Exploit Regression

## Duplicate creature insertion

Adding the same genome twice left the collection size unchanged.

**Passed**

## Consumed-parent reuse

A valid breed succeeded. Reusing the same consumed parents returned a stale-parent rejection.

**Passed**

## Double crafting

Calling the same recipe twice with exactly enough material for one item produced one item and no negative cargo.

**Passed**

## Salvage arbitrage

No recipe returned more materials through salvage than it consumed through crafting.

**Passed**

## Affix resurrection

A corrected confirmation-path regression was run:

- before salvage: one equipped `rig1` with a yield affix
- after confirmed final-copy salvage: count 0, equipment cleared, affix cleared
- after reacquiring and equipping `rig1`: old affix remained absent

**Passed**

## Oversized creature code

Oversized payload was rejected.

**Passed**

## Stored markup and JavaScript

Hostile HTML/SVG/image-event strings were inserted into save-derived player, creature, notification, and Atlas-style data.

- JavaScript execution: 0
- hostile event images mounted: 0
- page errors: 0

**Passed**

## Malformed save collections

Wrong-type collections were normalized rather than destroying the whole save. Valid scalar progress survived.

**Passed**

## Backup recovery

A corrupt primary save with a valid backup recovered progress and rewrote a valid primary record.

**Passed**

---

# Important Gameplay Logic Defect

## Breeding XP is applied to a consumed parent

On success:

```js
awardXP(aEntry.id, 2, "a successful union");
awardXPOnce(aEntry.id, "lineage:" + key, 5, "a first-of-its-kind lineage");
...
removeFromCodex(aEntry.id);
removeFromCodex(bEntry.id);
```

The parent receives up to seven XP, then is removed. The child receives zero.

This is not a security exploit, but it breaks a headline progression promise and makes the event reward transient.

**Severity: High gameplay logic**

Award XP to the child after `_storeSpecies`, or to a persistent lineage record.

---

# Known Open Issues Not Refiled as New

The following were explicitly acknowledged by the supplied reviewer notes and were not treated as newly discovered regressions:

- burn/thorns kills lacking a death line
- conquest affix selection targeting a worn slot
- latent stacking-context traps
- delayed wound assertion in training Step 13
- partial modal focus memory
- high-tier Ambush
- first-paint HD thumbnail generation

---

# Technical Recommendation

The build’s core engine is suitable for a Gold candidate. No new critical exploit, code-execution path, economy duplication loop, deterministic failure, or broad combat bias was confirmed.

Fix the breeding XP destination and retain the existing exploit corpus as a mandatory CI gate.
