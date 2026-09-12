# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-12 · WEATHER ACCEPTED, RAIN LADDER SHOWN, PHONE EMBEDDING NEXT

Nick accepts weather/mat9f51f2c9/Cranberry as is. New active ordinary Earth recipe selects
weather-mat-v1 and matching composite; original/raw finisher retained unchanged, audit
qualityAccepted true. Old cd6b609f retained as history; no kit/frozen paragraph/4E edits.
Six offline rain intensity variants A–F shown, no model run; Nick chooses default. Until
selection,1x accepted weather remains active. Evidence audits/ART_KIT_WEATHER_LADDER_20260912.

Phone next: Nick authorized ONE additional same-device probe, no retry on session loss.
Initializer inspection PASS443 tensors in pinned parent and expanded worker graph;
max108MiB<1GiB, total expanded initializer memory4.39GB is separate. Evidence
 audits/IPHONE_EMBEDDED_PROBE_20260912. Precompute accepted recipe embedding with ONE Mac
text-encoder-only run (no painting/transformer/VAE), pin bytes/prompt/revision, then phone
loads only encode/denoise/decode and attempts one warm finisher. Memory where exposed;
report first result before proceeding. Nick confirmed unlocked; first result reported below.
Mac text-only preparation onf725f633 PASS, one text inference and zero painting/image stages.
Embedding6,389,760bytes SHA46f0533d51e3c436b6d6cf6bcfa3e8af0c5d402b51e6d4570e13dda0724a20c7
is shipped as earth-rain-v1.f16/json; phone-only worker forbids text loads/fallback/repeat.
Focused controls, seven game tests, typecheck/root validate PASS. After signing8a739f73,
ordinary-game-02 PASS:165.23ms composite, retained accepted weather PNG restored on reload
and opened in Inspect; zero model requests/inference. Screenshot visually inspected.
After unlock, physical Safari session-preflight-03 succeeded (iOS26.6.2/Safari26.6.1).
First embedded probe oncaf3db63 stopped before model load: secureContext false and zero
HTTP requests reached the HTTPS server; GPU/storage APIs unavailable on that page. No
captured URL/error page establishes the cause. Not a hardware/WebGPU/OOM finding.
No model, text encoder or finisher ran; no new memory/timing. Raw native-01 result retained,
first result reported, no retry. Session/server/driver closed. Phone remains unqualified.

Previous phone probe lost Safari session during text-encoder load, no confirmed cause;
physical12GB is user-reported and single-buffer1GiB is not total memory. Mac installed
model->ordinaryLand->retained finisher already proved, plus no-inference reload/Inspect.
No repeat of those runs. After new phone result: Civet animation proof end to end beside
own accepted landfall; then family/library rollout only after proof acceptance. Effects
class needs separate approval. No new painting parameters or broad exploratory sweep.

OpenAI/Codex macOS owns /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac,
upstream origin/openai/mac. Signed8a739f73 contains embedding/phone preparation; ordinary
UI proof signedcaf3db63 (41 ahead upstream,152 ahead cached develop). Phone result commit
follows. Earlier ordinary-game-01 refused uncommitted source before browser startup;
signed-source ordinary-game-02 PASS. Embedded phone probe attempted once, no retry; failed
before any model attempt. A fresh phone probe needs separate authorization after resolving
secure-origin navigation. NEXT Civet animation proof; no kit edits, rain choice pending.
Unrelated .DS_Store untouched. Same Sept12
startup receipt. GitHub step NONE; PR42 parked, no push/label/dispatch/merge/release/deploy.
Budget UNFROZEN/public/private fallback3000, zero exact hosted authority. Unit tests hold
no checkout lease. Claude need not open/sync; no PR now. Report signedIDs/ahead at stops.


Nick explicitly authorized one retry ("try again"). Signed372a1fc0 adds exact secure-page
readiness and failure screenshot/URL/TLS diagnostics; negative controls PASS. native-02
now identifies the blocker: Safari error page says server certificate invalid, and two
TLS connections produced certificate-unknown alerts; zero HTTP/model requests. No model
loaded and no timing/memory measured. Screenshot inspected. Result reported, no further
retry; all owned sessions/server/driver closed. Trust settings unchanged. A trusted local
HTTPS connection is required before another authorized phone attempt. Earlier failed
attempts retained. Latest source372a1fc0 (43 ahead upstream,154 ahead cached develop),
result commit follows. Rain A–F choice pending; accepted1x stays active.


## Active secure-HTTPS setup (supersedes phone retry stop above)

Nick approved establishing trusted local HTTPS. New short-lived root/server certificate,
profile and negative controls prepared; Apple native trust evaluator and strict managed
OpenSSL HTTPS verification PASS, no Mac trust-store changes. Root signing key removed;
server key private. Evidence audits/IPHONE_EMBEDDED_PROBE_20260912/trusted-https.
HTTP setup http://192.168.1.62:49764/; HTTPS check https://192.168.1.62:49765/.
Certificate-only server remains active, shell session76799, tool serve-iphone-trust-setup.mjs.
Live setup-server-status.json is untracked while serving; do not commit mutable status.
No model routes or inference. User must install profile CF Local Probe 20260912 and enable
SSL trust via iPhone Settings; instructions/link already given, confirmation pending. After
confirmation inspect iPhone report/physical secure context before any model load. Use the
new private server-key.pem/server.pem under /private/tmp/cf-iphone-trusted-tls-20260912.
Root expiresSep14 22:59UTC, serverSep13 22:59UTC. Remove profile after probe. Do not weaken
TLS validation. Last signed8249989a (44 upstream/155 cached develop ahead); setup commit
follows. No GitHub action, PR42 parked, no Claude sync needed. Rain choice still pending.
