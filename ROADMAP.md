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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 ATTEMPT 2 RED · CROSS-HOST RULER REPAIRED LOCALLY ◀◀◀

### Fresh-session start

- Read `GITHUB_ACTIONS_BUDGET.md`, this handoff, `PROCESS_LAWS.md`,
  `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions. Either OpenAI/Codex or
  Anthropic/Claude can resume from repository state; use only that agent's owned worktree.
- Existing open, non-draft PR #32 is `openai/mac` → `develop`; remote head
  `e9b04d5d515ce09363971f912603720f820de7f1`, base
  `38447019517147319bd08c598202d097ee866874`. It is mergeable but correctly blocked by terminal-red
  battery run `32441023665`. The `actions-budget-approved` label is absent. Do not merge it.
- Certified product source remains `9d5247f0d6e7c36015d465cef0961a460d1a27d3`; descendants through
  `e9b04d5…` changed workflow/policy/docs only. The current local descendant changes the numeric
  budget, its focused tests, audit evidence, and current Markdown only. Recheck local HEAD/status.
- Nick lifted **`FROZEN`** on 2026-08-20. The repository is public and standard hosted runners are
  free while it remains public; 3,000 applies fail-closed if visibility/billing changes. Both exact
  PR #32 attempts are consumed and red. No future attempt is authorized.

### Exact terminal evidence and diagnosis

- Authorized run `32441023665`, attempt 1, tested exact head/base once with a 92 runner-minute owner
  ceiling and no retry. It completed in 33m43s. Root validate, Smoke, Field Training capture,
  10-viewport layout, v2 parity/type/art/coverage, exact Edge install, and browser/instrument
  selftests passed. The battery stopped at Compendium; later browser gates correctly did not run.
- Complete report `a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36`
  produced 78 outcomes: 75 pass, three fail, none blocked, complete lifecycle. Phone warm aggregate
  range was 97,320 B against 65,536 B, entirely non-monotonic embedder-heap variance with stable
  resource bytes. Linux native PNG encoding retained one 220,530 B portrait against 196,608 B on
  phone and desktop. Every other cache/job/lease/worker/decoded/encoded/DOM/absolute-heap/
  answerability field passed. Exact authority and raw values are preserved in
  `audits/PR32_LINUX_MEMORY_EVIDENCE_2026-08-21.md`; the exact raw report is retained as deterministic
  gzip `audits/PR32_LINUX_MEMORY_REPORT_32441023665.json.gz` (`a3b67e70…` compressed).
- The run matched fixture, working-tree digest, measurement
  `23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92`, collector
  `0c7ec3ba5b41f7ee0766c6986a27e75b3c22c00009419fbf540d4de280d6315b`, producer
  `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`, and exact Edge `.86` used
  by macOS candidate27/28/29. This is cross-host ruler portability evidence, not a product leak.
- Earlier run `32440536261` remains consumed/red before browser work on the now-repaired Markdown
  mode parser. Run `32420327368` remains older no-verdict history. None may be rerun or reused.

### Local bounded repair and evidence

- Budget `e3a71c8ae96e98b73c6957efe722f0222394c77bc8acb5d6fd93c0c761ca8f68` raises exactly
  phone warm range and phone/desktop retained-portrait encoding to 262,144 B. Every other ceiling,
  the three candidates, paired baseline, measurement, collector, producer, browser, attempt policy,
  and HUMAN boundary remain unchanged.
- Replaying the exact Linux raw report against the repaired budget yields 78/78. Three independent
  just-below controls reproduce only `phone/warm-plateau`, `phone/byte-ceiling`, and
  `desktop/byte-ceiling`. Baseline11's 393,140 B phone warm range and 20,693,680 / 55,868,080 B
  portrait totals still breach; the inventory remains four sealed faults and 14 phone / 13 desktop
  ceiling breaches.
- Focused budget test `0793772dbe9f679c2f3df954ed7ed5b78edf332057ce8b94a75f0a884fd2cd05`
  passes 14/14 and verifies the committed raw gzip/SHA/authorities, original 75/3 result, production
  replay, and three isolated negative controls. `npm run compendiummem:selftest` passes 222 controls;
  all 445 v2 tests pass with one intentional skip; root/app/worker typechecks pass; Actions policy
  passes 64 fail-closed controls; root validate passes boot/render and 50/50 determinism.
- Exact `9d5247f…` previously passed the complete local battery, including exact Edge Compendium
  78/78/six PNGs, Smoke, Glass, personas, root layout 787/787, and nonpublishable preview. That is
  prior local evidence, not authority to overwrite either hosted red.

### Next bounded sequence

1. Confirm the current repair is committed with a clean worktree, record its exact HEAD, and stop
   before push.
2. A new changed-head `test-battery` requires Nick's fresh exact head/base authorization. Never rerun
   `32441023665`; remove the label after any separately authorized attempt.
3. Merge PR #32 only if that exact changed head is terminal-green and still clean/mergeable.
4. Do not start Arc 1B, release, deployment, version bump, publication, `main`, or site work before
   PR #32 merges. HUMAN review remains open for the six Compendium images.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns `openai/mac`. Remote head `e9b04d5…` is terminal red on
run `32441023665`. The current local cross-host budget/evidence/docs repair commit descends from it
and remains unpushed; record its exact HEAD and verify clean status.

**GitHub step:** None until Nick authorizes one fresh changed-head attempt. Do not push, apply
`actions-budget-approved`, dispatch, rerun, merge, or publish before then.

**PR details:** existing open, non-draft PR #32; base `develop`; source `openai/mac`; title
**Arc 1A — Bound Compendium portraits and measured resources**. Its title/description need no
change. Remote exact head `e9b04d5…` is red; local repair is not on GitHub.

**Other side:** Anthropic/Claude Code need not be opened now. It may synchronize only through
`origin/develop` after an authorized PR merge, from its own clean branch.

**Release status:** `develop`, `main`, live site, and development site are unchanged. No release,
version bump, deployment, or publication was performed or authorized.

**Actions budget:** `UNFROZEN`; public/standard runners free while visibility holds; 3,000 remains
the fail-closed private/ambiguous cap. Consumed attempts: `32440536261` and `32441023665`, both red;
authorized future attempts: zero; approval label: absent.
