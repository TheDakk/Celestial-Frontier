# Celestial Frontier v1.8.7 → v1.8.8 — notes for round 10

> ## ⭐ SUPERSEDED IN PART: v1.8.8 "Paid for Playing" shipped the same day
> **CF1805-05 (harvest) is CLOSED**, and §6.4 below (asking you for a view on it) is answered.
> We did what you would call the third option: **we stopped defending the clock and changed which
> clock it is.** Harvest now runs on `COSMIC_EPOCH` — a persisted, monotonic **play-time**
> accumulator this codebase has used for biosphere recovery since v1.7, which never reads
> `Date.now()`, survives a reload, and cannot be wound. `HARVEST_EPOCHS = 2` ≈ 40 minutes of
> *playing* per world. There is no wall clock left in the path to attack.
>
> Your sentence is what unlocked it: *"a monotonic in-memory stamp is the right instinct and the
> wrong storage."* The storage already existed; harvest was simply the one regeneration system
> that had never been moved onto it.
>
> **What we would most like you to attack in round 10:**
> 1. **Try to wind it.** Device clock forward a day, a week, a year; across reloads; with an edited
>    save. Our gate (`tools/harvestclock-check.js`) asserts no payout and fails on v1.8.7 — please
>    try to find the case it does not cover.
> 2. **`conq[].e` on load.** Absent ⇒ ready (a pre-v1.8.8 empire pays one cycle per world, once, by
>    design). Clamped to `[0, EPOCH_BASE]`. Attack a save claiming a future or negative epoch.
> 3. **The cadence.** 2 epochs is a balance guess, not a measurement. An engaged player now earns
>    slightly faster than the old hourly wall cadence; an idle one earns nothing while away. Tell
>    us if that reads as generous, mean, or invisible.
> 4. **`EPOCH_TICK` is now a shared knob** — it drives biosphere recovery *and* harvest income.
>    If you see a tuning conflict between those two, that is a finding we cannot see from here.
>
> Everything below still stands as written for v1.8.7.

---


**Build:** see `version.json` at https://celestialfrontier.github.io/.
**Predecessor audited:** v1.8.6 `0bfc904`. **Round 9 delivered and answered:** 2026-07-31, same day.

Round 9 is the most useful review this project has received, and the reason is narrow and worth
naming: **you reviewed the delta hunk by hunk instead of re-running the fleet.** 152 changed lines,
and it found a line that was corrupting live saves — something no amount of session volume was
going to surface, because the corruption only shows up across a reload boundary.

---

## 1 · CF1806-01 — you were right, and it was worse than you measured

Removed. `_sanitizeSavedGenome` no longer touches `size`.

We reproduced your simulation with our own build's functions and got **12.4% of lineages past
size 5 by generation 5** (max 10) — the same order as your 10.4%, from different seeds.

**One wrinkle you did not have, which strengthens the finding.** You wrote that `size:1e6` wraps to
`4` for `+16` vitality "against a legitimate maximum of +20". That is true of the `sz*4` term, but
`size` is **not** uniformly wrapped: `speciesGrade`, `rarityRoll` and `sapience` read it **raw**
(`>=3`, `>=4`, `>=5`), which lifts the whole stat budget. So a stored `6` is *not* equivalent to a
stored `0`:

| stored `size` | in session | after ONE reload with the clamp |
|---|---|---|
| 6 | "tiny", **vit 50** | "titanic", **vit 70** |
| 9 | "large", vit 62 | "titanic", vit 70 |

Your conclusion holds either way — measured, a crafted `size:1e6` yields **vit 66 against a
legitimate maximum of 70**, so the wrap alone bounds it and the clamp bought nothing.

It also means **do not "finish" this by wrapping at load instead**: that would rewrite honest data
too, just less visibly. The drift is a balance question, and `crossGenome`/`evolveGenome` are both
determinism-fingerprint probes, so changing the mutation needs a deliberate re-pin.

**Guarded now:** `node tools/sizedrift-check.js` asserts a drifted genome survives the load path
unchanged and that the crafted-save exploit stays bounded. It **fails on v1.8.6** (`size 9 → 5`,
`vit 80 → 88`) and passes on v1.8.7.

---

## 2 · CF1806-02 — fixed, and the gate that missed it now exists

Your diagnosis was exactly right, including the honesty note about forcing the state. The new rule
inherited `#panel`'s selector shape and not its constraint.

The fix is a variable, `--tut-dock` (126px below the 900px breakpoint, 24px above), read by the
`.tutpri` rule — **not** a second rule. That shape was chosen after the obvious one failed, and the
failure is worth passing back to you: the first attempt added a duplicate `max-height` inside the
media block, which sits *earlier* in the sheet than the `.tutpri` rule at ~1876 with *equal*
specificity. Both `!important`, both ours. It changed nothing.

Measured after the fix, iPhone SE: board ends at **549**, dock starts at **563**.

**On your note about our gate** — you were right that the card-only pass is why CF1805-01 is fixed
and also why this was missed. `uilayout.js` now asserts your stronger assertion: *every dock control
is the topmost element at its own coordinates*, for all four boards, on every viewport at or below
the breakpoint. 763 → 787 checks.

⚠ **It took three corrections before it measured anything real**, and in its first two forms it
**passed against v1.8.6** — the build you had already proven broken:

1. a key collision (`out.dockAtlas` was taken) that silently clobbered an existing check;
2. it measured **empty** boards, which collapse under the very `min-height:0` the fix sets and
   never reach the dock;
3. it read `--tut-bot` left at the *dodged* value (53px) from the previous pass.

Four green-but-wrong states in one afternoon, counting the CSS. We mention it because your reports
keep making the same point from the other side, and because a gate of ours agreeing with a bug
report by accident is the failure mode we are now most afraid of.

⚠ **Scoped to ≤900px on purpose.** Above the breakpoint those ids are rail buttons, not a dock, and
laptop/desktop report overlaps on **v1.8.5 too** — pre-existing, not this regression. Filed
separately rather than folded in behind the same name.

---

## 3 · CF1806-03 and CF1806-04 — both correct

**CF1806-04.** Fixed, and your read of the hole was right. An objective-less player now gets a
suggestion **unconditionally** rather than behind `_stall>=10`, which is what CF1802-03 always
claimed to do — it was still half-gated.

**CF1806-03.** The code is unchanged and the **comment now states the real bound**: one roll per
page load, plus one per 10 monotonic minutes within a load. Round 8's wording overstated it.

Your `_atL` suggestion does not transfer, and the reason is worth recording: `_hvFloor` defends
against a *lowered* stamp inside a save the player edited, whereas this defends against a *raised*
wall clock — and any wall-clock minimum written into the save is satisfied by the very forward wind
that triggers the roll. Your own sentence is the right conclusion and we have quoted it into the
docs: *a monotonic in-memory stamp is the right instinct and the wrong storage.*

---

## 4 · §2.5 smalls — both taken

- **`trueOdds` perf.** Correct: rekeying on the stat vectors moved the cache check below the two
  `battleStats` calls that build the key, so a hit still paid per row. `openConquestPicker` now
  hands its own `nS` down. General shape: *a cache key derived from expensive values cannot
  short-circuit the work that produces them.*
- **The lineage key is player-mutable.** Correct, and now keyed on the genome
  (`_earthName || speciesName(seed)`) rather than the renamable display name.
  ⚠ One clarification, since the key has now been wrong twice: `speciesName` is seeded per
  **individual**, so this groups *Earth-descended* creatures while every procedural pairing is
  genuinely unique and pays every time. We believe that is correct — each catalogued procedural
  creature *is* its own species — and both parents are consumed regardless. If you disagree, that
  is a design argument we would like to have.
- **`#records.tutpri` is a dead selector.** Confirmed, left in place for symmetry as you suggested.

---

## 5 · Your retraction

Thank you for it, and for the method note. We have recorded that **step 8's stall rate is currently
unmeasured, not defective**, and that the card burial was real and was not the cause of the number
attached to it. Nobody here will treat 26/98 as a known bug.

That is the second round in a row you have withdrawn a headline of your own before publishing. It
is the main reason we act on your findings without re-litigating them first.

---

## 6 · What we would most like from round 10

1. **Physical iOS / iPadOS Safari.** Four rounds outstanding. Every class-of-defect bug in this
   project's history was found on real hardware, including both of round 9's.
2. **Your cold-boot A/B, re-run THROTTLED.** Still not run since we changed it. At 4× the naming
   screen was *painted* at 393ms and *unable to answer a tap* until 6,440ms — measure
   **answerability**, not paint.
3. **The multi-session lineage probe**, now that the key is genome-derived.
4. **A view on CF1805-05 (harvest)** — still open by decision. Accept it, or change the design so
   yield tracks engagement rather than wall time? A third option is the most valuable thing you
   could send.
5. **CF1802-08** — `renderCodex` is byte-identical for a fourth build. We still cannot reproduce
   the close-on-dismiss through a real pointer path. If you can produce the exact sequence, we will
   fix it that day.

```
npm install
node tools/validate.js         # 9 gates + the 50-probe determinism fingerprint
node tools/smoke.js            # 553 checks
node tools/uilayout.js         # 787 checks, real headless browser, 10 viewports
node tools/balance-sim.js
node tools/simrun.js dom 24
node tools/duelxp-check.js     # reward outcomes
node tools/sizedrift-check.js  # save round-trip / CF1806-01 guard
```

Every suite that gained a check this round can be replayed against an older build
(`--url=` / `--src=`) to confirm it fails there. We would rather you told us a gate of ours is
vacuous than that it passed.
