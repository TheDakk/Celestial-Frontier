# Claude review — PR #23: `port/V2_PROGRAM_ROADMAP.md` + refreshed handoff

**Reviewer:** Anthropic/Claude Code (Windows) · 2026-08-14
**Reviewed at:** `develop` tip `5836d81` (PR #23 was already merged when this review ran; findings are written so they can ride the first implementation PR — no dedicated planning PR needed)
**Read against:** EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md · PORT_MASTER_PLAN_v4.0.md (§20 phases, §22 gates, §23) · port/DECISIONS.md (all 13 decisions) · port/RUBRICS.md (full) · port/V2_FULL_SWEEP_2026-08-13.md · port/v2/README.md · port/v2/DEVIATIONS.md · ART_DIRECTION.md (v2 overlay) · AUDIO.md (v2 overlay §0) · AUDIO_LICENSES.md context · PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md

---

## Verdict

**APPROVE — proceed to coding.** The program map is sound, internally disciplined, honest about
completion state, and consistent with every authority I checked. It also *corrects two things my
own sweep got less right* (noted below), which is exactly what a second-agent pass is for. I found
**one internal contradiction, one ambiguity worth settling now, and a handful of small gaps and
wording nits** — none blocks starting **F1a**, and all can be folded into the F1a PR's normal
same-batch doc refresh instead of another planning cycle.

---

## Answers to the eight review questions

### 1. Does every approved Arc 0–10 have correct scope, dependency, and exit condition? — YES, with two clarifications (R1, R2)

Verified arc-by-arc against the contract's §13 table, master plan §20/§22, and RUBRICS. Scope,
dependencies, and exit evidence are present and correctly stated for F1a/F1b/F2, Arc 0, 1A/1B/1C,
F3/F4, and Arcs 2–10. Specific spot-checks that passed:

- Arc 5's lower-parent 50% `fed` inheritance = DECISIONS.md §1 and §9 exactly.
- Arc 7's `legacy` voice fallback-only + soft-saturation-after-listening = DECISIONS.md §3–4 exactly.
- Arc 4.5 / 5.5 human gates match the contract's §13/§13.1 non-substitutable [HUMAN] rows.
- §8 Gate ledger matches master plan §22 and RUBRICS row-for-row, including Gate C's real-save
  blocker and Gate B's "F4 alone cannot close it" (economy parity stays EXEC-TODO).
- Visual lanes map correctly onto master Phases 5/6 (living rigs; 43-biome universe production).

### 2. Missing or improperly deferred deviations / continuity / handoff items? — Mostly covered; four small gaps (R3–R5, R9)

- `D-TRAIN-1`, `D-CFB-1`, `D-IMPORT-1` all exist in DEVIATIONS (lines 1251/1256/1261) and their
  §4.4 placement rules are faithful. The "remaining open deltas" row covers D-9e, D-LOC, D-ST,
  D-HAZE, D-NOTIF-T.
- **I accept the map's amendment of my sweep's DOM-10.** "Inventory semantic call sites, don't
  mechanically grow `DOMAINS` to eleven" is the better rule — the sweep's wording presumed a 1:1
  site-to-domain mapping that nothing guarantees. Same for moving F2 ahead: also accepted (see Q3).
- Gaps: see R3 (main.ts split unplaced), R4 (species-chunk import sequencing missing from Arc 1A),
  R5 (Training-framework prep only implied), R9 (three one-line items worth naming).

### 3. Is the order sound (F1 → F2 → Arc 0 → Arc 1A/B/C → F3/F4 → Arc 2+)? — YES

F2-before-Arc-1A is a **defensible improvement over my sweep's order**: it closes the live
forged-coordinate gate bypass (a progression-integrity hole players can hit today) before UX/memory
work, and neither package depends on the other. F3 before F4 is right (the tab lease F4's clock
needs is F3 work). Arc 2+ correctly waits for all four foundations. The one sequencing risk is R1:
as drawn, the spine lets a *product decision* (CFB) stall the Compendium memory fix — see below.

### 4. Does anything incorrectly claim a Gate, feature, art system, or audio system is complete? — NO

Checked every current-state assertion:

- §1.2's slice description matches port/v2/README.md's boundary exactly.
- §5.8 "v2 currently has stings only" matches AUDIO.md §0.1's truth boundary verbatim.
- §6.3 correctly says the Platinum static set is *frozen for delivery* while explicitly refusing to
  call it all-catalogue certification or Gate E/F evidence — matching README's "Literal completion
  still means a new clean 1,250-row collection" and the reviews' UNREVIEWED/CURRENT-ONLY seals.
- §4.1 correctly scopes what existing smoke does and doesn't prove; F1a exit keeps Gate C [HUMAN]
  open pending the real veteran save (RUBRICS' ⛔ row).
- The Gate ledger claims contributors and closure *requirements* only — no gate is asserted closed.

### 5. Are premium graphics and audio real production tracks with human gates? — YES

§6 and §7 are genuine lanes with placement, required proof, and [HUMAN] Gate E/F/G evidence that
matches RUBRICS and master Phases 5/6/7 — not trailing polish. The audio budgets in §5.8 are the
real AUDIO.md §0.6 numbers (20–28/28–40/40–56/56–72, 8 creature emitters, 120 nodes) with the
correct "distinct scopes" caveat. One wording nit: R6 (add the unit).

### 6. Are the no-go rules correct? — YES, all six named areas

1. Canonical ingress (#1) matches the sweep's SCN-3 finding and the F2 hard no-go.
2. CAS/receipts (#2) matches D-STORE/D-RECEIPT and the contract's §10.
3. Clock/RNG (#3) matches D-AUTOEXTRACT-CLOCK, D-CLOCK, and DECISIONS §10; the Reduced-Motion
   clause correctly separates visual policy from progression time.
4. bfcache (#6) matches PROCESS_LAWS' pagehide law ("a browser-cache restore must not revive a
   destroyed app") and the current code-owned replacement-transaction design; §4.6's version is
   consistent with it.
5. Guide truth (#4) matches PROCESS_LAWS' developer-markdown law and closes my sweep's UI-G1 cliff
   (sign-off binds the exact body/capability revision — good).
6. Resource ownership (#5, #7, #9) matches the freshness/empty-surface/no-retry instrument laws.

I looked for a missing no-go and found none: determinism/share-code identity is covered by §2.2's
projection-separation law; publication boundaries by #10.

### 7. Is the agent-branch sync wording accurate? — YES

The handoff's "Other side" paragraph (ROADMAP.md:101–107) states exactly what the implemented
workflow does: strictly-behind **remote** branches fast-forward after a `develop` push; a divergent
branch with unmerged work is deliberately skipped and follows the manual clean-worktree merge;
local clones still perform the ordinary pull. That matches `.github/workflows/sync-agent-branches.yml`
as shipped (ancestor check via `merge-base --is-ancestor`, plain non-force push, never `main`) and
its first live firing, which brought all four agent branches to develop's tip.

### 8. Contradictions, missing dependencies, scope creep, unclear ownership — the findings register below

No scope creep found — the map adds no product surface beyond the approved contract. One internal
contradiction (R1), one ambiguity (R2), the rest are small.

---

## Findings register (all correctable in the F1a batch's doc refresh)

**R1 · MEDIUM · internal contradiction — §3 spine vs §4.4 placement rules.**
`port/V2_PROGRAM_ROADMAP.md:113–117` draws Arc 0 as a serial gate before Arc 1A, but §4.4's own
placement rules (lines 225–230) gate `D-CFB-1` on "companions, combat, or audio identity" and
`D-IMPORT-1` on "import becomes a broad player promise" — i.e., *later* arcs. As drawn, a stalled
[DECISION] item (CFB parent preservation is Nick's call) could block the Compendium memory fix,
which DEVIATIONS records as a release prerequisite. **Correction:** add one sentence to §4.4: the
spine is the primary path; each Arc 0 item's own placement rule controls what it blocks, and items
whose rule targets a later arc must not mechanically block Arc 1A/1B/1C.

**R2 · MEDIUM · ambiguity — complete Charter writers bundled into Arc 9A.**
`port/V2_PROGRAM_ROADMAP.md:541–543` puts "complete Charter writers/rewards/accepted chains/
weeklies" in Arc 9A, while the systems those goals reference (mining, fabrication, capture,
conquest, breeding) land in Arcs 3–6. Read literally, chapters stay landfall-only through most of
the playable game. **Correction:** state explicitly that each content arc enables *its own system's*
Charter goals in the same arc (the natural reading of the contract's "port complete outcome writers
and only then expose their goals"), with 9A as the closure/audit of chains, weeklies, rewards, and
endings — or, if landfall-only-until-9A is intended, say so as a player-visible consequence.

**R3 · LOW-MED · missing placement — the `main.ts` monolith split (sweep MAIN-1).**
The app core is 3,800+ lines and every content arc adds panels to it; master plan §4.8 ("do not
recreate the monolith") is the map's own inherited law, but the split has no named home.
**Correction:** add a structural item beside no-go #5's panel policy: "split `main.ts` into owned
modules before Arc 2 UI expansion."

**R4 · LOW · missing Arc 1A bullet — species-chunk import sequencing (sweep ART-1).**
`hdart.verbatim.js:4758` mutates `document.body` and installs listeners at module load, so *when*
the lazy art chunk loads is app-shell business. My sweep's Arc 1A scope included "species-chunk
import sequenced by the app shell"; §4.5 dropped it. **Correction:** restore that bullet.

**R5 · LOW · under-specified — Training-framework prep.**
F1b's "similarly isolated UI contract work" is the only hook for the sweep's UI-T1..T3 (element-
identity allow-scope, typed event bus) — but those become load-bearing when Arc 2/3 add lessons
pointing at dynamic controls. **Correction:** name "capability-gated lesson framework + selector-
evaluated allow-scope, before the first new-system lessons" in §9.2 or F1b.

**R6 · LOW · wording — audio budget units.**
`port/V2_PROGRAM_ROADMAP.md:510–513` lists "20–28 low/mobile…" without a unit; AUDIO.md:127 defines
them as **full-mix active-voice targets**. Add the two words so nobody reads them as megabytes.

**R7 · LOW · wording — "300/440px detail art" in §4.5's exit.**
The live Compendium detail card mounts the 440px portrait; 300px is the unlabeled *art-review*
surface from the reset workflow, not a Compendium tier. Reword to "132px list art and 440px detail
art" (or explicitly name 300px as review-packet evidence) so the [HUMAN] gate reviews real surfaces.

**R8 · INFO · handoff PR-state now historical.**
ROADMAP.md:79–99's five fields describe draft PR #23 as pending review; it merged shortly after.
Correct at write time — the next batch's handoff refresh covers it. No action beyond the normal
hygiene rule.

**R9 · INFO · three one-line additions to §4.4's "remaining open deltas" row.**
(a) `lastAnomKey`/`frontierEnding` are the only imported strings with zero validation (sweep PER-5;
verbatim-parity, so hardening is a recorded-deviation decision, not a silent edit); (b) the
combatcore⇄strays circular package dependency (sweep DOM-5) should be recorded before bundling
gets stricter; (c) `worldRoster`'s `slice(0, 8)` cap needs an owner before Arc 4 capture reads the
full roster.

---

## Two review notes in the other direction (things the map got *more* right than my sweep)

1. **F2 before Arc 1A.** The sweep ordered UX/memory first; the map closes the live gate bypass
   first. The map's order is better and I withdraw the sweep's on this point.
2. **DOM-10 amendment.** Semantic call-site inventory beats mechanically completing `DOMAINS` to
   eleven. The F4 wording should be treated as the authoritative version.

## Recommended path from here

1. Treat this review's R1–R9 as a small doc-refresh commit **inside the F1a PR** (the map is a
   refreshed-in-place reference; no dedicated planning PR needed).
2. Start **F1a exactly as scoped in §4.1** — it is correctly bounded, its exclusions are right, and
   its exit evidence matches the sweep's PER-1/PER-2/PER-4/PER-6 findings.
3. Keep the map's own instruction: F1a only; nothing else starts merely because it has a place in
   the program now.
