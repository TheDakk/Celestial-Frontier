# Celestial Frontier — development toolchain

Verified on **2026-09-06**, macOS 26.6.2 / Apple Silicon. This is the maintained tool reference;
versions are observations, never a permanent assumption. Nick authorized the three additions
and automatic maintenance of active development tools. Players install none of these tools.
The browser/PWA game remains the product; tooling readiness does not mean artistic acceptance.

## Executive fit

Blender creates models, materials, lighting and rendered art. Inkscape authors vector icons
and emblems. TypeScript, PixiJS and native HTML/CSS/SVG assemble those assets into a responsive,
accessible browser game. Surge supplies synthesis and the preserved REAPER projects retain
editable sound design. ImageMagick and FFmpeg prepare and inspect outputs. Python and Node
connect the command-line workflows. Verification tools check the actual game and final media.
No tool automatically supplies a professional art direction; coherence, readable layout,
interaction, animation, mixing and mobile performance remain implementation work.

GPU rendering (audit 2026-09-06): prior pilot B and refined ship/ecosystem recipes explicitly
used Cycles CPU with four render threads. Future asset working copies should select **Metal
on the M4 Pro** and **OptiX on Nick's Windows RTX 4080**, following Blender's
[GPU rendering requirements](https://docs.blender.org/manual/en/5.2/render/cycles/gpu_rendering.html).
Enumerate and enable the actual GPU, set the scene to GPU Compute, and record the Blender
build, backend, device name, applicable driver and render result in the receipt before claiming
GPU use. The Windows card model is Nick's report; its installation and driver have not been
inspected here. Keep preserved source originals unchanged; apply device selection only to
working copies. A factory-startup background query on this Mac enumerated
`Apple M4 Pro (GPU - 16 cores)` as METAL (Blender 5.2.1 LTS); no render was run.
GPU selection does not itself establish better artwork or a measured speedup.

## Installed and active

| Tool | Verified version / installation | Purpose and actual use |
| --- | --- | --- |
| Blender | 5.2.1 LTS, /Applications/Blender.app | Python-controlled modeling, materials, lighting, background renders; existing source/save/reopen/render evidence retained. |
| Inkscape | 1.4.4, /Applications/Inkscape.app | Code-authored SVG icons/emblems and terminal PNG exports; U3 icon study precedes any emoji replacement. |
| ImageMagick | 7.1.2-31, Homebrew imagemagick | Contact sheets, dimensions, color/alpha inspection and pixel comparisons for U3/U4 and exported assets. |
| FFmpeg / ffprobe | 9.0.1, Homebrew ffmpeg 9.0.1_1 | Audio/video conversion, file inspection, PCM export, loudness/true-peak measurement and later motion proof clips. It is not a synthesizer host. |
| Surge XT | 1.3.4 app, VST3 and AU | Original synth patches; /Library/Audio/Plug-Ins/VST3/Surge XT.vst3 and matching AU exist. The installed Surge CLI is not proven as an offline WAV renderer. |
| REAPER | 7.79.0_06dd787u | Existing .rpp, embedded MIDI/plugin state and reference renders. Desktop process/dialogs remain possible; a license file exists, validity/recognition unverified. Never print/read its key for inventory. |
| Python | Homebrew python@3.12 3.12.14 | Isolated scripting runtime at tools/audio-render/.venv; standard library only for now. Apple Python 3.9.6 remains separate. |
| GSAP | 3.15.0 in tools/ui-motion | Isolated motion-authoring dependency; not imported by the game. Future integration respects reduced motion and native focus/click owners. |
| Node / npm | 26.7.0 / 11.19.0 | Existing project/tool execution. Node 26.8.1 available, deferred because six managed Node processes were active during setup. |
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
- **Lucide/Phosphor:** deferred U3 icon study; no replacement of current emoji without review.
- No Steam package, Unity/Unreal port, paid plugin or hosted rendering service is installed.

## Before-use check and automatic maintenance

Nick authorized maintenance on 2026-09-06. The local daily maintenance task and every agent's
first tool use in a work batch follow this same procedure. This is macOS maintenance; it does
not claim that another Windows computer has been inventoried or updated.

1. Use the shared lock for maintenance and for an entire asset job or certificate chain:
   `node tools/with-toolchain-lock.mjs --label NAME -- COMMAND ARGUMENTS...`.
   Keep it held between stages. Do not update while a tool/app is open, a plugin is loaded,
   or another agent has a render/build/certificate in progress. The lock complements process
   checks; older jobs that predate it may still be active. Exclude only the known maintenance
   wrapper itself from its busy-process check. Never kill jobs or close apps to update.
2. At the start of each tool-using batch, run `node tools/development-toolchain.mjs --check`.
   It reads installed identities and official stable metadata. Check failure means freshness
   is unknown, not current. A metadata suffix difference must be resolved against `brew outdated`.
   Cache a successful check only within the same batch/day; recheck local binary identity before use.
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

The active local task is **Maintain game development tools**, daily at09:00 America/New_York
(automation id `maintain-game-development-tools`). The reusable personal skill is
`nick-game-toolchain`, installed under the local Codex skills directory. Its dated inventory
is a starting point; before-use verification remains required.

The scheduled task needs this Mac powered on and the desktop app running. Before-use checking
covers missed schedules. Automatic maintenance reports successful updates, failures or required
user action, and stays quiet when nothing changes. No hosted Actions run is part of maintenance.

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
readiness is in audits/AAA_BATCH_A_RECONCILIATION_20260904.md. ROADMAP.md owns current U1 work
and the approval stop. This reference replaces the earlier inventory in place; audit history stays.
