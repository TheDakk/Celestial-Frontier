# Celestial Frontier v1.8.6 — Full-Battery Gold Audit

**Build reviewed:** `Celestial-Frontier-main(11).zip`  
**Detected version:** **v1.8.6 — “Kept Promises”**  
**Source SHA-256:** `38d4885c80f4d87b88c68f0f95fb1c209b7a9987bd1f10029ef5b32594425aef`  
**Main runtime:** `celestial-frontier.html`  
**Source size:** 1,948,872 bytes · 26,877 lines  
**Review mode:** deterministic stress battery, real Chromium interactions, adversarial regression probes, responsive-layout checks, and 1,000 synthetic player profiles

---

# Executive Verdict

## Gold status

**Release Gold / Code Gold approved for release-critical behavior.**

The prior v1.8.5 Gold blocker—the stale conquest matchup estimate—is closed. Across **10,000 battle-state mutations**, every mutation changed the computed battle signature and **none reused a stale cached result**. The sample count is also part of the cache identity, and the memo remained bounded.

I found:

- **0 critical blockers**
- **0 high-severity regressions**
- **0 new medium-severity defects**
- **0 invalid results** in the completed procedural, combat, sharing, affix, and universe batteries
- **0 responsive overflows** across ten tested viewport sizes
- **0 failures** in the requested step-8 training-card reachability matrix

This is not a literal “zero issue anywhere” certification. Three known, non-blocking items remain: the Bat voice ceiling, full-resolution first thumbnail return, and the accepted offline harvest clock self-cheat. None presently justifies holding the build from Gold, but they remain real backlog rather than being described as fixed.

## Overall assessment

| Area | Score | Assessment |
|---|---:|---|
| Procedural and deterministic core | **10.0/10** | Large fresh battery; no invalid genomes, hybrids, codes, systems, planets, or affixes |
| Combat engine | **9.9/10** | Deterministic and side-balanced; no errors in 160,000 stress duels |
| Conquest matchup meter | **10.0/10** | Previous P0 closed in 10,000 mutation regressions |
| Save and exploit resistance | **9.9/10** | Save markup, hostile genomes, stale breeding, oversized codes, affix resurrection, and salvage loops passed |
| Creature progression | **9.8/10** | Duel XP, live feed cap, brood cap, and multi-session lineage ledger passed |
| Training reachability | **9.8/10** | Step 8 passed 20/20 card-position states across 10 viewports |
| Responsive/mobile UI | **9.8/10** | No horizontal overflow, no open-panel escape, no undersized tested mobile utility targets |
| Audio implementation | **8.7/10 technical** | Highly deterministic and broad; Bat ceiling remains |
| Boot responsiveness | **9.6/10** | Median answerability 362 ms at 1× and 1.54 s at 4× CPU throttle in this environment |
| Performance efficiency | **8.5/10** | Bounded portrait cache; first thumbnail path still starts with full art |
| Synthetic fun signal | **7.45/10** | Strong guidance proxy and only 1 rage-quit proxy in the fresh 1,000-profile model |
| Gold confidence | **High** | No release blocker reproduced in the completed independent battery |

---

# 1. Fresh Test Coverage

## Core and systems

- 100,000 generated fauna genomes/stat blocks
- 60,000 deterministic crosses/evolutions
- 10,000 repeat-determinism duels
- 50,000 exact mirror duels
- 100,000 randomized ability-bearing duels
- 10,000 star systems containing 28,184 planets
- 10,000 creature-code round trips
- 1,000,000 affix rolls
- 200,000 procedural voice models
- 10,000 focused Bat voice models
- 60,000,000 rarity seeds

## Gold-regression probes

- 10,000 conquest-odds cache mutations
- One real friendly duel through the Arena UI and reward ledger
- One same-session lineage repeat and one save/reload lineage repeat
- Live positive feed at the 200 ceiling
- Weekly-charter boundary checks at immediate, 599-second, and 601-second intervals
- Malicious saved markup, hostile genome fields, stale parent reuse, oversized creature code, salvage arbitrage, and affix destruction/reacquisition

## Browser and presentation

- 10 responsive viewports from 320×568 through 2560×1440
- 20 step-8 tutorial-card states: ten viewports × top/bottom card positions
- 4 boot/answerability measurements at 1× and 4× CPU throttle
- 1,000 deterministic synthetic player profiles across eight persona families

---

# 2. Previous Gold Blocker — Closed

## Conquest odds memoization

The v1.8.5 build could retain the old matchup percentage after a champion or defender changed. The v1.8.6 cache is now keyed to the simulation inputs.

### Fresh result

| Mutation field | Cases | Battle signature changed | Stale reuse |
|---|---:|---:|---:|
| `fed` | 1,667 | 1,667 | 0 |
| `brood` | 1,667 | 1,667 | 0 |
| `xp` | 1,667 | 1,667 | 0 |
| `hurt` | 1,667 | 1,667 | 0 |
| `_mult` | 1,666 | 1,666 | 0 |
| `_wf` | 1,666 | 1,666 | 0 |

**Total stale reuse: 0 / 10,000.**

Additional checks:

- Sample-count key changed: **TRUE**
- Memo entries after 1,000 varied calls: **198**
- Memo bounded: **TRUE**

**Verdict:** closed.

---

# 3. Core Stability

## Creature generation

Across 100,000 generated creatures:

- Invalid genomes/stat blocks: **0**
- Maximum ordinary generated power: **597**

| Tier | Count |
|---:|---:|
| 0 | 19,090 |
| 1 | 24,767 |
| 2 | 23,341 |
| 3 | 16,153 |
| 4 | 8,942 |
| 5 | 4,467 |
| 6 | 2,208 |
| 7 | 761 |
| 8 | 225 |
| 9 | 40 |
| 10 | 6 |

## Breeding and determinism

Across 60,000 operations:

- Cross/evolution deterministic mismatches: **0**
- Invalid evolved stat blocks: **0**

## Combat

### Exact mirrors

- Side A wins: **24,682**
- Side B wins: **24,548**
- Draws: **770**
- Side A share of non-draw outcomes: **50.14%**
- Errors: **0**

### Randomized ability-bearing matches

- Side A wins: **49,829**
- Side B wins: **49,687**
- Draws: **484**
- Side A share of non-draw outcomes: **50.07%**
- Errors: **0**

### Repeat determinism

- Repeated duel mismatches: **0 / 10,000**

No first-slot bias regression or nondeterministic outcome was found.

## Universe, codes, rarity, and affixes

- Systems invalid: **0 / 10,000**
- Planets invalid: **0 / 28,184**
- Creature-code failures: **0 / 10,000**
- Affix failures: **0 / 1,000,000**
- Rarity downgrades: **0 / 60,000,000 seeds**

The first aggregate systems probe used the wrong nested planet fields and falsely marked every planet invalid; a corrected independent pass against `p.P.seed` and `p.P.type` produced **0 invalid planets**. The erroneous raw file is retained in the evidence pack, beside the corrected result, so the audit trail is explicit.

---

# 4. Progression and Reward Outcomes

## Friendly duel XP

A real friendly duel was played through the Arena controls.

- Duel count: **1**
- Win count: **1**
- Champion XP: **0 → 8**
- Gain: **+8**
- Outcome check: **PASS**

The previous dead reward path is closed.

## Multi-session lineage bonus

First session:

- First A × B child XP: **7**
- Ledger entry created: **pair|16wtscr**

After save/reload, a new A × B pairing produced:

- Child XP: **2**
- Ledger before/after: unchanged
- Multi-session test: **PASS**

This distinguishes “once per pair ever” from the old per-individual behavior.

## Live feed and brood ceilings

- Positive loved meal from `fed=199`: **199 → 200**
- Reported delta: **+1**
- Feed cap test: **PASS**
- Child brood cap from capped parents: **200**
- Saved hostile genome fields sanitize to:
  - `brood=200`
  - `fed=200`
  - `xp=486`
  - `hurt=1`
  - `size=5`
  - `_mult`, `_wf`, and hostile apex override removed

---

# 5. Weekly Charter Rate Limit

The mitigation was dynamically tested around the stated ten-minute monotonic boundary.

| State | Resulting week |
|---|---:|
| Initial legitimate rollover | 3000 |
| Immediate second forward roll | 3000 |
| Simulated 599 seconds | 3000 |
| Simulated 601 seconds | 3001 |

Result: **PASS**. The second slate remained blocked until the monotonic interval exceeded 600 seconds.

This mitigates rapid clock-stepping, but it does not make an offline wall clock trustworthy. The broader harvest reload issue remains an accepted single-player design risk.

---

# 6. Save, Exploit, and Economy Review

## Save markup and malformed data

A save containing an `<img onerror>` payload in explorer, Compendium-origin, and Atlas text was loaded and rendered.

- Script execution marker: **0**
- Raw markup exposed as text: **False**
- Valid codex rows retained: **1**
- Valid Atlas rows retained: **1**
- Runtime errors: **0**

**Stored markup injection did not execute.**

## Exploit regressions

- Consumed parents rejected on second breed: **PASS**
- Oversized creature code rejected before decode: **PASS**
- Affix removed when last item copy was salvaged: **PASS**
- Reacquiring the same base item did not resurrect the affix: **PASS**
- Salvage-return-above-cost loops: **0**
- Invalid generated affixes: **0 / 1,000,000**

No new economy duplication or stale-instance exploit was reproduced.

---

# 7. Training and Responsive UI

## Step-8 reachability

The exact prior failure class was retested across:

- 320×568
- 375×667
- 393×852
- 430×932
- 744×1133
- 768×1024
- 820×1180
- 1024×768
- 1366×768
- 1920×1080

Each viewport was tested with the guidance card in both top and bottom positions, using a 63-point hit grid.

- States tested: **20**
- Failed states: **0**
- Minimum reachable fraction: **100%**
- Result: **PASS**

## General responsive matrix

- Viewports: **10**
- Horizontal overflow: **0**
- Open panels escaping viewport: **0**
- Browser errors: **0**
- Tested mobile utility targets below 44×44: **0**

The 1024×768 pass used a desktop pointer context, so it is not presented as a replacement for physical coarse-pointer iPad testing.

## Training limitation

A complete independent 21-step, action-driven eight-session fleet was not completed in this environment. The official project notes report green smoke/layout gates, but those claims were not substituted for independent evidence. The fresh result here is the targeted reachability matrix and the broader responsive matrix.

---

# 8. Boot and Performance

## Cold boot answerability

A boot-side script filled the naming field, activated the confirmation control, and measured the next animation-frame response.

| CPU throttle | Runs | Median runtime ready | Median answerability |
|---|---:|---:|---:|
| 1× | 2 | 260 ms | 362 ms |
| 4× | 2 | 933 ms | 1540 ms |

No page errors occurred. This is a small, environment-specific sample, but the measured interaction delay did not reproduce the earlier multi-second unanswerable state.

## Thumbnail path

The first list-thumbnail request still returns the full portrait while the 132px copy is produced asynchronously.

- Average first-return encoded length: **292,020 characters**
- First fresh request: **43.6 ms**
- Cached repeat: **0.1 ms**

This remains a performance optimization, not a correctness blocker. Direct low-resolution rendering would reduce first-paint CPU, allocation, and decode pressure.

---

# 9. Audio Review

## Broad procedural voice stress

Across 200,000 procedural voice models:

- Deterministic mismatches: **0**
- Unique parameter sets: **199,706**
- Exact 6000 Hz clamps: **1,690**
- Models above 4000 Hz: **5,191**

All tested genes now influence almost every sampled voice:

| Gene | Changed voice in first 5,000 mutations |
|---|---:|
| Trait | 4,920 |
| Body | 4,920 |
| Locomotion | 5,000 |
| Diet | 4,952 |
| Sense | 5,000 |
| Temperament | 5,000 |
| Size | 4,996 |

The wrong-modulus defect is closed.

## Remaining Bat ceiling

Focused named-Bat sample:

- Exact 6000 Hz clamps: **1,552 / 10,000 (15.52%)**
- Above 4000 Hz: **3,908 / 10,000 (39.08%)**
- Average fundamental: **3819.5 Hz**

This remains a real audio-quality backlog item. It does not destabilize the game, but it prevents a “no known issues” audio claim.

---

# 10. 1,000 Synthetic Player Profiles

The model used v1.8.6’s actual generation, rarity, crossing/evolution, battle-stat, duel, system, and level functions. It is a deterministic decision-path model, not a claim that 1,000 humans played.

## Overall

- Synthetic fun signal: **7.45/10**
- Hard no-op rate: **5.1%**
- Guided denial rate: **84.8%**
- Level 3 reached: **134 / 1,000**
- Level 6 reached: **1 / 1,000**
- Rage-quit proxy: **1 / 1,000**
- Stall suggestions triggered: **180**

| Persona | Fun | Hard no-op | Guided denial | Mean max level | Rage-quit proxy |
|---|---:|---:|---:|---:|---:|
| Explorer | 8.05 | 0.4% | 87.3% | 2.05 | 0 |
| Rancher | 7.28 | 5.8% | 86.0% | 1.02 | 0 |
| Miner | 7.30 | 3.6% | 86.3% | 1.32 | 0 |
| Optimizer | 7.39 | 5.5% | 86.4% | 1.39 | 0 |
| Completionist | 7.82 | 1.9% | 84.6% | 1.50 | 0 |
| Sprinter | 7.63 | 3.5% | 86.4% | 2.18 | 0 |
| Casual | 7.59 | 3.6% | 86.7% | 1.10 | 0 |
| Adversarial | 6.55 | 16.5% | 74.5% | 1.19 | 1 |

The strongest signal is guidance rather than raw progression: the model routed **84.8%** of blocked actions into an actionable path. The progression tail is intentionally slow; only one profile reached level 6.

---

# 11. Known Non-Blocking Backlog

## Low — Bat voice ceiling

Reduce the Bat base frequency or taper the size/trait multipliers before the hard cap. Add a focused acceptance threshold such as:

- fewer than 1% exact clamps in 10,000 named-Bat samples
- 95th percentile below 5.5 kHz

## Optimization — direct 132px thumbnail generation

Render list art directly at list resolution, or allow portrait painters to accept an output dimension. Avoid generating, encoding, decoding, and downscaling a 440px master for first shelf paint.

## Accepted design risk — offline wall-clock harvest

There is no trusted cross-reload monotonic clock in an offline browser game. The current one-cycle accrual and lack of competitive economy make acceptance defensible. A true closure requires changing the design from wall-time entitlement to engagement-derived yield, not merely persisting `performance.now()`.

## Compatibility decision — breeding size drift

The deterministic baseline intentionally preserves `crossGenome` output. Current save, card, and combat consumers clamp size, preventing the old player-facing divergence.

---

# 12. Environment and Method Limits

- Chromium 144 was available.
- Local `file://` and localhost navigation were administratively blocked, so browser tests loaded the exact source through `page.set_content`.
- A lexical localStorage substitute was used for save/load tests because storage is disabled on `about:blank`.
- `npm ci` could not complete because the available package registry returned a 404 for a transitive package; therefore the full jsdom suite was not independently rerun.
- Physical iPhone/iPad Safari remains untested.
- Audio parameter generation and control plumbing were tested, but subjective listening requires human ears and real output hardware.
- The synthetic persona score is comparative evidence, not a human retention study.

---

# Final Gold Decision

## **Gold approved**

The release-critical standard is met:

- previous conquest-meter blocker closed
- no critical/high/medium regression discovered
- procedural and combat core clean at large scale
- real friendly-duel XP fixed
- lineage persistence fixed across reload
- live progression caps aligned
- weekly reroll mitigation works at the stated boundary
- save/economy exploit regressions remain closed
- step-8 training card fully reachable in the targeted matrix
- responsive UI clean across ten viewport sizes
- boot answerability acceptable in the measured sample

## **Not a literal zero-known-issue declaration**

The Bat voice ceiling, direct-thumbnail optimization, and accepted offline-clock behavior remain documented. They are suitable for post-Gold backlog, but they should remain visible rather than being relabeled as solved.
