# D50 — certified creatures delivered into the game (slice 1)

Decision: D50 (Dakk 2026-11-03, "Yes, tiered"). Branch: `anthropic/d50-delivery`. It joins `anthropic/mac` only together with a
fresh I5 epoch: game-imported files changed, so the selected C502 Compendium/I5 certificate no longer binds the build.

## How a certified species reaches the game
1. `resolve-fits.mjs`: every certified registry row → the EXACT fit its certifying native film used (sha256 of record.json and
   binding.json, both bound in the film's report.json) → its authentic tracked master by `record.geometry.cutoutAssetHash`.
   517 rows → 502 resolved (481 species); 15 AI-finish rows carry no fit hash in their film report (follow-up).
2. `publish.mjs --slice …|--all`: latest certified fit per species → `port/v2/tools/morph/delivered-archetypes.json` (data rows
   appended to the hand-listed `CARD_ARCHETYPES`), the film's own contact-support setting, the master restored byte-for-byte at the
   path its record names, and `force-add.txt` (ignored fit files the build and tests read, tracked so a fresh clone can rebuild).
3. Existing builders, unchanged: `build-card-masters.mjs` → `build-shipped-battle2.mjs` → `creature-finish-source-pins.mjs` →
   `build-shipped-battle2.mjs`; `CF_REGENERATE_CARD_TINT=1` on the card-tint test regenerates the tint table.

## Admission = certification + every existing per-archetype game gate, unchanged
`arena-probe.json` and `admission.json`: of 451 deliverable species, 381 pass the arena (attacker + target, zero rig refusals),
scale sweep, accent trim ≤35 %, body recolour and long-body card gates. 70 are HELD with exact reasons: 28 in families without
attack/voice/stand-in support yet (bivalves, gastropods, worms, isopods, nautiloid, polyps, sponges); 4 rig refusals in the arena;
23 accent > 35 %; 13 body barely recoloured; 2 long-body card. Held species keep their certification.

## Slice 1 (this commit): 24 species
Tiger, Giraffe, Zebra, Red Fox, Penguin, Flamingo, Hippopotamus, Rhinoceros, Koala, Polar Bear, Cheetah, Gorilla, Clownfish,
Sea Turtle, Ladybug, Cobra, Chameleon, Crocodile, Hedgehog, Raccoon, Moose, Snowshoe Hare, Raven, Bat. Library 65.0 → 108 MiB
(on demand); first-use pack unchanged at 60.4 MiB.

## Code and test changes (each keeps or tightens its check)
- `build-card-masters.mjs`: appends the delivered data rows.
- `creature-finish-source-pins.mjs`: a DELIVERED fit without its own labels.png gets no labels pin (not finish-eligible; it ships
  its certified atlas). Hand-listed archetypes still fail closed; the test adds the negative control (empty delivered set → throws).
- `painted-cards.test.ts`: the tool's list = literals + delivered rows; exact total count + no duplicate species.
- `morph-library.test.ts`: long bodies stay an explicit list (`delivered-long-bodies.json`, measured once, compared exactly).
- `painted-variants.test.ts`: Lion → Tiger (nearest painted felid), Red Fox is itself, Brown Bear → Polar Bear; each old rule kept
  as a control with that painting removed.
- `battle2-matchup.test.ts`: rigs load with the archetype's contact supports, as the app wiring builds them (was: none).

## Gates on this commit
All affected suites green; develop 6096/6102 with ONE expected red: `current-producer-authorities` (the Compendium/I5 authority
binds the build) → a fresh I5 epoch is required (C502 procedure), owned by Claude, after the O3 reservation closes.

## Scaling past slice 1 (decision needed)
The full 381 changes the matchup tests (all pairs: 405² stagings, beyond their time budget) and the card-memory test (a
100-archetype control). Offering every pair in the picker vs representative pairs is a game-design call, not a test tweak.

## Tier 2 (2026-11-03): 100 species delivered
Slice 1 + 76 more, round-robin across the supported body families (`port/v2/tools/morph/delivered-archetypes.json`). Library
210 MiB on demand; first-use pack unchanged (60.4 MiB). Develop 6097/6103 in 11 min, ONE expected red (Compendium/I5 authority).
Added since slice 1: D52 representative matchup pairs (`battle2-matchup.ts`); the card-memory "unbounded" control is sized to the
roster (was a fixed 100); admission also requires a template the game supports (Prawn's `crustacean-small` has no voice/stand-in);
roster-dependent examples (Lion → Tiger, Komodo Dragon → Anole, Anaconda → Boa, Brown Bear → Polar Bear) each keep a control that
removes every delivered painting and recovers the pre-D50 answer; the coverage count is stand-in + self-painted.

## Why not all 381 yet (D55)
Every per-archetype battle test runs each archetype through full bouts. At 405 archetypes four of them exceed their 300 s budgets
(arena share, frame, band, matchup); at 124 the slowest is the scale sweep at 235 s. Raising budgets weakens nothing but makes the
develop gate (and the hosted step cap) impractical. Options: a separate library profile that runs the full roster per batch of
deliveries, with develop running the hand-listed set plus the current batch; or sharding the loops across workers.

## Tier 3 (2026-11-04, FINISH sprint F3): 382 species delivered
D55 (library check profile) unblocked the rest. Re-resolved 505 certified fits (O3's Stick Insect, Whale, Lancelet added);
published every certified, resolved, supported species that is not hand-listed and not held: +283 rows tagged `batch: d50-tier3`
(earlier rows `d50-tier2`). Stick Insect then failed the unchanged long-body card outcome (diagonal fill ratio 1.137 <= 1.15) and
is HELD (admission.json), leaving **382 delivered + 38 hand-listed = 420 card archetypes**. The long-body list was re-measured with
the same renderer comparison (107 names). Library 669 MiB on demand; the precached first-install pack is unchanged (60.4 MiB).
Roster-dependent examples (Lion, Brown Bear, Komodo Dragon, Anaconda, Great White Shark, Red Fox, Garter Snake) now assert the
route over the PRE-delivery painted set (so later tiers cannot move them) and that a delivered species is itself.
Gates: `--profile=library` PASS over all 420 (sweep / arena / matchup, 46 min); develop: one expected red (I5 binding) until F4.
