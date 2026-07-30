# Celestial Frontier v1.8.6 "Kept Promises" — notes for round 9

**Build:** see `version.json` at https://celestialfrontier.github.io/ (`v` + `build`).
**Predecessor audited:** v1.8.5 `e20d62c`. **Round 8 delivered:** 2026-07-30, answered the same day.

Round 8 arrived as two independent bundles — the 214-session fleet review and a
separate full-battery audit with its own P0. Both are answered here. Thank you for
the harness rebuild; the twelve goal-directed verbs are what made §2.4 and §2.5
possible, and `saw` vs `did` is the most useful number anyone has sent us.

---

## 1 · What we fixed, and what we want you to attack

Every claim below was reproduced in our own source before a line changed. Three were
reproduced with a **controlled failure** (the check fails on the old build, passes on
the new one) — those are marked ✅NC.

| item | status | how to verify |
|---|---|---|
| **CF1805-01** lesson card buried by a raised board | ✅NC fixed | iPad mini / iPad Air, training step 8. Re-run `tutreach8.mjs`. We measure the card at ≥90% on a 63-point grid across 10 viewports, in **both** card positions. |
| **CF1805-02** duel XP (`mine.id` → `_mid`) | ✅NC fixed | Win a friendly duel; the champion's XP should rise by 8. "Bout survived" +2 and "to the wire" +3 also land now. |
| **CF1805-03** five wrong moduli in `voiceOf` | fixed | Re-run the 200k voice model. `diet` now spans 6 values, `trait` 25. |
| **CF1805-04** quest log loses its handle while stalled | fixed | Stall, tap the chip (it routes), then tap again — the chip has repainted to its objective state and the log opens. |
| **CF1805-06** `size` unclamped | fixed (2 of 3 halves) | Save-edit `size:1e6` → clamped on load. Card and combat now read the same modulus. **The `crossGenome` drift is deliberately NOT fixed — see §2.** |
| **CF1805-07** weekly charter reroll | **mitigated, not closed** | Rate-limited to one roll per 10 monotonic minutes. Please confirm the rate, and tell us if 10 minutes is the wrong number. |
| **CF1802-16** lineage bonus fires every breed | fixed | Now keyed on the pairing, not on consumed per-individual ids. **This still needs your multi-session probe** — one session cannot distinguish "once per pair, ever" from the old behaviour. |
| **Battery P0** conquest odds cache | ✅NC fixed | Your reproduction A and B. We rekeyed on the *simulation's inputs* (stat vector, level, ability set, both seeds, sample count) rather than a list of genome fields, so `fed`/`brood`/`_mult`/`_wf` are covered without being named. Please run your 10,000-case mutation retest. |
| **Battery P1** live `fed` / child `brood` above 200 | fixed | Clamped at the mutation site. |
| **Battery P1** stale specimen XP copy | fixed | Now names care XP alongside the victory numbers. |

---

## 2 · What we did NOT fix, and why

We would rather tell you these are open than ship something that looks like a fix.
Round 8's own pattern — *a correct diagnosis in a comment, with the code doing
something else* — is a fair hit, and the remedy is not to do it again quietly.

### CF1805-05 harvest — open by decision, and the proposed fix is not implementable

The in-session monotonic gate is real and stays. The reload path is open.

"Persist the monotonic stamps" **cannot work**: a browser has no cross-reload
monotonic clock. `performance` time restarts at zero on every page load, so a
persisted monotonic stamp is meaningless on the far side of the very reload that
defeats the gate.

More fundamentally: **an offline game cannot distinguish "waited an hour" from
"wound the clock forward an hour."** Every bound tight enough to stop the exploit
also penalises a player who genuinely closed the tab. And harvest does not
accumulate — an hour away and a week away both yield one cycle — so there is no
offline-progress cap to lean on either.

**What would help us most from round 9:** not another repro, but a view on which of
these you would pick — (a) accept it as self-cheating in a single-player offline game
with no leaderboard, or (b) change the design so harvest yield derives from
engagement rather than wall time. If you see a third option we have missed, that is
the single most valuable thing you could send.

### CF1805-06's third half — `size` drift in `crossGenome`

`crossGenome` **and** `evolveGenome` are both probes in our 50-probe determinism
fingerprint, which must match the v1.0 baseline byte for byte. Wrapping the `size`
mutation changes every bred creature and breaks that baseline. It is a balance
decision requiring a deliberate re-pin, not a bug fix. We closed the *player-visible*
divergence at `battleStats` instead (`makeGenome` yields 0–5, so the modulus is the
identity function there and the fingerprint held).

### Still open, sized, not started

CF1802-08 (dismissing a specimen card closes the Compendium), CF1802-07's unaffordable
Build/tech button (not rendered at all, so there is nothing to press), the Bat voice
ceiling (your focused sample still hard-clamps 14.4%), direct 132px thumbnails, and
adaptive stall cadence.

**§3.1, the structural one**, is with the project owner as a design call — cutting the
mandatory training path to five steps and making the other sixteen contextual. We
agree with the diagnosis; the shape of the replacement is not ours to choose.

---

## 3 · Where you were incomplete, and one place we were wrong

Offered because your reports get sharper when we push back, not to score points.

1. **CF1805-04's mechanism was incomplete.** The chip's click handler *already*
   clears the stall; what was missing is that nothing repainted the chip, so it kept
   the suggestion's markup and kept routing forever. That made the fix a one-line
   deferred repaint rather than a re-plumb, and it preserves the one-tap routing that
   CF1802-03 measurably won.
2. **CF1805-05's proposed fix cannot be implemented** — see §2.
3. **We were wrong about you once.** We briefly believed you had under-counted
   `FA_SENSE` and `FA_TEMPER` at 10. Our counter was splitting the array literal on
   commas and counting the one inside `'docile, easily approached'`. Your numbers were
   right and our instrument was broken — which is the same lesson we keep learning
   below.

---

## 4 · Our instruments found bugs in themselves first — again

This is the seventh time a check on this project has passed while the thing it
guarded was broken, and we think it is the most useful thing we can tell you about
how to read our green results.

**The new reachability gate agreed with your bug report by accident.** We added a
63-point training-card pass to our browser gate, and the first version came back
**clean on the exact case you reported**, because we pinned the lesson card at the
top — where a top-pinned card and a bottom-anchored board never share a band on a
tablet. Your card had **dodged to the bottom**. Adding the dodge pass reproduced your
measurement verbatim: `ipad-mini · Compendium · 0% reachable · 63/63 blocked by #codex`.

**Your §3.2 recommendation is now implemented, once.** `tools/duelxp-check.js` plays a
real duel through the arena UI and then reads the ledger. It exists because our smoke
suite *already had* a duel-XP check — which called `awardXP()` directly, and therefore
stayed green through every build in which the friendly duel paid nothing at all. On
the pre-fix build the new check reports `xp 0 → 0` while `duelwins` still increments,
which is exactly the shape you described.

⚠ **Only the duel awards have an outcome test today.** The other six advertised awards
deserve the same treatment and do not have it yet. If round 9 finds another dead
reward, that gap is why.

---

## 5 · What we would most like from round 9

1. **Physical iOS / iPadOS Safari.** Outstanding across three rounds now and still
   outside both harnesses. Every class-of-defect bug in this project's history was
   found on a real phone.
2. **Re-run your cold-boot A/B, throttled.** You did not run it this round, so our
   v1.8.5 boot fix is still verified only by our own instrument. Our measurement says
   the effect is CPU-bound, not cache-bound: at 4× throttle the naming screen was
   *painted* at 393ms and *unable to answer a tap* until 6,440ms. Please measure
   **answerability**, not paint — `waitForSelector(visible)` cannot tell them apart.
3. **The mutation-based odds retest** (your own §14 checklist item) and **the
   multi-session lineage probe.**
4. **A view on CF1805-05**, per §2.
5. **The rage-quit trend on a like-for-like slice.** 112.5 → 62.5 is the first fall in
   four builds and we do not want to over-read it — you called the caveats correctly
   (n is small, 9 vs 9, and the instrument changed). A repeat with the same fleet
   composition would tell us whether it was real.

---

## 6 · Reproducing our results

```
npm install
node tools/validate.js        # 9 gates + the 50-probe determinism fingerprint
node tools/smoke.js           # 553 checks, jsdom, full 21-step training
node tools/uilayout.js        # 763 checks, real headless browser, 10 viewports
node tools/balance-sim.js
node tools/simrun.js dom 40   # UI reachability through the real controls
node tools/duelxp-check.js    # reward outcomes
```

Every suite that gained a check this round can be replayed against an **older** build
to confirm it catches the bug it was written for:

```
node tools/uilayout.js  --url=file:///path/to/old.html
node tools/duelxp-check.js --src=/path/to/old.html
```

We would rather you told us a gate of ours is vacuous than that it passed.
