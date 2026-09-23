# Archetype repair sprint — final handoff

All 13 ordered items have a recorded outcome: **7 passing results and 6 stopped items**. This is not an all-green roster. The five passing archetypes are Salmon, Eagle, Python, Starfish and Octopus; I5 and Salmon markings supply the other two passes. Every original failure remains retained. Nick owns visual art acceptance.

| Item | Outcome and remaining finding | Packet / art review |
| --- | --- | --- |
| 1 — Compendium | Exact-Edge certificate PASS, 78/78 outcomes and zero findings, on clean committed local source | [Certificate and authorities](01-i5/README.md) |
| 2 — Salmon | 14 static rows and exact rest PASS; zero film refusals | [Packet](02-fish/README.md) · [sheet](02-fish/review-sheet.png) · [film](02-fish/native-02/battle-10s.webm) |
| 3 — Eagle | 15 static rows and exact rest PASS; zero film refusals | [Packet](03-biped-bird/README.md) · [sheet](03-biped-bird/review-sheet-07.png) · [film](03-biped-bird/native-07/battle-10s.webm) |
| 4 — Beetle | Corrected painting still exposes only five of six traceable walking legs; stopped at second painting | [Packet](04-insect/README.md) · [sheet](04-insect/review-sheet.png) |
| 5 — Python | Original signed PASS retained: 13 static rows, exact rest and zero film refusals | [Packet](05-serpent/README.md) · [sheet](../ARCHETYPE_SPRINT_20260922/05-serpent/review-sheet-unobscured.png) · [film](../ARCHETYPE_SPRINT_20260922/05-serpent/native-01/battle-10s.webm) |
| 6 — Tree Frog | Material/rest repaired; nine static failures diagnosed; corrected pose painting rejected | [Packet](06-hopper/README.md) · [fit sheet](06-hopper/review-sheet-02.png) · [rejected repaint](06-hopper/candidate-03/review-sheet.png) |
| 7 — Chimpanzee | Exact rest passes; three static failures diagnosed; corrected painting adds a third hind leg | [Packet](07-primate/README.md) · [fit sheet](07-primate/review-sheet-02.png) · [rejected repaint](07-primate/candidate-03/review-sheet.png) |
| 8 — Starfish | 14 static rows and exact rest PASS; zero film refusals | [Packet](08-radial/README.md) · [sheet](08-radial/review-sheet-03.png) · [film](08-radial/native-03/battle-10s.webm) |
| 9 — Tarantula | Corrected painting has six exposed walking tips; eight traceable chains required | [Packet](09-arachnid/README.md) · [sheet](09-arachnid/review-sheet-02.png) |
| 10 — Octopus | 14 static rows and exact rest PASS; zero film refusals after legal authored-mesh change | [Packet](10-cephalopod/README.md) · [sheet](10-cephalopod/review-sheet-03.png) · [film](10-cephalopod/native-03/battle-10s.webm) |
| 11 — Fruit Bat | Corrected wings point rearward, but near-wing tip is clipped and forearm pose remains wrong | [Packet](11-flyer-membrane/README.md) · [sheet](11-flyer-membrane/review-sheet-02.png) |
| 12 — Centipede | 73-joint candidate exceeds 64; compact 43-joint candidate fails existing planted-contact admission | [Packet](12-myriapod/README.md) · [sheet](12-myriapod/review-sheet-02.png) |
| 13 — Salmon markings | Six original mask results retained; exact bytes and original master authority checked, no repeated conservation battery | [Packet](13-fish-markings/README.md) · [six-mask sheet](../ARCHETYPE_SPRINT_20260922/13-fish-markings/six-mask-sheet.png) |

## Measured desktop performance

The passing local native runs have zero dense/live rig refusals. Per-rig p95 values below are rounded for reading; raw measured values and scope are retained in each report. The unchanged painted-tier limit is 3.5 ms per rig.

| Archetype | Native run ID | Left / right p95 ms |
| --- | --- | --- |
| Salmon | 20260922-salmon-native-02 | 1.50 / 1.10 |
| Eagle | 20260922-eagle-native-07 | 0.70 / 0.80 |
| Starfish | 20260922-starfish-native-03 | 1.90 / 1.60 |
| Octopus | 20260922-octopus-native-03 | 1.00 / 1.30 |

Python's historical run `archetype-sprint-05-serpent-01` records whole-stage p95 2.899999976158142 ms; no separate native run ID or per-rig metric was emitted. It is not relabelled as a newly measured per-rig result. The stopped corrected paintings and Centipede have no new film or CPU number.

## I5 certificate scope

Run `20260922-i5-focus-89b5da95c185` measured clean committed local source `89b5da95c185a1e8f08080ed3f42bab8a0494ec7`, using exact Edge 153.0.4234.48 / CDP 1.3. Named verification passed; duration 56765 ms. Producer authority: `bd8edd1b570d4bc4e1933a87a9e0552e75208d18ca43c40d2ffcd6712ebc1a5b`. Measurement authority: `6a829fb18eab4c171afaace0f49ad2a987cfcdc520d33dbc05337c379df85ee2`.

The required authority/budget tests and develop profile passed at that preparation: 251 Node tests, 4542 Vitest passes and one existing skip. Historical calibration samples, ruler, ceilings and historical assertions remain preserved. Later archetype diagnostics carry their own source hashes; this certificate is not rebound to later code or to PR #43's integrated bytes. No PR #43 green claim follows.

## Changes, limits and handoff

Approved local repairs covered Compendium focus/source completeness, native habitat sizing and exact-output orientation optimization with JS fallback. The orientation controls and S2 comparison are retained in Eagle's packet. Subsequent commits through Centipede change audit/handoff files only; FINAL_SOURCE_CHECK.json records that inspection. Accepted bindings, S2 inputs and numerical gates remain protected. No unchanged acceptance batteries were repeated for evidence-only closure.

Five items exhausted their single corrective repaint: Beetle, Tree Frog, Chimpanzee, Tarantula and Fruit Bat. Further paintings need a new allowance. Centipede's corrective painting remains unused; its counted-contact representation must be scoped before painting or fitting, and the 64-joint/32-part ceilings remain unchanged. These are unresolved acceptance problems, not passes.

All item commits use SSH signatures; individual verification receipts and earlier signer refusals remain retained. The signer worked for the final continuation. Earlier `agent refused operation` messages did not establish a locked 1Password state.

Codex completes the signed closure and one normal final `openai/mac` branch push under Nick's standing instruction, verifies remote equality, then holds. FINAL_PUSH_PREFLIGHT.json records PUBLIC visibility and UNFROZEN mode; inspected workflows have no push trigger, and no hosted-attempt authority is inferred. No fetch/sync, PR, label, merge, release or deploy.

Claude consumes the signed packets under Nick's integration direction. Nick can open Claude after the final handoff and review the linked sheets/films. Claude should retain the six stopped outcomes unless Nick grants the remaining painting/contact scope; no PR preparation or merge is part of this handoff. The final response reports the actual signed head and push result; this pre-push committed packet does not invent a future remote result.
