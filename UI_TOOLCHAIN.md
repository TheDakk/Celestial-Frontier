# Celestial Frontier — development toolchain

**September9 browser-AI proof:** Nick explicitly continues the browser game as the local-generation
proof of concept for a later engine game. `tools/local-image-generation/` is an isolated authoring
package pinned to ONNX Runtime Web1.29.0 (MIT) and Hugging Face Tokenizers0.2.0 (Apache-2.0);
installed with scripts disabled and its own lock, leaving game/runtime/test locks unchanged.
Exact FLUX.2 Klein4B conversion revision3bffc0ef has20 runtime files/6,691,020,416 bytes plus
7,792-byte README provenance, stored only in the ignored development model cache. Actual Edge
WebGPU shader-f16 compute and three actual four-stage model runs passed on the Apple Metal
adapter, producing raw768×432 paintings in142–227seconds. ORT's native asyncify WebGPU provider
reports some CPU-assigned nodes. Art acceptance, peak unique memory, full-screen quality and
phone support remain open. Root coordinates immutable receipts in
[LOCAL_AV_AI_CONTINUATION_20260909](audits/LOCAL_AV_AI_CONTINUATION_20260909/README.md).
The uninterrupted September8 startup receipt remains applicable; no global tool upgrade.
The optional `--q8-block32` derivative uses the unchanged parent shards plus352,323,881 new
local graph/data bytes. All103 nodes retain represented weights, with every347,332,608 parameter
byte independently re-read. Seventeen converter controls and38 bridge controls PASS. Actual
native execution uses412 wide Q8 kernels and completes the same768×432 scene in69s versus239s
profiled original. Both raw images remain unaccepted; no phone/device or shipping-size claim.
The first rejected larger render and all native profiling failures remain retained.

**Latest authoring direction, September 8:** Nick selected the generated Living Worlds reference
for cohesive static landings, with shared-identity Compendium art and future articulated 2D battles.
Built-in imagegen produced the two reference boards and two full landfall review compositions in
[MIDGAME_ART_DIRECTION_20260908](audits/MIDGAME_ART_DIRECTION_20260908/README.md), plus one separately
bound canonical Civet still candidate in [STATIC_LANDING_PORTRAIT_20260908](audits/STATIC_LANDING_PORTRAIT_20260908/README.md).
All originals/prompts and exact workspace readbacks are retained; no generated painting by itself
proves rig/identity/native coverage. Nick explicitly authorized ImageMagick resize/encoding while
preserving quality. ImageMagick 7.1.2-31 exported a 960×430 lossless WebP of 600,756 bytes; its decoded
RGB exactly equals the resized display reference, while the unchanged 1875×839 master retains the
additional spatial detail. The first export receipt honestly records exceeding the old 512 KiB
runtime limit. The applied optional pilot now declares that exact size under a 640 KiB hard ceiling;
existing undeclared loads keep 512 KiB. Scoped focused/static/native integration checks passed
with the first TypeScript fixture and native observer failures retained. Pixel equality alone
does not prove runtime behavior. [Storage and quality](audits/STATIC_LANDING_PORTRAIT_20260908/STORAGE_AND_QUALITY.md)
separates disk bytes, decoded buffers and unknown runtime copies. No tool/package update, hosted
action or recreated automation. Same uninterrupted startup receipt.

**September 8 signing/sleep diagnostic:** Nick confirmed 1Password unlocked. Existing
`caffeinate` PID93550 runs `-i`, preventing idle system sleep but not display sleep. A separate
bounded `-d` assertion (PID16793 / exec16947) was verified and expires no later than
2026-09-09T03:11:15Z. Existing AC/battery display idle settings (10/5 minutes), screen-lock and
security preferences were not changed. Filtered recent power events did not establish a sleep or
screen-lock cause. One PTY signed-commit retry succeeded as
`afee1924aac880bed4360deae2a26d081ca18d45`, with command-scoped public-key verification PASS.
This does not isolate the cause of the earlier buffer failures. Exact receipt:
[audits/CIVET_PAINTED_PARTS_20260908/SIGNING_AND_SLEEP.json](audits/CIVET_PAINTED_PARTS_20260908/SIGNING_AND_SLEEP.json).

The uninterrupted startup receipt still applies. Two built-in image-generation calls produced one
rejected checkerboard atlas and a corrected magenta atlas; ImageMagick alpha extraction produced
five unaccepted components. User steering redirected work to universal anatomy/motion foundations;
no atlas was installed into the game. Common solver tooling and its limits are described in
[CREATURE_ANIMATION.md](CREATURE_ANIMATION.md). No engine/package update or scheduled prompt.

The 2026-09-08 local water/motion study reuses the uninterrupted
[TOOLCHAIN_STARTUP_20260908_CIVET](audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json) receipt;
no further update/install or generator call. The existing painted RGB/alpha asset remains exact.
The authoring-only Pixi mesh uses local joint transforms and borrowed-background waterlines.
Isolated Edge runs outside Seatbelt under the shared foreground lock and checkout build lease.
Actual-canvas native recordings/readback use preserveDrawingBuffer in this bench only: its extra
framebuffer/recording overhead is not production performance evidence. ImageMagick only decodes
RGBA for independent read-only pixel checks this batch. All owned buffers/textures/bitmaps and
water resources retire; the borrowed sibling is actually rendered after water retirement.
[Water/motion review packet](audits/CIVET_WATER_AND_MOTION_20260908/README.md) retains the first
TypeScript and native filter-toggle failures, final PASS and exact restart command. 1Password
successfully signed the preceding studies as `86ea06b79e11382b62173fbb2ccfc8c90fb37baa`; verification
uses a command-scoped temporary allowed-signers file with the configured public key, without
persistent signing changes. The original signer failure remains preserved. No hosted action.

**Explicit user retest — 2026-09-08 07:38 UTC:** Another isolated outside-sandbox
Inkscape 1.4.4 version/export chain passed. The inspected128×128PNG again matches the
September7 bytes exactly; the CVDisplayLink warning remained nonfatal. No crash reproduced.
[Fresh commands and evidence](audits/INKSCAPE_USER_RETEST_20260908/README.md).
Keep Inkscape for vector/export work; earlier crash causes and failures remain preserved.


**Inkscape confirmed — 2026-09-08:** A fresh isolated outside-sandbox version query and
128×128 SVG→PNG export both exited zero. The PNG is byte-for-byte identical to the September 7
successful export; dimensions/colors and visual inspection PASS. Both commands emitted GDK's
`Failed to initialize CVDisplayLink!` warning while completing normally; no crash was reproduced.
The [confirmation](audits/INKSCAPE_CONFIRMATION_20260908/README.md) and
[artifact verdict](audits/INKSCAPE_CONFIRMATION_20260908/artifact-verdict.json) retain the evidence.
The original controller remains instrument-red because it expected ImageMagick AE text `0`
instead of the returned `0 (0)`; direct byte equality established the artifact PASS without
another export or retry. Preserve that original red. Inkscape remains qualified for isolated
vector/export work outside the sandbox; this does not establish a universal crash root cause.

**Prior requalification — 2026-09-07:** Nick authorized the new test after reporting that
normal launch works. Under the shared job lock and approved execution outside the Codex sandbox,
Inkscape **1.4.4** answered `--version` and exported the synthetic SVG to a **128×128 PNG**;
dimension/channel/color checks and visual inspection PASS. Exact commands, logs and hashes are
retained in [INKSCAPE_REQUALIFICATION_20260907](audits/INKSCAPE_REQUALIFICATION_20260907/manifest.json).
No update, reinstall, private-document inspection or existing-window closure occurred. Inkscape
is qualified for isolated vector/export work with out-of-sandbox execution on the first attempt.
Keep Nick's colorful emoji; this qualification starts no new icon study.

The prior sandboxed failures remain retained in `audits/UI_U3_ICON_STUDY_20260906/` and its
`inkscape-crash-diagnosis.json`. Both reports show SIGABRT at HIServices `_RegisterApplication` /
`TransformProcessType` through GDK Quartz / `gtk_init_check`, even for `--version`. A restricted
registration failure remains an inference; the successful outside-sandbox control does not prove
the exact cause of those crashes or make sandboxed Inkscape launches qualified. The September 7 sandboxed
process inventory also failed because sysmond was unavailable; its scoped outside-sandbox
replacement succeeded. Preserve both results. U2–U4 does not depend on another Inkscape repair.

Verified on **2026-09-07**, macOS 26.6.2 / Apple Silicon. This is the maintained tool reference;
versions are observations, never a permanent assumption. Nick authorized the three additions
and automatic maintenance of active development tools. Players install none of these tools.
The browser/PWA game remains the product; tooling readiness does not mean artistic acceptance.

**Session startup — 2026-09-07:** [Receipt](audits/TOOLCHAIN_STARTUP_20260907/manifest.json)
retains the official stable check, scoped Homebrew refresh/outdated result, relevant process
inventory, dry-run dependency plan and completed upgrade/verification. Node26.7.0→26.8.1 with
libffi3.8.0, simdutf9.1.1, merve1.2.2_2 and simdjson4.6.11; npm remains11.19.0 and Homebrew6.0.22.
All seven CLI capability checks PASS, including the existing Python audio venv. No game/runtime
lock or package changed. REAPER was active but current; no apps/jobs were stopped. Inkscape was
read through metadata only at startup; the later explicit requalification above restores isolated
outside-sandbox version/export capability without repeating maintenance.
The Node update previously deferred on2026-09-06 is now complete; preserve this version through
the resumed coding/check chain. Caffeinate -i was restarted at Nick's request (PID93550).

## Executive fit

Blender creates models, materials, lighting and rendered art. Inkscape authors vector icons
and emblems. TypeScript, PixiJS and native HTML/CSS/SVG assemble those assets into a responsive,
accessible browser game. Surge supplies synthesis and the preserved REAPER projects retain
editable sound design. ImageMagick and FFmpeg prepare and inspect outputs. Python and Node
connect the command-line workflows. Verification tools check the actual game and final media.
No tool automatically supplies a professional art direction; coherence, readable layout,
interaction, animation, mixing and mobile performance remain implementation work.

Actual design-use status (2026-09-08): Blender has produced pilot ship/environment art and
one private connected Wolf candidate with a saved armature, verified weights, 97-frame finite
poses and five actual Metal renders. The game still uses protected canonical portraits; this
clay-like authoring candidate has no runtime integration or human art acceptance. Its exact
[review and preservation status](audits/CREATURE_BLENDER_CANID_20260908/README.md) remains separate
from prior verified pilot backups. Surge and REAPER have produced pilot audio. Inkscape's isolated version/export requalification
passes, but it has not produced accepted game UI artwork. Keep existing emoji and start no new
replacement-icon study. U1–U2 use HTML/CSS/TypeScript for layout, typography, spacing and interaction.
GSAP is staged
and verified, but not integrated. ImageMagick is ready for asset preparation and comparison
work; FFmpeg is verified for the next audio export and loudness checks. Nick's September7 local
playable campaign now includes audiovisual implementation beyond U2–U4; human appearance/listening
acceptance remains open, and all eight anatomical animation families remain incomplete.

GPU rendering (audit 2026-09-06): prior pilot B and refined ship/ecosystem recipes explicitly
used Cycles CPU with four render threads. Future asset working copies should select **Metal
on the M4 Pro** and **OptiX on Nick's Windows RTX 4080**, following Blender's
[GPU rendering requirements](https://docs.blender.org/manual/en/5.2/render/cycles/gpu_rendering.html).
Enumerate and enable the actual GPU, set the scene to GPU Compute, and record the Blender
build, backend, device name, applicable driver and render result in the receipt before claiming
GPU use. The Windows card model is Nick's report; its installation and driver have not been
inspected here. Keep preserved source originals unchanged; apply device selection only to
working copies. On 2026-09-08 a factory-startup **actual Metal render passed** in Blender
5.2.1 LTS, build `9e2066aef7ef`, using only `Apple M4 Pro (GPU - 16 cores)` with CPU devices
explicitly disabled. The synthetic 192×192 material/lighting scene rendered at 16 samples in
151.113 seconds; a one-second process sample during the initial delay found Cycles Metal kernel
compilation/XPC waits. The PNG passed dimensions/color inspection and visual review. Receipt:
[audits/CREATURE_BLENDER_CANID_20260908/metal-qualification/metal-qualification.json](audits/CREATURE_BLENDER_CANID_20260908/metal-qualification/metal-qualification.json).
This qualifies that bounded render/backend, not candidate anatomy, every shader or a measured
speedup over CPU. The actual Wolf candidate subsequently rendered five440px/16-sample poses
on that same GPU-only backend; final process6.468s, saved-model checks PASS. This is separate
from the synthetic qualification and carries its own render receipt in the Wolf audit.
Preserve the earlier enumeration-only and CPU-render provenance.

## Installed and active

| Tool | Verified version / installation | Purpose and actual use |
| --- | --- | --- |
| Blender | 5.2.1 LTS, /Applications/Blender.app | Python-controlled modeling, materials, lighting, background renders; existing source/save/reopen/render evidence retained. |
| Inkscape | 1.4.4, /Applications/Inkscape.app; outside-sandbox confirmation 2026-09-08 artifact PASS | Isolated 128×128 SVG→PNG export matches September 7 bytes. GDK CVDisplayLink warning accompanied exit 0, not a crash; [artifact verdict](audits/INKSCAPE_CONFIRMATION_20260908/artifact-verdict.json) preserves the controller red. Keep emoji; no new icon study. |
| ImageMagick | 7.1.2-31, Homebrew imagemagick | Contact sheets, dimensions, color/alpha inspection and pixel comparisons for U3/U4 and exported assets. |
| FFmpeg / ffprobe | 9.0.1, Homebrew ffmpeg 9.0.1_1 | Audio/video conversion, file inspection, PCM export, loudness/true-peak measurement and later motion proof clips. It is not a synthesizer host. |
| Surge XT | 1.3.4 app, VST3 and AU | Original synth patches; /Library/Audio/Plug-Ins/VST3/Surge XT.vst3 and matching AU exist. The installed Surge CLI is not proven as an offline WAV renderer. |
| REAPER | 7.79.0_06dd787u | Existing .rpp, embedded MIDI/plugin state and reference renders. Desktop process/dialogs remain possible; a license file exists, validity/recognition unverified. Never print/read its key for inventory. |
| Python | Homebrew python@3.12 3.12.14 | Isolated scripting runtime at tools/audio-render/.venv; standard library only for now. Apple Python 3.9.6 remains separate. |
| GSAP | 3.15.0 in tools/ui-motion | Isolated motion-authoring dependency; not imported by the game. Future integration respects reduced motion and native focus/click owners. |
| Node / npm | 26.8.1 / 11.19.0 | Managed Node updated while idle at the 2026-09-07 startup; CLI capability verified. Bundled app Node processes remain separate. |
| Homebrew | 6.0.22 | Official formula/cask installation and scoped stable updates. |
| GitHub CLI | 2.100.0 (updated from 2.97.0) | Repository metadata and separately authorized GitHub operations; maintenance does not authorize hosted work. |
| Apple Git | 2.50.1 | Signed source history and normal agent-branch workflow. Apple/Xcode owns its updates; do not replace it with another Git installation automatically. |

The installed game development dependencies remain pinned: PixiJS 8.19.0, TypeScript 7.0.2,
Vite 8.2.0, Vitest 4.1.10 and raw-CDP ws 8.21.3 (installed resolution). Pixi renders game
scenes; HTML/CSS/SVG own legible interactive UI; TypeScript catches contract errors; Vite
builds; Vitest exercises deterministic behavior. The existing root and v2 verification tools
own layout, accessibility/actionability, persistence, determinism, assets and performance.
They use isolated Chromium-family browsers; never inspect the user's desktop or browser
profile. Installed browsers retain their vendor update mechanism and per-run provenance.
No Playwright/Puppeteer or new browser extension is needed for the current test workflow.

## Deliberately inactive or not installed

- **AssetPack 1.7.0** was installed under Nick's earlier instruction in tools/pixi-tooling,
  alongside an isolated PixiJS 8.19.0 peer. It is parked until after U4; no game connection.
  Its dependency tree includes a bundled FFmpeg binary; use the new explicit Homebrew binary
  for maintained media work. It is not the authoritative ffprobe/loudness toolchain.
- **Pixi DevTools:** npm helper 2.0.1 exists in that same isolated folder; official extension
  2.3.1 was downloaded and hash-verified, but not loaded into any browser or connected to the
  game. Excluded from the required terminal-only workflow. No cleanup/uninstall was requested.
- **Pedalboard, DawDreamer, NumPy and Mido:** not installed in the audio venv. The next possible
  step is an explicitly approved bounded no-GUI Surge experiment, not general audio migration.
- **SoX, separate AVIF encoder, Figma/Penpot, Rive and Krita:** no additions planned.
  ImageMagick brings WebP support as a dependency; no separate WebP installation is needed.
- **Lucide/Phosphor:** inactive; current emoji retained and no replacement-icon study underway.
- No Steam package, Unity/Unreal port, paid plugin or hosted rendering service is installed.

**Fresh Civet-study session — 2026-09-08:** all ten approved authoring-tool identities and
Homebrew 6.0.22 remain current in the official metadata check. Scoped `brew outdated` returned
empty formula/cask lists and resolved REAPER’s 7.79 build suffix. No update was eligible; no
capability requalification was needed. REAPER remained open/current; no jobs were interrupted.
[Startup receipt](audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json) applies only to this
uninterrupted session. Nick explicitly authorized ImageMagick matte extraction after two built-in
image-generation transparency failures; preserved matte/edge evidence belongs to the Civet packet.
No scheduled prompt, dependency change or hosted action occurred.

## Coding-session startup runbook and automatic maintenance

Nick's revised instruction (2026-09-06): maintenance belongs at the start of a coding
session, independently of any chat. The daily thread automation was deleted. Do not create
a replacement timer or task. The agent performs this preflight when coding work begins in
a newly opened/resumed development session, after repository identity/sync checks and before
editing, building, rendering or certification. Merely opening an idle app does not execute
this runbook. Status questions and continued messages in the same uninterrupted session do
not trigger another update pass. A fresh session performs its own check, even on the same day.
This inventory/runbook covers macOS; Windows requires its own verified inventory and commands.

1. Use the shared lock for maintenance and for an entire asset job or certificate chain:
   `node tools/with-toolchain-lock.mjs --label NAME -- COMMAND ARGUMENTS...`.
   Keep it held between stages. Do not update while a tool/app is open, a plugin is loaded,
   or another agent has a render/build/certificate in progress. The lock complements process
   checks; older jobs that predate it may still be active. Exclude only the known maintenance
   wrapper itself from its busy-process check. Never kill jobs or close apps to update.
2. At coding-session startup, run `node tools/development-toolchain.mjs --check` under that
   lock. It reads installed identities and official stable metadata; it does not install
   updates. The agent must perform step3 for eligible updates before starting development.
   Check failure means freshness is unknown, not current. Resolve a metadata suffix difference
   against `brew outdated`. Reuse the successful receipt only in this uninterrupted session;
   recheck local executable identity before use. New sessions do not reuse a prior session's
   freshness result. If an existing job/app prevents updating, record the tool/version and
   deferral; do not interrupt it or schedule a chat wakeup. Preserve the verified current
   version for ongoing work and reconsider eligibility at the next safe session startup.
3. If updates are available and the tools are idle, the agent applies the scoped updates
   automatically under Nick's standing maintenance instruction. Run `brew update`, then
   `brew outdated --json=v2 --greedy` for only the applicable allowlist entries. Set
   `HOMEBREW_NO_INSTALL_CLEANUP=1` and `HOMEBREW_NO_ANALYTICS=1`. Upgrade named formulae/casks
   only; for casks use `--no-quit`. No blanket `brew upgrade`, force/reinstall, auto-uninstall
   or cleanup. Inspect dependent changes too: Homebrew may repair/upgrade dependents.
4. The active Homebrew allowlist is imagemagick, ffmpeg, python@3.12, node, gh, blender,
   inkscape, reaper and surge-xt. npm comes with the managed Node installation. Homebrew itself
   updates through brew update. GSAP updates only inside tools/ui-motion with an exact selected
   stable version and refreshed integrity lock; check the current license before a major change.
   Stage/review its isolated diff and verify before using it. No packages are added to the audio
   venv automatically; when an audio host is later approved, its dependency lock becomes its owner.
5. Run `node tools/development-toolchain.mjs --verify` after installation/update or any executable
   identity change. It exercises synthetic image comparison, real PCM/ffprobe/ebur128, Python
   isolation/imports and GSAP interpolation. App plist versions are inventory only. An updated
   Blender/Inkscape additionally needs its bounded synthetic CLI render/export checked before
   producing assets. REAPER/Surge metadata cannot close the unresolved GUI-free render requirement.
6. Python updates must revalidate the existing audio venv, interpreter architecture/base path,
   imports and future pinned native packages. If broken, recreate an isolated environment from
   its existing lock; do not upgrade its packages as an incidental repair. Preserve the old
   environment until the replacement passes. Never modify Apple Python.
7. Record exact versions, command results, dependency changes and verification in this reference
   and dated audits. Refresh the personal nick-game-toolchain skill's dated inventory when it
   changes. A failed capability check prevents use of that updated tool; retain the failure and
   diagnose it, without automatic retries, silent fallback or an unverified rollback claim.

Updates are automatic for these active authoring tools when the above conditions hold. They
**do not update game/runtime/test-workspace dependencies**, sealed Compendium inputs, browser
certificate pins, workflows, policy, protected art or source masters. Such updates remain bounded
code changes with their existing approval and validation rules. A REAPER upgrade that requires a
new paid entitlement stops for Nick; no purchases, license entry or account changes are authorized.
Other games use their own repository rules and locks; Celestial Frontier's release/hosted authority
never transfers merely because they reuse this tool suite.

Startup completion records the check time, machine, tool identities, available updates,
updates applied, capability results and explicit deferrals in the session handoff or dated
audit. Report actual updates or problems briefly. Keep versions fixed for the ensuing render
or certificate chain. An identity change during the session requires verification before that
tool's next use; it does not authorize a mid-chain update.

The former `maintain-game-development-tools` thread automation was deleted on2026-09-06 at
Nick's request. No scheduled maintenance remains attached to this conversation. `AGENTS.md`
and `PARALLEL_GIT_PROTOCOL.md` require the startup preflight; the reusable personal
`nick-game-toolchain` skill carries it to future game sessions. Its dated inventory is a
starting point, not a substitute for checking the machine. No hosted Actions run is involved.

## Terminal examples

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python recipe.py
/opt/homebrew/bin/inkscape input.svg --export-type=png --export-width=132 --export-filename=output.png
/opt/homebrew/bin/magick montage image-*.png -tile 3x -geometry +8+8 proof.png
/opt/homebrew/bin/ffprobe -v error -show_streams -of json cue.wav
/opt/homebrew/bin/ffmpeg -nostdin -i cue.wav -af ebur128=peak=true -f null -
tools/audio-render/.venv/bin/python script.py
```

Use a private working copy for source artwork/audio, fresh scratch outputs for verification,
and the shared lock around real jobs. Editable .blend/.rpp/patches/MIDI/WAV masters stay in the
hashed, independently backed-up private source location. Commit optimized approved outputs;
no Git LFS. Preserve installed-PWA128MiB pack/256MiB retained-update policy and Safari limitations.

## Unresolved headless audio decision

Pedalboard supports VST3 instruments, MIDI timestamps and offline48kHz PCM16 WAV. It does not
prove this exact Surge setup works without a GUI: the open Surge preset-loading issue394
reports an editor dependency. Our .surge.xml/RPP state also needs a verified host-state bridge;
neither file is directly a .vstpreset. DawDreamer is an alternative, not a demonstrated fix.
Use one existing **cf-pilot-ui-settlement** cue for a future approved A/B: basin-navigation-glass
patch, preserved MIDI's three notes at186s, existing0.7s/33,600-frame mono48kHz reference.
Preserve note timing, relevant pre-roll, stereo synth processing, gains, mono conversion,
fades and deterministic dither. Compare samples and repeatability before LUFS/true peak.
No render experiment or host installation is authorized by the three-tool setup.

REAPER's recognized valid license should remove its evaluation reminder, but neither -nosplash
nor a license establishes unattended device/plugin behavior. Current license-file existence is
not purchase or recognition proof. No key contents were inspected. Existing projects remain useful
regardless of the eventual headless host choice.

## Sources and evidence

[AssetPack](https://pixijs.io/assetpack/docs/guide/getting-started/installation/) ·
[DevTools](https://pixijs.io/devtools/docs/guide/installation/) ·
[Pedalboard API](https://spotify.github.io/pedalboard/reference/pedalboard.html) ·
[Surge issue394](https://github.com/spotify/pedalboard/issues/394) ·
[ImageMagick](https://formulae.brew.sh/formula/imagemagick) ·
[FFmpeg](https://formulae.brew.sh/formula/ffmpeg) ·
[Python venv](https://docs.python.org/3.12/library/venv.html) ·
[Homebrew update behavior](https://docs.brew.sh/Manpage) ·
[GSAP license](https://gsap.com/community/standard-license/) ·
[REAPER pricing](https://www.reaper.fm/purchase.php).

Current setup evidence: audits/DEVELOPMENT_TOOLCHAIN_SETUP_20260906.json (written after checks).
Earlier tool setup is in audits/UI_TOOLCHAIN_SETUP_20260905.json; preserved Blender/REAPER/Surge
readiness is in audits/AAA_BATCH_A_RECONCILIATION_20260904.md. The later Inkscape control is in
audits/INKSCAPE_REQUALIFICATION_20260907/manifest.json. ROADMAP.md owns the current playable campaign
and remaining acceptance gates. This reference replaces the earlier inventory in place; audit history stays.
