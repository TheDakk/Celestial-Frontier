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

## ▶▶▶ SESSION HANDOFF — 2026-09-04 UTC · CC4D7C9 LOCAL GAPS PROVEN · FOUR BOUNDED ROBUSTNESS ITEMS · NO HOSTED AUTHORITY ◀◀◀

### Exact boundary

- **OpenAI/Codex on macOS:** `/Users/nick/Projects/celestial-frontier-openai-mac`,
  **openai/mac**, tracking **origin/openai/mac**. Startup was clean and synchronized at
  **cc4d7c920083c3c630a9c8c8e6fc5a6e40f5e0d4**, tree
  `976027042d01f87ace54d57eafe0363cd685e415`. Base `develop` remains
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- Nick authorized the bounded local proof/robustness batch, documentation, signed commit and
  normal **branch-only push**. No label, dispatch, retry, PR metadata change, merge, release,
  version bump or deploy is authorized. PR #35 is Ready/open/mergeable with no approval label.
- The source commit containing this handoff intentionally does not embed its own SHA. The final
  Git handoff and `git ls-remote origin refs/heads/openai/mac` identify the pushed candidate.
  Never reinterpret the cc4d7c9 browser evidence below as a certificate for its descendant.
- SSH origin: `git@github.com:TheDakk/Celestial-Frontier.git`; last authentication account
  **TheDakk**, fresh fetch/read PASS. GitHub visibility verified **PUBLIC**. Budget mode
  **UNFROZEN**, private fallback cap **3,000**, **zero authorized hosted attempts**.
  Push/PR synchronization triggers no workflow; `test-battery` is owner-label-only.
- Exact review and audit: `audits/PR35_CC4D7C9_FORENSIC_REVIEW_20260904.md` and
  `audits/PR35_CC4D7C9_LOCAL_PROOF_AND_ROBUSTNESS_20260904.md`. Prior handoffs moved
  verbatim to `ROADMAP_ARCHIVE.md`; no history was deleted.

### Completed local evidence — unchanged clean cc4d7c9

- Slice `20260904025322131-97983-4d9021b5767b`: **PASS**, **369,040 ms**,
  including real Shipyard disclosures, source-bound log and ten retained screenshots.
- Full Glass `20260904030025751-98655-51d159101e76`: **12/12 PASS**, **116,676 ms**,
  zero findings/instrument failures; bound to that exact Slice.
- Named Glass verifier: **PASS**. Diagnostic projection: **PASS**; gzip **95,047 bytes**,
  base64 **126,732 / 700,000 bytes**, complete summary **129,124 / 900,000 bytes**.
- Chrome targeted `small-phone`, `compact-phone`, `primary-phone`, then `large-phone`:
  all **PASS**. The extra large row supplies genuine Chrome evidence because the old retained
  Edge row cannot satisfy the unchanged hosted Chrome-only jq filter.
- Exact workflow jq extracted like `scenemem-workflow.test.ts`: **both real reports PASS**,
  no provenance rewriting or altered filter. IDs, durations, hashes and recoverable compressed
  carriers are in the audit. No product/instrument result was retried.
- Full chain used Edge **152.0.4191.62 / CDP 1.3**. Targeted rows used official isolated
  Chrome for Testing **152.0.7977.82 / CDP 1.3** in a temporary directory. No system
  browser was installed or made default; Chrome processes are closed. Keychain access is
  unnecessary; Nick may dismiss its prompt. No keep-awake process was started in this batch.

### Four coverage-neutral robustness changes

1. Existing changed-input Glass preflight: **5 → 7 minutes**, with its three literal pins.
2. Pinned Edge **151.0.4129.101** download: **curl transport retries only**
   (`--retry 3 --retry-all-errors --retry-delay 5`). URL, SHA-256 and certification no-retry
   rule unchanged; two existing exact-command/mutation literals synchronized.
3. Shipyard settlement waits for **active and debounced persistence writes both zero**.
   Debounce count comes from the existing read-only
   `__smokeSettingsPersistenceDiagnostics()`; no product API/schema change.
4. `command -v jq >/dev/null` is the first preflight command.

Independent code review is **CLEAR** after correcting an initial wrong-source debounce lookup.
No controls, schemas, verifiers, rebaseline, product/instrument retries or gameplay changes were
added. Existing creatures, plants, biomes, Guardians, loot, graphics, audio, saves and release
identity remain untouched. Current README, codebase reference, process laws and budget agree.

### Verification and exact remaining boundary

Working-tree develop profile: **268/268 files, 2,785 passed / 1 skipped**, all three TypeScript
programs, art/override/spec audits green. That run preceded the reviewed debounce-source correction;
the final clean tracked-input rehearsal is the final-source static authority. Existing Glass
selftest, pinned-Edge preflight selftest, Actions policy **66/66**, and root validation/fingerprint
all pass. No new test inventory was added.

After the complete source/docs commit, run the requested
`node tools/tracked-input-preflight.mjs --profile=develop` once on the unchanged clean candidate.
Retain its exact terminal result, duration and log hash in the Git handoff; a red blocks the push.
Then push `openai/mac` normally and verify the full remote SHA. Do not start another browser
battery: Part A already ran once on the explicitly requested ancestor. Do not apply a label.

### Paired handoff

- **OpenAI/Codex:** finish the final clean tracked-only rehearsal and authorized branch push;
  no hosted run or merge follows from this batch. Final Git handoff supplies exact SHA/proof.
- **GitHub:** existing **PR #35**, base **develop**, source **openai/mac**. Metadata remains
  unchanged in this branch-only batch and must be refreshed within future explicit authority.
  Copy-ready title: `feat(v2): complete roadmap campaign and harden action-time CI evidence`.
  Copy-ready description: “Completes the established V2 roadmap without recreating gameplay;
  preserves the fifteen-stop history and cc4d7c9 forensic review; proves real Slice/full Glass and
  raw Chrome jq paths locally; adds only seven-minute canary margin, pinned-download transport
  retries, jq presence and debounce-aware Shipyard settlement. Existing static/selftests pass;
  exact final tracked proof is in the handoff. No hosted result is claimed. Changes remain on
  openai/mac until a green authorized PR #35 merge; no release or deployment.”
- **Anthropic/Claude Code:** Nick may open Claude for read-only review after the verified push.
  Do not edit the OpenAI branch or copy files. These changes are not in `develop`. Only after
  a future green PR #35 merge should a clean `anthropic/*` branch fetch and merge
  `origin/develop` before polish work.
- **Future hosted authority:** exact final head + base above, `test-battery`, PR #35,
  `actions-budget-approved`, maximum **122 total runner-minutes** (2 authorization + 120
  battery), **one attempt, no retry**, merge only if terminal green. None authorized now.
- **Release:** `develop`, `main` and the live site are unchanged.
