# C15 wiring and stage repairs (Claude, 2026-09-25)

Codex's C15 packets consumed on `anthropic/mac` after merging `openai/mac` at `e1cc9514` (merge `d1dbb979`).

## Wired (card, stand-ins, arena)
| Creature | Fit | Masks | Notes |
|---|---|---|---|
| Bass | `08-bass/fit-05` | packet root | READY per Codex |
| Tang | `10-tang/fit-06` | packet root | READY per Codex |
| Jellyfish | `jellyfish-repair-03/fit-06` | packet root | hash-bound `weapon-declaration.json` passed to `compileAnatomyAttack`. The declared repertoire is proven at build time, so a refusal keeps the Chronicle and never throws inside the ticker. Procedural jellies (plan 9) now draw as the Jellyfish. One coat: the radial accent group is its whole bell. |
| Dragonfly | `dragonfly-repair-03/fit-03` | packet root | the damage number is clamped (`NUMBER_TOP_MIN`); accent is antennae only (its wings are 67% of the paint) |
| Sturgeon | `sturgeon-facing-04/fit-02` | packet root | the ready gap fix (below) |
| Wolf | `11-wolf/fit-03` | `mask-set-02` | full travel now |
| Impala | `interior-root-repair-05/impala-fit-02` | fit's own (shipped at `markings/<name>`) | |
| River Otter | `13-river-otter/fit-02` | packet root | the ready gap fix |
| Heron | `16-heron/fit-01` | packet root | `contactSupports: 'observed'` (Codex's bird law) |

## Held (they pass the integrated check but are not shipped)
`port/v2/tools/morph/budget-held-archetypes.json` keeps their exact rows.
- **Pike, Goose, Ibex, Cougar, Marmot, Wall Lizard:** held by the 128 MiB shipped-pack cap. The rest of the app is about 54.5 MiB, so the arena may hold about 73.5 MiB; it is now 67.8 MiB. They come back once the masters leave the pack (C13).
- **Gull:** held by CARD = STAGE. Its accent saturation reads 0.183 on the stage atlas and 0.176 on the 512 card master, on either side of the 0.18 threshold, so the card and the stage would tint it differently. It needs ONE tint decision that both use.
- **Cattle:** held for performance, per Codex.
- **Brown Bear:** held because only five of its six masks exist.
- **Sparrow:** not repaired yet. **Reef Shark:** its tail leaves the water band.

## Stage repairs (the stage is Claude's)
- **Codex's layered idle + approach reach (`412e2cf2`) and faint idle settle (proposal 02) are applied.**
  - The measurement costs 0.5–2.7 s per legged rig on desktop, on the main thread at fight start.
  - The result is cached by its complete input: the record, the supports and binding, the cap, and the exact sampled timelines.
  - The first load still pays the cost. See mailbox C22.
- **READY spacing (`placement.readySpacing`).**
  - The painted boxes keep a `READY_GAP` of 0.10 of the frame, and stay 0.02 from its edges.
  - The stands spread out first. Only a frame too narrow for both scales the non-guardian fighters down; guardians keep the fill D2 decided.
- **Box-to-box run-up.**
  - The run-up is measured between the painted box centres (`stage.centresX`) and runs to `CONTACT_GAP`. There is no longer a 0.55 cap.
  - The Sturgeon now runs 0.08 of the frame, where Codex measured 0.018.
- **Test `battle2/ready-spacing.test.ts`:**
  - It uses the real Sturgeon against itself on a lake. The negative control is the old composition, which overlaps by 0.087.
  - Disabling the rule makes it fail.

## Checks
- The integrated library check (`library-arena.test.ts`) passes on all 33 candidates: zero rig refusals as attacker and as target at 30 Hz, the sizing, and band containment.
- **Picker smoke in Edge, with the production service worker in control** (`picker-*`, on package `dev-preview-96eb2e2cf338`):
  - Every pair passed, with painted rigs on both sides and zero page errors: Bass–Tang, Jellyfish–Sturgeon, Dragonfly–Heron, Wolf–Impala, River Otter–Civet and Jellyfish–Octopus.
  - One run failed (`picker-River_Otter-Civet`): its second matchup did not start within 120 s. Four reruns in the same order and the reverse order passed, and the failing report is kept.
- Full develop profile: 5,373 pass; the only red is I5.
  - The app and worker typechecks show 0 errors. artaudit, overridecheck, speccheck and overridecontrol all exit 0.
  - The root `--noUnusedLocals` check has 185 errors that were already there (Codex's motion → pixi/webgpu type path, plus `motion/overlay.ts` `BodyCard`). The profile never reaches that check while I5 is red.
