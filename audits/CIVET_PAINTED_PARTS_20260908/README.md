# Painted parts and shared animation foundation — 2026-09-08

This is an authoring and architecture packet, not a new game build or accepted animation.
Nick first requested a more fluid, better-integrated Civet; subsequent steering requires a
shared procedural system for flying, land and water creatures and their varying appendages.
The bounded result is a source inventory and a small renderer-free mathematical core. The
Civet atlas experiments remain unaccepted and are not wired into the game or prior study.

Later explicit steering prioritizes cohesive **static landing paintings**, with the same
organism identities extracted for Compendium and future articulated 2D battle creatures with
depth. No live landing-creature motion is requested now. The mathematical foundation remains
future battle infrastructure; this packet's atlas does not establish usable extracted sprites.

## Source and shared-core boundary

[SOURCE_TAXONOMY.md](SOURCE_TAXONOMY.md) records actual V2 drawing precedence, exact trait
vocabulary and seventeen source byte/SHA bindings. It distinguishes modern named/procedural
owners from compatibility rendering and historical Markdown. In particular, modern limb/eye/
tail mapping and extremophile locomotion do not universally match raw descriptor genes.
Animation must preserve final named/lineage identity and the actual winning body owner.

The new [kinematics.ts](../../port/v2/tools/creature-animation/kinematics.ts) provides affine
composition, two-bone solving and finite chain-wave mathematics. The focused
[test](../../port/v2/tests/creature-animation-kinematics.test.ts) uses heterogeneous synthetic
geometry. Neither file selects species, generates anatomy, loads assets, renders a creature,
advances an idle loop or integrates a runtime family. No universal-animation completion follows.

[kinematics-tests.json](kinematics-tests.json) records **15/15 PASS**, one file, 358 ms,
Vitest 4.1.10, Node 26.8.1, under foreground and checkout locks. This receipt is explicitly
transcribed from the original tool result because that run created no raw log. Its source
hashes were recorded afterward on files frozen since the run; it is not retroactively an
original source-bound raw log. The tests were not repeated to create this packet.

- Core: 8,239 bytes; SHA `4a27bf2ad2402e411bc3fd70d633ab91a3ab5dc1c00684f6969d9cb805416ae5`.
- Focused test: 9,853 bytes; SHA `542ed7088ff378bd7874bb7832a9906b25e704fcff6ec142527c14caa602c295`.

## Static verification

The first [runner](static-runner.mjs) and [result](static-results.json) remain unchanged.
That attempt stopped on an instrument assumption: source hashing required root `main.js`,
which is absent in this checkout. `tools/validate.js` itself deliberately treats it as
optional. **No typecheck, validation, focused test or browser command ran in that attempt.**
Both locks released, with no cleanup errors. This failure is not relabelled green.

A separate [corrected runner](static-corrected-runner.mjs) follows validate's existing
optional-file policy, preserving both present-file bytes and absent-file state. It runs
one fail-stop chain under the shared foreground lock and checkout lease. Root V2 tsconfig
includes the focused test, whose direct import brings kinematics.ts into the same strict
program (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); a duplicate
isolated typecheck is unnecessary.

<!-- STATIC_OUTCOME_START -->
The corrected chain **PASS** ran once, 2026-09-09 02:05:10–02:05:26 UTC
(September 8 Eastern), on the live math foundation at HEAD
`afee1924aac880bed4360deae2a26d081ca18d45`. All three V2 TypeScript programs passed,
then root validation passed: 1,010 clean named renders, zero boot errors and
50 fingerprints identical to the v1.0 baseline. The legacy HTML remained byte-identical.
Both locks released with no cleanup errors. No focused-test repeat, separate V2 build,
browser, native observer or full profile ran.

[Corrected result](static-corrected-results.json), [TypeScript log](static-corrected-typecheck.log)
and [validation log](static-corrected-validate.log) retain the commands, frozen core/config
hashes and generated validation outputs. The first instrument failure above remains unchanged.

The six-file landing candidate was restored out of live game code and retained as an
[unapplied patch/source copy](../STATIC_LANDING_PORTRAIT_20260908/README.md) before this chain.
Those audit copies lie outside the V2 TypeScript programs. This PASS validates neither that
candidate nor its new asset, admission tests or native painting. Export permission, application
with a valid asset digest and a separately scoped focused/static/build/native chain remain pending.
<!-- STATIC_OUTCOME_END -->

## Unaccepted painted-part inputs

[BATCH_INTENT.md](BATCH_INTENT.md), [generation inputs](GENERATION_INPUTS.json),
[prompts](GENERATION_PROMPTS.md) and [results](GENERATION_RESULT.json) retain the two built-in
image-generation attempts. The first atlas was rejected: opaque checkerboard, inconsistent
body/assembled scale, incomplete lower hind paw and a tail touching the edge. The corrected
1536×1024 magenta-backed atlas remains unaccepted.

The [alpha-first receipt](alpha-first/receipt.json) records the explicitly authorized
ImageMagick matte, key-color edge treatment and five component WebPs: body, fore-upper,
fore-lower, hind-upper, hind-lower. **Alpha and rest assembly await visual/composite review.**
No coherent joint overlap, complete hidden anatomy, fluid stepping/turning, rig attachment or
native rendered outcome is established. Preserve original images and the first rejection.

## Signing, prior review and retained limits

[SIGNING_AND_SLEEP.json](SIGNING_AND_SLEEP.json) records the successful explicitly authorized
PTY signed retry `afee1924aac880bed4360deae2a26d081ca18d45` for the preceding 185-file water/motion
study, plus command-scoped signature verification. It also records the bounded display-sleep
assertion through `2026-09-09T03:11:15Z`. Persistent power/security settings were unchanged.
The successful combination does not identify the cause of earlier signer buffer failures.

The prior [water/motion study](../CIVET_WATER_AND_MOTION_20260908/README.md) remains the local
review on port **58523**; this packet does not replace its served dist or introduce a new
preview. No server liveness check was performed by this packet's static runner. Its
[first static/native failures and final outcomes](../CIVET_WATER_AND_MOTION_20260908/final-results.json),
[evidence verification](../CIVET_WATER_AND_MOTION_20260908/evidence-verification.json) and
[visual limits](../CIVET_WATER_AND_MOTION_20260908/VISUAL_REVIEW.md) remain binding.
The [earlier cohesion](../CREATURE_SCENE_COHESION_20260908/README.md) and
[original Civet](../CREATURE_PAINTED_CIVET_20260908/README.md) packets retain their own reds,
alpha/generation failures and immutable native evidence.

D-9e remains open. The exact Earth/lineage genomes, deterministic identity, named natural
anatomy and botanical species, seeded alien forms/palettes, biome mapping, accepted anchors
and UI placement remain unchanged. Full admission, physical devices, Safari/PWA, native
heap, human art acceptance and family animation remain open. No source rebaseline, runtime
asset integration, hosted action, scheduled prompt, release or deployment occurred here.

Codex owns the local packet on `openai/mac`; root owns combined documentation and final
commit/handoff. Claude's `anthropic/mac` does not yet contain these unmerged changes; there
is no need to open or sync Claude now and no manual file copying. Future integration is
separately authorized `openai/mac` to `develop`, never directly `main`.
