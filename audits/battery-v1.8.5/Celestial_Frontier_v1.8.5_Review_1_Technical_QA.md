# Celestial Frontier v1.8.5 — Review 1: Technical QA and Exploit Hunter

## Score: 8.8/10, conditional

## Verdict

The underlying game engine is unusually stable for a browser-native procedural game. Large generation, breeding, combat, sharing, universe, rarity, affix, save, and economy batteries completed without invalid data or deterministic drift.

Final Gold should be held for the conquest odds-cache defect.

## Strongest findings

- 100,000 creatures: 0 invalid
- 60,000 hybrids: 0 invalid or nondeterministic
- 50,000 mirror duels: balanced
- 100,000 randomized duels: 0 errors
- 10,000 systems / 27,900 planets: 0 invalid
- 1,000,000 affixes: 0 invalid
- 60 million rarity seeds: 0 illegal downgrades
- Prior affix, crafting, stale-parent, duplicate-species, injection, malformed-save, and super-creature exploits remained fixed
- Veteran retraining save/reload restored protected data, including Earth history

## Blocking issue

`trueOdds()` memoizes using an incomplete key. It ignores feeding, brood, battle-stat changes, defender world modifiers, and sample count.

A cached 0% result remained on screen after actual odds became 100%. A cached 100% result remained after actual odds became 0%.

This is a player-trust failure in a headline feature and should block Gold.

## Secondary issues

- Live fed can exceed 200.
- A child brood value can exceed 200.
- First thumbnail paint still generates full HD.
- The 26,753-line source and shared lexical scope remain regression risks.
- 95 `innerHTML` assignment sites remain a security-maintenance burden.

## Technical recommendation

Fix the matchup cache first, add battle-signature mutation tests, then run the complete clean-install CI suite with source hashes embedded in every result.
