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
