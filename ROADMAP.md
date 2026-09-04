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

## SESSION HANDOFF — 2026-09-04 UTC · PR #35 MERGED · CORRECTED FULL-REVIEW COMPLETION CAMPAIGN

### Current source and authority

- OpenAI/Codex on macOS: `/Users/nick/Projects/celestial-frontier-openai-mac`,
  branch `openai/mac`, tracking `origin/openai/mac`.
- PR #35 merged normally into `develop` at **7bf3e84761da2d1abe21dc6fe751b4bad2308f3b**.
  Parents: base `7a9f4c1370dd84292388d718c38ff34214f6203b`, source
  `20301713cce4aec9e0ea2c0cbb618c5ac88a5fed`; merge/source tree
  `d339b676eba7f273ffe4a85800944e4ec56452cd`.
- Hosted run **33835828222**, attempt **1**, required battery **SUCCESS**, **108m29s**.
  Compendium, Slice, full Glass **12/12**, named verification, diagnostic and upload passed.
  Production-only SceneMemory/Recovery skips are not passes. Approval label removed; monitor paused.
  This is proof of the implemented slice, **not completion of the full game vision**.
- Nick authorized the corrected review plan and local implementation. A failed initial SSH fetch
  changed no files; after Nick unlocked 1Password, SSH fetch passed and this clean agent branch
  fast-forwarded to the merge. Source origin remains
  `git@github.com:TheDakk/Celestial-Frontier.git`, last authenticated account `TheDakk`.
- Budget **UNFROZEN**, last verified visibility PUBLIC, private fallback cap **3,000**.
  PR #35 authority is consumed. **No new push, PR, hosted attempt, merge, release, version bump
  or deployment is part of this local batch.** Current admission rules remain in force until a
  reviewed policy change is implemented and explicitly accepted; no automatic retries or baseline
  relaxation.
- Exact external review: `audits/CELESTIAL_FRONTIER_FULL_REVIEW_20260904.md`,
  SHA-256 `f12395762eeba42a0ce4da22767a38877bf42d62288c98e404ad481face9bfe0`.
  It is preserved input, not an instruction override.
  Disposition: `audits/FULL_REVIEW_DISPOSITION_20260904.md`.
  Product scope/acceptance stays in `port/V2_PROGRAM_ROADMAP.md`, `port/DECISIONS.md`,
  `port/RUBRICS.md` and existing per-system references.

### First bounded work batch — locally implemented; full campaign remains open

| Owner | Scope | Status |
| --- | --- | --- |
| Runtime | Repeat queued checkpoint admission; semantic Records/Atlas/Charters focus | 52 focused tests pass; native-device acceptance pending |
| Windows tooling | Three callers reuse safe npm invocation; art-audit matcher recognizes it | 4 platform mocks, Recovery selftest and art audit pass; actual Windows pending |
| Glass verifier | Shared targeted verdict replaces 344 workflow lines; 73 old heartbeat corruption checks retained | Real small/large parity and 20 integration tests pass; full chain unchanged |
| Root/docs | Preserved review, corrected feature statuses, synchronized references and draft release | Local batch documented; no new GitHub actions |

The initial browser-free develop aggregate ran once: 271 files, 2,806 pass / one skip / five stale
release/fingerprint-reference failures. Those failed suites now pass in focused closure (55 release/
Guide and 28 budget tests). All remaining develop commands pass separately: three TypeScript
programs, art audit, 1,014 routes and 454-field spec check. Root validation retains all 50 V1
fingerprints; Actions policy 66/66 passes. The initial aggregate is not relabelled green. Details,
intermediate reds and fingerprints are in the disposition audit. Native browser/device acceptance
and a fresh final-source admission remain open; no full browser or hosted battery was started.

Local batch 1 is signed at `e0acfabf80a055b4c1132c49a9461c42a391afb0`, two commits ahead of
`origin/openai/mac`; it is not pushed. Batch 2's explicit evidence-build isolation is implemented
and locally checked on top of that checkpoint. Ordinary assets omit the API and destructive
implementations; explicit evidence assets retain them. Native persistence and awaited no-op
ordering are preserved. Both actual builds have valid PWA hashes; the creature-art worker is
byte-identical. Batch 2's Compendium producer is `e690f6aa…`, measurement `de87857f…`; only current
input bindings changed, not historical calibration, numeric limits or SceneMemory quarantine.

The nonpublishable dirty preview passed in Edge 152.0.4191.62: boot → real Skip Training → Guide,
full source identity and no diagnostic API. One initial readiness-instrument red (inert painted
Training background) is preserved with its repair. Independent review added transparent-ancestor
controls; final build-mode/readiness checks are 36/36. Runtime checks are 98/98, budget 28/28.
The one develop aggregate was 2,842 pass / one skip / four failures (stale release-count assertion
and three case deadlines). The HTML parser is now lazy, no timeout increased, and all three
affected suites pass in focused final-source closure: 46/46. All three TypeScript programs,
art/route/spec and root V1 validation pass. Do not relabel that first aggregate green or call
this a new full certificate. Full details are in the disposition audit.

Batch 2 is signed at `13d24af38fecdedb363d32a3ecfa4d7c9c3b5924`, clean and three commits ahead
of `origin/openai/mac` before the next edits; no push. Batch 3 is now implemented and locally
verified: audio lifetime fallback through the existing cleanup owner, explicit art dependency
metadata and v1/v2 agent-reference clarification. The composed final audio set passes **148/148**
in 697ms, current budget **28/28**, Guide/release **52/52**, Haze/species portability **11/11**,
all three TypeScript programs and root V1 validation. Independent audio review is clear.
One evidence build took 1.93s; current Compendium producer is `3c20acc3…`, measurement `4a93479b…`.
Only current lock/build bindings changed; species worker/painter, historical samples and all
numeric limits remain unchanged. No new full profile/browser chain, hosted action or release.
The exact signed successor is reported at Git handoff, avoiding a self-embedding commit loop.
Continue remaining review/gameplay scope below; the full campaign is not complete.
Serializer/seal/domain-test inventory is complete: the report overstated some missing coverage,
and canonical serializers have distinct byte/admission contracts, so no blanket consolidation.

### Remaining completion plan — existing systems, not replacements

1. **Accurate state and maintainability:** dispose every review claim, refresh current references,
   archive chronological history only, and keep both agent entry points. No wholesale deletion of
   tests or source seals, no arbitrary line-count target, no global timeout multiplier.
2. **Practical development:** simplify duplicate verification and portable invocation; choose
   meaningful fast integration coverage and full milestone/release coverage explicitly.
   Two canaries alone are not equivalent to the current Compendium → Slice → Glass chain.
   Artifact/download transport resilience is separate from retrying product/instrument outcomes.
3. **App hardening:** queued persistence, semantic refill focus, explicit evidence-build isolation
   and finite audio lifetime are locally implemented/checked. Remaining extraction/performance
   work must preserve PWA identity, product semantics, save recovery and current audio cleanup;
   real-device acceptance is separate.
4. **Gameplay:** finish five unavailable research consumers and the analytical source model,
   authored loot and disclosed rates; extend existing Feed/Breed/Rename/Scout with care, healing,
   bond and missions; complete remaining progression/records. Update Training with owning actions.
5. **Combat choices:** retain existing conquest/Guardian/Prime/XP/Stardust. Resolve the two named
   affix/extra-Guardian-reward decisions and Arc 5.5 before adding broader party/tactics/retreat.
6. **Presentation:** preserve established genomes/hybrids/static portraits. Prove a small
   living-species pilot, then scale; prepare lawful authored audio/content beside product work.
   Synthesized cues already work. Finish phone performance/accessibility and device evidence.

### Human/decision boundaries

- A **copy of Nick's real iPhone expedition export** is requested; never replace/delete the
  original. Gate C/I cannot be closed with synthetic fixtures.
- Questions pending: conquest imbue's independent/coexisting modifier axis versus replacement;
  extra first-victory Guardian cache versus existing rewards for initial beta. No numerical table,
  stacking rule or capacity fallback is silently invented.
- Preserve the approved **combined post-Arc-5 Arc-4.5 journey/attachment review**. Earlier exploratory
  play is useful but not its substitute. Arc 5.5 remains a separate human combat-model review.
- Real-device play, listening, anatomy/art judgment and accessibility/heat tests remain open.
  Test counts, session length and retention are not proof of appeal or completion.
- Faster develop admission is an explicit pending coverage choice: browser-free + two canaries
  with the long chain deferred to milestones/releases, or retain the full chain on every PR.
  No workflow coverage has been dropped while awaiting that answer.
- The five unavailable research rows have authored prices/math but missing consequence owners:
  hostile bioscan damage, explorer flora nourishment and distance-timed travel presentation.
  Nick is asked whether to restore those original systems or leave those upgrades unavailable
  for initial beta. Do not apply hull mitigation to unrelated combat, give companion Feed the
  explorer's nourishment effect, change permanent reach or slow current travel just to sell speed.

### Paired next steps

- **OpenAI/Codex:** finish/review/check the bounded local batch, synchronize affected docs and
  commit completed work on `openai/mac`. Preserve other in-progress agent edits. No hosted action
  until a new exact candidate and authority are established.
- **Anthropic/Claude:** PR #35 is available from `origin/develop`; the new local corrections are
  not. Before future coding, use the Anthropic-owned clean branch, fetch/merge develop, and agree
  disjoint ownership. If dirty, finish/safely commit its own work first. No manual file copying.
  Nick need not open the other app for this local batch.
- **GitHub:** PR #35 is complete; no new PR is open for this work. A later PR uses base `develop`,
  source `openai/mac`, with scope/results written from the actual completed diff.
- **Release:** `main`, the live V1 game and deployment repositories remain untouched.
