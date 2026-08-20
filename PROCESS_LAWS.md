# Celestial Frontier — PROCESS LAWS

**STATUS:** current as of 2026-08-20. **This is a REFERENCE, not a log** — per CLAUDE.md’s
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
⚠⚠ A MEASURED RULER OWNS ITS EXACT AUTHORITY AND MUST REPLAY RAW EVIDENCE (2026-08-17).
  Bind the runtime/browser build, budget bytes, deterministic inputs, source identity, attempt
  policy, and artifacts that produced a ceiling. At terminal verification, recompute outcomes from
  the raw observations against those exact authorities. Never trust a copied PASS boolean, hash,
  metric summary, or outcome row as a substitute for the bytes or observations it summarizes;
  require every repeated carrier to agree and negative-control each one independently.
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
⚠ **BRANCH PUBLICATION FOLLOWS A PASSED PUSH BATTERY.** Agents never write a Pages
repository. The repository-owned publisher receives one target-specific deploy key only after
the exact `test-battery` push succeeds: `main` preserves the immutable root v1.8.9 production
HTML, while `develop` publishes the already-tested exact `port/v2` v2.0 development package to
the separate noindex DEV origin. Development packaging must keep its full-commit manifest,
origin refusal, noindex/robots guards and generated version identity; the visible identity lives
inside the Guide, never in a floating corner badge. Pull-request, manual, and failed-battery runs
have no publication authority; the development site is never merge/release/production authority.
⚠ **A GREEN, REVIEWED AGENT PR MAY FOLLOW ITS NORMAL INTEGRATION PATH WITHOUT A SECOND
MERGE PROMPT.** Nick's standing authorization (2026-08-13) lets Codex or Claude Code merge a
scoped agent-branch PR into `develop` only after the required battery is terminal-success and
the PR is clean/mergeable, then monitor the exact resulting push battery and automatic mapped
branch-site publication. This never includes `develop` → `main`, conflict shortcuts, red or
unfinished checks, force pushes, manual Pages writes, new external destinations/secrets,
versioning, release approval, or production deployment.
Once those exact preconditions are satisfied, this standing authorization is the prompt: do not
ask Nick repeatedly for another generic “proceed” before the normal PR merge or publication
monitor. Stop only for a real scope change, conflict, red/unfinished check, new destination/key,
release decision, or production action.
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
⚠ **A RELEASE BULLETIN IS AN OUTCOME MAP, NOT A COMMIT LOG OR A ROADMAP.** Follow the mature
  category order and its compact technical-outline voice, but summarize what the player can actually
  use now rather than narrating patches, gates, or unfinished plans. A cumulative x.0 development
  entry may be comprehensive without pretending open mechanics are shipped: omit inapplicable empty
  categories, name current-slice limits honestly, and keep draft identity separate from production
  release authority. Test the mutable draft semantically rather than freezing it behind a whole-copy
  hash: canonical unique sections, nonempty unique bullets, required implemented outcomes, forbidden
  overclaims, a browser-reachable final item, and proof that reading/reloading the draft cannot mutate
  the shipped-release marker. Continue to content-address the immutable legacy archive separately.

⚠ **RARITY DATA AND RARITY PRESENTATION ARE DIFFERENT CONTRACTS.** The lifted deterministic
descriptor may continue to calculate a `spectral()` designation and keep color words for seeded
art parity; that does not authorize a player-facing row named **Spectral class**. V2 survey cards
filter that legacy row at the presentation boundary. A planet reveals no grade before a successful
landing and then uses the plain ten-tier name (`Rarity: Legendary`, not a spectral color label).
Real stellar classifications such as G/K/M or neutron star remain astronomical identity, and star/
galaxy cards must not recreate the retired Spectral row. Test both directions: no pre-land leak or
legacy row, plus unchanged internal designation data.

⚠ **ONE SURFACE, ONE CLOSE OWNER.** A panel or survey card gets exactly one top-right 44px Close
action. Refill code must preserve that owner without seating a second control; geometry tests must
reject duplicate, detached, upper-left, and off-surface Close actions. Desktop notifications and
Settings/Records share the bottom-right utility edge; balanced padding, row separators, and borders
belong to the same presentation contract, not optional polish that may regress independently.

⚠ **A DISMISS MANAGER READS DECLARED NON-MODAL CHROME BOUNDARIES, NOT A SECOND ID LIST.** Flex/grid
spacing inside an interactive chrome root belongs to that root; it is not empty sky merely because the pointer
missed a child button. Panel content and registered openers remain manager-owned, while stable
non-dismiss chrome declares one generic boundary marker at its actual root. Prove the reported
geometry with real-browser pointer input and exact `elementFromPoint`: both desktop rail gaps keep the
active panel open, removing either marker recreates dismissal, temporarily marking the same canvas
point prevents dismissal, and restoring genuine unmarked sky closes. Deliberately outside actions
such as Search remain outside until their coexistence policy changes. Delegated document handlers
must also reject non-`Element` targets before calling `closest`; a type assertion is not a runtime
guard. True modals remain a separate lifecycle and are not claimed by this boundary law.

⚠⚠ **IMMUTABLE AUTHORITY MUST NOT DOUBLE AS A MUTABLE PRESENTATION CACHE.** F2's first
real-browser ingress attempt reached an accepted galaxy, then failed because the deeply frozen
`ProvenGalaxy` was handed to lifted `galaxyStats()`, whose legacy memoizer assigns `_stats` to its
input. Keep the proof frozen and registry-owned: give an input-mutating presentation helper a
disposable value copy, and retain only frozen derived fields in a private sidecar keyed by the
proof. The inverse alias boundary matters too. Copying an outer scene node does not detach a nested
object such as `bridge` from the memoized `galaxiesInCell` cache; clone and freeze that nested value
before presentation can mutate it and poison later composition. Audit every nested generator alias,
not only the outer object. An explicitly documented identity such as `systemScene.P` may remain
shared only as read-only presentation data and must never become action authority. Negative-control
both directions: the real accepted route must render while the proof stays frozen, and mutating a
returned presentation value must leave the source cache and the next composition unchanged. The
repaired complete one-attempt local `smoke:ci` and the complete 12-viewport Glass Matrix are green
on the same dirty working-tree digest; that is local outcome evidence, not exact-head CI,
integration or Gate certification.

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
HTTPS origin, a Guide-visible v2.0 + full-commit binding, a content-hashed manifest, noindex
policy, and a runtime refusal on the production origin. A corner badge is not the boundary and
must not cover play; the Guide identity, runtime binding and manifest must agree. Packaging and
publication remain distinct authority: ordinary CI artifacts are remote-blocked, while the mapped
post-green-`develop` publisher accepts only the verified publication candidate for that exact
commit. Neither path may imply a production version, release, `main` update, or live-site deploy.

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
> **The remedy is two-sided and phase-owned.** The app's five intentional reloads—Training restart,
> Training completion, Training recovery, accepted expedition import, and storage-health retry—use one explicit code-owned release path:
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
> **Responsive geometry requires bounded answerability throughout the transition.** The #206 repair
> preserved native UHD and, above the existing ultra threshold, capped each simultaneous full-viewport store
> at 3,145,728 pixels; exact rounding makes both 8K and 5K 2,365×1,330 each /6,290,900 combined.
> Test both downshift and restore with a strict exact-target command paired concurrently with a
> browser-process heartbeat, then require an advancing later post-render ticker turn. Deliberately
> stopped and stale-ticker controls must fail alongside the geometry, pointer, backing and ownership
> controls. That repair changed the resource ceiling; it did **not** optimize away the
> existing scene rerender, so do not document a quality-tier/rerender optimization that did not land.
> Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
> passed the sequential exact battery: root layout 787/787, v2 273/1 plus all gates,
> one-attempt smoke 0/10, certifying glass 12/12 and 57/57 with empty blocked/omitted
> ledgers and zero findings/instrument failures/retries, nine automated-only personas,
> terminal-only performance, and an Edge 151-smoked separate-origin preview with
> `publishable:false`. That source and clean `6554b2b` below remain prior evidence; immutable
> clean executable source `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` is the #208
> repair's local executable authority. No human or publication
> authority follows.

> **Correction earned by test-battery #207:** adjacent producer emissions are not an atomic
> observer state. Attempt 1 of run `31642880191` / job `94269466117` at exact pushed
> `ff9bebb22aaac0e95cd406e1e15737898452911a` (tree-identical merge
> `8dfe018590edf8a5d15291730c873869b96caae2`) passed every preceding gate,
> `smoke:ci`, and 11 glass rows. Tablet-portrait then received a valid release witness
> after ordered `release-started` but before `release-complete`; the observer woke between
> those two synchronous producer bindings and rejected the healthy intermediate state. The
> release itself proved renderer/stage destruction, detached view, 1×1 application/backdrop
> canvases, and null error. Preserve the one-attempt red: 0 product findings, 1 instrument
> failure, 57 planned/listed controls, `blocked=[]`, `omitted=[]`, 0 retries, and no persona/
> preview output.
> **A cross-channel order needs one shared ruler, not two independently complete ledgers.**
> Assign a monotonic receipt ordinal only across the operation-specific import-phase and generic
> release bindings for one armed capture. The successful terminal must be exactly
> `release-started` at N → release witness at N+1 → `release-complete` at N+2. A valid
> release-first intermediate stays pending only under the original unchanged 20-second import
> deadline; its receipt may anchor the separate navigation clock but never renew the import clock.
> Reject phase-complete-first, release before `release-started`, interposed/nonadjacent evidence,
> missing or late terminal evidence, duplicate/malformed/wrong-provenance bindings, early boot/
> ready, and overlong phase streams including a duplicate sequence-8 terminal. Do not defer every
> inconsistency until timeout: impossible order fails immediately, while only the one producer-
> legal intermediate waits.
>
> The earlier dirty diagnostic (report
> `805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
> chronology only. Immutable executable source
> `6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete clean exact battery.
> Its first sandboxed preflight Edge launch SIGABRTed before CDP; the same invocation passed when
> permitted, with only the expected Edge 151/pin-150 warning—an environment launch refusal, not
> a product retry. Root gates and exact layout 787/787 across 10/10 passed (report
> `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`); v2 passed 273/1 and
> every static/art/coverage gate; one-attempt smoke passed 0 findings/10 screenshots. Certifying
> glass passed 12/12 and 57/57 in 54,877 ms with exact 6/7/8 tails on every row, empty blocked/
> omitted ledgers, and 0 findings/instrument failures/retries. Tablet-portrait was 196 ms with
> 2/1/1/7/0 ms command durations; desktop-8k was 197 ms with 1/1/0/7/0 ms commands,
> 34 ms release→commit, 131 ms commit→ready, outgoing 2,365×1,330 twins →1×1, and the
> replacement at 6,290,900 combined pixels. Nine automated-only personas and terminal-only
> 635/717/77/151 ms performance passed. Exact preview
> `dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151 over loopback,
> bound to the expected separate development origin, with `publishable:false`. That immutable
> source remains prior #207 executable evidence; live Git/PR state determines the current tip,
> upstream, and checks. The
> selected pushed tip still requires matching CI, and no human, host, Ready, merge, release,
> deploy, or version authority follows.

> **Correction earned by test-battery #208:** a backing allocation may be inside its stated cap,
> emit every release/boot witness in order, and still fail the user-facing response contract.
> Attempt 1 of run `31649176954` / job `94289516851` at exact pushed head
> `ee8bc281c424b5a8f998dc7327372e5f5a18067d` (tree-identical merge `8fc6b4fc`) passed
> steps 1–15, `smoke:ci`, and the first 11 glass rows. Desktop-8k allocated a valid
> 2,365×1,330 pair /6,290,900 pixels and scheduled ready at browser performance 584.3 ms,
> yet ready did not emit until 3,143.8 ms—a 2,559.5 ms main-thread gap. Exact target cycle 1
> then timed out at 2,003 ms against the unchanged 2,000 ms bound while the concurrent
> browser-process heartbeat answered in 1 ms; there was no fatal. The report correctly
> retained `REPLACEMENT_UNANSWERABLE_AFTER_READY`, 1 product finding, 0 instrument failures,
> 57 planned controls with `ultra-same-backing-resize` product-blocked, `omitted=[]`, and
> 0 retries. Preserve #208 red; do not retry it green or call a scheduled-but-undelivered
> ready event an answerable product.
>
> **A resource cap is accepted by its sustained response outcome, not merely by its arithmetic.**
> Keep native backing through UHD so fast/native/common displays retain quality. Strictly above
> 8,388,608 CSS pixels, use one deterministic fixed ceiling of 2,073,600 pixels per simultaneous
> full-viewport canvas /4,147,200 aggregate. Exact rounded fitting makes desktop-8k DPR 0.25 and
> 5K DPR 0.375 both 1,920×1,080 per store. Do not substitute runtime-adaptive quality, a one-shot
> ticker pause, a longer target bound, a looser heartbeat, an early ready, or a retry: those change
> the contract or make identical inputs depend on machine timing. The unchanged exact target/
> heartbeat pair, later post-render ticker witness, runtime resize, pointer geometry, release/ready
> provenance, and zero-retry policy remain the acceptance boundary.
>
> Test the policy in both directions. Literal positives must assert 1,920×1,080 and 4,147,200;
> the former 2,365×1,330 ready and release shapes must fail, as must the existing 2,730×1,536
> shapes, while threshold/native-UHD, runtime same-backing resize, pointer, ownership, and stopped/
> stale ticker controls remain. A dirty-worktree browser pass can diagnose but cannot certify the
> fix; the `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
> PASS is prior chronology only. Immutable clean executable source
> `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed from committed clean bytes
> (status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
> snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
> Root layout passed 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`),
> v2 passed 273/1 plus all gates, and one-attempt smoke passed 0/10 in 105,339 ms
> (`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
> `fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`).
> Glass passed 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 tails,
> five-command ledgers, empty blocked/omitted ledgers and zero findings/instrument failures/
> retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`).
> Exact 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms,
> 33/129 ms release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels
> at DPR 0.25; terminal-only performance was 606/685/74/171 ms. Automated persona JSON/
> Markdown hashes are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
> `fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`.
> Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
> under Edge 151 over loopback, bound to expected separate origin
> `https://dev-celestialfrontier.github.io`, with `publishable:false`; manifest/content/tree
> hashes are `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
> `5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
> `5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR is authority for current
> tip/upstream/checks; whichever final pushed tip is selected requires matching CI. No human,
> host, Ready, merge, release, deployment, or version authority follows.

**Correction earned by PR #32's first Linux battery:** moving expensive work to another realm is
not itself a resource or responsiveness proof. Saved-Earth Planetside asked the renderer for its
first settlement observation; the target missed the unchanged two-second command bound while the
browser-process heartbeat answered in six milliseconds. The heavy painter import, 440px paint,
132px downsample and PNG encoding still ran synchronously on the renderer, and `setTimeout(0)` only
yielded between indivisible jobs. Keep the response deadline and move the indivisible producer to
one lazy dedicated worker with no synchronous fallback. Bind the reachable Window owner, exact
module Worker edge, worker instance/epoch/job identities, worker-local dynamic painter import,
ordered phases/results/errors, and final worker disposal; reject orphan/duplicate/preloaded/static
worker or painter paths and any renderer-reachable legacy synchronous facade. A page-heap gate may
not go green merely because live memory moved into an unmeasured retained worker: terminate the
worker at queue drain or measure the worker realm explicitly.

Failure ownership crosses the realm too. Run capability preflight once before worker readiness or
painter import. Capability, import, protocol and worker-fatal errors terminate one instance and
settle its active plus already-queued owners exactly once, without retrying the same broken import
for every tile; content-specific paint/encode failures may remain per-job. Negative-control both
directions with more than one owner. Smoke waits for the semantic image outcome (`src`, complete,
exact decoded dimensions, state, queue and active work) under one monotonic phase deadline whose
blocking CDP commands are clipped to the same remaining time. A fixed sleep, long data URL, copied
zero counter, later post-settlement observation, wider deadline, or green renderer-only heap number
cannot substitute for those outcomes.

**Correction earned by PR #32's da0 battery:** off-thread work, one serial producer, and
close-at-idle do not by themselves guarantee the main target gets a serviced turn. Local exact-da0
Compendium certification and its Chrome gates passed, but GitHub run `32334254714`, attempt 1,
preserved a terminal phone `product-unanswerable` result without retry. Its exact Edge, active-budget
bytes, and producer authority all matched. After 29 completed stages, Planetside thumb settlement's
target command missed the unchanged 2,000 ms deadline at 2,001.723 ms while independent root-session
`Browser.getVersion` answered in 0.872 ms. The partial report did not retain producer-phase state,
so it could not distinguish worker import, paint, encode, result publication, or absence at the
exact timeout. Source inspection nevertheless
showed that completion-message bursts followed by zero-delay successor pumps could repeatedly win
over rendering, input, and inspector work.

**Every default producer pump must cross the user-visible scheduler, not merely a timer queue.**
For this broker, each initial and successor pump waits for one rendering opportunity and then one
later task (`requestAnimationFrame` → `setTimeout(0)`) before dispatch. Negative-control both halves:
flushing timers before the frame must dispatch nothing, and servicing the frame without the later
task must dispatch nothing, for both the first and successor job. Persisted suspension or disposal
invalidates the generation of an already-armed pump; resume schedules a fresh serviced turn and a
stale callback must not clear or consume it. Do not answer this class with a longer target bound,
worker concurrency, an early ready marker, or a retry.

The scheduler is also producer authority. Changing the main-thread owner bundle makes any candidate
capsule, ceiling, or six-image package bound to the old producer stale for current certification even
when its historical result remains truthful. Fail the budget closed, bind the new exact producer,
recalibrate from fresh paired baseline plus independent candidates, and certify the eventual
activation head once. For this repair, producer
`1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2` was recalibrated under exact
Edge 151.0.4129.86 from one-attempt baseline4 plus independent candidate5/6/7. The active ruler
replays their raw capsules, retains all four baseline faults and 14 phone / 13 desktop breaches,
and exact-788 local certification passed. Every instrument-only head and PR test-merge must own its
exact-source browser evidence; whether the selected head has such ignored evidence is resolved from
its named artifacts, never cached in this reference. Activation or an earlier-head PASS is not
certification.

**Correction earned by PR #32's first serviced-turn Chrome Smoke:** a CDP session that answers
`Runtime.evaluate` does not prove that its document owns a rendering opportunity. Exact-head run
`20260820063539761-70885-f80e1a2198fc` created a live held-painter owner, then created a second
target and polled the first without reactivating it. The only finding was the 30-second lazy-art
refill returning `last null`; the instrument retained neither foreground authority nor the terminal
image/worker phase. Because each repaired successor pump deliberately waits for rAF and a later
task, judging an owner whose foreground/rendering authority was never re-established made the test
precondition unproved. Preserve that red as instrument evidence; do not infer the exact stalled
producer phase, add a hidden-tab timer fallback, widen the
deadline, or retry the unchanged run.

**A MULTI-TARGET BROWSER TEST MUST OWN THE RENDERING TARGET IT JUDGES.** Bind the expected page to
its attach-derived target/session and exact document token. Immediately before a held release or
other rendering-opportunity-dependent observation, activate that exact target, enable focus
emulation, bring the page forward, and require one fresh service token to remain visible, not
hidden, and focused at arm, rAF, and the later task, with zero intervening visibility/focus loss.
Only then may the test release once and start its one immutable phase deadline; a command response
received at or after that boundary is late even if its timeout callback has not run. If ownership later
moves to a different document, repeat the same proof for that owner rather than borrowing the first
page's witness. Negative-control wrong target, stale document/service identity, hidden/unfocused
arm and phases, phase reversal, and intervening visibility/focus changes. A timeout must retain the
last non-null image/decode, queue/active, worker identity/phase/result/error, broker, and foreground
state; a generic `null` cannot distinguish product from a missing test precondition.

**Correction earned by PR #32's exact-ef6 D-TRAIN Smoke:** a direct fixture write does not own
setup while an older product writer can still commit. Clean committed
`ef6c2c2cd31363cf47899a89c16c0d9f5f90d7a7` first passed its one-attempt exact Edge Compendium
certification and named verifier. Its immediately following one-attempt Chrome Smoke run
`20260820071826194-75001-c2a22330fd09` then completed with only two findings: no D-TRAIN import-
owner busy-refusal witness and the same phase's missing Skip action (`button:false`,
`witness:null`). Report/log SHA-256 values are
`65ca06c8f6d26ef3a9a3da19bb4bc09bb005d754f2291f55f389ac1ecf14aa46` /
`87b1c8b6308d3a1969fb45ea4c2ccb70d1f46c2a8311751984b3c1ab0acdd7d9`; the run used Chrome for
Testing 152.0.7977.54, zero retries, and detected no source change.

The D-TRAIN fixture helper had written IndexedDB immediately after a real Atlas/Land journey
without first joining that page's ordinary persistence owner. A later write could therefore replace
the fixture before navigation, while the helper proved only a changed document token and returned
whatever raw bytes happened to remain. Comparing the later primary to that returned value could be
self-consistent even when the intended fixture never booted. The report did not retain which raw
bytes won, so do not invent that terminal value or reinterpret the absent action/witness as a
product busy-refusal failure. Source ordering plus a deliberate stale-write reproduction identifies
this as a harness setup race.

**A FIXTURE MUST JOIN PRIOR WRITERS AND PROVE ITS RUNNABLE PRECONDITION BEFORE A PRODUCT VERDICT.**
Drain the actual preceding persistence path, deliberately reproduce the unjoined stale-write race as
a negative control, then seed once and require the intended primary bytes after a changed exact
document loads. Bind the page's document token, classified state, canonical route plus rendered
receipt, live surface, connected/enabled/visible real action, idle status, and expected ticker state
before arming the product transaction. Setup drift is one fail-closed harness finding before release,
never a product finding assembled from optional-chained missing controls. After setup passes, drive
one real action and wait semantically for its operation-local terminal witness; `Promise.resolve()`
is not settlement authority. For the import-owner case, also require one captured Skip click,
`claim-rejected/busy`, unchanged primary bytes, and zero native writes before releasing the import
owner. Do not answer this class with a sleep, retry, fixture rewrite loop, or looser product oracle.

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

PR #25 exposed the same phase-ownership requirement inside the launcher selftest itself. Its
WebSocket-open-timeout control first launched real Chrome and therefore could reject on a cold
`DevToolsActivePort` startup timeout before the injected socket existed; run `31815658572`, v2-smoke
job `94816585307`, failed in that earlier phase even though the same head's static, root, and glass
jobs were green. A WebSocket-phase control must instead use a deterministic portable child behind
a private launch seam, write one valid regular endpoint in the owned profile, and prove the short socket timeout,
exactly one fixture launch, socket close, bounded child shutdown, and profile removal. The control
must reject if the endpoint is absent or the injected socket is accepted. The selftest's following
live provenance check is then its first real browser launch and may own the fixed 30-second
cold-start allowance; the shared launcher default remains 15 seconds, its later warm launch remains
10 seconds, command/shutdown bounds stay unchanged, and no retry or fallback is added.

PR #26 exposed the remaining boundary between endpoint discovery and an open connection. In
test-battery run `31870103561`, v2-smoke job `94977303036`, the first live-provenance leg found a
valid `DevToolsActivePort` inside its 30-second allowance, constructed the real socket, then borrowed
the deliberately tight 1,500-millisecond **command** ceiling for WebSocket opening and expired before
`Browser.getVersion` or gameplay. Treat spawn → endpoint → socket-open as one absolute startup
deadline measured by a monotonic clock, while also giving socket-open its own validated phase cap
clipped to the remaining startup time; post-open commands and shutdown keep their independent
ceilings. The socket cap defaults to the startup budget, never to the post-open command budget, and
the selftest's real cold/warm legs
declare bounded 15/10-second socket caps inside their unchanged 30/10-second startup budgets. Prove
all boundaries with portable fixtures: a delayed socket must open after a shorter command ceiling
and still answer `Browser.getVersion`; a socket delayed beyond its explicit short cap must reject;
a longer socket cap must be clipped to the shorter absolute startup remainder; an exhausted
deadline must reject before construction, and a constructor that consumes the remainder must reject
immediately afterward; `onopen` delivered at or after its deadline must reject even if its overdue
timer has not run. Every failure closes the socket when one exists,
but setup must arm an error handler before closing a still-CONNECTING transport; it then terminates
exactly one child and removes its profile. Nonpositive and fractional caps reject before
launch. Real-browser legs must assert profile cleanup in `finally` on either rejection or success;
the portable rejection controls are the deterministic proof of failure cleanup. Never answer this
class with a retry, fallback, workflow-timeout increase, or wider startup/command/shutdown budget.

PR #27 exposed one earlier publication boundary: **A FILE PATH IS NOT A COMPLETE ENDPOINT.** In
test-battery run `31887203990`, v2-glass job `95018147710`, the ninth fresh matrix browser exposed
`DevToolsActivePort has an invalid port` only 364 milliseconds after launch; eight earlier and three
later rows passed under the same pinned Chrome, and the report correctly retained zero product
findings and zero retries. Chromium can create its final `DevToolsActivePort` path before both lines
have been completely written. A shared launcher must therefore treat parser-invalid regular-file
content as potentially incomplete inside the **same** single-process monotonic startup deadline,
and must require two consecutive identical, fully valid raw snapshots before constructing the
socket. A wrong file type, symbolic link, or unexpected filesystem error remains immediately fatal;
a persistently malformed regular file fails at the unchanged deadline with its last parse diagnosis
and zero socket constructions. Negative-control a valid-looking endpoint prefix, a port-only file
with its endpoint line missing, invalid endpoint syntax that becomes complete, persistent malformed
content, unsafe file types, exactly
one child, final-endpoint socket identity, socket/child closure, and profile removal. Do not turn
this into a browser relaunch, retry, per-viewport sleep, browser reuse, fallback change, or wider
startup/socket/command/shutdown budget.

On macOS, Chromium is also outside the Codex Seatbelt's permitted process surface. Three Edge
crash reports supplied on 2026-08-13 shared the same Node-parented, main-thread
`TransformProcessType` / `_RegisterApplication` SIGABRT within 100 ms of launch; the system log
showed denied LaunchServices and WindowServer lookups. That is an environment refusal before CDP,
page creation, GPU allocation, or game code—not a product crash and not memory pressure. The shared
launch boundary rejects `CODEX_SANDBOX=seatbelt` before spawning Chromium and instructs the agent to
use approved elevated execution. Negative-control the environment check without launching a real
browser; the actual browser outcome still requires a permitted process.

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

## Deep play must respect the player (2026-08-13)

Celestial Frontier may pursue deep mastery, attachment, surprise, long-term collecting and a
universe players enjoy thinking about away from the screen. It must not translate that ambition
into compulsion machinery. No implementation or acceptance metric may optimize streaks, FOMO,
punishment for taking a break, paid random rewards, hidden odds, expiring missions, energy sales,
variable-pressure notifications, or loss whose purpose is to manufacture urgency. Active-play
progress is allowed; absence penalties are not. Random loot is earned, source/ranges are disclosed,
and a ready reward waits until the player chooses to claim it.

This law is testable in part—no wall-clock reward owner, no expiry, no paid-random path, no hidden
pool—but the quality boundary remains human: does the loop create curiosity and meaningful choice,
or pressure and maintenance? Retention, session length and notification response are never release
criteria.

## Design documentation is not Guide capability (2026-08-13)

System docs may define a future Inventory, Shipyard, loot, Companion, combat or audio contract in
enough detail for either agent to implement it. The in-game Guide must continue to describe only
executable outcomes. A capability changes from unavailable/partial only after its real action,
persistence/reload, touch/keyboard reachability and negative-controlled outcome gate exist. A type,
pure resolver, imported legacy field, static portrait, planned table or design document is not a
player feature.

Large cross-system changes begin with an identity/ownership audit. Species catalogue rows are not
owned creature instances; base item definitions are not rolled gear instances; visual ship state is
not a second progression authority; an audio profile is not a biological recording. Name each owner
before adding content volume, then grep every reader/writer/importer/exporter before migration or
deletion. “Unused by the current slice” is not proof that compatibility, fixture or planned lazy
freight is defunct.

## A checkpoint restores only what it owned (2026-08-16)

The mature v1.8.9 Field Training `tsnap` was never a whole-save or whole-expedition snapshot. It
owned exactly eleven outer fields: `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}`. A compatible
restorer may replace only those surfaces—selected statistics, player statistics, achievements,
Stardust, Compendium, cargo, exceptional cargo counts, items, equipment, equipment affixes, and
the captured Earth Atlas/home row. Every other field belongs to the surrounding outer save and
must pass through the established v4 import/sanitize/export contract. The checkpoint's `e.where`
is historical display data, never route authority; regenerate and prove canonical Earth instead.
`view` is not one of the eleven fields. Do not promise legacy pre-Training location restore:
legacy Skip from Welcome persists the Training Sol route, while full completion after Land
persists Earth. Only the current-v2 exact one-key `{view}` checkpoint restores the pre-Training
location.
Do not invent a landing, conquest, achievement, or route, do not heal HP while clamping it to a
restored ceiling, reserve the current Atlas-cap slot Earth owns, and derive identity-backed counts
such as surveys and arrivals from their retained ledgers.

Fixture provenance is part of that contract. `training-restart-fixture.json` is action-derived from
the real v1.8.9 Settings → Restart Training control path. The older synthetic
`save-fixtures.json:tut_midtraining.tsnap` object is deliberately an unknown/refusal negative
control; never relabel it a legacy checkpoint, teach the classifier to accept it, or delete the
evidence. A recognized exact checkpoint on `tut:1` rescues the historical completion-order bug by
remaining pending. Any other bounded shape remains protected and refusal-only; oversized or
otherwise unsafe evidence is never normalized into something writable.

Restored cumulative records that cannot be re-derived after their record holder was consumed use
the optional compatible outer-v4 carrier
`ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}`. This is an additive extension of the v4
envelope, not “no schema change,” but it is not a global v5 migration or a game/release version
bump. Absent `ever` preserves historical derivation. Its record fields can only raise derived
floors; `arrivals`, when present, opts into the carrier shape but `sysSeen` remains the count
authority. A numeric nested `ever.v` greater than 1 protects the whole save as `future-version`;
do not silently ignore an unknown future carrier and then overwrite it. Malformed v1 carrier
members are contained field by field.

Training completion is a replacement transaction, not an autosave followed by cleanup. Finish or
Skip must synchronously claim exclusive replacement ownership before its first await, mark the
lesson busy and keep its focus lock/live card in place, stop the ticker, cancel queued persistence,
drain any active write, build and source-prove a detached candidate, and perform exactly one direct
primary write. Publish live state and tear down only after durability. Before that durable point, a
candidate/proof/write refusal releases the claim, resumes only the work that claim stopped, rearms
ordinary persistence, and leaves the checkpoint plus retryable lesson intact. After durability,
never write a second time merely because live-state publication failed; reload must converge from
the committed primary. A source-proof failure may commit only the still-incomplete save with the
exact checkpoint retained and a freshly proven, authorized Sol route, then reload to retry. If
Sol proof is also unavailable, forge no fallback, write, clear, or completion; keep the lesson
and checkpoint retryable.

Loaded unfinished Training has a separate write boundary. Any recognized pending checkpoint is
write-held. A loaded `tut:0` save without a checkpoint is also held and may be seated at proven Sol
in runtime only until the one atomic completion write; this does not fabricate an eleven-field
snapshot. Fresh empty onboarding may use ordinary saves. An unknown checkpoint or unavailable
recovery route enters a persistent modal lock: the import sheet remains modal, background-inert,
focus-trapped, nonclosable by Close or Escape, and reopens synchronously on every boot while the
protected source remains. Only retry/reload or a trusted complete import may replace it; session
practice must not appear to make progress over protected bytes.
