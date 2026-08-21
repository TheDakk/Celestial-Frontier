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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 ACTIVE COMPENDIUM RULER ◀◀◀

### Fresh-session start

- Read `GITHUB_ACTIONS_BUDGET.md`, this handoff, `PROCESS_LAWS.md`,
  `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions. Either OpenAI/Codex or
  Anthropic/Claude can resume from repository state; use only that agent's owned worktree.
- Activation commit `b3957e1dd5a9dc0784e6854efbdb2905fd5b8915` is on `openai/mac`.
  `origin/openai/mac` remains `731b2e2ab974252b410ba97dbdbe3ec6d3ee9c20`; the branch was clean
  and ahead 4 before this synchronized documentation batch. Recheck local status; do not poll GitHub.
- Actions remain **`FROZEN`**. The repository is public and standard hosted runners are free while
  it remains public, but Nick's efficiency/intent gate forbids push, label, dispatch, rerun, merge,
  sync, or publication. The 3,000 cap applies fail-closed if visibility/billing changes.

### Preserved evidence boundary

- Existing open, non-draft PR #32 is `openai/mac` → `develop`
  `38447019517147319bd08c598202d097ee866874`; do not update or merge it while frozen.
- Run `32420327368`, attempt 1, remains historical no-verdict evidence. Root/static/Chrome Smoke/
  Chrome Glass passed, while Compendium job `96590728191` hit its 40-minute ceiling RUNNING and
  lifecycle-pending with zero terminal profiles/outcomes. It is neither a product verdict nor retry
  authority; its spending annotation does not override current public billing.
- Static-server repair `aecf3865095176a509a4cb892e5842b584780870` retains one immutable
  monotonic 2,000 ms close boundary. Just-before succeeds; exact/late/missing/error callbacks force
  `closeAllConnections()` once and reject. Cleanup red suppresses PASS/sample.

### Active recalibrated ruler

- Clean committed source `6736ef40f029d71053f1041869afdbf53a8bfb09` collected serial c27,
  baseline11, c28, c29, each once with zero retries and a fresh exact Edge `.86` materialization.
  All three candidates completed 78/78 with complete lifecycle and 18 total PNG bindings;
  baseline11 retained all four faults and breached 14 phone / 13 desktop ceilings.
- Frozen report/sample/log SHA-256 carriers:
  - c27 `0925cf68…` / `a67c6dc5…` / `5022ee90…`;
  - baseline11 `868893d7…` / `3f80a4d6…` / `0aa3a507…`;
  - c28 `c0599e97…` / `a83b4414…` / `c67a69be…`;
  - c29 `372f5da3…` / `b797958b…` / `8540f63d…`.
- Activation `b3957e1…` embeds 3/3 candidates and measured 1/1 baseline under active budget
  `546d3a817073e42910b496895734ae2a01bb4c633af2780ecde1b1ef6570b292` and focused test
  `ef06252af072d59b85351c05671b762f5d3fa259656e20bc87b22e84ba510b55`.
  Measurement `23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92`, collector
  `0c7ec3ba5b41f7ee0766c6986a27e75b3c22c00009419fbf540d4de280d6315b`, selftest
  `0bbb35417182ddfd5465206c2dd5f9f75537c67fec3053e8d8e79935db32b15b`, and producer
  `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900` are unchanged.
  Every previous numeric ceiling remains strict above the new candidate maxima. This activates the
  browser-free ruler; it is not exact-head certification, hosted CI, HUMAN judgment, or Gate closure.

### Next bounded sequence

1. Finish/review and commit this synchronized documentation batch locally; no browser or hosted run.
2. From that clean exact head, run the required complete local battery once in protocol order. First
   red, ambiguity, authority mismatch, or cleanup failure stops; do not retry unchanged evidence.
3. HUMAN review remains open for the six fresh phone/desktop list/detail/focus images.
4. A hosted attempt exists only if Nick explicitly lifts `FROZEN` and authorizes that exact head.
   PR #32 must close terminal-green before Arc 1B/gameplay resumes. No release, deployment, version
   bump, or `main` work is authorized.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns `openai/mac`. Activation `b3957e1…` is committed locally;
this synchronized docs batch remains working-copy changes. Nothing is pushed.

**GitHub step:** None. Do not push, apply `actions-budget-approved`, dispatch, rerun, merge, or
publish while `FROZEN`.

**PR details:** existing open, non-draft PR #32; base `develop`; source `openai/mac`; title
**Arc 1A — Bound Compendium portraits and measured resources**. Its remote head does not contain
the four local commits; no PR write is authorized.

**Other side:** Anthropic/Claude Code need not be opened now. It does not have the local commits and
may synchronize only through `origin/develop` after an authorized PR merge, from its own clean branch.

**Release status:** `develop`, `main`, and both sites are unchanged. No release, version bump,
deployment, or publication was performed or authorized.

**Actions budget:** `FROZEN`; public/standard runners free while visibility holds; 3,000 remains
the fail-closed private-repository cap. Authorized hosted attempts: zero.
