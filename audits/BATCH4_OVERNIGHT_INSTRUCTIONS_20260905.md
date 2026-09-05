# Nick’s overnight Batch 4 authority — 2026-09-05

Verbatim user-authorized instructions follow.

UNATTENDED OVERNIGHT BATCH — Nick will not be available. Do not stop to ask questions.
When something is ambiguous, choose the option that (a) matches existing v1.8.9 behaviour or an
existing authored table, (b) changes the least, and (c) is reversible; write the choice and its
reason into ROADMAP.md under "Decisions made unattended" and keep going. If a step genuinely
cannot proceed without a product decision Nick has reserved, skip that step, record why, and
continue with the next one. Never idle: when the primary list is done, work the stretch list.
Stop only when every list item is done, parked with a reason, or blocked with a reason.

Context (verified 2026-09-05): develop is 9ea0104. PRs #36/#38/#39/#40 are merged, PR #37 closed
as superseded. Your openai/mac is 84b6f22 on merge 2415723 (contains develop). Batch A's
audio-source preservation stays open on Nick's external destination choice — not in this batch.
Fresh-start boundary: v2 is a brand-new game for everyone; no legacy player-import door may
return; keep the v1.8.9 codec, the evidence-build importBlob seam, the 77-outcome bulletin and
Glass planned-ledger matching. Gate C means v2 persistence on a real device.

CHECKPOINT PROTOCOL (new): work on openai/review-batch4-gameplay-20260905. After EVERY completed
step below — and at least every ~2 hours of work — run the fast gates (typecheck, artunused,
vitest), commit with a message naming the step, and push the branch (a branch push triggers
nothing). Run the browser gates (slicesmoke develop profile, both phone Glass canaries) at each
step that touched apps/game/src and at the end. Never leave work uncommitted between steps;
never amend or rewrite a pushed commit; never git reset --hard, git clean, rebase or force-push;
never touch another agent's worktree, .github/workflows, tools/actions-budget-policy.js,
reference/artlock.json, samepairs.json or shapepairs.json. If a gate goes red and you cannot fix
it within the step, revert that step's product change in a new commit, record the red output in
the handoff, and continue with the next step.

1. Sync and branch. From a clean openai/mac, create openai/review-batch4-gameplay-20260905 from
   the current develop head. Bring over the parked gameplay in two layers, as real merges or
   cherry-picks of your own signed commits only (never rebase, never rewrite):
   (a) 5377069 "connect research and expedition progression" — the delivered Batch 4 core:
       six purchasable Research rows wired to their existing effects (Reinforced Hull → hostile
       Discover Life only; Xenobotany → safe Flora meal only; Fusion/Antimatter/Warp Fold →
       deterministic 2x/4x/8x travel presentation), explicit Discover Life on living Survey cards
       with one durable Survey/hazard receipt, Flora "Eat 1" with deterministic heal/poison
       (poison never kills), Scout +2 XP capped at 486 inside the capture receipt, read-only
       Chronicle & Museum in Records, and the analytical economy scenarios;
   (b) cf1b9a7 WIP park (Starter/weekly Charters, descent, Paragons, Atlas, creature progression)
       — bring over only what each later step completes; leave the rest parked and say exactly
       what stayed parked.
   Resolve every conflict against the fresh-start develop: the Settings import door, its tests,
   the 77-bullet oracles, GLASS_NEGATIVE_CONTROL_LEDGERS and the Compendium producer authority
   are develop's; your parked ROADMAP text that says "awaits Nick's real save export" is stale —
   drop it. The parked "78 unique ordered bullets" is also stale; the bulletin is 77.
   → Checkpoint 1: layer (a) green on all gates, pushed.

2. Primary list — the approved §4.10 gameplay order, each co-delivered with its Training lesson
   and Guide copy, each its own checkpoint:
   2a. the fully authored accepted st-scan Starter Charter;
   2b. deterministic landing/descent and canonical-address wave-offs;
   2c. the 50-Paragon hunt;
   2d. exact-instance creature progression;
   2e. the mature Atlas.
   Do NOT start companion care/bond/missions, random loot/affix/socket/vendor tables,
   achievement-reward quantities, conquest-imbue coexistence or the extra first-victory Guardian
   cache — those are Nick's explicit product decisions and must not be fabricated. Preserve the
   combined post-Arc-5 Arc 4.5 review and the separate Arc 5.5 combat gate.

3. Stretch list (new) — only after 2a–2e are done or parked, each its own checkpoint:
   3a. the two narrow P1-tests gaps from the review disposition: malformed/shallow-frozen mint
       registration and public-registry clone refusal, plus the three WorldConfig anchor/freeze
       assertions (focused tests only, no new suites);
   3b. the P1-lists deduplication where ownership is genuinely the same, keeping independently
       authored expectations that detect a missing producer field;
   3c. incremental main.ts extraction along existing owners (P2-main) for code you touched in
       step 2 only — no generic action coordinator, no blanket rewrite;
   3d. a first analytical pass at P2-phone: measure (do not change) allocation/navigation/cache/
       boot on the develop profile and record numbers in the handoff.

4. Laws for every line: determinism (no Math.random/Date.now in domains; SessionRNG for
   outcomes); one lease-fenced F3/F4 receipt/CAS per reward-bearing or destructive mutation,
   stale-tab safe; review every save consumer before replacing an immediate commit with a
   debounce and preserve travel durability; keep the eighteen Arc 4 namespaces and the v5
   partition topology; no new instrument code beyond focused tests for the product you add.

5. Release and Guide copy: add bullets to V2_DRAFT_RELEASE for player-visible outcomes and update
   the affected Guide topics. When the bullet count changes, update every pin together:
   V2_DRAFT_BULLET_COUNT and GUIDE_DRAFT_BULLET_AUTHORITY (count + sha256 of the rendered <li>
   array) in tools/slicesmoke.mjs; expectedBulletCount, the inventory?.bulletCount control and
   the "N-outcome development inventory" string in tools/glassmatrix.mjs; and the pins in
   tests/guide-release.test.ts, tests/evidence-chain-tools.test.ts and
   tests/slicesmoke-sixth-red-contract.test.ts (including its executableDeclaration constant).

6. Whenever a checkpoint changed port/v2/apps/game/src/main.ts, re-derive ONLY the Compendium
   producer authority after that checkpoint's final build: node tools/print-producer-authorities.mjs,
   copy compendium.producer into budgets/compendium-memory-v1.json producerAuthority, cite the
   previous and current producer in calibration.selectionRule, and update the pins in
   tests/compendium-budget.test.ts. Never change measurement authority, ruler, ceilings or samples.

7. Full gate set at the final head, each once: npm run typecheck; npm run artunused;
   npx vitest run; node tools/glassmatrix.mjs --selftest; node tools/slicesmoke.mjs
   --profile=develop; node tools/glassmatrix.mjs --viewport=small-phone then
   --viewport=large-phone; root node tools/validate.js (all 50 v1 fingerprints unchanged);
   node tools/actions-budget-policy.js --selftest (81 controls). Do not run artlock.

8. Docs in the same batch: PROGRESSION.md, QUESTS_AND_CHAPTERS.md,
   EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md, ECONOMY_LOOT_CRAFTING.md, the codebase reference,
   port/V2_PROGRAM_ROADMAP.md, port/v2/README.md and the DEVIATIONS overlay; ROADMAP.md gets a
   fresh handoff with the superseded one archived verbatim.

9. MORNING REPORT (new) — write it as the top of ROADMAP.md's handoff AND as
   audits/BATCH4_OVERNIGHT_REPORT_20260905.md on the branch, then push:
   - a checkpoint table: step, commit SHA, pushed time, fast/browser gate results with counts;
   - what from cf1b9a7 stayed parked, and why, per item;
   - "Decisions made unattended" with reasons;
   - "Blocked / reverted" with the exact red output;
   - the final head SHA, base develop SHA, and the proposed PR title/body.
   Do NOT open the PR, apply any label, or merge — Nick authorizes the one agent-lane attempt
   separately after Claude's morning review. Budget UNFROZEN, public, private fallback 3,000,
   zero hosted attempts authorized.
