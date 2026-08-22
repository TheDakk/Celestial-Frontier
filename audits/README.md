# audits/ — external review bundles, preserved

External review rounds arrive as uploaded zips. Those uploads and any working directory used to
unpack them are **session-scoped** — they disappear when a session ends. The fix lists were being
copied to the repo root piecemeal while the evidence, harness code and raw measurements were not,
so the *conclusions* survived and the *proof* did not.

Everything here is committed so a future session can re-read the measurement rather than trust a
summary of it.

## Contents

### `ARC1_CLAUDE_REVIEW_2026-08-22.md` — Anthropic/Claude Arc 1 read-only review

The full-Arc adversarial review of PR #33 head `8b2c423b` against base `d4ab7e67…`, requested by the
`openai/mac` handoff. Records the exact review authority, what was independently recomputed here
(evidence hashes, all 21 producer inputs, raw↔derived agreement inside the certification report),
one MEDIUM instrument-hardening finding and three LOW items — each with file/line, why the existing
suites miss it, the smallest correction, and its required negative control. It claims no hosted CI,
HUMAN judgment, Gate closure, or release authority.

### `PR32_LINUX_MEMORY_EVIDENCE_2026-08-21.md` — exact-head cross-host ruler evidence

GitHub Actions run `32441023665` reached a complete 78-outcome Compendium report on exact Edge
151.0.4129.86: 75 passed, while three macOS-derived numeric ceilings rejected Linux-native PNG
encoding and embedder-heap variance. The note preserves the report/artifact hashes, exact
authorities, raw failing values, stable resource state, paired-baseline discrimination, and the
three-field budget-only repair. It is instrument portability evidence, not a product leak, retry,
merge, HUMAN review, or Gate closure.

### `PR32_LINUX_MEMORY_REPORT_32441023665.json.gz` — retained raw hosted report

Deterministic gzip of the complete 10,466,459-byte report from artifact `9433081460`. Compressed
SHA-256 is `a3b67e70881b725266a0fb669f027b51141967a4ff2193e011ed3b1d124a0916`; decompressed SHA-256 is
`a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36`. The focused budget test
verifies its authorities, original ordered 75/3 result, repaired production-evaluator replay, and
three isolated just-below controls.

### `v2-program-review-2026-08-14/` — PR #23 roadmap and HD-audio direction review

Two Markdown review inputs supplied after the complete v2 program roadmap was proposed: Claude's R1–R9
roadmap critique and the approved distant-ecology/companion-expression audio addendum. Both original
files are preserved byte-for-byte with SHA-256 values in the bundle README. Their accepted changes
are integrated into the operational roadmap and audio/gate/decision references; the originals remain
review/direction evidence rather than a claim that planned features are live.

### `round-7-v1.8.2/` — round 7, audited build `a9a13c7` (v1.8.2 "Steady Hands")

The strongest round the project has had. **Start with `v1.8.2-fix-list.md`** — 25 findings, each
with line numbers, the measurement behind it, and a recommended fix.

| Path | What it is |
|---|---|
| `v1.8.2-fix-list.md` | The report. The lead item, CF1802-01, is the mobile training wall |
| `evidence/dock_*.png` | Training step 5 with the dock outlined and per-button reachability labelled — phone vs the desktop control |
| `evidence/burial_*.png` | Step 7 across four viewports: the Compendium button buried under the survey card |
| `evidence/tr_*_step7/8/9.png` | The training walk at the steps that break |
| `data/training-reachability.txt` | CF1802-01's full per-step, per-viewport table + mechanism |
| `data/tutreach.json` | Raw surface-level reachability measurements |
| `data/fleet-1000-sessions.jsonl.gz` | 1,000 sessions · 10 personas · 21 device profiles |
| `data/fleet-summary.json` | The same, rolled up |
| `data/voice-model-200k.txt` | 200,000-genome run of the voice model, extracted verbatim from the build |
| `data/audio-lifecycle.txt` | Web Audio node instrumentation: the bed vs close / hidden tab / sound-off |
| `data/boot-ab.txt` | Paired cold boot vs v1.7.20, idle host, 8 reps, + payload table |
| `harness/*.mjs` | Their harness. Independent of ours, and it found things ours could not |
| `prior-rounds/*.md` | The v1.7.15 / .18 / .19 / .20 fix lists, for the series |

**Our response:** `../REVIEWER_NOTES_v1.8.4.md`.
**What we shipped from it:** v1.8.4 — 23 of 25 fixed. See the ROADMAP handoff.

### `battery-v1.8.2/` — the four-lens full battery on the same build

Ran before round 7. Returned **Conditional Gold, ~94%** with two P1s and two P2s, all fixed in
v1.8.3/v1.8.4.

- `reports/` — the summary plus four review lenses (technical/security · training/UI/Momentum ·
  creature/audio/fun · performance/release readiness)
- `raw-results/` — battery, boot comparison, exploits, odds, training overlay, UI matrix, source metrics
- `static-checks/` — their static analysis logs
- `source-notes/` — the reviewer notes we gave them for that round

**Our response:** `../REVIEWER_NOTES_v1.8.2.md` (corrected after they caught us overstating
"zero added payload").

### `round-8-v1.8.5/` — round 8, audited build `e20d62c` (v1.8.5 "First Touch")

**Start with `v1.8.5-review.md`.** Organised as a path to 10/10 rather than a bug list: §1 the
obstacles · §2 the archetypes · §3 the path · §4 the pattern. 7 new CF1805 findings, plus a residue
table on the round-7 partials.

The harness was **rebuilt** for this round, and that is the story of the bundle: 18 archetypes (was
10) and — the part that mattered — **12 goal-directed verbs** (`mine · harvest · scavenge · tame ·
conquer · craft · breed · feed · charter · sheet · idle · backout`) driven off the game's own
`data-act`/`data-craft`/`data-chacc` hooks, replacing eight generic actions that all poked the same
map. That is why five previous rounds never reached mid-game. Half the deep sessions boot from a
seeded veteran save built with the build's **own** `makeGenome`.

| Path | What it is |
|---|---|
| `v1.8.5-review.md` | The report |
| `evidence/tr_ipad-mini_step8.png` | CF1805-01 — the Compendium up, the training card gone |
| `evidence/tr_ipad-mini_step5/6/7/9.png` | The surrounding steps, for context |
| `data/fleet-rollup.txt` | 214 sessions: health, per-archetype reach, **saw vs did** |
| `data/training-reachability-v185.txt` | 6 viewports × 17 surfaces, every training step |
| `data/fleet-214-sessions.jsonl.gz` | Raw session records |
| `data/fleet-plan.json` · `veteran-save.json` | The seeded plan (re-runnable) + the mid-game save |
| `harness/*.mjs` | The rebuilt instrument, incl. `tutreach8.mjs` (found both P0s) |
| `prior-rounds/*.md` | v1.7.15 → v1.8.2 fix lists |

**`saw` vs `did` is the metric to carry forward.** "The affordance existed when we looked" vs "the
verb completed and the world changed" — a system nobody can find is as broken as one that errors,
and nothing in our own battery measures it. Their §2.4 finding: once an affordance is on screen the
game does the thing (100% for six verbs, 85%+ for four more). The barrier is entirely `nocard` —
the land-first chain fails about nine times out of ten. That is the mid-game reachability problem,
measured for the first time.

**Our response:** `../REVIEWER_NOTES_v1.8.6.md`.
**What we shipped from it:** v1.8.6 "Kept Promises" — 10 of the 12 fixes are player-visible.
CF1805-05 (harvest) is open **by decision** and the notes explain why it is not closable offline.

### `battery-v1.8.5/` — the independent full battery on the same build

Arrived separately the same day, and agrees with round 8 on almost nothing — which is what made the
pair useful. Its P0 is the **conquest odds cache**, which round 8 did not find at all: the memo key
named four of the ten inputs that move the result, so the meter could display 0% when the true
matchup had become 100%. Reproductions A and B are in the report. Both bundles independently found
the live `fed`/`brood` overshoot.

- `Celestial_Frontier_v1.8.5_Full_Battery_Audit.md` — the report (verdict, 14-point Gold checklist)
- `Celestial_Frontier_v1.8.5_Review_1..4_*.md` — the four analytical lenses

### `round-9-v1.8.6/` — round 9, audited build `0bfc904` (v1.8.6 "Kept Promises")

**Start with `v1.8.6-review.md`.** The most useful review this project has received, and the
method is why: **a 152-line delta reviewed hunk by hunk**, not another fleet run. Six of seven
round-8 findings closed, and one line we had shipped found to be **corrupting live saves**.

| Path | What it is |
|---|---|
| `v1.8.6-review.md` | The report |
| `data/size-drift-simulation.txt` | CF1806-01 — 500 lineages through the build's own `crossGenome`, showing ~10% drift past size 5 |
| `data/dock-clearance-measurement.txt` | CF1806-02 — forced-state dock reachability across four phone viewports |
| `data/voice-vocabulary-200k.txt` | The audio arc closed: 533 → 199,707 distinct voices |
| `data/training-reachability-v186.txt` | 6 viewports × every training step |
| `data/fleet-180-sessions.jsonl.gz` · `fleet-rollup.txt` | 180 sessions, rage quits down a second build |
| `evidence/v185_card_buried_BEFORE.png` | The CF1805-01 burial, for the before/after |
| `harness/*.mjs` | Their instrument, incl. `sizedrift.mjs` and `dockclear.mjs` |

**Why this round matters more than its size suggests.** The `size` corruption only manifests
*across a reload boundary*, so no volume of sessions would have found it — and our own 787-check
browser gate could not see it either. It took someone reading two lines of a diff and asking what
they did to each other. **Delta review and fleet review find disjoint defect classes.**

Round 9 also **retracted its own round-8 headline**: it had attributed the step-8 training wall to
CF1805-01, and reports that the card went 0% → 100% reachable while the stall rate did not move
(25% → 27%). Step 8 is recorded as *unmeasured*, not defective. Second consecutive round in which
they withdrew a finding of their own before publishing.

**Our response:** `../REVIEWER_NOTES_v1.8.7.md`.
**What we shipped from it:** v1.8.7 "True to Form" — a regression fix, plus CF1806-02/03/04 and
both §2.5 smalls.

### `battery-v1.8.6/` — the independent Gold audit on the same build

Arrived the same evening, separately, as in round 8.

## Two things worth carrying forward

**Their method beat ours twice.** They verify by *reachability* — does the code exist **and** can it
take effect at runtime — which caught `CF1720-07`: a rule we had shipped, tested and declared fixed
that was permanently dead because a blanket selector out-specified it. And they measure UI defects
by **clickability per viewport**, which is what found the P0 our whole battery missed.

**They retract.** Round 7 withdrew "a creature speaks only once per session" before publishing,
having traced it to their own probe clicking at (0,0) inside a collapsed shelf; and they reported
`tutorialCompleted: 0/498` as a harness limit rather than a regression after checking it against six
rounds of their own history. Findings from a source that does that are worth more.

## Reproducing a negative control against an old build

`tools/uilayout.js` takes `--url=FILE`, so a new gate can be replayed against the build a bug was
found in, to prove the gate actually catches it. Recover an old build from git rather than storing
one here:

```bash
# use an absolute Windows-style path — `/tmp/...` in Git Bash is NOT what node resolves
git show 66e0516~2:celestial-frontier.html > C:/Temp/v1.8.2.html
node tools/uilayout.js --vp=iphone,iphone-max,android --url="file:///C:/Temp/v1.8.2.html"
```

(`66e0516~2` is the commit before v1.8.4's two doc commits, i.e. the last v1.8.2-era build.
Verified: that file still contains `body.training:not(.vista) #panel{z-index:58}` and no `tutpri`.)

Against v1.8.2 that reproduces CF1802-01 on all three phone viewports — which is the only reason to
trust the gate.
