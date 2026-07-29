# Celestial Frontier v1.8.4 "Clear Ground" — response to round 7

**Live:** https://celestialfrontier.github.io/ · **Supersedes:** v1.8.2 `a9a13c7`
**Round 7 covered:** 25 findings across four reviews, a 1,000-session fleet, a 200,000-genome
voice model, and a paired idle-host boot A/B.

This was the strongest round the project has had, and the most useful thing in it was not a
finding — it was **method**. Three things in particular changed how we work:

- You verified CF1720 by *reachability*, not by presence. That caught CF1720-07: a rule we had
  shipped, tested, and declared fixed, which was permanently dead because a blanket selector
  out-specified it. We had independently walked into the identical trap the same week.
- You retracted "a creature speaks only once per session" before publishing, and told us it was
  your probe. That is worth more than the finding would have been.
- You reported `tutorialCompleted: 0/498` as a harness limit rather than a regression, after
  checking it against six rounds of your own history.

**23 of the 25 are fixed. One could not be reproduced. One is a design question for the author.**

---

## 1. CF1802-01 — we had already fixed it, from the same report

Nick hit this on his phone and we shipped the fix internally before your bundle arrived, so this
is genuine independent convergence rather than us reading your answer. Two notes where we differ:

**We did not take the recommended patch.** Yours scopes the raise to three named step ids:

```js
document.body.classList.toggle('tut-panel',
  !!(s && (s.id==='survey-tour' || s.id==='atlas-add' || s.id==='land')));
```

That is correct today and drifts the moment a step is added or renamed — the same brittleness that
made the original blanket rule wrong. Ours derives the raised surface from **each step's own
`spot`/`allow`**, so the law is "the surface this lesson points at is the top surface" and it
holds for all 21 steps and every step added later. Exact-token matching, so `#logbtn` never
lights `#log`.

**Your recommended regression assert is exactly what we built** — `elementFromPoint` at the centre
of each step's target — and it earned its place immediately: **our first version of the fix did
nothing at all.** We wrote the rule as `body.training .tutpri`, which scores two classes against
surfaces that declare their layer through an *id*, and one id outranks any number of classes. The
mark was applied, our class-level tests passed, and the bug was still live. Only the hit-test
caught it. That is CF1720-07's failure mode, in our own new code, in the same week you reported it.

Replayed against v1.8.2 with `--url=`, that gate now reproduces your measurement on all three
phone viewports.

**CF1802-02** (no ring at 744×1133) we believe is downstream of this: `_tutSpot` deliberately
draws nothing when its target's centre is covered or off-screen, and at that width the survey card
covered `#logbtn`. 744×1133 is now a permanent viewport in our layout gate — it sits just under
the 900px dock breakpoint, exactly the seam you identified — and it passes.

---

## 2. The exploits — all seven fixed

| # | Finding | Fix |
|---|---|---|
| CF1802-09 | Tapping a life-form row minted an uncaught species | Only a **catalogued** row opens a card; an uncaught one names Tame/Scavenge and refuses audibly |
| CF1802-10 | "A welcome meal" unledgered; `fed` unbounded | The welcome bonus is now a **first**, per creature — as its own name says |
| CF1802-11 | A lost conquest was never recorded | Consolation XP is keyed **per creature, per world** |
| CF1802-12 | Free mates → rarity slot machine | **Mitigated at the source**: with -09 fixed a mate costs a real capture again, restoring the designed brake. Grade-uncapped bred children remain intentional |
| CF1802-13 | Weekly landfall charters self-completed | The banked-landfall law is now **starter-only**; weeklies count only landings made while held |
| CF1802-13b | `_chRoll` still ran on the boot tick | The roll is **armed** by the first real gesture (or 8 s), never on the pre-NTP tick |
| CF1802-14 | Harvest cooldown trusted the wall clock | In-session harvests must satisfy a **monotonic** clock too; no save-shape change |
| CF1802-15 | Sanitiser missed `_mult`/`_wf`/`apex` | The load path now **mirrors `normGenome`** |

CF1802-15's framing is the one we've written into `SAVE_SYSTEM.md` as a standing rule: *anything
`normGenome` strips from a shared creature must also be stripped from a loaded one.* They are the
same trust boundary — one is another player's bytes, the other is the player's own editable bytes.

**CF1802-09 confirmed.** You asked for twenty seconds of runtime verification; the source path was
unambiguous enough that we treated it as confirmed and fixed it. Worth noting: the Guide already
promised the correct behaviour — *"The survey reveals the roster; it catalogues nothing."* The
documentation was right and the code had drifted away from it.

---

## 3. Momentum — including the one that matters most

**CF1802-03 is the most consequential item in the round** and we've treated it that way. The stall
suggestion could only render for a player who already had a goal, so the player with nothing on —
50% of your fleet, 100% of your rage quits — was the only one who could never be offered a next
step. Fixed by hoisting the branch above the `if(!g)` return.

Its gate has a story worth passing back. Our first version cleared `chacc` and called it a
no-objective state — and **passed against a build with the fix reverted**, because the Ascent
chapter goal was still standing and `g` was never null. The real state is *both* conditions. Once
we constructed it properly, the negative control failed correctly. We would not have caught that
without deliberately breaking the build first.

Also fixed: **CF1802-04** (both Atlas suggestions now gated on `logMap` actually having something
in it; `go:null` replaced with a real destination so the chip stops toggling the quest log),
**CF1802-05** (`skim` → `skimmed` — one character, and it meant an actively-skimming player was
told to go do something else), **CF1802-06** (the log rides `_chBadge`, closes on Escape, and
cannot strand after the chip hides), **CF1802-07** (the Fabricator shortfall button was a dead
press with no handler at all — it now answers; and the three silent training returns now refuse
audibly with a nudge instead of vanishing).

**CF1802-08 we could not reproduce.** Driving the real path in our harness — open the Compendium,
open a shelf, tap the row, dismiss with a genuine `pointerdown`+`click` — leaves `codexOpen ===
true`. Our first attempt at that check passed *vacuously* because `click()` alone never fires the
outside-close manager, so we re-ran it with a real tap and it still holds. The check is now a
permanent gate either way. If your repro used a specific viewport or an interleaved action, we'd
take the sequence.

---

## 4. Audio — your three prerequisites, done

You said fix -19, -20 and -21 before any listening test, because scaling §15 against a 540-voice
vocabulary would be building on the wrong measurement. Agreed and done:

- **CF1802-19** — the bed stops on Sound-off. (Your point that `ac()` gates only *new* sound, and
  the bed is the one voice that outlives its trigger, was the whole diagnosis.)
- **CF1802-20** — the voice now reads `trait`, `body`, `loco`, `diet` and `sense` as bounded
  multipliers alongside family/size/temperament. No new branching, no payload, determinism
  untouched; the vocabulary goes from 533 distinct to millions.
- **CF1802-21** — `bold` now reads `g.temper % FA_TEMPER.length`, the gene the card actually
  prints, with an explicit boldness value per temperament rather than the index order. "Aggressively
  territorial" is now the boldest voice; it was near the meekest.
- **CF1802-22/23** — `playConfirm` has call sites; the deny tone moved out of the markup builder
  and into the presses.
- **CF1802-24** — `bat` f0 5200 → 3600, plus a gain taper above 4 kHz.

We have **not** restarted the bed on tab-return; flagged as a design decision rather than silently
chosen.

---

## 5. Not fixed — one design question, one measurement we owe you

**CF1802-17 is half fixed.** The *bug* — the preview overstating by up to 6.2× because the band
was built from `battleStats` totals that include a `fed` bonus the child cannot inherit — is
fixed: the range is now computed without it, and the card says plainly that the fed bloodline does
not carry over. **Whether `fed` should be inherited at all is a design change, not a defect**, and
it interacts with the ceiling we just put on `fed`. That is Nick's call, not ours to make quietly.

**The cold-boot outlier.** Your 3-of-8 reps at ~2.1–2.3 s to interactive is the one thing here we
have not chased, and you were right to flag rather than claim it. It is on the list.

---

## 6. Corrections to our own claims

- **"Zero added payload" was wrong** and your byte table settled it — zero *audio-media* payload,
  +2.4% gzip for the whole arc. Already corrected in the v1.8.2 notes.
- Our §3 claim that the stall detector was "ordered by cost" and "never suggests the unavailable"
  was **not true of the code**, as you showed. We have not re-made the ordering claim; the
  unavailable-suggestion half is now actually true.
- Our "denial contract covers every 'can't'" claim covered three paths. It now covers the two you
  named as mattering most plus the silent training returns — still not all ~24, and we are not
  going to claim otherwise until it is.

---

## 7. What would help most next

1. **Re-run the seven exploits.** The lineage bonus especially: correct behaviour is "pays once per
   species pair, ever", which a single session cannot distinguish from the old bug.
2. **Rage quits on 1.8.3+.** CF1802-03 is the first change actually aimed at the mechanism you
   identified rather than at the symptom, so this is the first round where the number should be
   able to move.
3. **A human listening test**, now that -19/-20/-21 are done.
4. **CF1802-08**, with the exact sequence if you still see it.
5. **Physical iOS/iPadOS Safari** — still outside both harnesses, and still where CF1802-01 lived.

Gates at ship: fingerprint MATCH 50/50 · smoke 553/0 · layout 683 checks across 10 viewports ·
balance PASS · validate 9/9. Every new check was verified to fail against a deliberately broken
build; two of those negative controls changed what we shipped.
