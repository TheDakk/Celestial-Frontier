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

## ▶▶▶ SESSION HANDOFF — 2026-08-29 · UNIVERSE POLISH + ARC 5 · COMPENDIUM ACTIVATION CERTIFIED · FULL RESTART NEXT ◀◀◀

### Exact current boundary

- **Owner/environment:** OpenAI/Codex desktop on macOS, physical root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
  `origin/openai/mac`, SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`. Do not edit
  another agent worktree or the sibling live-site repository.
- **Exact stopped campaign source:** signed commit
  `55126af50f3f7ab7b4eaeee7d81b28f8881c87fa` (tree
  `1b561cae692f38d2b8f38e66578a68657b0567a7`, parent
  `283c8b3b04e0e9a70bb7e4242e3408169c24b02a`). It contains the reviewed universe-polish and Arc 5
  implementation plus the bounded SceneMemory transport repair. The commit has an SSH signature;
  local verification needs an allowed-signers file and therefore reports no local trust judgment.
- **Exact completed calibration source:** signed commit
  `b65fd5d4a1b7928fc8c722f4e6ac22cc2ef02974` (tree
  `d59e2a9fd3ea61fa24459a41646672c73c5024cf`, parent `55126af50f3f7ab7b4eaeee7d81b28f8881c87fa`).
  It preserves the immutable campaign red and owns the fail-closed `calibration-required` transition.
  Three independent current-producer candidates and one paired broken-baseline measurement completed
  on this unchanged clean source.
- **Exact certified activation source:** signed commit
  `27513798bedd9e4337d0b1db9712fa784b90b9fd` (tree
  `9ae0ffa3c8d39d0a05b6f8b823576b88af8fb516`, parent `b65fd5d4a1b7928fc8c722f4e6ac22cc2ef02974`).
  It activates the reviewed ruler, commits all four calibration carriers and synchronized docs,
  passes the full browser-free battery and owns the exact 78/78 Compendium certificate below.
- Locally known `origin/develop` remains `7a9f4c1370dd84292388d718c38ff34214f6203b` and is fully
  contained. The exact activation source was **111 commits ahead** of `origin/openai/mac`; the
  signed certificate-evidence descendant is **112 commits ahead**. Everything remains local and
  unpushed.
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
- The immutable Compendium red is bound to measurement authority
  `3c811274c4f67cf706b621142db2001d614ba6b1a3c3669daf6ce1dacf67b574`. The fail-closed
  authority-binding repair advances the prospective calibration measurement to
  `cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78`; current producer remains
  `d97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271`. Current SceneMemory
  buildDist/gameMain inputs are `2d4ff26c0afc2e21373c2797393374a7057f4a43b793534b9eeb8aca7801281c` /
  `87660ca42fe6f1ee06c28315f143297c5fff2f0b92eb540a285c616cb8ddb745`.
  Browser policy and the product/runtime limits did not move. The current Compendium evidence
  transition deliberately clears live samples and numeric ceilings, preserves all former ruler
  evidence as historical/unrebound, and targets the current measurement/producer for calibration.
  The required `b65fd5d…` candidates and paired baseline were collected outside that immutable
  transition. Signed `27513798…` binds them to the active ruler and its exact certificate.

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
  **163 files / 1,711 passed + 1 skipped** after activation; Compendium-focused **27/27** and
  instrument selftest **222/222**; all three
  TypeScript configurations; `artunused`;
  **1,014/1,014** override routes plus the complete mutation control; art/coverage/specification
  audits; current producer binding; **108** SceneMemory-focused assertions; Guide/release,
  Slice/Glass/persona/preview/Recovery selftests; and global/staged diff checks.
- Developer visual review captured matching 1280×720 before/after fixed-seed pairs for temperate,
  cold, hot, abyssal, coral, Shipyard, hybrid detail, flora detail, Sol system, home galaxy and
  universe under
  `port/v2/apps/game/smoke/20260828-universe-polish-fixed-seeds/` (ignored local evidence).
  It confirms the new biome atmosphere and depth while preserving creature/plant/ship structure.
  This is not HUMAN art acceptance.

### Prior exact campaign — immutable instrument stop and bounded repair

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

### Current exact campaign — Layout and SceneMemory green, Compendium product-red

- The clean signed `55126af…` source ran each stage once with **zero retries** on system Microsoft
  Edge `151.0.4129.107` / CDP `1.3`. Layout
  `20260828-universe-polish-55126af50f3f-layout` passed **787/787** across ten viewports in
  **76,378 ms** and passed named verification. SceneMemory
  `20260828-universe-polish-55126af50f3f-scenemem` passed the current input-v4 contract **44/44**
  in **10,672 ms**, including both vista lifecycles and complete cleanup, then passed named
  verification.
- Compendium `20260828-universe-polish-55126af50f3f-compendium` completed its full measurement in
  **46,681 ms** and stopped terminal product `fail` at **74/78**. All 78 expected outcomes were
  present; exactly `phone/heap-ceiling`, `phone/byte-ceiling`, `desktop/heap-ceiling` and
  `desktop/byte-ceiling` were red. The exact FAIL report passed its named verifier with the expected
  nonzero verdict. The chain correctly stopped before Slice, Glass and Recovery; do not run or
  automatically retry those stages on `55126af…`.
- Exact breached dimensions:
  - phone V8 used heap **10,902,116 > 10,485,760** and backing storage
    **4,678,792 > 4,194,304**; embedder **3,070,912 < 4,194,304** and aggregate
    **16,222,216 < 16,777,216** remained green;
  - phone encoded art **3,202,320 > 2,621,440** and encoded portrait
    **308,486 > 262,144**;
  - desktop aggregate heap **21,239,200 > 20,971,520**; V8 used
    **14,536,484 < 14,680,064**, embedder **3,220,288 < 4,194,304** and backing storage
    **6,278,552 < 6,291,456** remained green;
  - desktop encoded art **8,528,076 > 6,815,744** and encoded portrait
    **308,486 > 262,144**.
- Every cache-entry, decoded-pixel/byte, job, lease, subscriber, portrait-entry, ownership,
  answerability and cleanup count stayed within its ruler. Both profiles retained a stable warm
  plateau; desktop range was **326,652 < 524,288**. The app's independent hard runtime caps also
  retain substantial headroom. Together with the deterministic full-cache payload increase, these
  facts indicate the intended higher-entropy universe art increased compressed PNG and stable
  heap/backing cost; they do **not** indicate a leak, invalid instrument or Edge-version drift.
  Independent red-diagnosis and budget-policy audits agree with that disposition.
- Immutable current-campaign carriers:
  - Layout `audits/PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260829_001955334.json.gz`: raw/gzip SHA-256
    `bd2dacb071e4f667a0565b2cd43de06461adcc228bc60b1b37700bbf24f3a813` /
    `8a922d61d7195db624984f4ca735b82b5076955d7c641295061cc252573cb000`;
  - SceneMemory `audits/ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260829_002021315.json.gz`: raw/gzip
    SHA-256 `1355c8a67e64a4cf058e6dd85aeda006396e37e7b885f97b724f173da440ec2d` /
    `f9bb59a819c91babe2cc429a41b00ce43cf49582d7d8b0e7db4a13dbcce448c5`;
  - Compendium `audits/COMPENDIUMMEM_CURRENT_INPUT_FAILURE_20260829_002129399.json.gz`: raw/gzip
    SHA-256 `c5adaca207770251b48b3cadf634d80bd03cb55f589814fd3e93c8c635aba5d8` /
    `25292bcd0ff55a32842c0958d25ae9d299c1ef8470ca6dc7269ccdfd1c092716`.

### Completed `b65fd5d…` calibration — exact candidates and paired broken baseline preserved

- Three independent current-product candidates ran once each with zero automatic retries from the
  same unchanged clean signed `b65fd5d…` source. Candidate1/2/3 completed all **78** calibration
  outcomes in **45,761 / 45,286 / 45,357 ms** under measurement
  `cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78`, producer
  `d97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271` and Edge
  `151.0.4129.107` / CDP `1.3`. Exact run IDs are
  `20260829-universe-polish-b65fd5d4a1b7-candidate1`, `…-candidate2` and `…-candidate3`.
  They are calibration observations, not exact-budget PASS certificates.
- Paired `20260829-universe-polish-b65fd5d4a1b7-baseline1` measured broken product commit
  `38447019517147319bd08c598202d097ee866874` with collector `b65fd5d…`. Phone and desktop each
  reproduced `unwindowed-1500-rows`, `list-source-440`, `full-portrait-dom-exposure` and
  `eager-art-import`.
- Selected phone V8/backing/aggregate/encoded/portrait ceilings are **11,534,336 / 5,242,880 /
  17,825,792 / 3,407,872 / 393,216 B**; desktop values are **15,728,640 / 6,815,744 /
  23,068,672 / 8,912,896 / 393,216 B**. Every other field stays byte-identical. Broader heap
  margins avoid sub-spread or sub-one-percent false reds. The 384 KiB portrait margin conservatively
  carries prior cross-platform encoder variance without claiming a fresh Linux measurement. Exact
  +1/fractional and warm-range controls remain; the paired baseline retains **14 phone / 13 desktop**
  breaches.
- Immutable calibration carriers, with raw/gzip SHA-256:
  - candidate1 `d259ddbee5e621dd7694302601ac4a4576bd31ba39d184f93874c446683a5135` /
    `65c9982ee3339d32b493fe26beb72aa35b2d55cece3b35a981852512ee6cacdc`;
  - candidate2 `7d36e634b30a75ae70a15a806dc7288b76815c151110377dbb3717121d36972e` /
    `855d823ec0a8866e3f69f8542fd8a1c892ca04760341c3b7b9fa36d9caba66e0`;
  - candidate3 `7fbd4375d26063a8e000b63fe652cc4d812696255dc5467641332836a7e7c705` /
    `bf1ad07f82c7e3565644162b7d9195289f844e0be360259689800f4ffa8a9d0c`;
  - baseline1 `fc9afe2499629e9ad16966b0f8da4b370acf056fbd13a2309a1d0a592e5361aa` /
    `353c09949f413d3f4a9a7907167151345475877225033df10156e65c71a978c2`.

### Completed `27513798…` activation certificate — exact current ruler green

- Browser compatibility preflight passed on canonical Edge `151.0.4129.107` / CDP `1.3`.
  `20260829-universe-polish-27513798bedd-compendium-certification` then ran exactly once with zero
  retries, passed **78/78**, complete lifecycle/cleanup, zero findings and zero blocked outcomes in
  **44,432 ms**, and passed its exact named verifier.
- The immutable certificate `audits/ARC1_COMPENDIUM_UNIVERSE_POLISH_ACTIVATION_CERTIFICATION_20260829.json.gz`
  is 453,664 compressed bytes with SHA-256
  `1415773e8eb7474d141b9174939bf618795b76742afd874e4bf73fa7bc0a70e7`; decompressed it is
  8,637,650 bytes with SHA-256
  `3b0116f98a77e3089ef80fd78ebc762a658c74907a2c5e473061718c9860e7a6`.

### Next exact action — sign evidence descendant, then restart from Layout

- Preserve this certificate and synchronized docs in one signed clean evidence descendant. From
  that changed source, a completely fresh once-only campaign must start at
  **Layout 787 → SceneMemory 44 → Compendium 78 → Slice → Glass 12 → Recovery 20-minute**.
  Every stage uses source-derived IDs and stops/preserves on any red, nonzero or instrument result.
- Compatible Edge point updates remain provenance only and never trigger a rebaseline, calibration
  rerun or numeric threshold change.

### Explicitly open after automation

- HUMAN visual appeal across the full universe and physical phones/tablets; screen-reader behavior;
  listening judgment; first-journey/playtest judgment; physical-device heat/battery and true GPU-byte
  evidence remain open even if the automated chain is green.
- Gate G/live distant-world ecology playback remains deliberately unwired; the current join is pure
  and non-playing. D-9e remains design-gated. Gates A–I are not globally closed.
- No production release, version bump, preview publication, deployment, push, PR update, Actions
  run or merge is authorized by this local calibration/campaign work.

### Paired handoff

- **OpenAI/Codex:** preserve the green activation certificate and synchronized handoff in a signed
  clean evidence descendant, then start the fresh full chain from Layout. Keep temporary
  `/usr/bin/caffeinate -dis` active until that endpoint, then restore normal monitor/sleep behavior.
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
