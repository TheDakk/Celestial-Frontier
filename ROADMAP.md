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

## ▶▶▶ SESSION HANDOFF — 2026-08-28 · UNIVERSE POLISH + ARC 5 · FIRST CAMPAIGN PRESERVED · INSTRUMENT REPAIR ACTIVE ◀◀◀

### Exact current boundary

- **Owner/environment:** OpenAI/Codex desktop on macOS, physical root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
  `origin/openai/mac`, SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`. Do not edit
  another agent worktree or the sibling live-site repository.
- **Signed implementation commit:** `c55cc63ee3a8c9b761cfccb2de2ad108f46c6b4e` (tree
  `6e89ef511543e79d9bd1abfe1e21d6243e0452f0`, parent
  `bfdcb1dab6876147e16e451bec94ae4475a2bb58`) contains the reviewed universe-polish, Arc 5 Feed,
  locale/ecology/audio joins, final memory-oracle repair, current authorities, Guide/release copy
  and synchronized current references. The commit contains an SSH signature; local verification
  needs an allowed-signers file and therefore reports no local trust judgment.
- **First campaign source:** signed docs descendant `a9d35cc795076a8903807d02ae011288ea5a639c`
  (tree `c2374dc04488654058919d0f539f770ea9e3e467`, parent `c55cc63…`) supplied the first exact
  browser campaign. Locally known `origin/develop` remains
  `7a9f4c1370dd84292388d718c38ff34214f6203b` and is fully contained. The branch is **107 commits
  ahead** of `origin/openai/mac` at that first-campaign checkpoint; work remains local and unpushed.
- **Signed instrument-repair commit:** `283c8b3b04e0e9a70bb7e4242e3408169c24b02a` (tree
  `49ee6bab3477b754a583bd702b81beba6983d2b3`, parent `a9d35cc…`) repairs the preserved
  SceneMemory stop, rebinds only its producer identity, adds positive/negative timeout controls and
  retains both first-campaign carriers under `audits/`. The commit contains an SSH signature; local
  verification needs an allowed-signers file and therefore reports no local trust judgment. The
  branch is now **108 commits ahead** of `origin/openai/mac`.
- This ROADMAP-only working-copy refresh is the sole change after `283c8b3…`. Sign it as a tiny docs
  descendant, require a clean worktree and use that exact HEAD as the new campaign source.
- Temporary `/usr/bin/caffeinate -dis` remains active so macOS and 1Password stay available during
  the authorized local certification. Restore normal monitors-off/sleep behavior only after the
  complete chain and final handoff are safe.

### Implemented player-visible scope

- **Universe-wide art treatment:** galaxy and system space, planet sprites, all **43** canonical
  biome landing profiles, fauna/flora/fungi/microbe canvases, creature and plant details, Shipyard
  presentation, bloom/fog/particles and protostar/effect treatment now share one deterministic
  finishing language. Sol is only calibration; the policy has no Sol-only branch.
- Existing authored silhouettes, anatomy, proportions, topology, seeds, share-code identity and
  interaction geometry remain intact. The pass layers atmosphere, depth, grading, rim light,
  material response and bounded effects around the established structures rather than redrawing
  them.
- **Display controls:** Visual Effects, Screen Shake and Reduced Motion resolve through explicit
  low/medium/high policies. Effects Off disables protostar animation as well as ambient animation;
  reduced/off paths remain deterministic and bounded.
- **Arc 5 Feed:** real Compendium fauna detail owns one exact creature + flora transaction, fixed
  five-segment persistence, nonoptimistic pending state, one committed winner, stale-CAS
  read-only convergence across two same-origin documents, reload fixed point and exact expression
  audio through the shared Tame runtime.
- Feed replay retention is constant-size; same-current and superseded successes are rejected.
  Audio proof requires one oscillator start and a same-AudioContext node/edge path to exactly one
  `AudioDestinationNode`. The inline polite atomic status is the sole accessible announcement;
  the simultaneous visual toast is excluded from assistive technology.
- Generated non-Earth civilization years use the deterministic D-LOC formatting facade without
  changing values or RNG. The canonical biome profile is computed once in the world roster and
  joins the current-world ecology/audio identity without wiring speculative distant-world playback.

### Authority, browser-version and resource policy

- Canonical biome-profile schema `cf.domain.biome-profile.v1` owns exactly 43 recursively frozen
  profiles; digest `bpd1-6fce883d4d70e3b6bde0fb184b416e8e`. Worker request/cache identity
  includes schema, digest, biome key, weather/hazard environment fingerprint and stale fences.
- SceneMemory input-v4 now has **44** outcomes: the historical 42 semantics plus one phone and one
  desktop biome-vista lifecycle outcome. Four raw diagnostics bind worker active, mount count,
  cache entries and cache pixels through cold 0 → exercised positive → repeat/ascent → BFCache →
  reload/replacement cleanup. Fixed caps remain one entry / 412,800 pixels. Historical v3/42
  reports replay only as explicit legacy evidence and cannot certify the current contract.
- Normal Edge updates do **not** require rebaselining. Local/root/art/SceneMemory gates accept the
  compatible Microsoft Edge/Chrome/Chromium family plus CDP 1.3; the exact point version is recorded
  as run provenance. Only a real capability/producer/ruler change can trigger recalibration.
  Compendium's separately sealed `.101` hosted package remains a repeatable calibration input, not
  a system-Edge version lock.
- Current Compendium measurement authority is
  `3c811274c4f67cf706b621142db2001d614ba6b1a3c3669daf6ce1dacf67b574`; current producer is
  `d97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271`. Current SceneMemory
  buildDist/gameMain inputs are `2d4ff26c0afc2e21373c2797393374a7057f4a43b793534b9eeb8aca7801281c` /
  `87660ca42fe6f1ee06c28315f143297c5fff2f0b92eb540a285c616cb8ddb745`.
  Fixed rulers, historical samples, ceilings and browser policy did not move.

### Review and browser-free evidence

- Independent whole-diff review found three actionable Feed issues: unbounded replay-key retention,
  an audio path oracle that accepted cross-context intermediate nodes, and duplicate assistive-
  technology announcements. All three were fixed, mutation-controlled and independently re-audited
  **CLEAR**. The Effects-Off protostar leak and missing SceneMemory vista diagnostics were also fixed
  and independently cleared. No remaining code-review blocker, determinism defect, save-compatibility
  defect or browser-version-policy defect was found.
- Final browser-free battery passed: root Actions-budget and browser-resolver selftests; v1 validate
  with **1,010/1,010** renders and the unchanged 50-probe v1.0 fingerprint; full root smoke and
  training checkpoint; golden seeds, code/audio/save fixtures, rarity and dead-code scans; v2
  **163 files / 1,706 passed + 1 skipped**; all three TypeScript configurations; `artunused`;
  **1,014/1,014** override routes plus the complete mutation control; art/coverage/specification
  audits; current producer binding; **108** SceneMemory-focused assertions; Guide/release,
  Slice/Glass/persona/preview/Recovery selftests; and global/staged diff checks.
- Developer visual review captured matching 1280×720 before/after fixed-seed pairs for temperate,
  cold, hot, abyssal, coral, Shipyard, hybrid detail, flora detail, Sol system, home galaxy and
  universe under
  `port/v2/apps/game/smoke/20260828-universe-polish-fixed-seeds/` (ignored local evidence).
  It confirms the new biome atmosphere and depth while preserving creature/plant/ship structure.
  This is not HUMAN art acceptance.

### First exact campaign — immutable instrument stop and bounded repair

- Root browser preflight passed with system Edge `151.0.4129.107` / CDP `1.3`; Layout selftest
  passed. Layout `20260828-universe-polish-a9d35cc79507-layout` then ran once with zero retries,
  passed **787/787** across ten viewports in 76,183 ms and passed named verification.
- SceneMemory `20260828-universe-polish-a9d35cc79507-scenemem` ran once with zero retries and
  stopped terminal `instrument-fail` after 6,059 ms. The phone profile completed its initial
  sample, four warmups, all four measured cycles and BFCache proof; the reload-cleanup caller then
  passed a 30,000 ms phase budget into a CDP command whose fixed transport cap is 5,000 ms. Desktop,
  contract projection and all 44 outcomes therefore did not run. Browser/server/workspace-lock
  cleanup passed. This is instrument-only and makes no product verdict. The serial chain correctly
  stopped before Compendium, Slice, Glass or Recovery.
- Exact raw/gzip hashes and both immutable carriers are recorded at the top of `audits/README.md`.
  The repair clips every collector command to the existing 5,000 ms cap, leaves the separate
  30,000 ms semantic settlement deadline intact, removes the widened one-shot reload request and
  adds both valid-shorter/longer-cap functional checks and source-wiring mutation controls. Only the
  SceneMemory collector producer hash changes; browser policy, product, fixtures, samples, ceilings
  and all numeric rulers remain unchanged.

### Next exact action — new repaired signed source, fresh chain

- Repair verification is complete: the independent focused review is **CLEAR** with 110 assertions;
  the full v2 suite passed **163 files / 1,708 passed + 1 skipped**; all three typechecks,
  `artunused`, current-producer derivation, JSON/gzip integrity and global diff checks passed.
  Sign this ROADMAP-only descendant. That clean descendant—not `a9d35cc…`—starts a completely fresh
  campaign exactly once and serially: **Layout 787 → SceneMemory 44 → Compendium 78 → Slice →
  Glass 12 → Recovery 20-minute**.
  Give every stage a new source-derived run ID, named-verify it before starting its successor, and
  stop/preserve immediately on any red, nonzero or instrument finding. Never rerun the immutable
  `a9d35cc…` campaign.
- After the chain, preserve exact run IDs, durations and report hashes; refresh this handoff in
  place; sign the final docs/evidence descendant; then restore normal monitor/sleep behavior.

### Explicitly open after automation

- HUMAN visual appeal across the full universe and physical phones/tablets; screen-reader behavior;
  listening judgment; first-journey/playtest judgment; physical-device heat/battery and true GPU-byte
  evidence remain open even if the automated chain is green.
- Gate G/live distant-world ecology playback remains deliberately unwired; the current join is pure
  and non-playing. D-9e remains design-gated. Gates A–I are not globally closed.
- No production release, version bump, preview publication, deployment, push, PR update, Actions
  run or merge is authorized by this local campaign.

### Paired handoff

- **OpenAI/Codex:** sign this ROADMAP-only descendant of the reviewed `283c8b3…` repair; run the
  fresh exact local chain above without retry; preserve evidence and finish the docs-only handoff.
  Keep full caffeinate active until that endpoint.
- **GitHub step:** none. Zero exact hosted attempts are authorized; do not push, open/update a PR,
  apply `actions-budget-approved`, dispatch, rerun, merge, deploy, publish or bump a version.
- **PR details if Nick later authorizes the exact GitHub write:** base `develop`; source
  `openai/mac`; title **`Phase 4: universe-wide visual polish and Arc 5 Feed`**; description
  **`Carries the deterministic visual treatment across galaxy/system space, all 43 biomes,
  creatures, plants, ships and effects without structural redesign; completes Arc 5 Feed with
  two-document stale-CAS convergence and exact expression audio; strengthens version-tolerant
  browser and memory evidence; synchronizes Guide/release/current references; and records the full
  local verification boundary. Anthropic/Claude receives it only after merge to develop. No
  production release, deployment or version bump is included.`**
- **Anthropic/Claude Code:** Nick does not need to open Claude now. This local work is not in
  `develop`; do not copy files manually. After a future authorized PR merges, Claude may fetch and
  merge the latest `origin/develop` into a clean `anthropic/*` branch at its next coding batch.
- **Release status:** `develop`, `main` and the live site are unchanged; no release or deployment.
- **Actions budget:** `UNFROZEN`; repository public; 3,000 fail-closed private/ambiguous cap; zero
  exact hosted attempts authorized.
