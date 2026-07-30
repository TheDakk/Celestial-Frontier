# Celestial Frontier v1.8.5 — Full-Battery Synthetic Audit

**Build reviewed:** `Celestial-Frontier-main(10).zip`  
**Detected version:** **v1.8.5 — “First Touch”**  
**Source SHA-256:** `7c7c38cbde4fa62022ec2afd57817385a2e5a206a264fc959e2bb241b80d5ed2`  
**Main runtime:** `celestial-frontier.html`  
**Source size:** 1,937,864 bytes · 26,753 lines  
**Review mode:** large automated battery, real-click Chromium flows, adversarial probes, and 1,000 synthetic player profiles

---

# Executive Verdict

## Release recommendation

**Release Candidate, but hold final Code Gold for one focused combat-UI fix.**

v1.8.5 is the strongest build tested in this review sequence. Its procedural core, save hardening, responsive layouts, training flow, Momentum guidance, broader creature XP, audio plumbing, economy protections, and veteran-training recovery all performed well.

The main blocker is not the underlying duel engine. It is the new **conquest matchup meter cache**:

> The 160-duel estimate is accurate when freshly calculated, but the memoization key omits several battle-relevant values. After feeding/training a champion or changing a defender’s world multiplier, the picker can continue displaying the old percentage and even the opposite result band.

A demonstrated matchup remained at **0%** after the champion’s real outcome changed to **100%**. A defender remained displayed at **100%** after a world multiplier changed its real outcome to **0%**.

Because the conquest meter is intended to prevent misleading decisions, this should be fixed before Gold.

## Overall assessment

| Area | Score | Assessment |
|---|---:|---|
| Procedural and deterministic core | **9.9/10** | Very large stress battery completed with zero invalid results |
| Combat engine | **9.8/10** | Deterministic, side-balanced, and exception-free |
| Conquest matchup UI | **6.5/10** | Fresh estimates are excellent; cached estimates can become completely stale |
| Save and exploit resistance | **9.8/10** | Major previously reported exploit classes remain fixed |
| Standard and adversarial training | **9.6/10** | 8/8 full real-click sessions completed with zero stalls |
| Responsive/mobile UI | **9.7/10** | Nine viewports passed; touch targets and input sizing are strong |
| Momentum/actionable guidance | **8.8/10** | Clear denials, useful CTAs, live quest log, and functioning stall assistance |
| Creature progression | **8.1/10** | Care XP works and anti-farm logic works; live bloodline caps are inconsistent |
| Audio implementation | **8.6/10 technical** | Deterministic and well-contained; subjective sound quality was not directly heard |
| Performance efficiency | **8.2/10** | Fast boot and good cached thumbnails; first thumbnail paint remains full-HD |
| Synthetic fun signal | **6.66/10** | Better clarity and connection; Rancher and Miner friction remain |
| Informed target-player estimate | **7.5–8.2/10** | Estimate, not a human playtest result |

---

# 1. What Was Tested

## Fresh core and systems battery

- 100,000 initial creatures
- 60,000 deterministic hybrid/evolution operations
- 10,000 repeated deterministic duels
- 50,000 exact-stat mirror duels
- 100,000 randomized ability-bearing duels
- 10,000 star systems
- 27,900 planets
- 10,000 creature-code round trips
- 1,000,000 affix rolls
- 200,000 procedural voice models
- 60,000,000 rarity seeds

## Fresh browser and UI testing

- Eight complete 21-step real-click training runs
  - four standard
  - four aggressive/chaos
  - phone, tablet, and desktop sizes
- Nine responsive viewports from 320×568 through 1920×1080
- Actionable denial buttons and destination CTAs
- Stall detector after repeated non-progress interactions
- Objective-chip/quest-log behavior and live charter progress
- Conquest matchup calibration and cache invalidation
- Breeding anticipation rows
- Creature temperament/specimen presentation
- Compendium and Fabricator collapsed-state behavior
- Audio toggles, persistence, event wiring, loop cleanup, and hidden-tab behavior
- Veteran restart-training reload and restoration
- Save corruption, malformed data, hostile markup, and backup recovery
- Crafting, salvage, affix, stale-parent, duplicate-species, and oversized-code exploits
- Boot responsiveness
- Creature thumbnail generation and cache behavior

## Synthetic player campaign

1,000 profiles were divided equally among:

- Explorer
- Rancher
- Miner
- Optimizer
- Completionist
- Sprinter
- Casual
- Adversarial

This is a deterministic decision-path simulation based on the build’s actual domain functions and progression rules. It is **not** a substitute for 1,000 human players.

---

# 2. P0/P1 Finding — Conquest Odds Cache Can Show the Opposite Truth

## Severity: High / final-Gold blocker

The new 160-duel meter is a major improvement over a flat power ratio.

## Fresh-estimate calibration

Across 50 randomized matchups, comparing the 160-duel picker estimate against 3,000-duel ground truth:

- Mean absolute error: **1.11 percentage points**
- Maximum error: **12.58 points**
- Result-band mismatches: **1/50**

That is strong calibration for a lightweight UI estimate.

## Confirmed cache defect

The `_oddsMemo` key includes only:

- champion seed
- native seed
- champion XP
- champion injury

It does **not** include:

- champion `fed`
- champion `brood`
- current battle-stat vector
- ability-relevant changes
- defender `_mult`
- defender world field `_wf`
- requested sample count

### Reproduction A — champion improves

- Before feeding/training:
  - displayed estimate: 0%
  - actual result: 0%
- After raising champion `fed` and `brood`:
  - cached estimate: still 0%
  - actual result: 100%

### Reproduction B — defender world multiplier changes

- Base defender:
  - displayed estimate: 100%
  - actual result: 100%
- Defender changed to `_mult=3`:
  - cached estimate: still 100%
  - actual result: 0%

The meter can therefore tell the player “Favored” when the real matchup is “Overwhelming,” or the reverse.

## Source

`main.js` around lines 18,297–18,322.

## Recommended correction

Build the cache key from a complete battle signature rather than selected genome fields:

```js
function duelSignature(entry) {
  const stats = entry.stats || battleStats(entry.genome);
  const g = entry.genome || {};

  return [
    g.seed >>> 0,
    stats.vit, stats.fer, stats.res, stats.agi, stats.ins,
    stats.total,
    stats.ab?.id || "",
    stats.ab?.mag || 0,
    g.hurt || 0,
    g._mult || 1,
    g._wf || ""
  ].join("|");
}

const key = duelSignature(champ) + "||" + duelSignature(native) + "|" + N;
```

An even safer approach is clearing matchup caches whenever:

- a creature is fed
- XP/level changes
- injury changes
- equipment or affixes change
- a world/region defender modifier changes

## Required retest

For at least 10,000 random matchups:

1. Calculate odds.
2. Modify every battle-relevant field one at a time.
3. Recalculate without manually clearing the cache.
4. Compare with a high-sample ground truth.
5. Assert the displayed band and percentage update.

---

# 3. Core Stability Results

## Creature generation and rarity

| Tier | Count |
|---:|---:|
| 0 | 19,119 |
| 1 | 25,035 |
| 2 | 23,222 |
| 3 | 16,078 |
| 4 | 8,866 |
| 5 | 4,590 |
| 6 | 2,098 |
| 7 | 737 |
| 8 | 215 |
| 9 | 38 |
| 10 | 2 |

Across 100,000 generated creatures:

- Invalid genomes/stat blocks: **0**
- Maximum ordinary power: **584**
- Tier 9: **38**
- Tier 10: **2**

The high end remains appropriately scarce.

## Breeding and evolution

Across 60,000 operations:

- Deterministic mismatches: **0**
- Invalid results: **0**

## Combat

Across 50,000 exact mirrors:

- Side A: **24,850**
- Side B: **24,967**
- Draws: **183**
- Errors: **0**

Across 100,000 randomized ability duels:

- Side A: **50,101**
- Side B: **49,682**
- Draws: **217**
- Errors: **0**

No first-slot regression was observed.

## Universe, sharing, and affixes

- Systems: 10,000, invalid 0
- Planets: 27,900, invalid 0
- Creature-code round trips: 10,000, failures 0
- Affix rolls: 1,000,000, invalid 0
- Rarity audit: 60 million seeds, illegal downgrades 0

---

# 4. Training Review

## Fresh full real-click runs

| Mode | Sessions | Completed | Stalls | Breaks/errors |
|---|---:|---:|---:|---:|
| Standard | 4 | 4 | 0 | 0 |
| Aggressive/chaos | 4 | 4 | 0 | 0 |
| **Total** | **8** | **8** | **0** | **0** |

Viewports included:

- 320×568
- 390×844
- 1024×768
- 1366×768

The training fixes are holding:

- survey presentation did not cover the needed action
- Feed and Breed lessons retained their specimen context
- collapsed shelves did not prevent completion
- no competing-modal stack broke the flow
- no page or console errors occurred

This is strong evidence, but eight fresh sessions are not enough to prove a sub-1% stall rate. The repository’s bundled training evidence reports larger passing sets, but those artifacts were not source-hash stamped and were treated as supporting rather than fresh evidence.

## Veteran training recovery

Restarting training, saving, reloading, and skipping restored:

- original creature
- cargo
- item counts
- equipped gear
- affix
- Earth’s custom subtitle
- Earth badge and star classification
- favorite state
- original timestamp

The previous retraining persistence blockers remain fixed.

---

# 5. Momentum Layer and Actionable Denials

## What passed

### Denials explain the shortfall before the tap

Feed showed:

> **Needs flora**

Breed showed:

> **Needs another fauna**

The detailed denial described why the action was blocked and provided a direct **Open the Star Atlas** CTA.

### The CTA works

The denial CTA opened the Atlas rather than leaving the player at a dead end.

### Blocked and successful feedback are distinct

Instrumented audio showed:

- denial tone: 200 Hz
- confirmation tone: 660 Hz

### Stall guidance works

After approximately 10 no-progress interactions, the objective chip changed from restating the objective to:

> **Land on a living world and Scavenge for flora**

Selecting it opened the appropriate surface.

### Quest log works as a live mini-log

The objective chip unfolded into:

- chapter objective
- accepted charter
- current progress
- board navigation

After Mercury planetfall, the charter row completed/disappeared and the chapter counter updated live.

## Human-judgment assessment

The Momentum layer is meaningfully better than a generic “cannot do that” system.

The main tuning concern is cadence: ten interactions may feel helpful for a stuck casual player but mildly nagging for an optimizer deliberately inspecting menus. Consider an adaptive threshold based on:

- repeated failed actions rather than all interactions
- elapsed time
- whether the player dismissed the previous suggestion
- player experience/chapter
- whether an eligible action is already visible

---

# 6. Creature Progression, Breeding, and Personality

## Broadened XP passed

### Feeding

- First loved meal: **+3 XP**
  - welcome meal +1
  - first taste discovery +2
- Repeating the same taste: **+0 XP**

### Breeding

- First successful pairing:
  - union +2
  - first lineage +5
  - total child XP: **7**
- Repeating the same pairing:
  - union only
  - child XP: **2**

The per-creature/per-pair anti-farm ledger works.

## Breeding anticipation passed

A candidate row displayed:

> **Child ≈ 181–321 power · up to Rare · 83% success**

This creates useful anticipation without revealing the actual roll.

## Personality presentation passed

The specimen card surfaced temperament, senses, habitat, lifecycle, diet, metabolism, and behavior. The tested creature explicitly read as “aggressively territorial,” making it more memorable than a stat block alone.

## Stale XP copy

### Severity: Medium UX inconsistency

The specimen sheet still says:

> **XP 0 — victories feed it: duels +8 · conquests +20 · guardians +60**

That copy contradicts the new care-XP system and makes feeding/breeding progression effectively invisible.

**Source:** `main.js` around line 12,660.

Recommended replacement:

> **XP grows through care and challenge: first tastes, successful unions, new lineages, close battles, conquests, and guardians.**

The exact numbers can remain in the Guide or a tooltip.

## Live bloodline caps are inconsistent

### Fed

After 120 loved meals:

- live `fed`: **240**
- XP: **3** because anti-farm worked

### Brood

Parents at 200/200 produced a child with:

- live `brood`: **401**

Save loading/import and effective combat sanitize these values, so this is not a million-power exploit. It does create inconsistent live UI, descendants, save round trips, and local/imported behavior.

**Sources:**

- `main.js` around line 16,302
- `main.js` around line 16,386

Recommended correction:

```js
child.brood = Math.min(
  200,
  (aEntry.genome.brood || 0) + (bEntry.genome.brood || 0) + 1
);

faunaEntry.genome.fed = Math.min(
  200,
  Math.max(0, before + delta)
);
```

---

# 7. Audio Review

## Scope and limitation

The build’s Web Audio graph was instrumented with a fake `AudioContext`. This verifies:

- deterministic parameter generation
- event routing
- independent toggles
- persistence
- loop lifecycle
- hidden-tab cleanup
- frequency and duration ranges

It does **not** substitute for listening through real speakers/headphones, and subjective timbre or fatigue cannot be honestly scored from this environment.

## Strong results

### Deterministic identity

Named Earth examples mapped consistently:

| Creature | Voice type |
|---|---|
| Wolf | roar |
| Sparrow | chirp |
| Blue Whale | song |
| Rattlesnake | hiss |
| Bat | chirp |
| Octopus | jet |
| Jellyfish | pulse |

### Hybrid drift

A hybrid voice moved away from its Earth ancestor’s roar parameters toward a more alien grunt profile.

### Event wiring

- Creature voice started 3 synthesis nodes.
- Combat hit started 4 synthesis nodes.
- Denial and confirmation tones were distinct.
- Ambience began as a loop.

### Lifecycle and battery behavior

- Master Sound Off stopped the active ambience.
- Hidden-tab transition stopped ambience.
- Voice Off did not disable combat sound.
- Combat Off did not disable creature voice.
- Both independent settings persisted.

### Payload

- Audio media files: **0**
- Added sample payload: **0**
- Audio is procedural.

## Confirmed Bat ceiling issue

### Severity: Medium audio defect

The general 200,000-model voice population looked healthy:

- exact 6,000 Hz clamp: 0.80%
- above 4,000 Hz: 2.58%
- 196,369 unique rounded parameter tuples

But a focused named-Bat sample was much worse:

- 10,000 Bat genomes
- exactly 6,000 Hz: **1,438 (14.38%)**
- above 4,000 Hz: **3,873 (38.73%)**
- average base frequency: approximately 3,779 Hz

The named Bat rig is still frequently hard-clamped, making different genomes converge on the same ceiling.

Recommended correction:

- lower the Bat archetype’s base frequency further
- replace hard clipping with soft saturation
- test each named Earth rig family independently, not only the global population

## Audio impact estimate

The audio layer should improve perceived feedback and identity, especially for:

- Optimizers during combat
- Ranchers building attachment
- Explorers during planetfall
- Casual players interpreting blocked versus successful actions

A defensible subjective fun delta requires real listeners. The implementation is technically promising enough to justify a small focused listening panel before committing to a large audio-production expansion.

---

# 8. 1,000-Profile Player Simulation

## Overall

- Heuristic fun score: **6.66/10**
- Blocked/no-op rate: **19.4%**
- Blocked actions receiving guidance: **60.1%**
- Approximate unguided blocked-action rate: **7.7%**
- Level 3 reached: **172/1,000**
- Level 6 reached: **6/1,000**
- Level 9 reached: **0/1,000**

| Persona | Fun | Blocked/no-op | Guided when blocked | Best tier | Mean max level |
|---|---:|---:|---:|---:|---:|
| Explorer | 7.15 | 0.6% | 74.3% | 6.98 | 1.16 |
| Rancher | 6.04 | 53.9% | 91.3% | 6.44 | 2.38 |
| Miner | 5.83 | 26.4% | 1.4% | 6.21 | 1.16 |
| Optimizer | 6.87 | 29.4% | 77.6% | 6.38 | 3.55 |
| Completionist | 7.15 | 0.7% | 69.5% | 7.05 | 1.02 |
| Sprinter | 7.01 | 2.2% | 32.2% | 6.59 | 1.45 |
| Casual | 6.91 | 20.1% | 67.3% | 6.46 | 1.75 |
| Adversarial | 6.34 | 21.7% | 67.3% | 5.77 | 1.70 |

## Interpretation

### Strongest paths

Explorer, Completionist, and Sprinter all exceeded 7.0 in the heuristic. The game rewards broad discovery and goal-directed movement well.

### Rancher

Rancher fun improved into the 6.0 range, and **91.3%** of its blocked actions received guidance. That demonstrates the Momentum layer is doing real work.

However, Rancher still had a **53.9% blocked-action rate**, generally from exhausting compatible creatures or flora faster than the persona replenished them. Guidance makes the failure understandable, but it does not remove the underlying resource-loop friction.

### Miner

Miner scored lowest at 5.83 and had 26.4% blocked actions. The simplified campaign model does not exercise every UI denial path for crafting, so its low guidance rate should not be read as a direct DOM failure. It does suggest that material acquisition and recipe readiness need clearer continuous routing.

### Optimizer

Optimizer reached the highest mean creature level and made heavy use of combat. This persona is the most exposed to the stale conquest meter bug.

### Progression

Broadened XP is measurably active, but Level 6 remained rare and Level 9 absent in this 120-action model. That may be appropriate for long-term pacing, but it should be verified with real session-time targets.

## Rage-quit signal

A true rage quit cannot be inferred from deterministic profiles. The best proxy is the unguided blocked-action rate, approximately **7.7% overall**. This is far healthier than the total 19.4% blocked rate because most blocks now explain a useful route.

Rancher remains the highest-risk persona despite strong guidance.

---

# 9. Security, Save, and Economy Regression

## Passed exploit probes

- Duplicate species insertion blocked
- Consumed/stale breeding parents rejected
- Pair XP paid once
- Affix resurrection blocked
- Double crafting with exact resources produced one item
- No tested salvage arbitrage
- Oversized creature code rejected
- Stored hostile markup did not execute
- Malformed collection fields did not discard valid scalar progress
- Saved super-creature normalized
- Corrupt primary save recovered from backup
- Restarted-training veteran snapshot restored

## Saved super-creature result

Extreme save data loaded as:

- brood 200
- fed 200
- XP 486
- injury 1
- `_mult` removed
- `_wf` removed
- bounded power 893

No million-power exploit returned.

## Security posture

No `eval` or `new Function` calls were found. The hostile-markup corpus remained nonexecutable.

The source still contains 95 `innerHTML` assignment sites, so future save-derived fields remain an ongoing review risk. Continue migrating untrusted strings to `textContent` and safe DOM builders.

---

# 10. Boot, Payload, and Rendering Performance

## Cold boot / first touch

Across 12 fresh boots:

- Name gate visible median: **427.7 ms**
- Name gate maximum: **532.7 ms**
- First click visually acknowledged median: **6.3 ms**
- Worst measured acknowledgement: **44.4 ms**
- Click to training card median: **1122.1 ms**

The first action responds immediately. The training card arrives roughly one second later.

## Payload

- Main HTML: 1.85 MiB
- Audio media files: 0
- External runtime URL references: only the project URL
- Procedural audio adds no downloaded sample payload

## Thumbnail first-paint cost

Across 20 thumbnails:

### Initial full portrait

- Encoded total: **5,725,312 characters**
- Average: **286,266**
- Generation time: **0.94 seconds**

### Cached small image

- Encoded total: **420,384 characters**
- Average: **21,019**
- Repeat lookup: **0.2 ms**

The second lookup is excellent. The first shelf open still generates a full 440px portrait before downscaling.

Direct 132px rendering remains the highest-value performance optimization.

---

# 11. Independent Synthetic Review Lenses

These are four separate analytical perspectives, not four human reviewers.

| Review lens | Score | Verdict |
|---|---:|---|
| Technical QA and exploit hunter | **8.8/10 conditional** | Exceptionally strong core; conquest cache blocks Gold |
| UX, training, mobile, and casual onboarding | **9.0/10** | Training and Momentum are strong; stall cadence needs human tuning |
| Creature systems, optimizer, and Rancher | **8.1/10** | Care XP and previews help; live caps and Rancher resource friction remain |
| Audio, immersion, and fun | **8.6/10 technical** | Strong procedural architecture; Bat ceiling and subjective listening remain |

Separate Markdown reviews accompany this report.

---

# 12. Known Inherited Backlog

The supplied reviewer brief identified items not claimed as fixed in this arc:

- burn/thorns kills can lack a death line
- conquest affix placement always targets a worn slot
- latent `#searchres` / `#tray` stacking-context risk
- Step 13 wound timing is delayed
- partial modal focus memory
- high-magnitude Ambush balance
- direct 132px thumbnail rendering

These were not reclassified as new v1.8.5 regressions. The thumbnail item was independently confirmed as still open.

---

# 13. Priority Fix Order

## P0 / before final Gold

1. Replace the conquest odds memo key with a complete battle signature.
2. Invalidate odds after any champion or defender state change.
3. Add mutation-based cache regression tests.

## P1

4. Clamp live `fed` and child `brood` to 200.
5. Update specimen XP copy to describe care XP.
6. Retune or soft-limit the named Bat voice ceiling.
7. Run physical audio listening tests with several devices and listeners.

## P2

8. Render thumbnails directly at 132px.
9. Make stall-assistance timing adaptive.
10. Improve Rancher resource replenishment and Miner recipe routing.
11. Add build hashes to every bundled simulation artifact.

## P3

12. Modularize the authoring source while preserving the single-file release artifact.
13. Continue replacing untrusted `innerHTML`.
14. Add adaptive visual-quality tiers.
15. Complete physical iOS/iPadOS Safari and assistive-technology testing.

---

# 14. Gold Retest Checklist

- [ ] Conquest percentage changes after feeding, breeding, XP, injury, ability, affix, world-field, and multiplier changes.
- [ ] Cached and fresh odds produce the same result.
- [ ] 10,000 mutation-based matchup cases stay within the chosen calibration tolerance.
- [ ] Live `fed` never exceeds 200.
- [ ] New child `brood` never exceeds 200.
- [ ] Specimen sheet accurately explains care XP.
- [ ] Bat voice models no longer cluster at the hard ceiling.
- [ ] Eight-plus full real-click training sessions remain clean.
- [ ] A larger source-hash-stamped chaos fleet completes with less than 1% stalls.
- [ ] Nine-viewport geometry remains clean.
- [ ] All coarse-pointer controls remain at least 44×44.
- [ ] 100,000 creature and 60,000 breeding checks remain valid.
- [ ] 50,000 mirror and 100,000 random duels remain side-balanced.
- [ ] 60 million rarity seeds remain violation-free.
- [ ] Save, injection, crafting, affix, stale-parent, and backup-recovery probes remain clean.
- [ ] Physical iPhone/iPad Safari and real audio-listening passes succeed.
- [ ] Full clean-install CI runs after dependency installation.

---

# Final Assessment

Celestial Frontier v1.8.5 successfully improves the connection between existing systems.

The biggest v1.8 goals are visible in real DOM behavior:

- denials are actionable
- blocked taps sound different
- the objective chip becomes a useful quest log
- stall guidance points somewhere concrete
- creature care now grants XP
- breeding creates anticipation
- personality is more visible
- audio gives creatures, combat, planetfall, and failure distinct identities

The core game is technically very strong.

The conquest meter cache is the one issue that prevents a full Gold recommendation because it can display exactly the opposite of the current matchup. Correct that key/invalidation logic, clean up the smaller progression/audio inconsistencies, and v1.8.5 should be ready for a final Gold gate.
