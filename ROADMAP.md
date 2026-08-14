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

## ▶▶▶ SESSION HANDOFF — 2026-08-14 · F1A CANDIDATE LOCALLY GREEN; EXACT-HEAD PROOF NEXT ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve current Git/PR/check/publication status live. Historical handoff/CI IDs are context, not
  an assertion about the current tip. Never copy files manually between agent worktrees.

### Current integration state

- Planning PR #23 merged into `develop` at `5836d817fc8279b5f6520a1e9f9899a4367d43ec`.
  The remote agent-branch sync put `origin/openai/mac` at the same commit; this local worktree then
  fetched and fast-forwarded normally before editing. Remote auto-sync does not replace the local
  fetch/pull step.
- Claude's R1–R9 roadmap review is accepted and integrated. The two attached HD-audio proposals are
  accepted with explicit lineage and information-disclosure constraints recorded below.
- This branch now contains the bounded F1a save-integrity implementation and synchronized docs. It
  has not been merged into `develop`; resolve the draft PR and exact check state live.

### What changed in F1a

- `SaveRepository.recover` proves the exact backup through the supported-envelope classifier before
  any primary replacement. Invalid/future backup bytes cannot destroy the invalid primary; a
  supported backup still recovers, and future primaries still never roll back.
- Reset clears the canonical complete `STORES` list, so future split stores cannot be silently
  omitted. Every supported fixture family now has a direct `exportSaveV2` → boot-envelope contract.
- The browser smoke persists future/corrupt recovery backups in real IndexedDB and checks the exact
  primary after reload, not just the notice.
- Claude's roadmap refinements now clarify Arc 0 row-level blockers, Charter co-delivery, the
  pre-Arc-2 `main.ts` split, app-shell species imports, capability-gated Training, full-mix audio
  voice units, 132/440 Compendium tiers, and named PER-5/DOM-5/MAIN-3 work.
- HD audio direction now includes canonical surfaced-lead/roster distant calls, event-owned companion
  expression without mutable voice identity, same-granularity accessible cues, cross-modal biome
  drift controls, and the honest rule that an ordered parent-seed tuple alone does not preserve both
  parents' complete audible phenotype.
- Both supplied review inputs are preserved byte-for-byte with SHA-256 provenance under
  `audits/v2-program-review-2026-08-14/`; future sessions do not need the Downloads copies.
- The program now has an explicit recurring balance/optimization/code-health rail: measure real
  outcomes, audit complete consumers, prove removals, and keep unrelated cleanup out of risky fixes.

### Verification and controls

- Test-first old behavior: focused recovery/reset suite failed **2/36**; the missing-export-key
  control failed all **9** new fixture contracts; browser overwrite control failed by name for both
  future and corrupt backups. Every temporary defect was restored before certification.
- Local candidate diagnostics: `npm test` **296 passed /1 skipped**; `npm run typecheck` passed root
  + app configs; one full `npm run smoke` passed the complete browser loop with zero console errors.
  These runs are not clean exact-head certification; commit and rerun before promoting `[EXEC]`.
- Gate C is not declared closed. Real veteran/current-device import/readback and original-source
  preservation remain [HUMAN]. F3 still owns revisions/CAS, split stores, receipts, tab lease and
  migration authority.

### Next action

1. Commit/push this bounded candidate and open a **draft** PR from `openai/mac` into `develop`.
2. Claude reviews the exact draft diff, especially recovery classification ownership, reset growth,
   exporter/classifier coupling, and the roadmap/audio wording. Do not start another batch inside
   the same PR.
3. After terminal-green checks and review resolution, the standing authority permits a normal merge
   of that exact head and monitoring of the resulting `develop` battery/development publication.
4. The next implementation PR scopes F1b's independent guardrails; if an item cannot stay narrow,
   move it to its natural owner. F2 remains the next critical exploit/provenance closure before any
   world-bound ownership or reward writer.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`. F1a save-integrity code, executable controls,
Claude roadmap refinements and approved HD-audio direction are locally diagnostic-green and ready
for the first candidate commit; exact-head evidence remains pending.

**GitHub step:** push `openai/mac`, create a draft PR into `develop`, and review its exact head. Do
not mark it Ready or merge it while any required check or review concern is unresolved.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Draft PR: pending push/creation
- Copy-ready title: `Harden v2 save recovery and record approved HD audio direction`
- Copy-ready description: `Implements bounded F1a save integrity: classify exact recovery bytes
  before primary replacement, clear the canonical store list on reset, and directly prove every
  supported exporter fixture satisfies the next-boot envelope. Adds unit and real-browser persisted-
  byte controls for invalid/future backups and records deliberate pre-fix failures. Integrates
  Claude's R1–R9 program-roadmap review plus approved distant-ecology and companion-expression HD-
  audio direction, with the parent-lineage representation caveat. Updates SAVE_SYSTEM, the codebase
  reference, v2 README/deviation ledger, draft release notes, RUBRICS, DECISIONS, AUDIO, and the live
  handoff, and preserves the two external review inputs under audits. Explicitly excludes F3 CAS/multi-
  tab/receipts/migrations, F2 navigation work, later arcs, production versioning, deployment, and
  develop-to-main release work.`

**Other side:** Anthropic/Claude Code should review the draft PR's exact diff after its URL is
available; do not copy files manually. Nick does not need to open Claude until the draft is created.
After a normal merge, the remote sync workflow fast-forwards a strictly-behind agent branch;
Claude's clean local worktree still fetches and performs the ordinary trivial pull before work.

**Release status:** no release, deployment, version bump, `develop` → `main` merge, or manual site
write is part of this batch.
