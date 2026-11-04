# O3 sprint — work order (Dakk 2026-11-03: "I would like to make more progress on this, can we do a sprint?")

Start: when Codex reads TO_CODEX C551. End: Codex TERMINAL when the queue drains, or 06:00 EST 2026-11-04, whichever is first.
Roles unchanged from O1/O2 (D45, D46): Codex owns all heavy work in ONE serial reservation (42 GiB start, 30 GiB floor);
Claude does CPU-only review on a ~25 min tick. Claude accepts, Dakk QAs.

## Why O3 is shaped differently
O1 + O2 certified 4 species in ~15 h. The film chain is not the main limit: 38 of the 62 open items were REFUSED at the first
step (G1 auto-author). Most of those were scored against their whole family's references (rays vs ordinary fish, shrimp losing
to insect, seals failing on ground contacts), and a close certified relative already exists for most of them. About 18 need a
body plan no reference supplies yet. O3 works in order of payoff.

## Wave A — run as is (no tooling change)
Candidate-only or intake-pass items: Lancelet (native first), Fruit Bat, Insect-Eating Bat, Vampire Bat, Mandrill, Orangutan,
Cassowary, Thrips; then the owner/pivot fixes for Stick Insect, Wallaby, Kangaroo and Tadpole Shrimp.

## Wave B — nearest certified kin as an explicit reference
Add an optional, explicit reference pin to the authoring recipe (same shape as D40: default bytes unchanged, outcome tests,
negative controls in both directions; if G1 already supports it, use that). Suggested kin (Codex may choose a better certified one):
- Brine/Fairy/Freshwater/Vent Shrimp, Krill, Amphipod → Prawn
- Seal, Walrus → Fur Seal / Sea Lion
- Chimpanzee, Baboon → Gorilla; Marmoset → Lemur / Spider Monkey
- Kiwi → Rhea / Emu; Peacock → Turkey
- Rattlesnake → Viper; Gulper Eel → Eel / Moray Eel
- Deer Tick, Mite → Spider
- Giant Tube Worm → Tube Worm; Scale Worm → Leech / Earthworm
- Giant Clam → Clam (certified O2)
- Mosquito, Water Strider → nearest certified insect (Black Fly / Cricket)
- Narwhal → Gray Whale; Fangtooth → Viperfish; Oarfish → Moray Eel; Lungfish, Olm → nearest certified
Kin pinning never loosens a score threshold: the refusal rules are unchanged; only the reference set is narrowed.

## Wave C — first-of-kind body plans (one hand-built reference each, then fan out)
Rays (Eagle Ray, Manta Ray, Ray, Stingray); bell/tentacle radial (Jellyfish, Portuguese Man-of-War); Sea Cucumber; corals
(Coral, Cold-Water Coral, Deep-Water Coral); errant soft worms (Marine Worm, Polychaete Worm); colonial (Salp, Pyrosome);
Barnacle; Fly Larvae; Horseshoe Crab; Hermit Crab; Water Flea.
For each first-of-kind: Codex posts STATIC_READY_FOR_CLAUDE (the part map and rig stills) BEFORE any native film. Claude reviews
it on the next tick; rejecting a bad template there costs minutes, not a film/AI cycle.

## Interleaved
Source-material holds (Egret fringe and the other eight): regenerate or repair as each wave allows. Guardian r03: fix the
tail/contact static compression → rig → film (D47: 1254²).

## Gates
- The develop profile runs ONLY between waves with all worker CPU idle (C546: a contended run timed out). Red still stops, no retry.
- Any change in the game or I5 import graph is listed in `audits/O3_20261103/I5_CHANGES.md`; offline tools that the game does
  not import do not need a new epoch (C549 review).
- End chain (Claude, once, after TERMINAL): if no game/I5-imported change, certify all O3 accepts in one pass against C502
  (`i5-v2-0a5b6d4d00c8`); otherwise a fresh I5 epoch on the final head first (C502 procedure). Develop + validate before and
  after. First red stops, zero retries.
- Hard stops: no push/PR/label/hosted/develop/main/release/deploy; no weakened test, threshold or re-bound seal; signing refusal
  that one retry does not clear; free disk under 42 GiB at a stage start.
