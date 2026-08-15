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

## ▶▶▶ SESSION HANDOFF — 2026-08-15 · F1B AUDIO PRE-INITIALIZATION CONTRACT ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · `AUDIO.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve Git, PR, checks and publication live. Historical run IDs below are evidence, not an
  assertion about a newer tip. Never copy files manually between agent worktrees.

### Integrated foundation through WorldGen

- F1a remains integrated at `a1dabdeb4059292d67d7a89652e92fb317d750c7`; F1b Charter remains
  integrated at `bd49beb0693b45fdd57d4acad746ade79843a91e`; UI-P1 remains integrated at
  `b5e5d0a3b4bb4057fa6d251816454b370e8b2624`.
- WorldGen PR [#27](https://github.com/TheDakk/Celestial-Frontier/pull/27) reached exact final head
  `ce98236083f0f71df8b71013f502a6dc54321a31`. Three independent Codex read-only audits were clean
  after their findings were resolved. GitHub recorded no Claude review or PR comments; Nick
  explicitly authorized marking that exact terminal-green head Ready and merging without waiting
  for Claude feedback.
- PR #27 merged normally into `develop` at
  `a50e593e2135f55ae8c37e6ece1f10c52701346b`. Exact-`develop` test-battery run
  [`31892937375`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31892937375) passed
  v2 static, root gates, one-attempt smoke, the 12-viewport Glass matrix, persona/preview and the
  final join. Mapped publication run
  [`31893693225`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31893693225) passed
  development and skipped production.
- The public DEV manifest serves build `develop-a50e593e2135` from the full merge SHA. Remote
  automation fast-forwarded agent branches; this worktree fetched and normally fast-forwarded clean
  `openai/mac` to that exact merge before audio work began. Automation never substitutes for the
  required local folder/branch/clean/fetch check.

### Active F1b audio contract

- DOM-12 is a real public-package contract defect: the lifted rarity, survey and navigation stings
  call the application-owned free `ac()` seam before their local synthesis `try`, while the facade
  formerly re-exported them directly. A package consumer could therefore throw before
  `initAudio()`.
- This is not recorded as a reproduced current-player crash. Current application boot assigns the
  save and installs audio synchronously before publishing its playable scene/input path, and known
  pre-boot navigation paths fail closed on the absent save.
- The bounded repair keeps the exact five-export public API but makes every public sting and
  `applySfxGain()` inert until successful initialization. After initialization, wrappers delegate
  directly without adding a facade catch, so application-seam failures retain their prior behavior.
  Initialization itself creates no context; Sound-off remains mute-before-create; the first enabled
  sting lazily creates one context.
- Constructor selection restores production-v1 compatibility: prefer standard `AudioContext`,
  fall back to typed `webkitAudioContext` only when standard is absent, and fail silent when neither
  exists or construction throws. This is compatibility coverage, not physical-iOS certification.
- The byte-verbatim sting bodies, application boot/caller order, save schema, sound/volume meanings,
  generated content, balance and deterministic identity remain unchanged. Creature voices,
  ambience, combat/Guardian cues, music, mixing/buses, visibility/context-loss recovery, disposal,
  node/voice/memory budgets, rights, device listening and commercial-quality acceptance remain
  Arc 7/8 and Gate G work.
- No Guide topic, Training lesson, v2 draft release bullet, development/production version,
  production release or deployment changes. Existing player copy already describes only the live
  stings and settings; the former exception has no proved playable route.

### Evidence status

- The focused package suite passes **12/12**. It reproduces the raw pre-init `ReferenceError` while
  all four non-initializer public operations stay inert, proves failed seam installation does not
  enable dispatch, then exercises exact rarity-tier forwarding, survey and whoosh nodes, live mute
  and `sfxVol²`, singleton reuse, standard-first/WebKit-only construction, absent/refused
  constructors, and rejected/successful/synchronous suspended-resume paths.
- Deliberate restored defects fail diagnostically: enabling the facade before initialization fails
  two tests; reversing constructor precedence fails the standard-wins test; removing WebKit fails
  both fallback directions; adding a facade-level catch fails the application-seam propagation
  test; and falling back after a present standard constructor throws fails the absence-only law.
- The combined candidate passes 26 test files with **311 passed /1 skipped**, both root and app
  TypeScript programs, `artunused`, and `git diff --check`. The complete one-attempt real-browser
  slice smoke passes the full Gate-D core-loop journey with existing live survey/travel callers and zero
  console errors. This is route/lifecycle evidence, not a WebKit-device or audible-quality claim.
- Two independent final read-only source/test/caller/documentation audits are clean after their
  findings were resolved. The WorldGen handoff is archived byte-verbatim; current references and
  the complete program agree on this bounded scope.
- Final certification still requires a committed exact head, a fresh draft PR into `develop`,
  terminal exact-head CI, Claude review or an exact-head waiver, normal integration, the resulting
  `develop` battery, and mapped DEV publication.

### Next actions

1. Commit and push the completed bounded candidate, open a draft PR from `openai/mac` into
   `develop`, and require
   fresh exact-head CI. Request Claude's exact-diff review unless Nick explicitly waives it for that
   exact head; do not conflate the PR #27 waiver with this batch.
2. Merge only a reviewed-or-explicitly-waived terminal-green exact head, monitor `develop` and DEV
   publication, then continue the separate epoch-contract F1b slice before F2 canonical ingress.
   No world-bound ownership/reward/receipt writer starts before F2.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`, based on synchronized `develop` merge
`a50e593e2135f55ae8c37e6ece1f10c52701346b`. The worktree contains only the completed bounded audio
facade, its focused tests, synchronized current references, the archived WorldGen handoff and this
live program/handoff update. Resolve commit/PR/check state live rather than inferring it from this
pre-publication snapshot.

**GitHub step:** after the complete local evidence is green, commit and push `openai/mac`, then
open a new **draft** PR targeting `develop`. Do not reuse PR #27, push to another agent branch,
mark Ready, merge, touch `main`, or publish manually.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `F1b: harden the audio facade before initialization`
- Copy-ready description: `Makes the existing stings-only @cf/audio public seam safe before its
  application-owned initialization without changing the byte-verbatim synth bodies or application
  boot order. Preserves the exact five-export API, lazy singleton context, live Sound/Volume gates
  and squared gain taper; restores standard-first WebKit constructor parity; and adds bounded
  package controls for raw-defect reproduction, all four non-initializer public operations, post-init synthesis,
  live mute/gain, constructor precedence/failure, singleton reuse and suspended-resume rejection.
  Updates AUDIO, port, deviation, codebase-reference, complete-program and live-handoff truth.
  Explicitly records that no current playable pre-init route was reproduced and excludes Arc 7/8
  content/mixer/lifecycle/budgets/listening, Guide/Training/release copy, saves, balance, versioning,
  production and deployment.`

**Other side:** Claude need not act while the candidate is local. After the exact PR head is pushed
and terminal green, Nick should open Anthropic/Claude Code unless he explicitly waives review for
that exact head; Claude fetches and normally fast-forwards clean `anthropic/mac`, then reviews the
remote diff without editing this worktree.

**Release status:** no release, manual deployment, production version bump, `develop` → `main`
merge, or direct site write is part of this batch.
