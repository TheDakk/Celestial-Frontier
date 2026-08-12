# Celestial Frontier — PROCESS LAWS

**STATUS:** current as of 2026-08-12. **This is a REFERENCE, not a log** — per CLAUDE.md’s
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
⚠ **DEVELOPER MARKDOWN IS NOT PLAYER-FACING DOCUMENTATION.** The v2 slice changed its travel,
  save-protection and mobile controls while its persisted `seenGuide` field had no live Guide at
  all. Every player-visible change must update the relevant system reference **and**, in the same
  batch, every live in-game explanation it affects: Guide topics, contextual hints, Training and
  release/update copy where those surfaces exist. Prove the rendered wording against the real
  action outcome in a browser and inject stale wording as a negative control. A port Guide must stay
  source-addressed to the mature canonical Guide; capability-aware bodies describe only systems that
  are actually live, account for every authored legacy topic, and keep intentionally dormant topics
  recorded but player-hidden rather than advertising them as usable.

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


⚠⚠ **"THE DATA IS VALID" IS NOT "THE CODE RUNS IT."** Wave 11 added 280 plant routes, imported
the table into the router, and never called it. Every key was checked and valid; the sentinel
reported 927/927 with zero dead routes; all 280 painters were unreachable. A validator that
inspects a table proves things about the *table*. Whether anything *reads* the table is a
different claim, and it is the one that decides if the code does anything.
> **The remedy:** for any lookup table, assert that its consumer references it — a one-line
> grep of the router is enough — and negative-control that assertion by unwiring it on purpose.

⚠ **THE DISCOVERY RULE IS ITSELF AN ASSUMPTION.** The same tool missed work four times running,
each time because of how it decided *what to look at*: a hardcoded file list, then an
`export const`-only scan, then a `*overrides.ts` filename glob, then not checking wiring at
all. Every fix widened the rule and the next fix widened it again.
> **The remedy:** when a tool enumerates things, enumerate everything and filter late — and
> when a check comes back clean right after you added work, suspect the enumeration first.


⚠⚠ **THE "NEVER OVERRIDE WHAT ALREADY EXCELS" LAW GOVERNS YOUR OWN IMPROVEMENTS TOO.** A
retrospective found seven painters discarding their random stream, and spending it on surface
texture improved six of them. The seventh was the dragonfly — the one species the reviews and
the user had both singled out as near-perfect — and the texture pass turned its venated wings
into grey smudges. The rule had always been aimed outward, at the engine we were replacing.
It applies inward: a later idea of yours is still an override, and a sweeping improvement will
sweep over the things that were already right.
> **The remedy:** when a systematic pass touches something already known to be good, render
> that thing FIRST and compare before applying the pass anywhere else. And when you decide to
> leave something alone, record the decision in a machine-checkable form (`@rng-unused: why`)
> so the exception cannot silently become the rule.

⚠ **AN AUDIT'S EXEMPTIONS ARE WHERE ITS BUGS LIVE.** `artaudit` check G flags tools that
enumerate files by name pattern. It exempted anything "containing an extension test" — which
waved through `/overrides\d*\.ts$/`, the exact pattern that had been hiding 302 species from
the coverage report. The check was correct; the escape hatch was not.
> **The remedy:** write the exemption as narrowly as the rule, and negative-control the
> exemption itself — reintroduce the thing it excuses and confirm the check fires.


⚠⚠ **AN INSTRUMENT THAT TAKES A NAME CANNOT SEE THE UNNAMED.** Twelve waves of art work were
reviewed entirely through tools that addressed species BY NAME — so the procedural creatures,
and every creature a player breeds, were never once rendered for review. They were not broken;
they were simply outside every instrument's reach, which is worse, because nothing ever
reported their absence.
> **The remedy:** for every code path a user can reach, ask which instrument renders it. If the
> answer is "none", that path is unreviewed no matter how green the suite is. Adding one
> `proc:` form to the strip tool changed the plan for a whole wave.


⚠ **A THING YOU CANNOT RENDER IS A THING YOU CANNOT REVIEW.** The strip tool failed to find
`Lion's Mane` because the catalog stores a curly apostrophe and the lookup compared raw
strings. It drew an empty box — which looks like a rendering failure, and is actually the
reviewer being unable to see the species at all. The same shape as the procedural creatures
being invisible to every name-based instrument.
> **The remedy:** when a review tool reports "nothing here", determine whether the thing is
> broken or merely unreachable BEFORE concluding anything about the art.

---

## Added 2026-08-10 (full-catalogue reset foundation)

⚠⚠ **A DISPLAY NAME IS A LABEL, NOT A CATALOGUE IDENTITY.** The Earth roster owns four
names in two sets—Green Algae, Reindeer Lichen, Snow Algae, and Tardigrade—and a review
loader keyed by bare name silently gave the later set's `mustRead` contract to both rows.
Every file still joined; the judge was simply shown the wrong organism contract. Review,
comparison, merge, package, cache, and lineage joins use **set + species** (or a stronger
stable identity), reject duplicate exact identities, and carry a negative control that
reproduces the bare-name collapse.

⚠⚠ **A CHILD'S GAMEPLAY KINGDOM IS NOT NECESSARILY THE CATALOGUE THAT OWNS ITS EARTH
ANATOMY.** A mixed-kingdom child can inherit an Earth lineage from either parent while its
own `kingdom` comes from the other. Store the selected lineage's set-qualified owner when
breeding, route through that exact owner, and test final pixels in fauna, flora, fungi, and
microbe cases. A fauna-only outcome gate was green while non-fauna blends either crossed
ownership boundaries or ignored the inherited Earth route. Route fields existing in memory
are not evidence; drive the production renderer for every kingdom and both parent orders.

⚠⚠ **A DIRTY-WORKTREE CAPTURE IS DIAGNOSTIC EVIDENCE, NEVER CERTIFICATION PROVENANCE.**
File and pixel hashes can make an uncommitted capture reproducible enough to investigate,
but another machine cannot fetch the exact state from a 40-hex commit. Freeze one clean
commit before the official render; bind the evidence to that exact HEAD; prove the scoped
source stays clean and unchanged from start to finish; write to a new evidence root. If any
source changes while review is running, discard promotion and recapture. Never describe a
dirty provisional matrix or packet set as the final review source.

⚠⚠ **A VERDICT MUST BE BOUND TO THE VIEW THE REVIEWER WAS REQUIRED TO JUDGE.** A native
portrait hash alone does not prove unlabeled gameplay identity, an old/current comparison,
or that the correct `mustRead` contract was present. Literal species certification binds
each exact set/species row to the native 440px portrait, the unlabeled 300px gameplay render,
the **actual unlabeled 132px thumbnail**, the labelled old/current comparison, and the hash of
its set-specific `mustRead` or procedural-plan payload, plus date, reviewer attestation, source
commit, and ruler version. If any bound input moves, the verdict is stale. Resolution-specific
evidence is not optional: Fruit Bat's first rebuild contained details enlarged that did not
survive card scale, so code presence and native-scale visibility were both false comfort.

⚠⚠ **A HASH DOES NOT MAKE AN IGNORED EVIDENCE ROOT PORTABLE.** Wave 2e reached `develop` with
four verifiable art-source hashes and two documented pre-edit evidence hashes, but the actual
288-row protected roster, 864 PNGs, and one-off scoped capture/control procedure remained under
ignored `apps/game/smoke/` on the originating machine. A receiving machine cannot derive bytes,
scope, or negative-control semantics from a digest. Publish immutable evidence with a tracked,
reproducible producer before a cross-machine handoff; otherwise stop before comparison and recover
the exact root (or explicitly authorize a deterministic reconstruction that reproduces every seal).

⚠⚠ **A SOURCE SCANNER MUST PROVE THE GRAMMATICAL ROLE IT REPORTS.** A quoted token at object
depth is not necessarily a key: it may be a call argument, and a ternary value may even be followed
by the same `:` that superficially marks a property. `overridecheck` produced 21 false duplicates
by classifying token shape instead of property position. Controls now cover both overcapture forms
and require genuine injected defects to exit exactly 1 with their own diagnostic; a parser crash or
unrelated failure cannot satisfy the test. Do not hand-roll a language parser for this: template/
regex context, keyword-named member calls, Unicode identifiers and restricted-production ASI each
created another silent truncation. Delegate the complete TypeScript source to a pinned parser, then
count only the exact AST node role the check claims. Malformed route-table source requires its own
exit-2 control. Discovery is a separate claim: traverse every route-like declaration and require
each to own a supported literal initializer, because perfect extraction cannot inspect a declaration
it never discovers. Controls must include comment-separated and later declarators, not only the
first whitespace-separated name after `const`.
Once the AST identifies a literal route key, never discard it with a second length, alphabet, or
"looks like a species" heuristic. Validate the claim exactly as written; unsupported CANON key
shape is parser damage, not permission to skip it.
The denominator is code too: parse the one exact catalogue declaration, accept string literals
independent of quote style, require the exact kingdom surface, and bind its read-only runtime
consumer. An initializer-only scan is stale the moment later code can push or replace a row.
Nor does a key alone prove a live route: TypeScript assertions and `any` can assign `null!` or a
truthy non-function to a painter map. Require painter values to be statically callable and spec
values to be objects through immutable, unwritten exact local/import bindings. A supported factory
must return a direct callable expression—not a parameter or mutable alias; a type annotation by
itself is not runtime liveness.
Likewise, a literal-only table contract must reject post-declaration writes and table alias escapes;
otherwise a runtime key can bypass perfect initializer extraction.

⚠⚠ **A NAME AFTER THE CONSUMER IS NOT WIRING PROOF.** Never search from a function declaration to
end-of-file and call any later textual mention a live read; summaries, exports, tests, comments,
and inert property labels can all make a disconnected table look wired. Inspect the parsed consumer
body for the exact table-read AST shape, and negative-control both non-reference syntax inside that
body and a symbol deliberately repeated outside it. A name match is still not provenance: require
one declaration owner, bind external reads to the unaliased import from that owner, and compare the
complete kingdom-qualified route set—not bare names—so one surviving cross-kingdom copy cannot mask
its missing sibling.
An exact lookup whose result is discarded is not wiring either: bind the read to the resolver's
selection initializer **and its executable guard/call/fallback chain that feeds the returned canvas**.
Negative-control an intact initializer whose consumer is disconnected, selectors hidden behind
always-false predicates, and a painter whose ink is never fitted onto the returned canvas. Whitelist
exact computed lookup shapes **at their audited consumer nodes** and every allowed route-table method;
callbacks such as `forEach`, computed methods, and prototype members can expose the original table
under a new name. Reject ownerless route imports and value-wrapper/default/namespace/destructuring
aliases instead of assuming name-based analysis saw them. Recursively inventory the source root and
compare each import's complete normalized relative path—not its basename—to the sole declaration
owner **and its actual exported binding**. Include every executable TypeScript extension; reject
untracked executable files/imports/re-exports and unapproved bare dependencies, and byte-pin any
legacy JavaScript input explicitly outside the AST inventory. When reporting shadows, derive winner/loser from audited resolver precedence, never directory
or alphabetic scan order. Bind compositor/helper names too: prove the resolver has its exact parameter
list and that `newCanvas`, `newInk`, and `fitInk` still resolve to stable, unwritten module functions;
a default parameter or reassignment must not shadow the pipeline. Never trust any lexical shadow of
`Object.keys`, including TypeScript namespaces.
Static provenance is not a JavaScript sandbox. State the standard-unmodified-intrinsics and
approved-dependency-implementation assumptions
explicitly; do not turn “we reject the audited alias/mutation shapes” into a claim that arbitrary
hostile prototype or dynamic-code monkey-patching is impossible. Runtime rendering and visual review
remain separate evidence.

---

## Added 2026-08-11 (Platinum current-generation review)

⚠⚠ **A VERDICT IS VALID FOR ITS BOUND RULER, NOT IMMORTAL FOR THE LABEL.** A prior scoped
PASS can be honest and still be reopened when a later review binds more surfaces or asks a stronger
question. The Platinum review did not show that the earlier glider and focused-lineage evidence was
fabricated; it showed that isolated anatomy/detail checks and distinct stage hashes did not prove
whole-form family separation or gradual five-generation continuity. Preserve the old verdict as
history with its source commit, evidence hashes, resolutions, and rubric version. Mark it
**superseded for the broader scope**—never silently rewrite it—and require a new hash-bound judgment
for every changed pixel under the expanded ruler.

⚠⚠ **FRESHNESS IS A CONTENT-ADDRESSABLE STATE, NOT A FILENAME OR DATE.** Every review package binds
at least: clean 40-hex source commit; producer/schema version; exact catalogue identities and counts;
browser provenance; per-file and aggregate SHA-256; required surfaces/resolutions; and review-ruler
version. A completed verdict set additionally binds its reviewer/date and verdict-file hash; an
UNREVIEWED blank package must leave those completion fields empty. A package is current only while
all applicable bindings still match. Source, producer, browser, roster, required surface, or ruler drift
makes it `STALE_FOR_CURRENT`, not corrupt and not retroactively false. Generate into
a new non-overwriting directory/ZIP, deep-reverify after extraction, keep the old artifact sealed,
and expose a machine-readable freshness check that names the first mismatched binding. “Latest”
symlinks, mutable shared folders, and filenames containing “final” are navigation aids, never
authority.

The clean-source evidence contract is an integrity and reproducibility boundary, not an adversarial
signature system. Producer code, approved reference inputs, and platform intrinsics at the recorded
clean commit are trusted. Exact schemas/statuses and forbidden verdict artifacts must still fail
closed, but SHA-256 cannot prove authenticity against an actor who deliberately rewrites producer
metadata and every dependent hash before resealing. That stronger threat model requires signed
attestations and protected keys; do not claim it from ordinary hashes.

⚠⚠ **A SEALED PREPARATION STATUS AND A RETURNED HUMAN VERDICT ARE DIFFERENT LAYERS.** An archive
correctly generated as `UNREVIEWED / NOT_CERTIFIED` must not be reopened or resealed to insert a
later judgment. Preserve the returned review separately, byte-hash it, and cross-bind it to the exact
archive and clean source. Report both truths: the immutable package still describes its preparation
state, while the external document supplies the human verdict. A package-level PASS does not become
literal per-row `--collect/--certify` output by wording alone, and it does not close unrelated blocked
evidence. If the supplied review omits a reviewer identity, signature, or archive digest, record that
limitation and the external cross-binding; never invent the missing attestation.

---

## Added 2026-08-11 (v2 integration audit)

⚠⚠ **A TOTAL LOADER IS NOT AN AUTHENTIC SAVE CLASSIFIER.** A migration function may deliberately
turn `{}`, partial legacy fields, or malformed rows into usable defaults so a session can continue.
That does not authorize those bytes to replace a primary save or last-known-good backup. Classify
storage/import input first: absent/fresh, coherent supported envelope, unsupported future version,
corrupt/truncated payload, or transient storage failure. Only coherent supported data may be
promoted. Future and corrupt bytes remain protected; a transient hold clears only after storage
health is re-proven. Negative-control syntactically valid truncations, primitives/arrays, a future
version, backup recovery, and a failed-then-successful database open. “The importer returned an
object” proves availability, not preservation.

⚠⚠ **A HANDWRITTEN DECLARATION MUST BE TESTED AGAINST THE RUNTIME IT CLAIMS.** TypeScript can make
the wrong call shape compile perfectly when a `.d.ts` lies: an omitted required callback crashes,
an array declared where an object exists selects the wrong path, and an incomplete combat-stat
shape reaches a nested dereference. For every lifted JavaScript boundary, pair compile-time probes
with runtime calls that exercise the returned shape and failure surface. Run the consumer app's own
TypeScript configuration too; a workspace-root check can omit the exact program that exposes the
drift. Treat declaration-only edits as behavior risk until those two directions agree.

⚠⚠ **A DEVELOPMENT PATH IS NOT A DEVELOPMENT ORIGIN.** Browser persistence is isolated by
scheme + host + port, not by a URL pathname. A GitHub Pages project site under
`celestialfrontier.github.io/<repo>/` would share IndexedDB and localStorage with production even
if its repository and visible path were different. Human previews require a genuinely separate
HTTPS origin, a visible DEV + full-commit binding, a content-hashed manifest, noindex policy, and
a runtime refusal on the production origin. Packaging and publication are separate approvals:
ordinary CI artifacts remain remote-blocked, and no preview action may imply a version bump,
release, `main` update, or live-site deployment.

⚠ **A RETRY IS NOT A DIAGNOSIS.** The v2 browser gate had several intermediate red builds while
the harness learned document readiness and outcome timing. CI runs it once, retains the complete
raw output and structured commit/browser evidence, and surfaces the first scoped failure plus a
related count. Never make a flaky-looking failure green through blind retries; either prove an
expected bounded wait from observable state or leave the red run as evidence while correcting the
instrument or product.

⚠⚠ **A DYING EXECUTION CONTEXT IS NOT A NAVIGATION COMMIT, AND NAVIGATION DOES NOT
PROVE THE OLD RENDERER RELEASED.** Test-battery #201 passed the one-attempt browser smoke and every
earlier gate, then the desktop-8k import leg spent its former 20-second "replacement" budget on the
old top-frame loader after that document's slice token and import-phase global had disappeared. That
state is ambiguous: it proves neither a ready replacement nor an import rejection. It also does not,
by itself, prove the plausible high-resolution GPU/backing-store overlap was the root cause.
> **The remedy is two-sided and phase-owned.** The app's three intentional reloads—Training restart,
> accepted expedition import, and storage-health retry—use one explicit code-owned release path:
> synchronously claim one mutually exclusive replacement transaction before any await, stop ordinary
> persistence, remove resize listeners, destroy Pixi with its global/child resources,
> detach the view, shrink the application and backdrop canvases to at most 1×1, emit an optional
> out-of-context diagnostic witness, then cross one task boundary before reload. Do **not** install
> that teardown on generic `pagehide`; a browser-cache restore must not revive a destroyed app.
> The harness independently bounds import settlement, navigation commit, and replacement boot. A
> vanished global may be tolerated only after reload/navigation is observed; the 5-second navigation
> clock ends only at a changed stable loader, and only then does the new document receive its own
> 20-second boot clock. Require exactly one valid release witness and a changed loader + changed
> document token; retain Page/Runtime/Inspector/Network diagnostics; fail closed on crash, unreachable
> navigation, exception, fatal document load, phase regression, duplicate witness, or retained
> canvas. Negative-control both `replacement-document-loader-token-phase` and
> `reload-resource-release`, and never retry the first red result away.
> A deadline belongs to the phase being exited as well as the phase that remains
> stuck: just-late import→navigation, navigation→boot, and boot→ready transitions
> must fail, even when their destination state is otherwise valid.
>
> **Correction earned by test-battery #202:** a deadline-aware loop is still not a deadline-aware
> witness when it serially awaits blocking CDP commands. That run reached its first replacement
> observation after 61.163 seconds because one loop could spend up to 30 seconds each in
> `Page.getFrameTree`, `Runtime.evaluate({awaitPromise:true})`, and another frame-tree read. The red
> result therefore did not prove a 61-second product boot or save failure; it proved the observer
> could sleep through the evidence it was meant to time. Phase authority must come from sticky CDP
> event receipts carrying their arrival timestamps: the exact target session, default top-frame
> execution context, context identity/generation/origin, changed loader, URL and changed document
> token. The payload's browser-native `performance.now()` must itself be strictly below the
> 20-second boot budget (the exact boundary is a failing control), so a descheduled Node observer
> cannot compress a genuinely late product boot into an apparently timely receipt. A replacement
> page emits the optional `cf-v2-slice-ready/v1` binding only after load,
> complete slice wiring, persistence readiness, at least one ticker turn, an animation frame and a
> later task. The harness then performs one short, phase-owned confirmation in that exact context;
> a command timeout may be shorter than the connection-wide ceiling but never extend it. Reject
> missing, duplicate, malformed, wrong-session/context/loader/token/URL, pre-commit and just-late
> witnesses, and keep fatal events outside any bounded diagnostic ring. This tail witness means
> **boot publication plus a serviced event-loop turn**. It is not the 50 ms answerability metric;
> later driven outcomes remain the proof that controls answer.
>
> **Correction earned by test-battery #203:** an end-of-transaction release witness cannot
> diagnose or prevent renderer pressure *before* that witness. Eleven viewport rows completed,
> while desktop-8k crossed the unchanged 20-second import bound before any release/navigation/
> ready event; the outgoing 5,461×3,072 Pixi ticker was still allowed to render throughout the
> durable-write wait and teardown. A replacement transaction must therefore quiesce the outgoing
> renderer synchronously when its exclusive claim is acquired, before its first await, and resume
> only when that exact failed/rolled-back owner had stopped a running ticker. Invalid input that
> rejects before claim must leave play untouched. Diagnostic imports must expose an event-owned,
> exact-operation sequence from invocation and claim through persistence, durable write, and
> release, with the ticker running only at invocation. Start one immutable deadline before the
> bounded non-awaiting arm command; never give a late command or phase a fresh clock. Do not wrap
> IndexedDB durability in a generic timeout race: it can report failure while a write later commits
> and recreate the overwrite race the ordering protects. Negative-control both ticker directions,
> phase identity/order/context/deadline, and rollback resumption.
>
> **Correction earned by test-battery #204:** healthy import, renderer release, changed-loader
> navigation, document load, and first contentful paint still do not prove the replacement app can
> finish boot. Desktop-8k completed all of those, with no fatal event, then emitted no ready witness
> inside 20 seconds. Two independently “capped” full-viewport canvases had each consumed the entire
> 4,096² allowance, and Pixi auto-started before asynchronous save/scene/slice/input wiring. Under
> software rendering, those choices can starve the work that makes the app usable even though the
> browser has painted HTML.
> **Budget aggregate resources at their simultaneous owner, and keep producers dormant until their
> consumers are wired.** The application and backdrop now split one aggregate twin-canvas budget;
> each remains no larger than native 4K. Pixi initializes with `autoStart:false`, stays stopped
> through save load, scene publication, slice publication and input wiring, then proves a real
> tick/render, animation frame and later task before ready. A complete boot witness must carry the
> exact replacement session/context/generation/origin/loader/token through every ordered stage, with
> the ticker false through wiring and true only after the explicit start. Negative-control every
> stage, identity, ticker direction and deadline. Load/FCP is browser-document evidence—not
> application readiness—and increasing the boot timeout does not repair resource ownership or
> startup order.

> **Correction earned by test-battery #205:** publishing every ordered boot stage and the ready
> event does not prove the target can service the *next* turn. At exact pushed
> `c57305fbf30af2bc8158ff46af1ec49ec4455d95`, every preceding gate and `smoke:ci`
> passed; desktop-8k completed import, write, release, changed-loader navigation, all 12 boot
> stages, and ready at browser-native `performanceNow` about 3,733 ms. Its sole exact-context
> confirmation then timed out at the unchanged two-second bound. Because that run did not send a
> concurrent browser-process heartbeat, it is strong pixel-linear evidence of post-ready target
> starvation but cannot retrospectively distinguish an unanswerable target from a stalled browser/
> CDP transport. Preserve the single red execution; do not retry it or promote the likely diagnosis
> into proof the instrument did not collect.
> **Ready must be followed by bounded target evidence and an independent transport discriminator.**
> The matrix now sends two strict, no-retry, at-most-two-second confirmation cycles in the exact
> ready context. Each target command is issued concurrently with root-session
> `Browser.getVersion`; the second target command resolves only on a later Pixi ticker callback
> scheduled after the render listener. A target timeout or lost context while that browser heartbeat
> remains timely is a product answerability finding; a missing, malformed, timed-out, or late
> heartbeat is an instrument/transport failure. The five-row command ledger binds the import arm
> and both target/heartbeat pairs to their roles, cycles, session/context, await mode, ticker
> priority, and strict deadlines. Product failure may explicitly block later controls, but it may
> never be laundered into a generic omitted-control instrument failure: reports distinguish
> executed, `blockedNegativeControls`, and `omittedNegativeControls`.
>
> The same correction tightened the resource ruler. Native backing is retained through UHD
> 3,840×2,160. A viewport strictly larger than 8,388,608 CSS pixels selects an ultra tier of
> 4,194,304 pixels per canvas / 8,388,608 aggregate; exact rounded-dimension fitting prevents a
> fractional DPR from rounding over its cap. Desktop-8k therefore owns two 2,730×1,536 stores
> (4,193,280 each / 8,386,560 combined), not the prior pair of 3,862×2,172 stores. On a live
> density/viewport transition the old backdrop is destroyed and collapsed before either replacement
> full-viewport store is allocated, and an exact transition peak/budget witness fails if settled or
> transient ownership exceeds the selected tier. Same-backing-dimension viewport changes still
> refresh CSS size, Pixi screen/texture metadata, event resolution, hit coordinates, backdrop
> logical size, and generation; backing dimensions alone are not a resize outcome.

> **Correction earned by test-battery #206:** a resize can eventually publish perfect geometry
> and still monopolize the exact target long enough to be a product failure. Attempt 1 of run
> `31635297321` / job `94243979205` at pushed
> `558e0565d368a0b81d86d99fd380ebc50d30bc02` (tree-identical merge `e160577`) passed
> every preceding step and `smoke:ci`. Desktop-8k also passed replacement reload and both initial
> ready confirmations, but its later 8K→5,120×2,880 transition left the exact-context
> `Runtime.evaluate` unanswered for 2,003 ms against the strict 2,000 ms bound while concurrent
> `Browser.getVersion` answered in 2 ms. The report correctly retained the sole
> `ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` product finding, 0 instrument failures, 56 executed plus
> 1 product-blocked control =57, `omitted=[]`, and 0 retries. Do not reclassify that as transport
> ambiguity, retry it green, or raise the deadline.
> **Responsive geometry requires bounded answerability throughout the transition.** Preserve native
> UHD. Above the existing ultra threshold, the app now caps each simultaneous full-viewport store
> at 3,145,728 pixels; exact rounding makes both 8K and 5K 2,365×1,330 each /6,290,900 combined.
> Test both downshift and restore with a strict exact-target command paired concurrently with a
> browser-process heartbeat, then require an advancing later post-render ticker turn. Deliberately
> stopped and stale-ticker controls must fail alongside the geometry, pointer, backing and ownership
> controls. The current repair changes the resource ceiling; it does **not** optimize away the
> existing scene rerender, so do not document a quality-tier/rerender optimization that did not land.
> The current full Edge 151 `dirty-diagnostic` PASS is non-authoritative despite 12/12, 57/57,
> zero findings/instrument failures/retries (report SHA-256
> `faa399ec1ef1e07aa384937594683f07d74227497e10302eee213b91f3aabc8c`). Such
> evidence can guide the repair, but a clean-head exact battery for the immutable source and matching CI for
> whichever final pushed tip is selected remain the certification boundary.

⚠⚠ **A BROWSER PIN IS PROCESS ENVIRONMENT, NOT WORKFLOW MEMORY.** A v2 battery passed its root,
product, smoke, full 12-viewport and persona gates under explicitly pinned Chrome, then the next
GitHub Actions step lost that step-local `CF_BROWSER`, selected an installed Linux Edge through
fallback order, and failed before CDP created a page. That red browser check never exercised the
packaged page or product. Pin one exact browser at job scope for every browser-owning process and
resolve it fail-closed before long gates. Every raw-CDP gate must consume the shared executable
resolver and pinned `ws` transport; any gate claiming the shared owned lifecycle must actually use
it instead of carrying a guessed port, WebSocket loop or cleanup path. The owned launcher uses a
unique profile, asks Chromium for port 0, reads its
`DevToolsActivePort`, records exact `Browser.getVersion` provenance, detects early child exit,
retains bounded stderr head and tail, and performs bounded TERM→KILL shutdown plus profile removal.
Legacy `bootperf` shares the executable resolver and `ws` transport but still owns its older CDP
lifecycle, so none of the owned launcher's lifecycle guarantees may be attributed to it yet.
A prior green browser step does not certify the next process's provenance. Do not turn this class
of failure green with a retry, a longer startup bound, a fallback reorder, or by clearing the last
diagnostic mentioned on stderr; repair the scope and require matching new-head CI.

The report is process state too. A tracked last-run JSON can survive a launcher failure and make a
red current run look accompanied by green evidence. Browser gates must atomically replace stale
output with a `running` record before launch, then write a terminal `pass`, `fail`, or
`instrument-fail` record while retaining any legacy result rows consumers still need. Generated
reports are ignored working evidence, not source. Negative-control this boundary by seeding a stale
PASS, forcing a diagnosed early exit, and proving the current red record replaces it and cleanup
finishes. CI must verify the exact current run id before a separate always-run upload whose missing
file is an error; a filename, successful prior attempt, or artifact upload alone is not freshness.
A full layout PASS must also match the sealed v1.8.9 baseline's complete 787-entry
`viewport/surface/name` inventory. Counting 787 rows is insufficient: remove one expected outcome,
repair all summary counts, and the selftest must still reject the report. A targeted viewport run
is explicitly scoped diagnostic evidence and must never be promoted as the full inventory.

Executable dependencies are a two-install-surface contract. Both root and `port/v2` manifests and
locks declare the pinned `ws` transport and the supported Node lines
`^20.19.0 || ^22.13.0 || >=24.0.0`. Preflight must launch the selected executable through the same
owned CDP path used for provenance—not merely check that a path exists—and its selftest must reject
both an executable non-browser and excluded Node lines. A dependency check that accepts `/bin/true`
or an unsupported odd/intermediate Node line is another green-but-unrunnable battery.

⚠⚠ **CLEAN BEFORE + CLEAN AFTER DOES NOT PROVE THE BYTES BETWEEN WERE CLEAN.**
`overridecontrol` deliberately rewrites a production art source, runs its failing control, and
restores the file. A concurrent Vite/browser/evidence process once captured that transient poison,
then both commands ended with a clean tree; the resulting false boot was neither source truth nor
valid evidence. Every transient source-mutating control and every byte-producing browser/build gate
in a shared worktree must use `port/v2/tools/workspacelock.mjs` for mutual exclusion. Never overlap
`overridecontrol` with Vite, browser, preview, screenshot, or evidence work, and never put a parent
lock around a child gate that acquires the same lock. Clean/review and approved preview packages add
a second boundary: Vite builds an isolated `git archive` snapshot of the exact HEAD `port/v2` tree,
not the working tree. Only explicitly dirty, nonpublishable local previews may build working-tree
bytes.
