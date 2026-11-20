# 1,000-Tester Battery — v1.7 Baseline Report (2026-07-26)

**Build:** v1.7.0/v1.7.1 source (post-release baseline) · **Harness:** tools/simrun.js
**Spread:** 600 fast personas · 200 deep campaigns · 140 chaos adversaries · 60 full-fidelity UI/training sessions

## Headline: 1,000 / 1,000 clean

| Tier | Sessions | Errors | Softlocks | Deaths | Breaks | Completed |
|---|---:|---:|---:|---:|---:|---:|
| fast | 600 | 0 | 0 | 0 | — | 600 expeditions |
| deep | 200 | 0 | 0 | 0 | — | 200 campaigns (all built Jump+Array; 32 reached IG Drive) |
| chaos | 140 | 0 | — | — | **0** | **140/140** finished the 21-step training under adversarial input storms |
| ui | 60 | 0 | — | — | **0** | **60/60** (49 full training, 11 skip-path); **zero stalls** |

Zero JavaScript errors across all 1,000 sessions. The chaos tier — random clicks, Escape spam,
panel storms, double-activations between every legitimate step — completed training 140/140 with
no focus-lockdown or panel-rule violations (35 transient stalls, all self-recovered).

## Fun index (synthetic heuristic — directional, not human truth)

| Cohort | v1.6-era pack | This baseline |
|---|---:|---:|
| fast overall | 5.60 | **6.86** (p90 8.53) |
| Miner | — | **8.37** (the Forge economy landed for its audience) |
| Sprinter | — | 7.76 |
| Chaotic | — | 6.59 |
| Explorer | — | 6.22 |
| **Rancher** | 5.18 | **5.33 fast / 5.85 deep — still last** |
| deep overall | — | 5.56 |

## The Connection-arc thesis is CONFIRMED on fresh data

- **Ranchers fight the most and enjoy it least**: 646 duel wins per-cohort in deep tier — the
  highest activity of any persona — at the lowest fun score. Activity without progression payoff.
- **The creature XP drought is real**: 65/200 deep players reached creature Level 3 (~350 actions
  each); **zero** reached Level 6. XP only flows from wins today.
- Both are exactly what v1.8 "The Connection" targets (broadened XP, matchup meter, breeding
  anticipation, personality layer). This baseline is the measuring stick for that arc.

## Harness fixes made during this run (recorded for the next report pack)

1. `simrun.js` `tutAt` still matched the old `"/ 20"` step counter (same lesson smoke taught).
2. The walker predated the v1.7 graduation — it never opened 📜 or pressed Accept.
3. The v1.7 `sheet` lesson advances by its **Got It button**, not on open — the walker sat there.

Before the fixes the UI tier reported 11/60 complete; the 49 "failures" were the harness, not the
game. After: 60/60 and 140/140 with empty stall tables. **Rule reaffirmed: when the training
changes shape, grep BOTH smoke.js and simrun.js for the step total and the step-advance verbs.**
