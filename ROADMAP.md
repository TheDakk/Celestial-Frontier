# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## ▶▶▶ SESSION HANDOFF — 2026-09-03 UTC · A922 FORENSIC RISKS CLOSED LOCALLY · CLEAN-SOURCE LOCAL EVIDENCE GREEN · HOSTED AUTHORITY ABSENT ◀◀◀

### Exact current boundary

- **Owner/worktree:** OpenAI/Codex on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, tracking
  **origin/openai/mac**. `develop` remains
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- Exact pushed head remains **a922c4b74502fc4093ca103d46a189396cad1e8f**. Exact local
  browser-tested implementation checkpoint is
  **f348b249c69fcbecc25cf7a8dd54bd9feb09cab5**, parent `a922c4b…`, tree
  `5f9bae1466f84366e3801832738d76148be9d159`. The current local head is its signed
  documentation/evidence-only descendant; branch state is clean and **ahead 2**. Preserve every
  byte; do not rebase, amend, reset, overwrite or copy it to another worktree. Both local commit
  objects contain SSH signatures; local identity verification is unavailable because this clone
  has no `gpg.ssh.allowedSignersFile`, so do not overstate that fact as signer-identity proof.
- Nick authorized implementing the attached a922 forensic recommendations locally. This does
  **not** authorize a push, label, workflow dispatch, retry, PR mutation, merge, release, version
  bump, publication or deployment. PR #35 remains Ready/open/unmerged; `actions-budget-approved`
  is absent.
- External input: `/Users/nick/Downloads/PR35_a922c4b_forensic_review.md`, 20,310 bytes, SHA-256
  `30dda62c165748eae0fa9dd2c76e06739efde3f6de32a5c0fa406d06c1303264`. Current audit:
  `audits/PR35_A922_FORENSIC_PREVENTION_REPAIR_20260903.md`.

### Forensic disposition

- Accepted: the 90-minute outer job and 40-minute Compendium step had unsafe observed margin; the
  changed-input diagnostic reached only `small-phone`; and a generic Shipyard keyboard helper
  retained one Summary object across an ordinary DOM-replacing F4 heartbeat.
- Corrected: retained timing places full Glass start at approximately **74m09s**, not minute 77,
  so 90 minutes was unsafe rather than mathematically impossible. Compendium's **39m14s** run left
  46 seconds of margin, but the review did not prove one named commit caused the historical
  increase. The new caps are orchestration margin, not rebaselines or product evidence.
- Corrected: `EngineeringPanelController` already captured disclosure/focus identity and restored
  the live replacement after rerender. No duplicate product focus repair was added. The stale
  Slice/Glass observer is repaired instead.
- Deliberately retained: mandatory artifact upload remains hard-fail. The existing deterministic
  step-summary projection retains terminal diagnosis through service failure but cannot soften
  Glass, replace named verification, advance Recovery or make the job green.

### Bounded implementation

- Workflow topology remains exactly one **2-minute authorization** job plus one battery job. The
  battery cap is now **120 minutes** and Compendium's independent step cap **55 minutes**;
  `tools/actions-budget-policy.js` seals both. No matrix, shard, fanout, soft-fail or retry exists.
- The existing changed-input Glass step remains capped at **five minutes** and runs two targeted
  rows sequentially on one unchanged committed source: `small-phone` Inventory first, then
  `large-phone` Capture/Shipyard. Each owns a distinct immutable ID/report; any red stops the step.
  It remains noncertifying and cannot replace the unconditional exact-Slice-bound 12-row Glass.
- `main.ts` returns one exact `cf-v2-f4-heartbeat-cycle-receipt/v1` from every lawful heartbeat
  exit, with current document token, completed/skipped/failed cycle, typed reason and exact
  Shipyard/Compendium/Capture refresh disposition. Unexpected exceptions still reject.
- Slice and Glass re-query the one current Shipyard `mining` Summary at event time. The forced
  `large-phone` path requires old-node disconnection, current semantic replacement/focus, a
  completed/null-reason receipt with `refresh.shipyard=completed`, trusted current-target Enter and
  the expected disclosure toggle.
- The forced Shipyard collector quiesces and settles the ambient timer before it establishes the
  deliberate-cycle baseline, so an ordinary five-second heartbeat cannot contaminate lineage.
  Coherent zero/duplicate setup targets retain exact null facts and remain product-red; malformed
  or contradictory empty carriers remain instrument-red.
- Current Glass PASS schema is `cf-v2-glassmatrix/v2`. Historical v1 non-PASS evidence remains
  readable; v1 full or targeted PASS is refused by Glass, Recovery, diagnostics and persona.
  Shared and hosted verifiers independently replay exact setup/initial/after/receipt descriptors,
  document/connection/focus/replacement facts, 44px geometry, exact display/visibility,
  target-plus-ancestor opacity/filter transparency and assessment-key maps. They do not trust
  stored all-true booleans.
- Negative controls cover stale/disconnected identity, skipped/forged heartbeat receipts, blank
  names, malformed display, `visibility:collapse`, direct/ancestor opacity including
  `filter:opacity(0)`, descriptor drift, product-red toggle and v1 PASS downgrade. A product-red
  activation is recorded before waiting for its toggle so it cannot become an instrument timeout.

### Verification at this checkpoint

- Focused suite: **8/8 files, 73/73 tests**.
- The first consolidated profile stopped only at its fail-closed current-producer assertion after
  the intentional `main.ts` evidence change. Recomputed authority updated source identity alone:
  Compendium measurement remains
  `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`, current producer is
  `ad74e459e00a12c516fc7fbfc17122cb53faa14ef89bdbe5d4e6776d658cb907`, and the fixed ruler,
  numeric ceilings, 78 outcomes and historical samples are unchanged. Focused authority coverage
  then passed **32/32**.
- All three TypeScript programs pass.
- Glass report, Arc 4 Recovery and persona selftests pass.
- Actions policy passes **66/66** fail-closed controls; independent workflow/policy review is
  **CLEAR**.
- Consolidated browser-free `develop` profile passes **268/268 files, 2,785 passed / 1 skipped**,
  all three TypeScript programs, art audit, override audit and specification audit. Independent
  carrier review and producer-reference audit are **CLEAR**.
- Clean committed `f348b249…` passed browser preflight under Edge `152.0.4191.53`, CDP `1.3`,
  capability contract
  `35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341`.
- Compendium run `20260903163424801-81698-61f9306500` passed **78/78** in **70,593 ms**, with
  zero blocked outcomes/findings, exact start/end source identity, report SHA-256
  `8dcaf50316fa93f50f34bb7c2047890606931937de47f4f0b8c9e00386a48491`, and a green named
  verifier.
- Nine separately immutable, noncertifying Glass diagnostics passed once/no-retry on the same
  source: `large-phone`, `phone-landscape`, both tablets, `laptop-720p`, `desktop`,
  `desktop-1080p`, `ultrawide`, and `desktop-8k`. Every row has zero product findings and zero
  instrument failures. Their exact IDs, durations and SHA-256 digests are preserved in
  `audits/PR35_A922_FORENSIC_PREVENTION_REPAIR_20260903.md`.
- This is local diagnostic closure, **not** a full Slice-bound 12-row Glass certificate and not a
  hosted result.

### Exact remaining sequence

1. No implementation, focused check, local Compendium run or requested targeted Glass row remains
   in this forensic batch. The final browser-free profile is green on the signed documentation
   descendant; `caffeinate` is stopped at handoff.
2. Do **not** push or run Actions. A future hosted attempt needs a new exact workflow/head/base,
   `actions-budget-approved`, maximum **122 total runner-minutes** (2 authorization + 120 battery),
   no-retry authorization. Merge PR #35 only if that exact attempt is terminal green.

### Paired Git/Claude handoff

- **OpenAI/Codex:** local work is complete and clean on the signed evidence descendant, two commits
  ahead of `origin/openai/mac`. No GitHub write is authorized.
- **PR #35:** base **develop**, source **openai/mac**.
  - **Title:** `feat(v2): complete roadmap campaign and harden action-time CI evidence`
  - **Description:** “Completes the established v2 roadmap campaign without recreating gameplay
    systems; preserves all fifteen immutable stops; right-sizes the single battery/Compendium
    orchestration envelope; exercises small/large changed-input diagnostics early; binds Capture
    and Shipyard keyboard evidence to structured F4 receipts and current semantic controls; makes
    Glass v2 PASS consumers independently replay deep evidence; retains mandatory hard-fail
    artifact upload; adds no retry, browser pin, job, shard or gameplay redesign; and records the
    complete local successor evidence.”
- **Anthropic/Claude Code:** do not open/synchronize yet. These local bytes are not in `develop`.
  After a future terminal-green exact PR #35 run and merge, Claude/Fable may start the requested
  whole-plan polish review from a clean `anthropic/*` branch based on `origin/develop`.
- **Release:** `develop`, `main` and the live site are unchanged. No release/deploy occurred.
- **Actions:** mode **UNFROZEN**, repository public while verified, private fallback cap **3,000**,
  and zero currently authorized hosted attempts.

## PRESERVED PREDECESSOR HANDOFF — 2026-09-03 UTC · RUN 15 NATIVE-TAB RED CLOSED LOCALLY · DIAGNOSTIC RETENTION HARDENED · HOSTED AUTHORITY ABSENT

The predecessor sequence below is historical and is superseded by the current handoff above.

### Exact current boundary

- **Verified owner:** OpenAI/Codex on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, tracking
  **origin/openai/mac**.
- Exact pushed and hosted-tested head is
  **d529a9727c29fca3cd9f337a5bb4fc2577ceaec3**, tree
  **65927bf068b2bfa01f91c51dbce614d41ba6f254**, against unchanged `develop`
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- The signed local descendant containing this handoff adds only the bounded Glass
  native-focus/evidence-retention repair, deterministic controls and synchronized references; its
  own hash is intentionally not self-embedded. Preserve every current byte and do not rebase,
  overwrite or copy it to another worktree.
- PR #35 remains Ready/open/unmerged. `actions-budget-approved` is absent and `develop` is
  unchanged. The run-15 authority is consumed. No push, label, dispatch, retry, PR mutation, merge,
  release, version bump, publication or deployment is currently authorized.

### Fifteenth exact hosted attempt — consumed Glass red plus independent artifact outage

- Nick's one-time `test-battery` authority for exact head **d529a97…** against base
  **7a9f4c1…**, 92-minute maximum and no retry, produced run **33708487067**, job
  **100502739510**, attempt 1. Synthetic merge
  **ca4abf67ec6eb030642ea925b02f641a2873d88c** has base then head as parents and the same tree as
  the exact head.
- Authorization, legacy browser-free checks, v2 static/art/launcher checks, early changed-input
  small-phone Glass, root Layout **787/787** plus verification, Compendium **78/78** plus
  verification, and exact-bound Slice plus verification all passed. SceneMemory correctly skipped
  as production-only/quarantined. Compendium used about **39m14s**, Slice about **24m32s**, and the
  job used about **82m45s** total.
- Full Glass consumed exact Slice report SHA-256
  `fc488de105b3951ad8b3d6ca1a0dfe7a803e91f8a71241ff873e8123d0457cb3` and reached viewport
  four, `large-phone`. After about **5m45s**, it stopped once/no-retry with exactly one
  `ARC4_CAPTURE_NATIVE_SURVEY_RETURN`; only `idleKeyboardFocus` was false. Every earlier
  viewport and every other recorded clause was green.
- The later mandatory artifact upload independently found 27 files but failed `CreateArtifact`
  with `ETIMEDOUT`; zero artifact was created. The aggregate job log preserved the terminal
  finding, but the complete Glass JSON is unrecoverable. This outage did not cause or alter the
  earlier Glass exit.
- The label was removed, PR #35 did not merge, and the exact authorization is consumed.

### Causal diagnosis and bounded successor

- The old native-Tab helper retained exact Scavenge/Sample DOM object references across setup,
  a possible five-second Capture authority rerender, CDP Tab and final focus assessment. A healthy
  rerender replaces those objects while preserving their semantic controls, so comparing the
  current active replacement to the disconnected old Sample could report `idleKeyboardFocus:false`.
  The missing full report prevents absolute reconstruction, but the source defect and exact
  failure signature make this an instrument/harness stop for repair governance. The cumulative
  fifteen-stop ledger is **11 instrument/infrastructure, 3 product/runtime and 1 mixed**.
- Glass now records the first trusted same-document Tab regardless of its origin, then reacquires
  current controls by `data-capture-action` and `data-semantic-key`. Trusted delivery remains
  instrument evidence; wrong origin, missing current controls, stale semantic lineage, lost focus,
  unsettled scroll or invisible paint are product evidence.
- The exact failing `large-phone` row forces one real F4 quiesce → resume → manual heartbeat
  between setup and native Tab. It proves both old controls disconnected, both semantic
  replacements were acquired, Scavenge focus was restored, and native Tab moved focus to Sample.
  A deterministic lost-restoration mutation stays instrument-green and product-red.
- Visible focus now requires nontransparent painted decoration; a zero-alpha outline with otherwise
  unchanged paint is product-red. Geometry and scroll remain collected from the current live node
  across stable frames.
- Glass emits one concise START and PASS/product-red/instrument-red timing line per viewport.
  Immediately after Glass, one browser-free projection validates the exact immutable report,
  source, profile, Slice predecessor, browser/timing/red shape and terminal status, then places a
  deterministic gzip/base64 carrier plus bounded first diagnosis in `GITHUB_STEP_SUMMARY`.
  Product findings must belong to the completed timing prefix; instrument diagnoses must be
  nonempty strings; exact source/summary keys and both isolated/cumulative summary bytes are capped
  at 900,000. This does not soften Glass, its named verifier, Recovery ordering or mandatory
  artifact upload, and it adds no browser, viewport, retry, timeout or job.

### Verification and preserved scope

- Exact audit:
  `audits/ARC4_GLASS_PR35_NATIVE_TAB_IDENTITY_AND_DIAGNOSTIC_RETENTION_REPAIR_20260903_D529A97.md`.
- The final native-focus reviewer and diagnostic-projection reviewer are both **CLEAR**. Focused
  combined coverage passes **24/24**; the diagnostic/evidence-chain subset passes **12/12**;
  Glass selftest, TypeScript, syntax, diff and Actions policy **64/64** all pass.
- Targeted local Edge/CDP diagnostic
  `20260903043639066-7926-2f4122517015` passed `large-phone` in **11,037 ms** with **3/3**
  Arc 4 outcomes, zero findings and zero instrument failures. Its raw evidence proves old
  Scavenge/Sample nodes disconnected, replacements acquired, restored Scavenge focus, a trusted
  Tab from current Scavenge and visible focus on current Sample. It is noncertifying.
- The consolidated browser-free `develop` profile passes **266/266 files, 2,758 passed / 1
  skipped**, all three TypeScript programs, **34** art sources with zero findings,
  **1,014/1,014** live route keys with zero dead, **1,010/1,010** species, and **454** declared
  fields with zero unread or inert.
- Compendium measurement/producer authority remains
  `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da` /
  `c216cdc9e8d62800699bc592949726a197f3d8cb6613d1a35086ecd69a1d8cae`;
  the fixed ruler, numeric ceilings and 78-outcome inventory are unchanged.
- Capture mechanics, pools, odds, SessionRNG, Yield, ecology, ownership, rewards, creatures/genomes,
  plants, biomes, Guardians, world generation, loot, graphics, audio, saves and card structure are
  unchanged. No player-visible release note, Gate/HUMAN closure or production identity change is
  warranted.

### Exact next sequence

1. Preserve the signed local checkpoint; do not run another local or hosted browser battery.
2. A future hosted attempt requires Nick's new exact workflow/head/base/minutes/no-retry
   authorization. Only that exact future head may be pushed, labelled and dispatched.
3. Merge PR #35 into `develop` only if that one exact attempt is terminal green.

### Paired Git/Claude handoff

- **Current side — OpenAI/Codex:** the signed local descendant on `openai/mac` contains the
  run-15 repair, retention fallback, controls, audit and synchronized docs. Nothing in this batch
  is pushed or merged.
- **GitHub step:** none. Do not apply `actions-budget-approved` or mutate PR #35 without a new
  exact authorization.
- **PR #35:** base **develop**, source **openai/mac**.
  - **Title:** `feat(v2): complete roadmap campaign and harden action-time CI evidence`
  - **Description:** “Completes the established v2 roadmap campaign without recreating gameplay
    systems; preserves all fifteen immutable PR #35 stops; makes native Tab evidence follow current
    semantic controls through a real Capture heartbeat replacement; distinguishes transport from
    product focus/paint outcomes; preserves exact terminal diagnosis through artifact-service
    outages; adds no retry, timeout, browser pin, viewport or gameplay system; and passes the
    consolidated local successor checks.”
  Refresh PR metadata only inside a newly authorized GitHub-write sequence.
- **Other side — Anthropic/Claude Code:** the new bytes are not in `develop`, so do not copy or
  synchronize them. Nick does not need to open Claude yet. After PR #35 is terminal green and
  merged, Claude/Fable may begin the requested full polish review from a clean `anthropic/*`
  branch synchronized from `origin/develop`.
- **Release status:** `develop`, `main` and the live site are unchanged; no release or deployment
  occurred.
- **Actions budget:** mode **UNFROZEN**, public-repository assumption while verified, private
  fallback cap **3,000**, and **zero** currently authorized hosted attempts.
