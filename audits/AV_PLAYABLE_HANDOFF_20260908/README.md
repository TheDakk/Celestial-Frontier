# Playable audiovisual checkpoint and preview — September 8, 2026

This follow-up records the completed local preview and the signing blocker after
[the implementation audit](../AV_PLAYABLE_IMPLEMENTATION_20260907/README.md).
That audit and its manifest remain immutable; their references to a future clean preview
are a planned next step, not a completed artifact. This package is explicitly dirty/local-only.

## Play on this Mac

[Open the audiovisual preview](http://127.0.0.1:50689/?avpilot=1).
The Codex browser-panel request returned `queued`; that does not prove a person opened it.
The read-only server is PID **7566**, exec session **17770**, bound only to loopback.
Its package lives at `port/v2/apps/game/smoke/dev-preview-av-playable-local-20260908`.
`serve-preview.mjs` verifies each listed file and serves its unchanged in-memory bytes;
only package-listed files plus preview.json are available. No authoring lock is held by the server.
If this recorded process is still the same server, `kill -TERM 7566` stops it. If it has exited,
restart the recorded script with the package path and a NEW receipt path; it assigns a fresh port.

For a quick guided check: intentionally skip Field Training, select Earth and Land. The pilot
shows the candidate Earth landscape and eligible starter Scout arrival. Open Pilot controls and
choose **Play pilot sound** to opt into audio; enable the existing Sound setting if requested.
A subsequent eligible landing can play the short landing cue. Landed Survey's **Challenge** opens
the battle Chronicle with attack/reaction motion. **Show current look** allows visual comparison.
Creature portraits retain canonical art; battle motion currently translates whole portraits.
The full universe, anatomical rigs and biome locomotion are not complete.

This is a fresh loopback origin, separate from production saves. This Mac URL is not reachable
from a physical iPhone. No human UAT, speaker listening, Safari/PWA or phone hardware pass is claimed.
See [the automated preview record](../../port/playtests/20260908_AV_LOCAL_PREVIEW.md).

## Exact package and source limits

- Parent/source identity: `837db4aaa0ef5d3d8bffc79c70f62dcc2503032d`, branch `openai/mac`.
- `source.state`: **dirty-local-only**; `publishable`: **false**. Parent identity is not a claim
  that this modified app is contained in commit 837db4a. The package's content hashes bind its bytes.
- Content SHA-256: `5d1da7777da722ccb04b4dfc7b258c1b85f98fb1c3e0ae47fa5286217ac292d2`.
- preview.json SHA-256: `4568e3aa013dc712094c5624a72b7ff1654efdf8b36205f76796385d0903f24a`.
- Served index SHA-256: `3cf676bb7eb0ab4b57d46e339b1d864337a42aa06ebc83f0814c55ef239fb689`.
- The ordinary distributable package has no diagnostic API and no floating development badge.
  Its Guide's full build identity matched its manifest in the package browser check.
- The expected future hosted origin remains `https://dev-celestialfrontier.github.io`.
  This local-only package refuses remote execution and was not published or pushed.

## Retained verification sequence

1. Product completion passed the full browser-free develop profile: **327 files / 3610 tests /
   1 skip**, all three TypeScript programs, art/override/spec checks, plus root validation and
   the scoped native landing/battle diagnostics. These receipts precede the observer correction below.
2. Both preview selftests passed, including delayed browser endpoint controls. The first package
   call then stopped before build because the supplied output basename lacked `dev-preview-`.
   The next call corrected that argument; no unchanged selftest was repeated.
3. Package build and verification passed. Its first browser check stopped red because the old
   observer required a visible breadcrumb, while U1 deliberately hides that canonical state carrier.
   Actual player/canvas rendering and distributable identity were present. The failure is retained.
4. The observer now requires connected, populated breadcrumb state, while actual player UI and
   canvas must remain strictly visible. `trailVisible` separately reports breadcrumb visibility.
   Four hidden-breadcrumb positive controls and blank/detached-state negative controls preserve
   the distinction; real player/canvas visibility and inert-control checks remain strict.
5. After this two-file tool/test correction: **21/21 readiness tests PASS**, all three TypeScript
   programs PASS, then the unchanged package passed its real Edge **152.0.4191.66** browser check
   at **320×568, DPR 2**, including ordinary Skip Training and Guide identity. No console errors.
   This is a scoped local package check, not a Compendium/Slice/Glass admission certificate.
6. The read-only server's HTML and manifest were fetched outside the network sandbox and matched
   the package hashes above. The first sandboxed curl returned exit 7 without data; this is retained
   as a transport limitation, not an app failure. The server did not need to be restarted.

All three raw preview logs are stored here, compressed losslessly. The success log's existing
phrase “rendered trail” is legacy wording: it identifies canonical breadcrumb text, not evidence
that the intentionally hidden breadcrumb was painted. `trailVisible` is the observer's actual fact.
The package app bytes did not change between the failed and successful observer runs.
No full develop rerun or new product certificate is claimed after that scoped observer correction.

## Signing, continuation and Claude review

`git commit -S` failed once with **1Password: failed to fill whole buffer**, exit 128; no commit was
created. The literal tool result is in signing-attempt.json. Source, tests and review evidence are
staged locally, with ambient `.DS_Store` preserved. A compressed binary patch and its receipt
are saved as `port/v2/apps/game/smoke/av-playable-staged-20260908.patch.gz` and
`av-playable-staged-20260908.json`. This is an ignored local backup of the index at checkpoint,
not a signed commit or authorization to apply/copy the work into Claude's checkout. HEAD remains signed 837db4a, **38 ahead / 0 behind**
origin/openai/mac; origin/develop is an ancestor. Verification of old HEAD would not verify this batch.
An asynchronous request to restore/unlock the signing connection is pending. Do not bypass signing
or keep retrying unchanged. Once restored, sign the completed staged work, verify the NEW commit,
then produce a clean exact-commit review package. No new generic coding approval is needed.

The same Codex checkout may continue the authorized 24-hour local campaign after preserving this
checkpoint; an unsigned/staged snapshot is not ready for cross-agent transfer or publication.
Deadline **2026-09-09T03:11:15Z** (September 8, 23:11:15 Eastern). Reuse the uninterrupted startup
receipt, shared lock and active-job checks; do not duplicate the hourly heartbeat.
Caffeinate PID 93550 remains requested for coding. Inkscape 1.4.4 is requalified for isolated
outside-sandbox export work; preserve its earlier crash evidence and keep the selected emoji UI.

Next bounded coding task: the complete-genome → final morphology → Blender bridge and one coherent
Wolf-family candidate from the existing [creature findings](../AV_PLAYABLE_IMPLEMENTATION_20260907/CREATURE_BLENDER_FINDINGS.md).
Qualify an actual bounded Metal render, preserve canonical/named/bred identity, and keep private
editable masters with verified backup. Anatomical animation for all eight families remains open.

Claude's Thursday September 10 review should inspect the original retained reds, final native
captures, audio ownership and canonical Explorer adaptation, then this observer correction and
subsequent Blender work. The original U2 failures and missing admission stages remain open exactly
as recorded in ROADMAP; this preview does not close them. No review message was sent.

Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`, tracking
origin/openai/mac. SSH origin is `git@github.com:TheDakk/Celestial-Frontier.git`; TheDakk account/read/
fetch proof is retained from this session. No foreign agent worktree was edited. GitHub step **none**;
PR **not needed now**. Claude need not open or sync now, does not have this unmerged work, and must
preserve anthropic/mac's unmerged 173c806 without manual copies. Only after a later authorized
openai/mac → develop merge should Claude fetch/merge origin/develop into its own clean branch.
Budget **UNFROZEN / PUBLIC**, private fallback cap **3000**, exact hosted authority **0**, attempts/cost **0**.
No push, label, workflow, PR mutation, merge, publication, deployment or production version bump;
develop, main, hosted dev and production remain unchanged.
