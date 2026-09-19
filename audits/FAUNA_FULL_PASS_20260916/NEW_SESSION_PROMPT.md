# New-session prompt — Celestial Frontier, September 17, 2026

Continue implementation of Celestial Frontier as OpenAI/Codex on macOS in:
`/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`.
Verify the physical repository and branch before work. Do not switch branches or edit the
Anthropic worktree. Resume the latest committed implementation, not PAUSED_CHECKPOINT.md or
an earlier restart sequence. Do not reset to an older checkpoint.

Read first, in this order:
1. ROADMAP.md, PROCESS_LAWS.md and PARALLEL_GIT_PROTOCOL.md.
2. audits/FAUNA_FULL_PASS_20260916/README.md, REVIEW_PROMPT.md and coverage-final.json.
3. CREATURE_ANIMATION.md, SPECIES_AND_GENOME.md, ATTACK_ANATOMY.md and the relevant sections
   of celestial-frontier-codebase-reference.md.
4. audits/LONG_SESSION_20260913/WORK_ORDER.md and CONTRACTS.md. Apply subsequent direct
   user decisions as recorded in ROADMAP and the references, rather than reverting to old orders.
5. ART_KIT.md, MOTION_KIT.md and SOUND_KIT.md before touching their implementations/assets.
   These kits describe the approved direction; do not edit their wording without approval.

Follow the nick-game-toolchain skill and UI_TOOLCHAIN.md startup runbook for the new coding
session. Do not assume the prior uninterrupted-session maintenance receipt qualifies a new
session. Preserve pinned runtime/test inputs and active jobs.

## Goal and immediate work

Nick wants the accepted painted artwork brought to life with fluid, full-body, anatomy-driven
2D battle animation: mobile heads, bodies, limbs, tails, wings and appropriate attacks, with
convincing anticipation, impact and recovery. Combatants must inhabit their correct ground,
air or water environment within a procedural biome arena. This must work across Earth
species and procedural anatomy, not through species-specific clip or solver patches.

Continue coding and completing the outstanding fits; do not stop after another audit, generic
fixture or representative demonstration. Use the coverage ledger to work systematically:

1. Complete source-owned anatomy observations and part masks for the 58 missing-body species,
   grouped by their actual painter families. Preserve actual limb/segment counts, material,
   shell structure, hidden surfaces, joint names and body proportions. The winning painter
   owns procedural anatomy; authored master records remain hash-bound. Named Earth anatomy
   must not be overridden by genes. Unsupported combinations must refuse explicitly.
2. Complete painted fits for the accepted masters, including Persimmon, Cranberry and Devil's
   Club. Observe real bark/foliage ownership rather than borrowing synthetic material metadata.
   Preserve original master bytes and work on copies. New structures must be proved on real
   Earth and procedural paintings, not promoted from synthetic geometry.
3. Validate every supported action and transition, exact rest, seam/shape integrity, contacts,
   attack intent, orientation and habitat. Reuse CreatureRigV1 and the agreed PoseTarget
   vocabulary; keep shared motion curves, seeded behavior and deterministic playback.
   Enforce the existing 64-joint, 40-part and 2048-atlas limits. Keep negative controls.
4. Produce native evidence and reviewable captures for completed fits. Preserve source hashes;
   do not edit source during a hash-bound capture. Test actual device budgets before claiming
   iPhone qualification. Candidate code, nonblank renders and artifact existence are not
   visual acceptance or universal animation completion.

## Exact starting state

- Signed, independently verified checkpoints: 423afd62 (accumulated work) and 057d9bc2
  (full catalogue audit and repairs). At 057d9bc2: 125 ahead of cached origin/openai/mac,
  236 ahead of cached origin/develop. The session-handoff commit follows it; inspect local
  Git state for the actual current head. Signing worked through the configured 1Password
  helper; do not change it or use unsigned fallback. A future lock state is not guaranteed.
- The approximately 17.5 million added audit lines versus cached develop are already committed
  history. They are not an uncommitted source backlog. Unrelated .DS_Store was left untracked.
- Native census 03: all 1,010 Earth entries plus 240 procedural samples; 1,237 nonblank,
  observer/ordinary pixel-parity passes, 13 explicit legacy fallthroughs outside that check.
  Its 38 topology emissions exclude the separate quadruped anatomy observer. No universal
  motion claim follows from this count.
- Crab, Coconut Crab, Freshwater Crab, Mud Crab and Vent Crab have source-rendered PNGs and
  44-joint records checked against actual alpha. Named owners emit their own geometry; Mud
  paddles are rigid foot surfaces. Padded ink coordinates now map through rasterFrame.
  These are geometry proofs, not completed animated crab skins.
- Skink and Beetle accepted-source fits have exact rest and full-action native diagnostics:
  19/13 actions × 121 samples, ten-second films at 60 fps, rig-update p95 1.2/1.6 ms. Hidden
  Skink leg emergence, folded Beetle wings/open flight and out-of-plane views remain unproven.
- Twelve specialized structure/curve candidates exist. All 58 missing-body species still
  need qualified painted fits. Eight of eleven accepted-master hashes have matching binding
  artifacts; that does not mean eight new visual acceptances.
- Full application tests: 4,457 pass, one fails, one skips. The remaining failure is
  tests/current-producer-authorities.test.ts: stale Compendium producer-bound certificate.
  Measurement authority matches. Do not weaken the test or repin hashes without fresh
  measured admission. All 204 Node tool tests, TypeScript and root validation passed.
- Current native evidence: audits/FAUNA_FULL_PASS_20260916/native-census-03/. Earlier census
  runs are historical snapshots. The review prompt links all prior C2 and C3 work.
- Prior review preview: http://127.0.0.1:49816/painted-fits/, with temporary files under
  /private/tmp/cf-animation-preview-20260916. Check availability; committed evidence is the
  durable source, not a guaranteed surviving server or browser tab.

## Other packages and boundaries

C1 mechanical Wild intake is complete; Nick owns final visual acceptance. Rain E is active.
The second weather choice and smaller phone-finisher decision remain open. Do not resume Klein
phone probing, the obsolete six-reference scene generator, OPFS variants or Blender-projection
battle tokens. Do not generate from retired Art Kit v3.

C3 current evidence: audio-production/REVIEW_PROMPT.md, audio-production/REVIEW_PACKS.md and
audits/AUDIO_FAUNA_CONTINUATION_20260915/README.md. There are 203/631 authentic fauna source
identities, 428 missing; 1,617 WAV/Opus pairs; 43 biomes with 484 rendered routes and two
intentional silences. Source coverage and listening acceptance are separate. Follow the approved
REAPER/Surge workflow, spend $0, retain rights/source records, and preserve the CC BY attribution
exception. Do not call placeholders authentic species coverage.

Continue authorized work without asking between routine steps. Preserve the review stops for
kit wording, the first image/sound of a new class, new artwork sheets twelve at a time, actual
scope questions, GitHub writes and history rewrites. Do not wait for Claude to repair ordinary
in-scope defects. The local motion anatomy/habitat exception is recorded in the parallel protocol;
effects/, battle2/, soundkit/ and worldlife/ remain reserved. Announce any main.ts hunk in its
commit message. Unit tests must not take the checkout lock; native browsers require the Mac
execution/lock rules. Run relevant checks, retain failures and negative controls, and never
claim a full green certificate chain from focused or diagnostic runs.

No new branches, push, label, dispatch, hosted Actions, merge, release, deployment or history
rewrite. PR42 stays parked. LFS migration is approved in principle but still awaits Nick's
explicit go. Promotion remains: prune on openai/mac, then UI/engine/tools tiers into develop
using merge commits, then a separately authorized develop-to-main release/full chain.

Update the current references, coverage ledger, ROADMAP handoff and long-session log as work
lands. Keep chronological history rather than deleting old evidence. Maintain one consolidated
review prompt linking completed code, exact artifacts, tests and honest open requirements.
Commit completed batches with signatures and report local commit IDs plus cached ahead counts.
Claude does not need to open or sync now; later review is read-only and consolidated.
