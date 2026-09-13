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

## SESSION HANDOFF — 2026-09-13 · C1 WILD PHASES AWAITING IMAGE REVIEW

Nick authorizes continuation through C1–C5 without repeated proceed questions. Stop for kit
wording changes, first image/sound of a new class, GitHub writes, history rewrites, or scope
questions; every C4 sheet also stops for Nick's eye. Report each package with the evidence
specified in the supplied work order, and log each package in audits/LONG_SESSION_20260913/LOG.md.

Supplied arena review, revised world-life MOTION_KIT.md and SOUND_KIT.md committed verbatim
in8a2dfdc0. Hash/byte receipt: audits/LONG_SESSION_20260913/supplied-kits-receipt.json. The kits'
PROPOSED labels are supplied bytes; Nick's existing approval remains authoritative.
WORK_ORDER.md received September13 from Nick's explicitly attached sibling-worktree file,
read and retained verbatim at audits/LONG_SESSION_20260913/WORK_ORDER.md. Hash/byte/source
receipt: work-order-receipt.json beside it. No sibling worktree edit or Git operation.
Additional long-session zip retained: CONTRACTS.md, LOG-A4.md, LOG-A5.md and the incoming
LOG.md verbatim as LOG-CLAUDE-PACKET.md, preserving our local chronological log. WORK_ORDER
is byte-identical. Provenance: long-session-pack-receipt.json. Treat Claude's reported tests
as reported evidence, not locally reproduced results; no source/evidence media came in the zip.
Nick approved e89cb621; ART_KIT now4.3 with only the exact requested header/history adoption
changes beyond that diff. Frozen paragraph/4E and game theme hexes unchanged. Evidence:
audits/WILD_V43_PROOF_20260913/README.md, adopted-kit.diff, kit-adoption.json, generation.json.

C1: exactly three built-in imagegen calls, one Wild phase each, no rerolls. Warm ochre/earth,
fur tufts/torn leaves replace the rejected blue palette. Original1254-square masters retained.
Generator enlarged phases beyond requested bounds; uniform-scale/translation intake copies
now share1024square, origin(.20,.55), contact(.80,.55). Visually measured active anchors map
within.5pixel, empty anchors virtual. wild-anchors.json uses registered copies; separate
wild-anchors-master-fallback.json retains original per-phase anchors. No warp/rotation/crop.
Review wild-masters-review.png and wild-registered-review.png. Keyer reports89/597/529 unresolved
fine-edge pixels; do not claim zero fringe or accepted artwork. STOP for Nick's image review
before staging; this does NOT block independent C2 coding. C2 material observer is fixed and
parts runtime now implemented/tested; authored/procedural masks, joint patches, real atlases,
visual proof/captures and C3 remain pending. No new kit wording request. Keep combining incoming feedback; do not drop earlier
requirements unless a later explicit decision supersedes them.

MID's one-pass exact190 RGB correction from07c93945 reverified, alpha and all arena masters
unchanged. mid-verification.json references the original completed copy and composite;
no repeated pass. Arena FAR/MID/NEAR remain accepted templatev1. Rain E remains active.

Earth compiler version guard updated to admit4.3 and retired-v3 test mutant updated. Initial
pre-adoption guard refusal retained; final3 compiler tests prove deterministic output, retired
kit/malformed source refusal and unchanged engine prompt. Nine contact/despill controls pass;
full v2 TypeScript/root validation logs retained. No native inference or scene/finisher run.

C1 review delivery: two ZIPs at /private/tmp/cf-wild-v43-review-part1-20260913.zip (11.9MB)
and part2 (18.5MB), each below30MB; paths/hashes/file lists in
WILD_V43_PROOF_20260913/review-packages.json. Send both to Claude with REVIEW_REQUEST.md in
the packet. It requests per-phase/material/edge/registration/MID verdicts, read-only; Nick
retains final acceptance. Do not leave Nick without the review artifacts/prompt.

C2 runtime now at apps/game/src/creature-rig.ts: loadCreatureRigV1 admits the existing
record/master/alpha and a hash-bound cf.creature-parts/v1 single-atlas binding; actual Pixi
parts, far/near layers, record-joint parent-pivot inherited transforms, normalized cutout
space, radians/body-length offsets, atomic invalid-pose refusal and disposal. PoseTarget
adapter supplies setJoint. Reuses existing GRAPH/kinematics/admitRecord; no fixed mesh.
Five tests include negative controls and 40-part CPU mean<2ms; full TypeScript, root validate
and pinned packer controls pass. This is not a browser/GPU timing or visual rig proof.
Next independent C2 work is authored masks/joint patches and painter-emitted procedural masks,
then real atlases; native proof/staging waits for C1 image review and required asset readiness.
Evidence: audits/C2_RIG_RUNTIME_20260913/README.md. No main.ts or Claude-module changes.

C2: parts masks per authored master, turnaround joint patches, painter-emitted procedural
parts, pose application and one deterministic atlas per creature with pinned packer. Compile
body cards from resolved anatomy using Motion Kit §§3–6; report absent fields. Civet versus
Platypus in accepted arena with Motion timings; ten-second Civet/fox/procedural captures.
C2 interface: load parts for a resolved record; apply a pose of joint rotations and offsets;
expose part display objects and pivots. CONTRACTS.md supplies CreatureRigV1: recipeHash,
templateId, parts {id,display,pivot,layer}, root, applyPose(joint rotation radians and dx/dy
in body-length units), normalized bounds {width,height,groundLineY}, dispose. Joint names
match record landmarks. PoseTarget.setJoint(name,radians,dx,dy) is the same vocabulary;
rotation names describe child bones pivoting at the parent per A1. Claude's fixture uses
this same contract until C2 lands. Pack2 CONTRACTS§6 is retained verbatim in6030e636.
Nick reports motion5d0abd01, effectsc03aad82, world-life50a7fbd2, sound5f22581b committed/green
on anthropic/mac; none merged/copied as code here. A3/A6 remain in progress there.

C2 observer now emits spec.alien.skin when that painter route is active, otherwise actual
spec/family coat. Five material routes and named-Earth protection covered by two real-painter
command-stream tests; pre-fix red preserved. No rendered pixel change intended or native
capture claimed. Do not rewrite the old procedural capture: freshly emit its corrected record
for C2. Evidence audits/C2_MATERIAL_OBSERVER_20260913. TypeScript/root validation pass.
Registered Wild anchor JSON now includes measured alphaBoundsPixels required by A2; all PNG
hashes unchanged. No repaint/repeated MID despill. Source-set naming/formats in CONTRACTS§1
remain binding; synthesized placeholders are not C3 source approval.
Claude owns the body-card compiler (A1), effects sequencer (A2), battle scene adapter (A3), sound
derivation (A4) and world-life (A5). Codex supplies rig/parts and source assets, without editing
those modules. Effect anchors schema: cf.effect-sequence-anchors/v1. Missing anatomy fields
must produce named refusal. No more continuous-mesh repair, Blender projections or texture
finisher passes. Retain older proof evidence/assets.

C3: quadruped voice archetype, Wild theme set, battle set, temperate rain bed, fur impacts;
rights recorded; 48kHz WAV masters plus Opus. Derive Civet/fox/procedural voices from one
archetype. CONTRACTS.md defines quadruped.<cue>.wav and numbered footfall filenames,
mono48kHz24-bit, <2s cues/<300ms steps, dry, -1dBTP, rights and SHA256 per source; Wild phase
files, battle cue ids, bed.temperate.wav24–40s with loop sidecar and weather.rain.wav.
Motion/Sound frozen paragraphs already approved; do not ask again. SOUND_KIT v1
approved by Nick, frozen text unchanged. Root MOTION_KIT now includes the supplied world-life
layer. Both retain supplied PROPOSED status labels verbatim. First new-class sounds require
Nick's review; the parts-rig body-card audit still reports missing record fields.

C4: approved-order library batches of twelve, arenas per biome family; stop at every sheet.
C5: prune on openai/mac, then promotion tiers into develop with MERGE COMMITS, not squash:
production UI; painted landfall engine; research tooling merged as tools. No new branches.
Audits LFS migration approved in principle, performed by Codex on openai/mac only when Nick
says go; no history rewrite now. No PR Ready before Civet proof/weather pick/phone-tier decision.
One later develop→main release PR with full chain and separate release authority. PR42 parked.

Claude now works on anthropic/mac, which Nick reports contains Codex history, on new motion/,
effects/, battle2/, soundkit/, worldlife/ modules and their tests. Codex must not edit those
paths. Any main.ts hunk must be announced in its commit message. No main.ts change this batch.
No need to open Claude Code now; continue assigned disjoint work, no synchronization requested.

Prior emitter replacement is local/tested: Pixi8 ParticleContainer, recipe-seeded absolute-time
updates, no peer override/second renderer; not yet battle-wired. Three emitter and two despill
tests, v2 TypeScript and root validate passed in07c93945. All approved masters immutable;
PNG optimization copies-only; GSAP3.15.0 and packer core0.3.9/CLI0.3.0 remain pinned.
Rain E remains accepted/active; raw finisher and originals retained. Existing weather and phone
follow-ups remain recorded; the supplied work order does not place weather/phone evaluation
within C1–C5. Preserve those queued requirements and resolve scope when their order matters.
Klein phone probing remains stopped; no delivery engineering before phone-tier result.

Ownership verified: OpenAI/Codex, macOS, /Users/nick/Projects/celestial-frontier-openai-mac,
openai/mac → origin/openai/mac; SSH origin git@github.com:TheDakk/Celestial-Frontier.git.
Pre-runtime9ae342da:74 ahead upstream/185 ahead cached origin/develop, zero behind. No remote
refresh needed or performed; .DS_Store excluded. Current budget file says UNFROZEN, but Nick's
explicit GitHub step NONE controls: no push/label/dispatch/merge/release/deploy or hosted attempt.
This C1 batch reuses the uninterrupted September12 maintenance receipt; Node26.8.2 verified.
Latest C2 runtime/test/declaration and review-package documentation remain local; no main.ts hunk.


### Pack3 continuation — 2026-09-13

Pack3 verbatim commit56509c0c supersedes incoming packet status; prior local chronological log
is preserved in audits/LONG_SESSION_20260913/LOG-CODEX-PRE-PACK3.md. CONTRACTS§§1–6 unchanged.
A11 family joint inventories are binding when their painter observers are added; current C2
proof targets quadruped first. Claude lane complete per Nick, code not integrated here.
C1 second intake attempted once (radius8 inward samples then1pxerode); travel110/impact85
unresolved, targetunder40 FAILED. No automatic repeat. Review images/prompt/receipt in
 audits/WILD_V43_PROOF_20260913/second-pass/.
Updated anchors identify candidate derived copies; every master, launch and MID unchanged.
C2 independent coding continues; no effect staging acceptance implied. All24pre-existing full
suite failures listed in incomingLOG belong to C5; do not run a new full-chain admission now.


### Current C2 implementation checkpoint — 2026-09-13

Signed Pack 3 = 56509c0c; signed C1 second intake = 597821d2 (77 ahead origin/openai/mac,
188 ahead cached origin/develop, 0 behind). C1 still fails the under40 target (110 travel /85 impact).
Nick has been asked whether to authorize another targeted intake correction or review these
candidates. Do not automatically rerun second-despill.mjs or generate art. The delivered review prompt is
 audits/WILD_V43_PROOF_20260913/second-pass/REVIEW_REQUEST.md.

C2 now has part-masks.mjs and build-authored-parts.mjs under port/v2/tools/creature-animation:
hash-bound authored polygons, complete pixel coverage, one pinned atlas and CreatureRigV1 binding.
The actual Civet22-part /2046×919 atlas preserves visible RGBA offline; see
 audits/C2_PARTS_ATLAS_20260913/README.md, which lists missing Motion Kit body-card fields.
This is not native or animation acceptance. Next: fit turnaround joint patches, inspect authored
cuts at Motion extremes, emit fresh procedural masks from the winning painter, fox/procedural
atlases, native rest/ground/performance checks, and three ten-second captures. C3 follows C2.
Mask/atlas negative controls, existing five Pixi rig tests, v2 typecheck and root validate pass.
Claude's A1–A11 code is not integrated here; do not copy or edit its owned modules. No main.ts hunk.
Nick need not open Claude for manual synchronization now. GitHub step none; PR42 parked; no new
branch, LFS/history rewrite, develop/main merge, release or deployment.
