# Claude review response — openai/mac `0426ef4d` + staged September 17 batch

Reviewer: Claude (anthropic lane), 2026-09-17. Read-only review of the Codex worktree
`/Users/nick/Projects/celestial-frontier-openai-mac` at HEAD `0426ef4db5dc55205925725b9579ca61d960cd42`
on `openai/mac`, including the **staged, uncommitted** implementation (signing blocked by 1Password).
Requested by Nick; input report `audits/ANATOMY_COMPLETION_20260917/CLAUDE_REVIEW_REPORT.md`.
No edits to either lane, no pull/merge/sync, no GitHub writes, no tests run, no media generated.
PR42 remains parked. No PR, deployment or promotion requested.

Two passes are recorded verbatim: **Pass 1** (defect/coverage register against the report) and
**Pass 2** (re-weighted against the product vision, with the code that Pass 1 had not read line by
line). Pass 2 supersedes Pass 1 where they differ (see §2.1).

---

## Pass 1 — consolidated register

### 0. Input integrity (verified, no drift)
- Worktree branch `openai/mac`, HEAD `0426ef4d`. 1,280 index entries, zero unstaged changes, one untracked `.DS_Store`.
- `CLAUDE_REVIEW_INPUTS.json`: **1,271 / 1,275 SHA-256 match** the working files; the 4 mismatches are exactly the declared post-snapshot pointer edits (ROADMAP.md, ANATOMY_COMPLETION_20260917/README.md, FAUNA_FULL_PASS_20260916/REVIEW_PROMPT.md, LONG_SESSION_20260913/LOG.md). Staged set = manifest + the 4 review-only docs. Scope retained as requested.
- Signing: `gpg.format=ssh`, `gpg.ssh.program=…/1Password…/op-ssh-sign`, `commit.gpgsign=true`. "agent returned an error" is a locked/unapproved 1Password SSH agent, not a repo defect. Codex retries `git commit -S` after Nick unlocks/approves.
- Rendered evidence inspected via montages / 3× crops of the crab and flora stills and ffmpeg frames from the WebMs.

### 1. Verdicts by area (Pass 1)
| Area | Verdict |
|---|---|
| Code correctness | PASS with 2 medium behavioural regressions (A1, A2) + lows |
| Source observation | PASS for 12; 46 of 58 have no observation |
| Art / views | OPEN — crabBody gape unreadable (B2); hidden surfaces unaddressed |
| Fitting | 5 crabs source-stage OK; 3 flora FAIL (chunk rigs) |
| Visual motion | FAIL flora (even idle sway tears); crabs incomplete (rigid stationary set, floating scuttle) |
| Combat integration | NOT STARTED — no runtime consumer |
| Audio (compiler/rights) | PASS except F1 (see Pass 2 downgrade); listening not assessed — Nick's |
| Performance | FAIL flora desktop (up to 127 ms per clip); crabs desktop OK |
| Physical phone | NONE for any of the 5 + 3 + 58 |
| Admission | Compendium producer certificate still red (I5) — blocks any hosted attempt |

### 2. Register

#### A — Code defects
| ID | Sev | Location | Observed vs expected | Failing control | Bounded shared repair | Acceptance proof |
|---|---|---|---|---|---|---|
| A1 | **Med** | `port/v2/apps/game/src/motion/specialized-actions.ts:12-13, 22` | `pose()` now zeroes every `legs` joint for all non-approach actions on **all 13** specialized templates, not just brachyuran. `dodge` still translates root −0.08 (line 22) → feet slide (`crab-native-02/dodge-50.png`); `faint`/`hit` are body-only. | None — `source-pincer.test.ts` asserts fixed feet only for `melee:pinch` (root 0), tautological given legs=0. | Scope leg-zeroing to zero-travel actions; give `dodge` anchored root (or drive body over planted feet). | Outcome test: sample `dodge`, assert world-space `leg*Foot` unchanged while root moves; stills. |
| A2 | **Med** | `family-actions.ts:104-106` | Root keys (`-0.01`, `0.004`, `0.30/-0.030/-0.050` grow rise) deleted from disturb/harvest/grow for **both** `plant-woody` and `plant-herb` (the already-reviewed 3-branch library) to satisfy the new native root-drift gate; not recorded as a library change. Roots for authored fits are already pinned by `splitObservedSurfaces(fixedJoints:['root'])`. | None. | Restore keys (pinned root absorbs; express rise as trunk) or record as a deliberate 169-action amendment + fixture hash. | Family-library count/hash fixture; CREATURE_ANIMATION.md grow-reveal line. |
| A3 | Low | `tools/creature-animation/split-observed-surfaces.mjs:254` | Receipt prints `excludedOverlaps:0` when `preservePaintBoundaries` welded them (cranberry-05: 13 excluded → cranberry-06: 0 reported, 13 welded). | none | Report both counts. | Test on receipt. |
| A4 | Low | `body-card.ts:193` | Genome-skin fallback now off for any `earthName` record; Earth records lacking `materials.surface` throw. Intentional, but the full suite was not rerun and the 1,010-render census never compiles cards. | — | — | Run current full suite (or a census mode compiling cards for the 53 emitters). |
| A5 | Low | `source-pincer.test.ts:5`; `flora-observed.test.ts:11` | Pincer test reads superseded `crab-masks-04` (no `projection`; recipeHash ≠ masks-05/fits-02). Landmarks are byte-identical today (verified), but nothing pins that; neither test checks `recipeHash`. Tests depend on `audits/` bytes slated for pruning/LFS. | none | Point at `crab-fits-02`, assert expected `recipeHash` constants (or copy fixtures under `test/fixtures`). | Test fails on fixture path/hash change. |
| A6 | Low | `packages/art/src/speciesoverrides.ts:825-840` | Labels come from the 2nd (capture) render; validated only against primary alpha + geometry JSON. Capture-render RGBA is never compared with primary RGBA — the hazard crab-masks-01 recorded (1,634 changed channels) could shift edge ownership silently. | none | `changed===0` between capture ink and primary ink inside `resolveOverrideCanvas`. | Negative control: perturb `lineWidth` on the proxied context → refuse. |
| A7 | Low | `painter-prefix-replay.ts:28` | Pre-recording context state (fillStyle/lineWidth/lineCap/globalAlpha) not captured, only transform; caught only if final RGBA differs. Document as a stated limit. | — | — | — |

#### B — Missing anatomy / art / views
| ID | Sev | Location | Finding | Repair | Proof |
|---|---|---|---|---|---|
| B1 | **High** (coverage) | `coverage-final.json` | 53/58 unbound; 46 unobserved (annelid 9, bivalve 6, gastropod 12, crustacean-small 12, clawed 3, barnacle, larva, sponge). **Fiddler Crab** has its own painter `faunaFiddler` (`faunaoverrides.ts:3756`) outside `crabBody`/`resetCrabII`, so it got no mask staging. | Stage `startTopologyPartCapture` in `faunaFiddler` (one painter). | Parts census → 6 rows. |
| B2 | **Med** | `invertoverrides.ts:2626-2629` (crabBody) | Crab & Coconut Crab paint the pincer as a near-closed loop (fixed tip `(0.64,−0.10)cw`, dactyl `(0.62,−0.02)cw`) → source-relative closure is a few degrees; `melee:pinch` 25/50/75 are indistinguishable from idle at 3×. Mud/Freshwater/Vent (`resetCrabII`) show a clear open→closed V. Solver correct; source art gives no strike. | Art decision (Nick): accept subtle pinch, or authorize a painted open gape (kit change — not authorized here). | Nick's eye on 3× crops. |
| B3 | Med | `faunaoverrides4.ts` (Pyrosome `zooid0..189`), `fungioverrides2.ts` (Tardigrade `fold*`), isopod `tergite*` | Surface marks are emitted with `kind:'body'` — indistinguishable by schema from structural outlines; only the id string says otherwise. | Add `kind:'mark'` (or `structural:false`) to `DrawnFeature`. | Test: structural count Pyrosome = 1 tube. |
| B4 | Low | — | Hidden crab joints, horseshoe legs, flora reverse/hidden paint, leaf/fruit articulation — open by their own statement. | — | — |

#### C/D — Incomplete fits and visual failures
| ID | Sev | Evidence | Finding | Repair | Proof |
|---|---|---|---|---|---|
| C1 | **High** | `persimmon-native-03/disturb-25.png` (155 ms), `harvest-75.png`; `devils-club-native-01/disturb-25.png`; `cranberry-native-02/disturb-25.png` (tears) → `cranberry-native-03/disturb-25.png` (smears) | Each "branch group" is a 5–6-vertex polygon covering a whole limb + canopy sector (`family-review/flora/persimmon.json`), and the woody clip amplitude (disturb `sway(-14)`: base 14°, tip 21°, leaf 28°, leaves ±30) was authored for the stylized 3-branch template and is not scaled by bone length/depth. On a photoreal master that shears whole canopy chunks; welding boundaries converts tears into smears. | (a) amplitude falloff by branch/trunk length ratio and depth; (b) twig-level groups; (c) foliage as secondary only. → Pass 2 S2. | Stills 25/50/75 with no straight cut edges or smear at 2×; seam oracle unchanged; p95 ≤ 2 ms. |
| D1 | **High** | `persimmon-native-03/family-10s.webm` @0.5 s (sway) | The **idle** sway loop already shows a straight tear at the top-right canopy. | as C1 | as C1 |
| C2 | Med | `crab-native-02/approach-scuttle-75.png` | Scuttle = same sine on Root/Knee/Foot at fixed body height: near legs lift far above the ground line and cross the carapace; no contact model. → Pass 2 S3. | Planted-foot gait (alternating tetrapod). | Foot-contact outcome test + stills. |
| C3 | Low | crab-native-02 stills | Stationary set is body-only: `faint` does not collapse, `hit` has no recoil, idle/alert/tame/feed differ from rest by claw closure only. | — | — |

#### E — Combat integration
| ID | Sev | Finding | Repair | Proof |
|---|---|---|---|---|
| E1 | **High** (gap) | No runtime consumer: brachyuran `melee:pinch`, `source-pincers` projection and plant actions exist only in the study/timeline; battle2 (Claude lane) has no brachyuran/plant intake, no damage/effect/audio timing, no target contact, no cancellation. → Pass 2 S4 (data-level blockers). | Integration ticket for the anthropic lane after merge. | duelxp-style outcome test: a crab pinch lands and pays. |
| E2 | Med | Crab/plant records carry only the presentation realm profile; no arena/habitat placement study for either. | — | Habitat study rerun on these fits. |

#### F — Audio (compiler/rights only)
| ID | Sev | Location | Finding | Repair | Proof |
|---|---|---|---|---|---|
| F1 | Low (was Med; see Pass 2) | `audio-production/manifests/acquisition.json` vs `RECORDING_CREDITS.md:252, :434` | Two CC-BY-4.0 media disagree between manifest `creator` and credits: `"Lucy Milan Neuhaus"` vs `"Luca Milan Neuhaus"` (iNat 190197357); `"呂一起(Lyu yi-chi)"` vs `"呂一起(Lu i-chi)"` (iNat 193679309). 61/63 match. | Rename manifest field to `creatorProfileName`; test that credits/lock use `attribution`. | Test green. |
| F2 | Info | manifests | 1,669 media: CC0 1,211 · PD 237 · NPS-PD 158 · CC-BY-4.0 63 · **0 NC/ND/SA** · 3 refused; all `listeningStatus:not_reviewed`, `integrationStatus:source_only`. | — | — |

#### G/H — Performance and phone
| ID | Sev | Evidence | Finding |
|---|---|---|---|
| G1 | **High** | `persimmon-native-02/report.json` rows | Per-clip rig p95: **disturb 127.3 ms, harvest 41.3 ms** — the table's "9.7 ms" is the capture aggregate and understates 13×. native-03: disturb 2.2; cranberry-03: disturb 4.4 / harvest 3.4; devils-club: 2.0 ×4. All at/above the 2 ms goal on desktop. Vertices after split 3.4–4.7 k vs crabs 1.3–2.6 k. Register per-clip p95, not the aggregate. |
| G2 | Info | crab `*-native-02` | 1.0–1.5 ms desktop; per-clip 0.3–0.4 accelerated. |
| H1 | **High** (gap) | — | No iPhone measurement for any of 5 crabs, 3 flora, 58 targets; Klein probing stopped. |

#### I — Evidence / instruments / docs
| ID | Sev | Finding | Repair |
|---|---|---|---|
| I1 | Low | New native plant root-drift gate has no negative control (no run shows a moving root fails); seam negative exists (8.8 / 12.54 px). | One deliberate root-key run → FAIL. |
| I2 | Low | Older flora stills carry the old title "physical attack library trial"; native-runner pins only `gsap-adapter.ts`, so a report cannot by itself prove which `native-entry.mjs` produced it. Confirm `native-entry.mjs` sha is in each report's `sources`. | — |
| I3 | Low | Staged reference docs contain run-together tokens ("after0426ef4d", "a1Password", "All58", "September17,2026", "has1,237nonblank") in README/ANATOMY_STATUS/CREATURE_ANIMATION/SPECIES_AND_GENOME/UI_TOOLCHAIN/codebase-reference; the same paragraph is pasted verbatim into three references. | One canonical paragraph + links; fix spacing. |
| I4 | Info | Manifest OK. Landmarks identical across masks-03/04/05/fits-02 for all 5 crabs. crab-masks-05 rows: 21–23 prefix reads, 0 different channels, parity 0, 26 parts. Label PNGs sane (shadow owned by root). |
| I5 | **Med** (admission) | `port/v2/tests/current-producer-authorities.test.ts:74`: sealed Compendium budget `producerAuthority` (index/owner/painter/worker/serviceWorker sha256 + relativePaths, 9 paths) ≠ current producer — the one red in 4,459. The `develop` boundary runs this certificate, so any hosted attempt stays red until a fresh **measured** certificate is produced on the exact committed source. Not repairable by editing the pin. |

---

## Pass 2 — vision-aligned re-review

Bar used: *AAA everywhere · one painted hand · procedural, not hand-authored per species · 2D parts-rig
over the master, smooth at 60 fps desktop / 30 fps phone budget (Motion Kit §5, line 171) · feet plant,
nothing hovers or slides (Motion Kit line 62) · iPhone first · FF-style battles in procedural arenas.*

Added coverage (read line by line): all of `apps/game/src/motion/*`, `creature-rig.ts`,
`creature-rig-performance.ts`, `creature-rig-contact.ts`, `motion-pose-blend.ts`, `anatomy-attacks.ts`,
`battle-habitat.ts`, `earth-fauna-profiles.ts` (crab rows), the solver core (`arap-skin`,
`orientation-projector`, `wasm-arap-sweep`, `compiled-skin-field`, `smooth-skin-weights`, `paint-skin`,
`build-paint-skin`, `part-masks`, `build-authored-parts`, `deformation-quality`, `skeleton-pose`,
`family-record`, `quadruped-template`, `repeated-anatomy`, `performance-probe`, `source-join-continuity`),
`family-contracts.mjs` (all 14 contracts summarised programmatically), the audio production/rights stack
(`produce.py`, `acquire.py`, `report.py`, `package-review.py`, `wildlife-by.py`, `animal-supplement.py`,
`review-probe.mjs`, `coverage-audit.mjs`, `audio-production-{plan,review,mix,routing,anatomy}.ts`), and
`asset-intake/{contracts,audio-export}.mjs`. Not read: the raw JSON body of `family-contracts.mjs`, the
~30 study-tool entry files, C5 test changes.

### 2.1 Changes versus Pass 1
| Item | Change | Why |
|---|---|---|
| **F1** | Medium → Low | `wildlife-by.py:55-56` stores `creator` = iNat *profile* display name at fetch time and `attribution` = the sound's own licence attribution string. `report.py:7-16` and `RECORDING_CREDITS.md` correctly print `attribution`; the in-game dialog uses the same. Credits are right; the manifest field is mislabelled metadata. |
| **E1** | High → program-level High | `grep` over `apps/game/src` (non-test, non-motion): **no production file imports** `loadCreatureRigV1`, `createCreatureRigPerformance`, `compileAnatomyAttack`, `compileHabitatBattle`, `createGsapPlayer`, `hitstopMs`/`HITSTOP`/`FLASH`/`DAMAGE_NUMBER`. Every consumer is under `tools/`. The whole rig/attack/habitat stack is study-only. |
| 30 fps phone | Withdrawn as a conflict | Motion Kit lines 171 / 239-241 (approved) set the 30 fps / 4 ms phone budget; "smooth" referred to tweening. Kept as a budget fact in S5. |
| Others | Stand | A1/A2 gain weight under the kit's "nothing hovers or slides" rule (S3). |

### 2.2 Systemic findings
| ID | Sev | Location | Finding | Bounded shared repair | Acceptance proof |
|---|---|---|---|---|---|
| **S1** | **High** | `creature-rig.ts:153-162` (`applyPose`), `creature-rig-performance.ts:46-50`, `paint-skin.mjs:49-53` | Per-frame pipeline is skeleton → compiled field → **ARAP solve** (4×4 symmetric GS + up to 64 orientation passes) → per-part `assertPaintPartShape` which **throws** on any folded triangle. Refusal is atomic (good) but there is **no runtime policy** for the caller: a thrown frame leaves the creature frozen at its last pose mid-battle. The kit only defines whole-portrait as a *load-time* fallback (line 259). | Define the frame-refusal policy in the performance owner: hold last pose + counted diagnostic, or degrade to the compiled-field pose without ARAP for that frame; never throw into battle. | Negative control: inject a fold at frame N → battle continues, counter increments, no exception reaches the scene. |
| **S2** | **High** | `family-actions.ts:285-291` (plant), `:99-111`, `specialized-actions.ts:8-14`; kit §4 line 106 "key poses in joint space relative to bone length" | Amplitudes are fixed degrees per template; nothing scales by bone length ratio, part pixel area or hierarchy depth. The kit intends bone-length-relative curves; the code is only *timing*-relative (mass → ms). Single root cause of C1 (canopy sectors sheared at 14–28°), C2 (identical sine on all crab leg joints), C3 (body-only stationary set). | One template-level amplitude profile derived from the record: `scale(joint) = f(boneLength/bodyLength, partArea)` applied in `buildTimeline` next to `projectionScales` (`timeline.ts:81`) — no per-species edit. | Persimmon disturb at 25/50/75 with no straight cut or smear at 2×; crab scuttle legs stay within carapace silhouette; 169-action library hash fixture updated once. |
| **S3** | **High** (kit violation) | `creature-rig-contact.ts:19-47` (quadruped-only, `GRAPH` hard-bound; consumers only in `tools/quadruped-proof`, `battle-facing`); `body-card.ts:212-227` computes `legSlack` "for the C2 planted-contact solver" that no runtime uses | Kit line 62: "Contact is honest: feet plant, weight shifts, nothing hovers or slides." A contact solver exists for **quadruped only** and is not wired into the performance owner or the native captures. All 13 family and 13 specialized templates slide or hover (`crab-native-02/approach-scuttle-75.png`, `dodge-50.png`). | Generalise `createQuadrupedContactSolver` to any template with a `legs` role (two-bone chains already generic in `kinematics`), pass it as the `resolve` hook of `createCreatureRigPerformance.update`. | Outcome test per template: world-space foot positions constant during stationary actions and during root travel; stills of scuttle/dodge. |
| **S4** | **High** | `earth-fauna-profiles.ts:79, :95` (`candidateTemplates: []`), `body-card.ts:176` (vocabulary lacks `pinch`), `anatomy-attacks.ts:14-47` (no brachyuran/specialized rows) | The pinch clip is **unreachable** by the game's own resolvers: a crab card compiles with `weapons: []`, `resolveActionId(card,'melee')` throws "no admitted brachyuran melee", `attackRepertoire` throws "species/template mismatch". The native diagnostic only reaches it by requesting `melee:pinch` by literal id. | Add `pinch:'claw'` (or a `pinch` Weapon) to the vocabulary; `candidateTemplates:['brachyuran']` for the five bound owners; one `ANATOMY_ATTACKS` row `row('brachyuran','pinch','claw','Pincer',['clawNearElbow','clawNearPalm','clawNearDactylRoot'],'clawNearDactylTip',['ground','water'])`. | `attackRepertoire(crabCard,'ground').status==='READY'` with `pinch`; `compileAnatomyAttack` contactMs at strike. |
| **S5** | Med | `timing.ts:13` (`FRAME_RATE.phone 30`), Motion Kit 239-241 "under 4 ms at 30 fps phone… two combatants + effect + three plates" | Flora rigs already miss on **desktop** (2.0–4.4 ms per clip; `persimmon-native-02` disturb 127.3); crabs at 1.0–1.5 ms desktop leave no headroom for two combatants on a phone CPU. Vertex counts: flora 3.4–4.7 k, crabs 1.3–2.6 k. | Budget per rig at intake: refuse/downsample a paint skin above ~2 k field vertices for the phone tier (levers: vertex count, `interiorStep`). | Phone probe on iPhone 17 Pro: two crab rigs + arena ≥ 30 fps. |

### 2.3 Additional code findings from the supplementary read
| ID | Sev | Location | Finding | Repair / proof |
|---|---|---|---|---|
| A8 | Low | `overlay.ts:115-158` vs `timeline.ts:67-117` | `buildActionTimeline` duplicates `buildTimeline` but omits `projectionScales` (added this batch); a pose-editor preview of a brachyuran pinch differs from the runtime recipe. The comment says "fold into buildTimeline when next touched" and it was touched. | Fold; contract test over every template incl. brachyuran. |
| A9 | Low | `creature-rig.ts:171-176` | `createCreatureRigPoseTarget.setJoint` calls `rig.applyPose` **per joint** — with the GSAP adapter's `push()` that is 44–62 full ARAP solves per frame. Unused by runtime today; exported footgun. | Batch (collect joints, apply once) or delete. |
| A10 | Low | `wasm-arap-sweep.mjs:24` / `arap-skin.mjs:62` | Wasm pass self-checks against the JS reference on one admission pose and falls back to JS on non-finite; `robustFallbacks` is a counter, not a refusal. A device silently on the JS path is slower, not wrong. | Report `sweepBackend`/`robustFallbacks` in the phone probe. |
| A11 | Low | `family-record.mjs:22` vs `prepare-flora.mjs:309` | Plant `trunk` remainder part declared with a `[[0,0],[.001,0],[0,.001]]` placeholder polygon; correct only because `cutAuthoredParts` routes unclaimed pixels to `remainderPart`. | Document or make the polygon optional for the remainder. |
| A12 | Info | `family-contracts.mjs` | Contracts mirror `family-templates.ts` exactly (joint counts 31/31/19/13/21/13/22/21/11/17/29/32/22/22); limits/bounds identical. |
| A13 | Info | `timeline.ts`, `timing.ts:50`, `audio-production-routing.ts:12-23`, `anatomy-attacks.ts:76` | Determinism holds: seeded idle period, injected clock in GSAP, FNV selection by settled counter, no `Date.now`/`Math.random` in the read set. |

Audio and intake mechanics — reviewed, no new defects: `acquire.py` host allow-list / redirect guard /
archive traversal checks; `produce.py` approved-ledger binding, headroom proof for v4 recordings, −1 dBTP
gate, portable RPP check; `report.py` refuses to rebuild if any approval exists; `chooseProductionAudio`
requires `approved` unless explicit audition; `mixProductionPreview` refuses >0.89 peak rather than
clamping; `audio-export.mjs` measures both source and Opus, decoded frame-count check, bitexact flags.
Sound-Kit voice derivation is currently a ±3 % rate nudge (`audio-production-plan.ts:63-64`) — thin,
but honestly labelled `synthetic_fictional`.

### 2.4 Re-weighted verdicts
| Area | Pass 1 | Pass 2 | Reason |
|---|---|---|---|
| Code correctness | PASS w/ 2 med | PASS w/ 2 med + S1 policy gap | Nothing crashes; the gap is what happens when a frame refuses in play |
| Motion architecture vs kit | — | **FAIL on §4 amplitude (S2) and "feet plant" (S3)** | Both template-layer, one fix each, shared by every family |
| Combat integration | NOT STARTED | NOT STARTED, and the crab path is closed by data (S4) | Three small edits open it |
| Flora fits | FAIL | FAIL — root cause S2, not the solver | Boundary welding treats the symptom |
| Crab fits | source-stage OK | source-stage OK; motion blocked by S2/S3 | |
| Audio rights | PASS except F1 | PASS (F1 → metadata label) | |
| Performance | FAIL flora | FAIL flora; crabs unproven for two-combatant phone budget (S5) | |
| Phone | NONE | NONE | |

### 2.5 Recommended order for Codex
1. **S2** amplitude profile in `buildTimeline` (unblocks C1/C2/C3 in one place; re-run the six native captures).
2. **S3** generalised contact solver as the `resolve` hook (kit rule).
3. **S4** three data edits (pinch reachable).
4. **S1** frame-refusal policy in the performance owner.
5. Pass 1 A1/A2/A5/A6, then B1 (Fiddler staging), I1, I3.
6. **S5** phone probe with the two-crab arena before any more flora work.

The vision needs one shared skin and one shared interpreter; everything above keeps that discipline —
none of it is a per-species edit or a kit change.

---

## Coordination
- **Nick** owns image/motion/listening acceptance; B2 (crab gape) and the S2 direction (amplitude scaling vs twig-level groups) are his calls.
- **OpenAI/Codex:** next step is a **plan only** (no code changes yet) reconciling this response into a bounded repair register — see `CODEX_PLANNING_PROMPT.md` beside this file.
- **Anthropic/Claude:** nothing to open; E1 runtime integration is queued for this lane after merge. No PR, no push; PR42 parked.
