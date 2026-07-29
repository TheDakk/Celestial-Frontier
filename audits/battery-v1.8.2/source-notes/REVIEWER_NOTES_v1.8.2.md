# Celestial Frontier — reviewer notes for v1.8.2

**Live:** https://celestialfrontier.github.io/ · **Version:** 1.8.2 "Steady Hands" · **Build:** `a9a13c7`
**Your last audited build:** v1.7.20 "The Proof"
**Releases since:** v1.7.21 · **v1.8.0** (feature arc) · v1.8.1 · v1.8.2

Our gates at ship: fingerprint MATCH 50/50 · smoke 527/0 · layout 561/9 viewports ·
balance PASS (17 archetypes + 55 rolled ability arts) · training sims 100/100, zero stalls · CI green.

---

## 1. Please read this first — where your coverage is uniquely valuable

**Our own harness is structurally blind to almost everything in v1.8.**

`simrun` drives the game through probe hooks (`breedPair`, `craftItem`, `chAccept`), not the DOM.
Every headline v1.8 feature lives in the UI layer, so our simulation cannot see it: the denial
messages render into surfaces it never opens, and the stall detector counts pointer events it never
fires. We ran a matched A/B (100 runs per arm, identical seeds, same tier) and it came back
completely flat — **which tells us nothing about whether any of it helps a human.**

We are reporting that rather than dressing the flat result up as either success or failure. Your
Playwright fleet drives real clicks, so **you are the first instrument that can score this arc at
all.** Everything in §3 is unvalidated at the player level by us.

One methodological note we owe you in return: we measured our own harness noise at **±6 on the
"creatures reaching L3" metric at n=100**, discovered by accident when two builds that are identical
from the simulation's point of view returned 16 and 10. If you score anything at that granularity,
a same-build repeat is worth running first. Our no-op and stall counters were stable across four
runs (35.3 / 35.3 / 35.0 / 35.4) and are the trustworthy signals.

---

## 2. ★ Audio — a dimension no round has ever been able to test

**This is the first build with meaningful audio, and prior rounds were structurally deaf** (persona
reviews were built from screenshot storyboards). Your own annotation flagged this: §15 of the port
plan is its largest section at 904 lines, against evidence from 2 of 24 testers, neither
substantive — an absence of evidence, not evidence of absence. This release is the cheap audio
playtest that annotation asked for, *before* anyone commits 10–18 weeks of audio production.

Everything is **procedural Web Audio — zero added payload.** Cold boot and the instant-link
property are unchanged (please verify).

- **Creature voices.** A voice is a parameter set, never a sample, and it is deterministic per
  genome — the same creature sounds identical on every device and through every shared code.
  - Earth's named animals sound like *what they are*, via the same rig taxonomy the art uses:
    18 archetypes across mammal, primate, bird, bat, reptile, serpent, amphibian, turtle, fish,
    cetacean, cephalopod, insect, arachnid, crustacean, gastropod, jelly, sessile. A wolf roars,
    a sparrow chirps, a whale sings, a rattlesnake hisses.
  - Alien creatures derive their voice from the genome, as their portrait does.
  - **Breeding blends voices.** A hybrid inherits from its Earth ancestor and drifts alien as the
    lineage anchor weakens over generations — the same anchor law the renderer already uses to
    graft alien phenotype onto an Earth rig.
- **Combat.** Duels and conquests previously played exactly one sound, at the very end. Every blow
  now lands with weight scaled to damage, crits ring above the impact, ability procs carry their own
  colour. Skipped playback stays silent by design.
- **Planetfall.** An arrival chord, then a biome ambience bed under the vista (tundra wind, ocean
  surf, magma furnace). The bed is bounded to the vista and stops on close, on hidden tab and on
  sound-off — please confirm it never becomes a background CPU or battery cost.
- **Feedback grammar.** A *blocked* action has its own tone, so a dead tap is audibly distinct from
  a successful one before the words are read.
- **Two toggles**, Settings › Audio: **Creature voices** and **Battle sound**, independent, both
  default on, both persisted.

**Ask:** does audio move any persona score? If it moves nothing, that is a genuinely useful result
and we would rather know before scaling §15.

---

## 3. v1.8.0 "The Connection" — the feature arc

Thesis: better *connections between existing systems*, not new systems.

| # | Item | What changed |
|---|---|---|
| 1 | **Actionable denials** | Every "can't" names what is missing, why, and where to get it, with a button that goes there. Breed/Feed wear their shortfall on the button face before you press. |
| 2 | **Broadened creature XP** | Care counts: welcome meal +1, taste discovered +2 (once per creature per flavour), successful union +2, first-of-its-kind lineage +5, bout survived +2, fight taken to the wire +3, conquest lost +3, defender nearly broken +5. Victories keep their weight. Anti-farm is a per-creature ledger, not a global cooldown. |
| 3 | **Stall detector** | When nothing has moved for ~10 interactions, the objective chip stops restating the goal and *suggests* a concrete next action, ordered by cost and never suggesting the unavailable. Any progress clears it. |
| 4 | **Conquest matchup meter** | **Closes CF1715-09.** `winEstimate` was a flat power ratio; the picker now runs 160 seeded duels per matchup and reports Favored / Even / Dangerous / Overwhelming, the true percentage, and one line of why. On your own reported case (defensive wall vs striker at equal power) the old ratio read 40%; the truth is 0%. |
| 5 | **Breeding anticipation** | Candidate rows preview the child's power band and reachable rarity — ranges only, never the roll. |
| 6 | **Personality + survey spotlight** | Cards speak temperament; a living world's card leads with its most notable resident. Presentation only — no generation change. |

---

## 4. v1.7.21 — your CF1720 round, all seven

- **CF1720-01** Earth's Atlas identity now *merges* onto the recruit's stub (the old guard was false
  on every completed training run, since step 4 re-charts Earth) **and** rides the persisted snapshot.
- **CF1720-02** the recovery rebuild reads the payload's stats, not live mid-training ones.
- **CF1720-03** the 44px heal target is back to zero layout cost (~26px of topbar reclaimed).
- **CF1720-04** honest failure copy — no longer points at the button that erases the game.
- **CF1720-05** markup strip on the recovery hydration path.
- **CF1720-06** `chWeek` no longer "repaired" at load.
- **CF1720-07** the ring is lowered rather than the card blanket-raised.

*Also, from our own CI:* the heal target measured 44×44 in Edge and 42×46 in Chrome, because the box
was sized from the ❤ glyph's intrinsic metrics. Now metric-independent. Worth a check on your fleet.

---

## 5. v1.8.1 / v1.8.2 — first playtest round

- The survey card no longer covers the Planetside during training.
- **Nothing auto-opens** any more: Compendium shelves and Fabricator categories start closed
  everywhere, training included. The two lessons that relied on a pre-opened drawer now ask the
  player to open one.
- **A real mini quest log**: the objective chip is now a handle — it unfolds into the chapter goal
  plus every accepted charter with live progress, and a way through to the board.
- The feed and breed lessons keep their specimen card open (its own buttons are the target).
- The heart's highlight hugs the glyph; the HP fill cannot paint past its track.

**Not a bug, please don't file it:** maximum HP rising above 100 is by design — `HP_MAX = vitality × 2`,
and eating flora permanently grows the stat.

---

## 6. Known open backlog (not claimed as fixed)

`CF1715-27` burn/thorns kills produce no death line · `CF1715-29` conquest affix always lands on a
worn slot · `CF1715-35` `#searchres`/`#tray` trapped in ancestor stacking contexts (latent) ·
`CF1715-37` step 13 asserts a wound applied 400 ms later · `CF1715-06` the ferocity-scaled damage
floor only bites above fer 20 (a fer-10 wall still loses; accepted design for now) ·
`CF1718-10` full per-modal focus memory (partial) · Ambush at magnitudes IV/V ·
direct 132px thumbnail rendering (first paint still generates HD).

---

## 7. What would be most useful from this round

1. **Audio scoring** — the first-ever measurement of it. Does it move fun, retention, or nothing?
2. **The Momentum layer, human-judged** — do denials read as help? Does the stall suggestion land as
   guidance or as nagging? This is the part our harness cannot see at all.
3. **Rage quits.** 3 → 5 → 7 across your last three rounds was the one metric moving the wrong way
   while everything else improved, and v1.8 is aimed squarely at it. Does it move?
4. **The conquest meter** — is "Overwhelming" showing up where the old number was reassuring?
5. **Cold boot and payload** — audio is procedural and should have cost nothing; please confirm.
6. **Physical iOS/iPadOS Safari**, which remains outside every harness we both run.
