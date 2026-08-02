# Celestial Frontier — PROCESS LAWS

**STATUS:** current as of 2026-07-30. **This is a REFERENCE, not a log** — per CLAUDE.md’s
doc-hygiene principle it is never archived; it is refreshed in place as laws are earned or
superseded. Extracted from ROADMAP.md on 2026-07-30, verbatim, when it reached 88 lines and was
the largest thing in a file that is supposed to hold only the live agenda.

**Read this before touching UI or tests.** Every law below was paid for with a real defect that
shipped, or with a check that went green while the thing it guarded was broken. They are ordered
roughly by how often they have bitten.

---

⚠⚠ WHEN A NEW INSTRUMENT FIRES — OR PASSES — SUSPECT THE INSTRUMENT FIRST (2026-07-30, learned
  THREE times across two ships). Every gate built in this arc found a bug in ITSELF before it
  found one in the build: bootperf's window closed at the moment it was measuring; the dom tier
  reported 141 phantom findings from its own stale/wrong-tab DOM; and the training-card
  reachability pass CAME BACK CLEAN ON THE VERY CASE IT WAS WRITTEN FOR, because it measured a
  top-pinned lesson card when the reported one had DODGED to the bottom (a top-pinned card and a
  bottom-anchored board never share a band on a tablet). Corollaries:
  (a) an observation window must outlive the thing it observes — pass --settle, don't stop at the
      first success;
  (b) MAKE EVERY FINDING CARRY ITS OWN DIAGNOSIS. "no control for {id}" was a bug report nobody
      could action; adding the surrounding state (a `why()` hook) turned days of guessing into
      minutes;
  (c) prefer a DETERMINISTIC path over a clever one — "always reopen the panel" beat four rounds
      of trying to deduce whether the DOM was current enough to trust;
  (d) ★ NEW — REPRODUCE THE REPORTED GEOMETRY, NOT A CONVENIENT ONE. A PASS is evidence only if
      the same check FAILS on the build the bug was reported against. A gate that agrees with a
      bug report by accident is worth nothing, and it is far more dangerous than one that fires
      wrongly, because nobody investigates a green run.
⚠⚠ ASSERT THE OUTCOME, NOT THE CODE PATH — the round-8 lesson, and the external round has now
  made this recommendation FIVE rounds running. smoke.js had a duel-XP check; it called
  `awardXP()` directly, and therefore stayed green through every build in which the friendly duel
  paid nothing at all. The +8 win had NEVER paid. A test that calls the reward function proves
  the reward function works and says NOTHING about whether the game ever calls it.
  `tools/duelxp-check.js` is the corrected shape: drive the real flow, then read the ledger.
  ⚠ ONLY THE DUEL AWARDS HAVE ONE. The other six advertised awards do not — that is open work,
  and if a later round finds another dead reward, this is why.
⚠ IN CSS, `min-height` BEATS `max-height`. CF1805-01's fix had to release `bottom` AND
  `min-height` explicitly, because the boards it targets are pinned `top:auto !important` WITH a
  min-height under @media (max-width:900px). A `top`-only rule would have been present, correct
  and completely inert — this project's signature failure mode, and the reason uilayout.js exists.
⚠ A DOC THAT CROSS-CERTIFIES ANOTHER DOC MANUFACTURES FALSE CONFIDENCE (2026-07-30). A "Field
  Training step count" entry sat in QUESTS_AND_CHAPTERS.md for months reading "20 array entries,
  18 counted, UI renders a literal /18 — CLAUDE.md's '18-step' is correct". Every clause was
  false (it is 21, all counted, rendered from `TUT_STEPS.length`), including the vouch for a
  number CLAUDE.md did not contain. The entry even described itself as a known discrepancy, which
  made it look investigated. Re-derive counts from the source, and cite the EXPRESSION that
  produces a number rather than the number.
⚠ PAINTED ≠ ANSWERABLE. A gate can be drawn, hit-testable and completely unable to respond,
  because the main thread is busy. `waitForSelector(visible)` cannot tell the two apart, and that
  ambiguity is what sent the cold-boot investigation to "cache warming" for three builds. Time
  ANSWERABILITY (first frame within 50ms of its predecessor), and split the longtask census at
  that moment: blocked-before-gate delays interactivity, blocked-after-gate is a different defect.
⚠ NOTHING EXPENSIVE RUNS BEHIND A BLOCKING FULL-SCREEN SURFACE. Invisible work still costs the
  player the only control they can reach. `_hdLater` + `_introUp` is the pattern; toasts had it
  first (_toastQ). See UI_PRESENTATION "THE ART-HOLD LAW".
⚠ A HARNESS THAT CRIES WOLF GETS IGNORED, and an ignored harness is worse than none. When a
  negative signal is ambiguous ("pressed it and nothing happened" is also what an unavailable
  action looks like), make the harness ADJUDICATE before it reports — the dom tier records `dead`
  only if the API path then succeeds from the same state.
⚠ NEVER run `node tools/extract.js` after editing main.js — it regenerates main.js FROM the
  html and silently destroys uncommitted work (main.js is gitignored). Use `node tools/build.js`.
  Three docs used to instruct exactly that; all three now warn (fixed 2026-07-29).
⚠ CSS lives ONLY in the html, and there are TWO <style> elements — append to the LAST one.
⚠ SPECIFICITY: one ID beats any number of classes. `body.training .tutpri{z-index:58}` LOST to
  `#panel{z-index:9}`; the mark applied, class-level tests passed, and the fix did NOTHING.
  An external round found the identical trap in shipped code the same week (CF1720-07).
  A class-level override cannot govern surfaces that declare their layer through an id.
⚠ ASSERT THE OUTCOME, NOT THE CODE PATH — and never assert a selector's SPELLING. Three checks
  have now passed while the thing they guarded was broken: the v1.8.1 vista check (matched
  literal selector text), the first meter check (called the formatter directly and passed
  against a regressed render site), and CF1720-07's own check (asserted the dead rule's text).
⚠ NEGATIVE-CONTROL EVERY NEW CHECK — break the build on purpose and confirm the check fails.
  Two controls changed what shipped this round: the .tutpri specificity miss, and a stall-detector
  test that passed against a reverted build because it never constructed the no-objective state.
⚠ jsdom has NO LAYOUT. A CSS rule can be present, correct and completely inert. tools/uilayout.js
  (real headless browser, elementFromPoint hit-tests, 10 viewports) is the only gate that sees
  this. It takes --url=FILE, so replay a new gate against an OLD build to prove it catches the bug.
⚠ A bare click() never fires the outside-close manager or the tap-dismiss — use a real
  pointerdown+click. This has produced vacuous passes twice (the v1.6.4 step-6 lock, CF1802-08).
⚠ MODULE SCOPE: a helper belongs in the scope of its CALLERS, not its callees. _denyPress/_okPress
  went inside the Fx IIFE next to playDeny and threw ReferenceError everywhere — three lines under
  a comment warning about that exact trap.
⚠ RE-PIN PROCESS unchanged: field-diff proof → surgical single-probe re-pin → authorization
  recorded in baseline.json repins[]. Never regenerate the baseline to make a failure pass.
⚠ DEPLOY = TWO PUSHES: deploy.js ships the SITE repo only; `git push origin main` syncs source.
⚠ LINE ENDINGS ARE PART OF THE BUILD CONTRACT — .gitattributes pins LF. Without it a fresh
  clone on Windows (autocrlf=true) checks out CRLF, and make-probe-build.js cannot find the game
  IIFE anchor "
})();
</script>" → validate/smoke/fingerprint/deploy-gate ALL fail, plus a
  26,717-byte payload tax. Found 2026-07-29 by cloning cold and running the battery; the tool now
  also tolerates CRLF. VERIFIED: a clone forced with core.autocrlf=true still checks out LF and
  the full battery passes on it. If you ever touch .gitattributes, re-run that test.
⚠ DOC/CODE DISAGREEMENT IS A FINDING EITHER WAY. CF1802-09 (free cataloguing) was a case where
  the GUIDE was right — "the survey reveals the roster; it catalogues nothing" — and the CODE
  had drifted. Check which one is wrong before "updating" the doc.

---

## Added 2026-07-31 (round 9)

⚠⚠ **TWO CORRECT FIXES FOR ONE BUG, SHIPPED TOGETHER, CAN DISAGREE.** Round 9's pattern, and the
first one that was not a mistake of reasoning. v1.8.6 fixed `size` twice: `battleStats` began
*wrapping* it, and the load path began *clamping* it. Each line was defensible alone. Together the
game computed one value in memory and stored another, and the difference was applied silently to
~12% of bred creatures on their next load — turning a "tiny" creature into a **titanic** one with
maximum vitality. Neither line was wrong; **nobody asked what the other line did.**
> **The remedy, and it is cheaper than the fix:** when a change touches a value, grep every reader
> and writer of that field and make them agree *before* shipping. For `size` that was ten call
> sites, one of which disagreed with the other nine.

⚠ **AN EQUAL-SPECIFICITY CSS OVERRIDE THAT APPEARS EARLIER IN THE SHEET LOSES.** The first attempt
at CF1806-02 added a duplicate `max-height` inside a media block that sits *above* the rule it meant
to override. Same specificity, both `!important`, both mine — it changed nothing and the gate still
failed. Prefer **one rule with a variable** (`--tut-dock`) over a second copy of the rule. Sibling
law to v1.8.6's *`min-height` beats `max-height`*: both produce a rule that is present, correct and
completely inert.

⚠ **A CHECK MEASURING AN EMPTY SURFACE IS VACUOUS.** The new dock-reachability pass measured boards
with no content. They collapse under the very `min-height:0` the fix sets, never reach the dock, and
the check went green against a build the external round had already proven broken. **Populate the
surface** — the probe already did exactly this for `#panel` and the new code did not copy it.

⚠ **RESTORE THE STATE YOUR PREVIOUS PASS MUTATED.** The same dock pass then read `--tut-bot` left at
the *dodged* value (53px) from the pass before it, parking the board where it could never touch the
dock. Two vacuous passes, one check, one afternoon. A probe that walks through several states must
re-establish each one explicitly; the state you forgot to set is the state the bug lives in.

⚠ **NAMESPACE YOUR PROBE OUTPUT.** `out.dockAtlas` was already taken; reusing it silently clobbered
an existing check, which then reported `covered by undefined`. The gate caught it, but only because
something else asserted on the same key.

⚠ **A CACHE KEY DERIVED FROM EXPENSIVE VALUES CANNOT SHORT-CIRCUIT THE WORK THAT PRODUCES THEM.**
Rekeying `trueOdds` on the stat vectors moved the cache check below the `battleStats` calls that
build the key, so a cache *hit* still paid full price per row. Correctness was untouched, which is
why nothing caught it. Hoist the invariant to the caller.

---

## Added 2026-08-01 (round 10 — the morphology pass)

⚠⚠ **A CHECK ONLY SEES THE AXIS IT MEASURES.** The eighth green-while-broken state on this
project, and the first where the check was not wrong about anything it looked at. The species
audit renders every name in the Earth catalog and reports how many painted: 1,254/1,254, zero
failures, run after run. Meanwhile **24 art-override painters were keyed to species the catalog
does not contain** (King Cobra, Bonobo, Dromedary, White Rhino, Lacewing, Water Bear…). Written,
listed, unreachable. The audit could not see one of them — *it renders the names the catalog asks
for*, so a table key the catalog never mentions is not a thing it can look at. No amount of
running it harder would ever have found this.
> **The remedy:** when a check is green, ask what it is *structurally incapable* of seeing, and
> write the check for THAT axis. Here it was `tools/overridecheck.mjs`, which walks the other
> direction — from our table keys back to the catalog — and exits 1 on any key that resolves to
> nothing. The two checks together cover both directions; either alone is blind on one.

⚠ **AN INSTRUMENT'S FIRST FINDINGS ARE USUALLY ITS OWN BUGS — STILL TRUE, TWICE MORE.**
`overridecheck` reported 38 dead routes on its first run; 38 of them were phantoms, because a
painter's *options* are strings too ('barrel', 'spots', 'monkey') and the scan was not brace-depth
aware. Its second run reported "fungi 0" — wave 1 had never happened, apparently — because the
scan matched `export const` and both fungi and microbe tables are module-private. Neither was a
finding. **Read the first report as a bug report about the tool.**

⚠ **AN AUTOMATED GATE CANNOT ANSWER "DOES IT LOOK RIGHT".** The species audit proves 1,254
portraits paint. It cannot prove any of them resembles the animal. Four painters shipped through
green audits looking wrong in ways one glance settles — snakes drawn as strings of beads, frogs
with spider legs, a rabbit whose ears swallowed its head, primates in gowns. `npm run strip
"A,B,C"` renders a named handful big and labelled *through the audit's own genome*, so the thing a
human judges is exactly the thing the gate measured. **Pair every counting gate with a looking
gate.** The looking gate found the dead routes too.

⚠ **A ROUTING TABLE WRITTEN FROM MEMORY DRIFTS FROM THE DATA IT ROUTES.** All 24 dead routes have
one cause: the tables were written from knowledge of *what animals exist* instead of from the
catalog file. Read the data, then write the table — and keep a check that re-proves the join.


⚠⚠ **A CHECK THAT READS A BUILD ARTEFACT MUST PROVE THE ARTEFACT IS CURRENT.** The ninth
green-while-broken state, and the longest-lived: `speciesaudit` built the bundle *only if it
was missing*, so once `dist/` existed it never rebuilt. For an entire session it reported on
whatever code happened to be compiled, not the code in the repo — including a duplicate-species
failure the source had already fixed. It would have reported a clean PASS for code that no
longer existed just as readily.
> **The remedy:** build unconditionally, and assert freshness anyway — compare the artefact's
> mtime against the newest source it claims to cover and refuse to report if it is older. The
> sibling tool that always rebuilt (`speciesstrip`) was honest all session; the difference was
> one `if`.

⚠ **"INDEPENDENT" PARAMETERS THAT SHARE A DERIVATION ARE ONE PARAMETER.** Six variation axes
were computed as `(hash ^ salt) / 2^32` with salts 0x11, 0x22, 0x33… XOR-ing a small salt
perturbs only the lowest byte, so after the divide all six returned the same number to seven
decimal places. The code read as six independent knobs and was one knob wired six times.
> **The remedy:** when deriving several values from one seed, run each through an avalanche
> (a proper finalizer) and *spot-check that they actually differ* before trusting them.
