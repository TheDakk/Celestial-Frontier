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

## SESSION HANDOFF — 2026-09-05 · PR #41 SYNC; AUDIOVISUAL BATCH A

### Integration and authority

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`,
branch `openai/mac`, tracking `origin/openai/mac`. The clean pre-merge head was
`84b6f22d2e6ecc948d161b33bb02feda2f11abf9`; fetched `origin/develop` is exactly
`c1791e210158de864fdd475323c3091d9ecbae58`. This checkpoint joins them with a real
signed merge; no cherry-pick, copy, rebase or history rewrite. Both former handoffs
and archive-side records are retained verbatim in `ROADMAP_ARCHIVE.md`.
The signed real merge is **`bc211bef1f4def92a27933b7c79a090d8913fae4`**, verified
and pushed to origin/openai/mac. This later documentation-only successor records its
results and Batch A continuation; its exact pushed head is supplied in the user handoff.

PR #41 is merged into develop at `c1791e2`. Nick's Claude-verified handoff reports
merge time 16:55:06 UTC; exact reviewed head `05c1d7fc7049a7b9813d2be1be020dc0d552b74f`.
Run `33976307813` was RED (3m29s, Glass targeted CLI 15 s cap at 16.7 s);
run `33977956355` was GREEN (8m10s) after the bounded timeout correction.
The label was removed; merging triggered no run. These hosted facts are Nick's
supplied review evidence, not a new hosted run or independent log replay here.

The runtime, tests, tools, producer pins and protected artlock references take landed
develop unchanged. All workflow bytes and `tools/actions-budget-policy.js` remain
exactly develop's. No player import door may return; v1.8.9 codec and evidence-build
`importBlob` remain. V2 starts fresh; the current draft has 79 outcomes, and retained
Glass carriers are judged against their planned `GLASS_NEGATIVE_CONTROL_LEDGERS`.
Batch 4 is integrated; its old save-export/PR prerequisites are superseded. Parked WIP
`cf1b9a7843200ecc281c5113b4139909dc0e3a29` and prior review refs remain untouched.

SSH origin is `git@github.com:TheDakk/Celestial-Frontier.git`; established account
`TheDakk`, current fetch PASS. Budget UNFROZEN, PUBLIC per Nick, private fallback
3,000; zero hosted attempts, labels, PRs into develop, remote merges or releases
are authorized. The requested local merge and normal openai/mac branch push are
authorized; the branch push triggers no workflow (label-only battery, others manual).

### Bootstrap-free verification and process law

Root ignored `main.js` and unrelated Finder `.DS_Store` were moved intact to a private
local backup before switching to clean openai/mac. Root `main.js` stays absent during
`npm run typecheck`, `npm run artunused` and `npx vitest run` from port/v2; expected
301 files / 3,100 passed / 1 skipped. All three commands passed once on the exact clean
merge: typecheck **2.423 s**, artunused **1.330 s**, Vitest **45.079 s** with all **301 files /
3,100 passed / 1 skipped**. No worker override, global config or selection change; root
main.js remains absent. Source/HEAD stayed clean and unchanged throughout. No profile,
browser or policy suite was added to Nick's three-command sync verification.
V2 tests needing legacy source must read tracked `celestial-frontier.html` through
`test-support/tracked-v1-source.ts`, never the gitignored machine bootstrap. Verify
without root main.js before any hosted attempt. The existing ignored-input law in
PROCESS_LAWS.md now names that helper and the required absent-bootstrap verification.
No Settings/Guide/Training code was changed. Exact results/hashes are recorded in
`audits/AAA_BATCH_A_PR41_SYNC_20260905.md` and its adjacent JSON.

### Audiovisual Batch A state

The accepted plan is `port/AAA_AUDIOVISUAL_CAMPAIGN.md`, Phase 0/1 Batches A–D only,
with the integrated pilot approval stop. Batch A means source/tool readiness. Blender
5.2.1 save/separate-reopen/render and REAPER 7.79 + Surge XT 1.3.4 save/reopen/export
already passed; browser WAV/FLAC decoding also passed. Do not repeat unchanged tool tests.
Human listening, Safari/iPhone and in-game audiovisual acceptance remain open.

`port/AAA_ASSET_POLICY.md` reserves 128 MiB for a complete installed pack and 256 MiB
aggregate retained payload during update overlap, counted before measuring. Enforcement
and real-device acceptance remain unproven. Offline is an installed, complete-ready-PWA
promise while storage is retained, with no eviction or deleted-save recovery guarantee.
The source policy requires editable .blend/.rpp/patches/WAV masters to remain outside
public Git, hashed and independently backed up; only optimized outputs, small code and
provenance records enter Git; no LFS. The current backup status is recorded below.

Batch A resumed by consolidating the existing masters, recipes, outputs and evidence into
a durable private working-source folder outside the public repo and app-private scratch.
Logical bundle `cf-batch-a-readiness-sources-20260905` preserves both ship tests,
both Lanternback .blend revisions and outputs, and the full original audio hierarchy.
**35/35 copied files match byte-for-byte (10,731,051 bytes); 23 existing manifest
references were also verified.** The new private index and restore notes retain location
mappings and the known absolute-path/plugin/config dependencies without changing originals.
No app launch, rerender, upload or public binary was needed. This is same-Mac preservation;
independent backup is still unselected/unverified, and portable replay remains unproved.
Nick has a pending destination question. The next bounded source step is to copy this bundle
to that selected independent destination and verify read-back bytes before closing backup.
The Lanternback/forest render remains invented concept art, not canonical creature coverage.

Later B–D work retains one ship/biome treatment and all eight body plans: quadruped,
biped, avian, serpentine, arthropod, tentacled, aquatic, flora/fungus; each static and
animated at actual 132/300/440. Unfaithful families keep their correct static portraits
and remain incomplete. Audio, candidate styleguide, three interface mockups and real-game
integration lead to Nick's pilot approval stop. No Phase 2; top bar/dock/rails leads it
after approval. No purchases, protected-portrait edits, CI/policy edits or release.

### Open decisions and paired next steps

Nick's artlock CI lane, ITP save protection and confirmation that DECISIONS row 19's
wording is his remain open. This sync decides none of them.

- **OpenAI/Codex:** sync/checks/push are complete; Batch A's consolidated local source
  handoff is verified and its known restore gaps recorded. Independent backup awaits Nick's
  destination. Do not repeat the passed tool tests or advance beyond the pilot approval stop.
- **Anthropic/Claude Code:** leave anthropic/mac `c860f57` and its unmerged `173c806`
  Slice injected-door negative control alone. Claude owns that worktree and any later
  sync there. Audiovisual-only records remain on openai/mac, not develop; no manual copying.
- **Nick:** no GitHub action/PR fields needed, and no need to open Claude now. An independent
  backup destination remains needed before that Batch A prerequisite can close.
- **Release:** develop is verified at c1791e2; main/live site are unchanged by this sync.
  No hosted run, merge into develop/main, release or deployment is performed here.
