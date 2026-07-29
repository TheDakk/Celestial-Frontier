# Harness — the instruments used in round 7

Everything here is Node + Playwright, run against a local static server:

    cd /path/to/build && python3 -m http.server 8906 --bind 127.0.0.1

Scripts default to `http://127.0.0.1:8906/game.html`; most accept `CF_URL`.

## The fleet
| file | what it does |
|---|---|
| `plan.mjs` | builds the 1,000-session plan (10 personas x 21 device profiles, seeded) |
| `bot.mjs` | one session: personas, device matrix, the training driver, the audit passes. Exports `SCAN_TARGETS`, `FIND_TARGETS`, `TUT_STATE`, which the probes below reuse |
| `fleet.mjs` | shards the plan across workers, appends JSONL |
| `analyze.mjs` | rolls the JSONL up |

    node plan.mjs 1000 out/plan.json
    node fleet.mjs 0 2 out/plan.json out/fleet.jsonl    # worker 0 of 2

## CF1802-01 — the mobile training wall
| file | what it does |
|---|---|
| `tutreach3.mjs` | walks the real training on 4-6 viewports; at each step samples a 7x9 grid inside every visible surface and asks `elementFromPoint` who wins. This is the instrument that found the P0 |
| `shot_dock.mjs` | walks to step 5 and screenshots with the dock buttons outlined and their measured reachability labelled |

## Audio
| file | what it does |
|---|---|
| `voicemodel.mjs` | extracts `voiceOf`, `_VOICE`, `_blendVoice`, `hashInt`, `makeGenome`, `crossGenome`, `_earthArt` **verbatim** from the build by brace-matching. Nothing is re-implemented |
| `voicerun.mjs` | runs that model over 200,000 genomes: family spread, f0 distribution, clamp saturation, the 540-voice vocabulary, the Earth-name checks, the breeding drift curve |
| `voices.mjs` | runtime fingerprint: `Proxy` on the `AudioContext` constructor, wrapping the four node factories with `setValueAtTime` and both ramp methods patched |
| `amb3.mjs` | the ambience lifecycle test — close / hidden tab / sound-off, with `loop` intercepted and every start/stop timestamped |

## Perf
| file | what it does |
|---|---|
| `ab_boot7.mjs` | paired cold boot, two builds alternating on the same host, fresh context each rep. Serve the comparison build on a second port first |
| `oddscost.mjs` | independent cost measurement of the conquest matchup meter (one `runDuel` = 0.0006ms) |
| `v18sim.mjs`, `duelsim.mjs` | brace-matched extraction of `runDuel` / `battleStats` / breeding functions for offline simulation |
| `responsive3.mjs` | 21-device layout sweep |

## The two probes that produced retractions
| file | what it showed |
|---|---|
| `specclick2.mjs` | "only 1 of 6 specimens opens" — real pointer clicks revealed the other five were landing at (0,0) because the rows had zero-size rects inside a collapsed shelf. My probe, not the game |
| `shelfstate.mjs` | what actually happens: viewing a specimen and dismissing its card closes the Compendium (shelves keep their open state) |

Kept deliberately. A probe that produced a false positive is worth shipping alongside the one that
corrected it.
