# Celestial Frontier v1.7.3 — Updated Synthetic Test Report

**Repository tested:** `Celestial-Frontier-main 3.zip`  
**Current source version:** `1.7.3 — The Tablet Tier`  
**Test focus:** training UI, phone/tablet/desktop layout, creature generation and breeding, combat determinism, progression friction, stability, and fun-factor comparison

---

# Executive Summary

## Overall verdict

The updated build is **technically stable and substantially stronger on touch/tablet UI**. The v1.7.3 layout changes work: phone and tablet panels stay inside the viewport, the 21-step training remains completable, creature generation is deterministic, breeding is stable, and the creature-code pipeline survived the new stress pass without failures.

The main design conclusion from the previous 1,000-player review is **still valid**:

> The creature engine is one of the strongest technical systems in the game, but the creature-focused player still encounters more friction and slower meaningful progression than the mining/crafting player.

## Updated scorecard

| Area | Updated score | Assessment |
|---|---:|---|
| Runtime and deterministic stability | **9.7/10** | Excellent |
| Training UI | **9.1/10** | Reliable; one recoverable chaos wait in the fresh sample |
| Phone/tablet HUD and panels | **9.3/10** | The Tablet Tier pass is successful |
| Creature generation and breeding integrity | **9.6/10** | No invalid genomes, hybrids, codes, systems, or duels in the 1,000-profile core test |
| Creature progression and player guidance | **6.7/10** | Level 3 is reachable with focus; Level 6 remains distant and normal campaigns do not create enough XP events |
| Creature-loop fun | **6.8–7.1/10** | Deep potential, but Rancher friction remains |
| Overall current fun factor | **about 6.0–6.5/10 synthetically** | Early sessions remain weaker than established sessions |
| Estimated informed human-player fun | **about 7.0–7.4/10** | Strong systems, but the emotional creature loop still needs faster reinforcement |

## Release conclusion

There is **no new technical blocker** in this synthetic pass. The updated code is a better release candidate than the previous build.

The primary remaining work is design polish rather than bug repair:

1. Reduce creature-action dead ends.
2. Create more frequent creature XP events.
3. Improve breeding anticipation and post-breed goals.
4. Give losses and unavailable actions a clearer next move.
5. Update the synthetic harness so it matches the current fresh-player flow.

---

# 1. Test Methodology

This review used three layers of evidence.

## A. Fresh v1.7.3 Chromium regression

The current source was booted and exercised in Chromium rather than relying solely on old report files.

Fresh current-build checks included:

- **15 balanced short expedition sessions** across five personas
- **600 live expedition actions** through the current game APIs
- **10 full training sessions**
  - 5 standard sessions
  - 5 adversarial/chaos sessions
  - phone, tablet, and desktop viewports
- **18 successful panel/layout openings** across phone, tablet, laptop, and desktop dimensions
- Current save/load use during every fresh expedition

## B. Fresh 1,000-profile creature/system stress pass

One thousand current-build synthetic creature profiles generated:

- **10,000 initial creatures**
- **6,400 hybrids**
- **11,600 deterministic duels**
- 1,000 generated star systems
- 1,000 creature-code encode/decode checks

This layer tests the creature engine deeply, but it is not presented as 1,000 full UI playthroughs.

## C. Re-aggregation of the bundled 1,000-session campaign pack

The ZIP contains the earlier exact 1,000-run campaign data:

- 250 fast expeditions
- 250 medium expeditions
- 200 deep expeditions
- 200 chaos-training sessions
- 100 standard UI/training sessions

Those runs remain the best large campaign baseline for progression and long-session fun. They were compared with the fresh v1.7.3 regressions rather than silently represented as newly generated v1.7.3 sessions.

## Environment limitation

The repository does not include `node_modules`, and the test environment could not download `jsdom`. Therefore, the repository's Node/jsdom runner could not be launched directly with `npm test`.

The current source was instead tested in installed Chromium, and the bundled raw 1,000-run data was independently re-aggregated. This distinction matters: the browser regressions are fresh v1.7.3 results; the bundled full campaign pack is the comparative baseline.

---

# 2. Static and Build Validation

The current source identifies itself consistently as **v1.7.3** in both `package.json` and `GAME_VERSION`.

Fresh static validation passed:

- JavaScript syntax: **Pass**
- CSS brace balance: **Pass**
- Static element IDs: **154 IDs, zero duplicates**
- Domain determinism guard: **no `Math.random` or `Date.now` in deterministic domain modules**

The bundled layout report contains:

- **546 checks**
- **546 passes**
- **0 failures**
- Coverage across iPhone SE, iPhone, iPhone Max, Android, iPad portrait, iPad landscape, laptop, desktop, and wide desktop

---

# 3. Training UI Results

## Fresh v1.7.3 result

| Metric | Result |
|---|---:|
| Training sessions | 10 |
| Completed | **10/10** |
| Permanent soft locks | **0** |
| Broken focus-lock rules | **0** |
| Runtime errors | **0** |
| Standard sessions | 5/5 complete |
| Chaos sessions | 5/5 complete |
| Skip paths used | 2 |
| Recoverable transient waits | 1 |

The one chaos wait occurred during the character-sheet lesson while several deliberately spammed surfaces were present. The training recovered automatically, completed, and produced no panel-rule break.

## Comparison with the bundled large baseline

The bundled campaign pack contains:

- **100/100 standard UI completions**
- **200/200 chaos completions**
- 30 transient waits across the 200 chaos sessions
- No permanent training failure

The fresh v1.7.3 sample supports the same conclusion: **training is reliable**.

## Updated training score

**9.1/10**

This is an improvement from the previous 8.7/10 assessment because:

- fresh players now go directly to training instead of seeing a changelog gate
- tablet panels use the new aligned sheet model
- touch targets are larger
- the dock labels are clearer
- the Guide and panel behavior is more consistent

## Remaining training improvement

When chaos input temporarily creates several competing surfaces, the training driver sometimes has to wait for the intended sheet state. A production player is unlikely to reproduce the exact synthetic spam pattern, but an atomic lesson transition would still be cleaner:

1. Close irrelevant overlays.
2. Open the required panel.
3. Mount the highlight target.
4. Verify it is visible.
5. Only then advance the lesson state.

---

# 4. Training Harness Problems Found

The game passed, but the synthetic harness itself has drifted from the current build.

## CF-SIM-001 — Fresh-player bulletin expectation is stale

Current v1.7.2/v1.7.3 behavior intentionally sends a new player directly into Field Training.

However, `tools/simrun.js` still does this after accepting the name:

1. Waits for `relbox`
2. Records a `fresh bulletin` stall when it does not appear
3. Attempts to click `relok`
4. Then waits for training step 1

This creates false stalls and adds unnecessary wait time.

### Required harness fix

Replace the fresh bulletin wait with a direct wait for training step 1.

```js
click(doc.getElementById('nameok'));
await stall(() => tutAt(1), 5000, 'step 1');
```

The release bulletin should only be expected for an eligible returning save.

## CF-SIM-002 — Medium runs are labeled as deep

`r1000-medium.json` contains medium-length sessions, but each run's internal `mode` field is `deep`.

The cause is that `expedition()` receives a Boolean `deep` parameter and writes:

```js
mode: deep ? 'deep' : 'fast'
```

The parent runner invokes medium sessions with deep behavior enabled, so the run loses its true cohort label.

### Recommended fix

Pass an explicit mode string:

```js
async function expedition(sess, seed, nActions, mode) {
  const advanced = mode !== 'fast';
  const run = { mode, ... };
}
```

This prevents future reports from merging medium and deep cohorts accidentally.

## CF-SIM-003 — Harness documentation still references 20 steps

The implementation correctly checks `n / 21`, but the file header still describes a 20-step training flow in places.

Update all comments, report labels, and training documentation to 21 steps so future harness changes do not repeat the earlier drift.

## CF-SIM-004 — Reusing one browser page indefinitely degrades the harness

During extended regression attempts, repeatedly calling `resetMemoryState()` and running new synthetic expeditions in the same browser document eventually became much slower than the first sessions.

This does not prove a normal-player runtime leak: the harness repeatedly resets live state without reloading module-level caches, timers, event machinery, and renderer state—something normal play never does.

### Harness optimization

- recycle the page after 5–10 synthetic sessions
- or add a test-only `destroyTestSession()` that clears timers, transient overlays, and bounded render caches
- record per-session execution duration and fail the harness on sustained degradation

---

# 5. Fresh Expedition Results

The balanced fresh current-build sample used three runs for each persona and 40 actions per session.

## Results

| Metric | Result |
|---|---:|
| Sessions | 15 |
| Actions | 600 |
| Runtime errors | **0** |
| Invariant violations | **0** |
| Valid saves | **15/15** |
| No-op actions | 174 |
| No-op rate | **29.0%** |
| Mean short-session fun proxy | **4.59/10** |

## Persona results

| Persona | Fresh fun proxy | No-op rate |
|---|---:|---:|
| Miner | **5.76** | 20.0% |
| Chaotic | 5.05 | 23.3% |
| Explorer | 4.34 | 28.3% |
| Sprinter | 4.27 | 34.2% |
| Rancher | **3.54** | **39.2%** |

This is a very small current-build sample, so these numbers should not be treated as statistically final. They are important because they reproduce the same ordering seen in the much larger prior battery:

- mining/crafting creates dependable progress
- the Rancher repeatedly chooses the signature creature systems
- the Rancher also encounters the most unavailable or low-payoff actions

## Directional improvement in no-op friction

The earlier full campaign battery produced a **35.3%** no-op rate. The small fresh sample produced **29.0%**.

That is directionally encouraging, and the v1.7.2 Fabricator now explains missing ingredients instead of presenting a dead craft action. However, the two cohorts have different lengths and sample sizes, so this should not be claimed as a definitive six-point improvement yet.

### Gold target

Bring real and synthetic no-op rates below **10–15%**, especially for Rancher and Sprinter personas.

---

# 6. Creature-System Stress Results

## Fresh 1,000-profile result

| Metric | Result |
|---|---:|
| Synthetic profiles | 1,000 |
| Initial creatures | 10,000 |
| Hybrids | 6,400 |
| Duels | 11,600 |
| Invalid creature/stat results | **0** |
| Determinism mismatches | **0** |
| Creature-code failures | **0** |
| Duel execution failures | **0** |
| Invalid system generations | **0** |
| Average initial creature tier | 1.99 |
| Average best tier per profile | 5.32 |
| Profiles reaching Tier 8 best creature | 42 |
| Profiles reaching Tier 9 best creature | 6 |

The generation, breeding, evolution, combat, and code-sharing foundations are excellent.

## Creature variety

Best-creature tier distribution across the 1,000 profiles:

| Best tier | Profiles |
|---:|---:|
| 2 | 9 |
| 3 | 52 |
| 4 | 225 |
| 5 | 283 |
| 6 | 245 |
| 7 | 138 |
| 8 | 42 |
| 9 | 6 |

This produces a healthy sense of escalation without handing every short synthetic roster a summit creature.

## Combat note

The test selected each profile's strongest generated creature against ordinary seeded opponents. It therefore produced an **86.5% win rate**. That result should not be interpreted as global combat balance; it validates that a player selecting the best member of a bred roster receives a meaningful advantage.

Only **18.3%** of those fights were near-even by total-power ratio. This supports a UX improvement: surface more evenly matched optional duels so players see more dramatic fights instead of mostly obvious victories or obvious losses.

---

# 7. Creature Progression Is Still the Main Design Constraint

The fresh focused creature model awarded current-rule XP through duel wins and a small standing-scout discovery allowance.

## Focused profile result

| Level milestone | Profiles |
|---|---:|
| Level 3 or higher | 812/1,000 |
| Level 6 or higher | **0/1,000** |
| Level 9 | **0/1,000** |

This means Level 3 is mechanically reachable when a synthetic player is deliberately given repeated creature battles. It does **not** mean ordinary campaigns reach it quickly.

The bundled full deep-campaign baseline still showed:

- 55 of 200 reaching Level 3
- 1 of 200 reaching Level 6
- 0 reaching Level 9

## Diagnosis

The level thresholds are not the entire problem. The normal expedition loop does not surface enough XP-bearing creature events.

Current XP remains concentrated in:

- standing-scout learning from newly catalogued species: +2
- friendly duel victory: +8, with anti-farm throttling
- conquest victory: +20 plus world tier
- guardian victory: +60 plus world tier

Feeding, breeding, compatibility discovery, preferred-biome visits, first-time abilities, narrow losses, and new lineage discoveries still do not meaningfully advance a creature's level.

## Recommendation

Keep combat as the fastest route, but award smaller XP for meaningful creature behavior:

| Event | Suggested XP |
|---|---:|
| Correct first-time feeding | 1–2 |
| Discover a food preference | 1–2 |
| First visit to preferred habitat | 1 |
| Breed a never-before-seen combination | 3–5 |
| First hybrid in a lineage | 4–6 |
| Participate in a duel | 1 |
| Narrow duel loss | 2–3 |
| Discover an ability interaction | 1–2 |
| Bond milestone | 2–5 |

This would make the Rancher progress by ranching rather than forcing every creature player into repeated victory farming.

---

# 8. Breeding and Lineage Feedback

The current code already has several good ingredients:

- deterministic inherited genes
- mutation
- class-lineage fusion
- Earth-lineage drift
- parent contribution percentages
- ancestry fields on the specimen card
- visual inheritance through the blended creature renderer

What remains is stronger **anticipation before the breed** and a clearer **goal after the reveal**.

## Recommended breeding preview

Before confirmation, show:

- likely body-plan inheritance
- possible habitat/class directions
- two or three highlighted traits that may pass
- mutation chance category, not necessarily an exact percentage
- whether the pairing can create a new lineage entry

## Recommended reveal improvements

After breeding, show:

- which parent contributed each signature trait
- what changed due to mutation
- whether this is a first-ever combination
- immediate suggested actions:
  - feed it
  - test it in a duel
  - visit its preferred habitat
  - breed toward a named trait goal

This converts breeding from a repeated button into a visible discovery arc.

---

# 9. Conquest Feedback

The current code displays a numerical estimated win percentage in the champion picker. That is useful and stronger than an unexplained difficulty gate.

The remaining opportunity is explaining **why** the estimate is high or low.

## Suggested presentation

Display both a label and the percentage:

- Favored — 74%
- Even — 52%
- Dangerous — 31%
- Overwhelming — 12%

Then identify the two main drivers:

> Faster initiative, but weak against the defender's Resilience and regenerative art.

After a loss, provide:

- opponent ability discovered
- closest round or remaining HP
- recommended stat or ability counter
- partial creature XP for a competitive attempt
- rematch tracking

This would make conquest losses feel like intelligence gathering rather than lost time.

---

# 10. Phone, Tablet, and Desktop UI

## Fresh geometry result

Eighteen fresh current-build panel openings were validated across:

- 390 × 844 phone
- 430 × 932 large phone
- 768 × 1024 tablet portrait
- 820 × 1180 large tablet portrait
- 1440 × 900 desktop

The successfully opened panels:

- stayed inside the viewport
- created no horizontal document overflow
- kept their close controls reachable in the corrected selector checks
- used the intended sheet behavior on touch/tablet sizes

The bundled full layout battery independently reports **546/546 passes**.

## Tablet Tier conclusion

The v1.7.3 Tablet Tier is successful.

The new model is clearer than squeezing desktop furniture into intermediate widths:

- named dock controls improve recognition
- 44px touch floors reduce missed taps
- panels align above the dock
- the world remains readable behind the sheet
- large monitors receive more useful panel width

## ARPG combat consideration

The exploration dock works well, but future real-time combat controls will compete for the same lower-thumb area.

Recommended mode behavior:

- **Exploration:** show the current two-row navigation dock.
- **Combat:** collapse navigation into one menu control and show attack, dodge, abilities, target, and interact controls.
- **Panel open:** pause or suppress world combat input.

---

# 11. Updated Fun-Factor Assessment

## Measured synthetic signals

- Fresh 40-action balanced sessions: **4.59/10**
- Earlier medium sessions: **6.12/10**
- Earlier deep sessions: **6.37/10**
- Current creature-focused short persona: **3.54/10** in the small fresh sample
- Current technical creature-system quality: **9.6/10**

## Interpretation

The game still becomes more enjoyable as systems begin to reinforce one another. Early synthetic players often leave before the full connection between exploration, mining, crafting, creatures, ship progression, and conquest appears.

The updated UI makes that path easier to understand, but it does not yet materially change the underlying creature progression rate.

## Current score

### Exact synthetic design band

**Approximately 6.0–6.5/10 overall**, with early sessions lower and established sessions higher.

### Estimated informed human-player score

**Approximately 7.0–7.4/10** for players who understand the systems and enjoy procedural sandbox progression.

### Path to 8.5+

The most important changes remain:

1. Make the first meaningful creature arrive earlier.
2. Let creature players earn progress through creature care and discovery.
3. Reduce Rancher no-op actions.
4. Give breeding stronger anticipation and follow-up goals.
5. Turn failed conquest attempts into clear preparation plans.
6. Add stronger audiovisual feedback for discovery, lineage, and level milestones.

---

# 12. Prioritized Findings

## High-priority design findings

### CF-DES-001 — Rancher friction remains the clearest fun problem

The fresh balanced sample again placed Rancher last:

- Fun proxy: 3.54
- No-op rate: 39.2%

The prior large battery reached the same qualitative conclusion. This should be treated as a reliable design signal despite the small fresh sample.

### CF-DES-002 — Normal campaigns do not generate enough creature XP opportunities

The engine can reach Level 3 under focused repeated battles, but ordinary deep campaigns rarely do. Add small XP sources to care, discovery, lineage, and competitive losses.

### CF-DES-003 — Short-session payoff remains weak

The fresh 40-action fun score remains close to the prior short-session result. Introduce a guaranteed memorable creature beat in the first substantial session.

## Medium-priority test and UX findings

### CF-SIM-001 — Remove the stale fresh-bulletin step from `simrun.js`

This is the most immediate test-harness fix.

### CF-SIM-002 — Preserve `medium` as its own run mode

This prevents misleading aggregation.

### CF-UX-001 — Explain matchup drivers, not only the percentage

The win estimate is useful; add the reason.

### CF-UX-002 — Make failed actions redirect the player

Every failure should give a nearby useful action.

## Optimization finding

### CF-PERF-001 — Recycle synthetic browser pages

The test harness should not run hundreds of reset sessions in one immortal document. Recycle pages and record duration trends to avoid cache/timer contamination.

---

# 13. Recommended Next Synthetic Battery

After the creature-progression and harness changes, run the following exact comparison battery:

| Cohort | Sessions | Purpose |
|---|---:|---|
| Standard training | 100 | Completion, clarity, skip behavior |
| Chaos training | 200 | Focus lock, Escape, double taps, panel storms |
| Short expedition | 250 | First-session fun and early creature timing |
| Medium expedition | 250 | Connection between systems |
| Deep expedition | 200 | Levels, conquest, ship progression, retention |
| Total | **1,000** | Direct comparison with the established baseline |

## Success criteria

- 1,000/1,000 complete without fatal errors
- Training permanent stalls: 0
- Chaos transient waits: under 2%
- No-op rate: under 15%, with Rancher under 20%
- Rancher fun score: at least 7.5
- Overall synthetic fun: at least 7.5
- 75% of short-session players find a meaningful creature
- 60% of medium creature-focused players reach Level 3
- At least 20% of deep creature-focused players reach Level 6
- Introductory conquest targets win at 30–50% when labeled Even/Favored

---

# Final Assessment

The v1.7.3 update is successful as a UI and device-support release.

## Confirmed strengths

- current source boots cleanly
- deterministic systems remain intact
- training completes under normal and adversarial input
- phone and tablet panels fit correctly
- creature generation, breeding, evolution, dueling, and code sharing are highly stable
- the new Tablet Tier UI is a meaningful improvement

## Main remaining limitation

The code is better at **creating creatures** than the current progression design is at **making players care for and advance them continuously**.

The next major gain will not come from adding another creature generator or another content category. It will come from making each creature action lead visibly to the next one:

> **Discover → understand → care → breed → test → grow → remember.**

That is still the clearest route toward an 8.5–9.5/10 Celestial Frontier experience.
