# Celestial Frontier v1.8.3 "Clear Ground" — response to the v1.8.2 full battery

**Live:** https://celestialfrontier.github.io/ · **Version:** 1.8.3 · **Supersedes:** v1.8.2 `a9a13c7`

Your v1.8.2 battery returned **Conditional Gold, ~94%**, with two P1 defects and two P2s.
**All four are fixed**, along with your meter-presentation note. Every fix has a gate behind it,
and every gate was checked against a deliberately broken build first — details below, because
two of those negative controls changed what we shipped.

---

## 1. Your four findings

| # | Finding | Status |
|---|---|---|
| P1 | Successful-breeding XP awarded to a parent that is immediately consumed | **Fixed** — and the defect went deeper than reported, see below |
| P1 | Sound Off does not stop a running biome ambience loop | **Fixed** |
| P2 | Training card blocks Settings › Audio at most viewports | **Fixed** |
| P2 | Actionable denial buttons marked `aria-disabled="true"` | **Fixed** |
| — | Meter should show `<1%` / `>99%`, not absolutes | **Done** |

### P1 — breeding XP: your diagnosis was right, and there was a second defect underneath it

You were exact: `awardXP(aEntry.id, …)` then `removeFromCodex(aEntry.id)` eleven lines later.
The XP existed in the event log and nowhere else. It now goes to the newborn — the only creature
that survives a union.

**We did not take your suggested patch verbatim**, because it would have introduced a new bug.
`awardXPOnce` keys its ledger on `id + '|' + key`; moving it to `born.id` makes every child a
fresh id, so the "first-of-its-kind lineage" +5 would fire on **every single birth**. A lineage
first belongs to the *pairing*, not to a creature.

Fixing that surfaced the deeper defect. The lineage key was:

```js
const _pk = [aEntry.kind, bEntry.kind].sort().join('+');
```

`kind` is `'Fauna'`/`'Flora'` — and breeding is always fauna × fauna, so **the key could only ever
be `'Fauna+Fauna'`.** "First-of-its-kind lineage" was a once-per-parent payout wearing a lineage's
name. It would have kept reading as working in any log, including yours. It now keys on the two
parent *species*, hashed short so it cannot collide against the ledger's 64-char load truncation.

### P1 — ambience lifecycle

Fixed exactly as you specified. One note for your model of the system: `ac()` already returns
`null` while muted, so nothing *new* could sound. The bed was the single voice that outlives its
trigger, which is why it was the only leak. No other envelope needed chasing.

### P2 — Settings › Audio

Fixed, and it is now gated by **clickability across all nine of our viewports**, mirroring how you
measured it rather than asserting a z-index.

### P2 — denial semantics

`aria-disabled` removed from the Breed and Feed shortfall buttons; each now carries an accessible
name for what it actually does ("Breeding unavailable — open guidance"). The `bclaim need` button
you did *not* flag keeps its `aria-disabled` — it has no handler and is genuinely inert.

---

## 2. Also in this build — a mobile training blocker you could not have seen

Our own designer hit a hard stop on a physical iPhone, on two separate lessons: the Star Atlas and
the Compendium lessons opened their board *underneath* Earth's survey card, with no way through.

The cause is adjacent to your P2. A v1.7.17 fix raised the survey card to a blanket high layer for
all of training, because the boards buried it on the landing step. On desktop the card has its own
column and nothing collides. On a phone every board shares that column — so the card buried
whichever surface the lesson had just told the player to open. Neither surface can simply win: the
landing step needs the card on top, the Atlas step needs the board on top.

The rule is now **whatever the current lesson points at is the top surface**, derived from each
step's own targets, so it holds for all 21 steps and any step added later.

Two things worth reporting because they bear on method:

- **Our unit-level checks passed while the bug was still live.** They asserted that the right
  element got marked. It did — and the mark did nothing, because the rule scored two classes
  against surfaces that declare their layer through an *id*, and one id outranks any number of
  classes. Only a real-browser `elementFromPoint` test caught it.
- Replayed against the exact v1.8.2 build, that new gate **reproduces the designer's report on all
  three phone viewports** — Compendium chip untappable, both boards buried.

The Planetside also now settles below the lesson card instead of under it, and the survey card
stops above the bottom dock.

---

## 3. On your rage-quit measurement

Your note that a defensible rage-quit number could not be produced this round is the most useful
sentence in the report, and we would rather have that than a number we cannot trust. 3 → 5 → 7
across the three prior rounds is still the metric we most want moved, and it remains unmeasured.

If it helps scope the next attempt: our own harness noise floor is **±6 on "creatures reaching L3"
at n=100**, discovered when two simulation-identical builds returned 16 and 10. Our stable signals
were the no-op and stall counters (35.3 / 35.3 / 35.0 / 35.4 across four runs).

---

## 4. Corrections to our own v1.8.2 notes

- **"Zero added payload" was an overstatement** and your byte comparison was right. It is zero
  *audio-media* payload; the synthesis code is ~45 KB raw / ~15 KB gzipped. The v1.8.2 notes have
  been corrected.
- We also asked you to verify a cold-boot claim we had not ourselves measured defensibly. Your
  excluding the invalid timing harness rather than reporting a soft number was the right call.

---

## 5. Not taken this round

- `willReadFrequently` on the two hot canvas contexts, and direct 132px thumbnail rendering —
  both real, both queued, neither a correctness issue.
- Uniques, burn/thorns death lines, conquest affix slot selection, full per-modal focus memory,
  Ambush at magnitudes IV/V — the standing backlog, unchanged.

---

## 6. What would be most useful next

1. **Re-run the four fixed defects** — particularly the lineage bonus, since the correct behaviour
   is "pays once per species pair, ever", which a single-session probe will not distinguish from
   the old bug.
2. **The mobile training walk on physical iOS**, the one surface neither of our harnesses reaches.
3. **Audio scoring with human listeners** — still the open question your report correctly declined
   to answer by automation.
4. **Rage quits**, if a stable fleet can be got to complete.

Gates at ship: fingerprint MATCH 50/50 · smoke 540/0 · layout 615 checks across 9 viewports ·
balance PASS · CI green.
