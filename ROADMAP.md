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

## ▶▶▶ SESSION HANDOFF — 2026-08-21 · PR #32 MERGED · ARC 1A AUTOMATED CLOSURE GREEN ◀◀◀

### Fresh-session start

- Read `GITHUB_ACTIONS_BUDGET.md`, this handoff, `PROCESS_LAWS.md`,
  `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions. Either OpenAI/Codex or
  Anthropic/Claude can resume from repository state; use only that agent's owned worktree.
- PR #32 (`openai/mac` → `develop`) merged normally at
  `d4ab7e671959ab80198bed22bb600a26fc3524cc`; its parents are exact base
  `38447019517147319bd08c598202d097ee866874` and terminal-green head
  `c68aee241220dcb720cadb7fc55f7fbf99bde6fb`. `origin/develop` contains Arc 1A's automated closure.
- The local `openai/mac` worktree was fast-forwarded to `d4ab7e6…` before this documentation-only
  handoff commit. Recheck its exact local HEAD, clean status, and unpushed relationship before the
  next batch; do not infer authority to push the handoff or start hosted work.
- Nick lifted **`FROZEN`** on 2026-08-20. The repository is public and standard hosted runners are
  free while it remains public; 3,000 applies fail-closed if visibility/billing changes. The three
  post-freeze PR #32 closure attempts recorded here are consumed; the final one is green. No future
  attempt is authorized and the `actions-budget-approved` label is absent.

### Arc 1A terminal closure

- Authorized run [`32462323775`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/32462323775),
  attempt 1, tested exact head `c68aee2…` against base `3844701…` with a 2+90 runner-minute ceiling
  and no retry. Authorization passed in 2s and the battery passed in 40m39s. Every step was green:
  root validation, Smoke, Field Training capture, layout, v2 parity/type/art/coverage, exact Edge,
  Compendium certification/evidence verification, Chrome controls, real-browser Smoke, Glass,
  personas, preview packaging, and all artifact uploads.
- The label was removed immediately after terminal completion. PR #32 was then re-read as
  `MERGEABLE/CLEAN` at the exact head/base and merged normally; no additional battery ran.
- Exact budget `e3a71c8ae96e98b73c6957efe722f0222394c77bc8acb5d6fd93c0c761ca8f68`
  raises only phone warm range and phone/desktop retained-portrait encoding to 262,144 B. Test
  `0793772dbe9f679c2f3df954ed7ed5b78edf332057ce8b94a75f0a884fd2cd05` binds the committed raw
  Linux report, its authorities/original 75/3 result, production replay, and three isolated negative
  controls. Baseline11 retains four sealed faults and 14 phone / 13 desktop breaches.
- Arc 1A's automated resource/ownership boundary is integrated. It is not Gate closure: the six
  fresh phone/desktop Compendium list/detail/focus images still require HUMAN judgment.

### Preserved earlier diagnostics

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

### Next bounded sequence

1. Stop this batch after the post-merge documentation handoff; do not begin Arc 1B implementation
   implicitly.
2. The next implementation scope is **Arc 1B — Pixi/canvas scene texture/resource ownership plus a
   long-session memory plateau gate**, followed by Arc 1C ShipVisualState/static Shipyard/owned HD
   planet attachment. Re-read `port/V2_PROGRAM_ROADMAP.md`, `PROCESS_LAWS.md`, the owning references,
   and current source before proposing the bounded Arc 1B batch.
3. Keep the six-image Arc 1A HUMAN review open; automation and the merge do not supply visual judgment.
4. No release, deployment, version bump, publication, `main`, or site work is authorized.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns `openai/mac`. PR #32 head `c68aee2…` is merged into
`origin/develop` at `d4ab7e6…`. The current local documentation-only handoff commit descends from
that merge and remains unpushed; record its exact HEAD and verify clean status.

**GitHub step:** None. PR #32 is closed/merged and its label is absent. Any future push, label,
dispatch, or publication requires its own exact authority.

**PR details:** [PR #32](https://github.com/TheDakk/Celestial-Frontier/pull/32), base `develop`, source
`openai/mac`, title **Arc 1A — Bound Compendium portraits and measured resources**, is merged. No new
PR is needed for this handoff-only commit; Arc 1B will need a separately scoped PR later.

**Other side:** Anthropic/Claude Code need not be opened now. At its next clean coding batch it may
fetch and merge `origin/develop` (`d4ab7e6…`) into its own `anthropic/*` branch; never copy files.

**Release status:** `develop` advanced to `d4ab7e6…`; `main`, live site, and development site are
unchanged. No release, version bump, deployment, or publication was performed or authorized.

**Actions budget:** `UNFROZEN`; public/standard runners free while visibility holds; 3,000 remains
the fail-closed private/ambiguous cap. Consumed attempts: `32440536261` and `32441023665` red,
`32462323775` green; authorized future attempts: zero; approval label: absent.
