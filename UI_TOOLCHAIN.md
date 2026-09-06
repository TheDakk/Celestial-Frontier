# Celestial Frontier — UI and audiovisual toolchain

Matches the installed macOS tool inventory and repository setup as of **2026-09-05 local**.
This reference describes capability and usage; it does not establish artistic acceptance.
Current gameplay/pilot authority remains in ROADMAP.md. No Phase 2 implementation is enabled.

## Minimal working stack

| Tool | Installed version | Role and automation boundary |
| --- | --- | --- |
| Blender | 5.2.1 | Scripted modeling, materials, lighting, background renders. Earlier create/save/reopen/render proof remains valid; not rerun in this setup batch. |
| Inkscape | 1.4.4 (dcaf3e7) | Custom SVG icon/emblem artwork authored in code; CLI geometry and exports without the editor. New 132px PNG export verified in this batch. |
| GSAP | 3.15.0 | Exact dependency of @cf/game, committed npm integrity. Headless import/paused interpolation verified; not yet imported into the game or emitted in its build. |
| PixiJS | 8.19.0 | Existing browser rendering runtime; native HTML/CSS/SVG continue to own readable, accessible controls. |
| Surge XT | 1.3.4 | Synth/patch authoring. Installed surge-xt-cli is present; earlier help/version proof covers live MIDI/OSC/device options, not offline WAV export. |
| REAPER | 7.79.0_06dd787u | Existing editable .rpp/Lua projects and proven Surge VST3 renders. Scriptable; macOS UI/device/evaluation dialogs can still appear. |
| Node / npm | 26.7.0 / 11.19.0 | Existing TypeScript/Vite workspace, development builds and verification. |

FFmpeg/ffprobe/ImageMagick were not found on PATH or among the checked bundled runtime
binary directories. They are optional future encoding tools, not required for the existing
verified PNG/WebP/WAV pipeline. No extra application or engine was installed.

## Inkscape from the terminal

Homebrew installed `/Applications/Inkscape.app` and the wrapper `/opt/homebrew/bin/inkscape`.

```sh
inkscape --version
inkscape /path/to/source.svg --export-type=png --export-width=132 --export-filename=/path/to/output-132.png
```

Author SVG source directly in code. Export options suppress the editor window; do not add
`--with-gui` or `--batch-process` to ordinary exports. Not every interactive Inkscape feature
is promised as a headless operation. Scope visual checks to generated assets/game captures,
never desktop screenshots or the user's existing browser/profile. Keep editable artwork in
the private hashed/backed-up source location; commit only optimized game assets under the
existing source policy. The smoke fixture is synthetic test data, not production artwork.

## GSAP from the game workspace

From `port/v2`, normal `npm ci` restores the exact pinned dependency. Future app code can use:

```ts
import { gsap } from 'gsap';
```

No CDN request, account or editor is needed. This setup deliberately introduces no animation
owner or global ticker into the shipped application. Later integration must respect existing
Motion/effects preferences, avoid delaying controls, and tear down timelines with the owning
surface. Native click/focus/scroll/Close owners remain authoritative. Do not claim that installing
GSAP improves the present pilot; design implementation remains at the approval boundary.

A simple terminal-only capability check from `port/v2` is:

```sh
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
const target = { value: 0 };
const tween = gsap.to(target, { value: 100, duration: 1, ease: 'none', paused: true });
try {
  tween.progress(0.5);
  assert.equal(target.value, 50);
} finally {
  tween.kill();
  gsap.ticker.sleep();
}
JS
```

## Cost and audio recommendation

Blender, Inkscape and Surge XT are free. GSAP 3.15.0 uses its Standard No Charge license,
which permits commercial game interfaces; it is not represented as MIT/open-source.
[GSAP license](https://gsap.com/community/standard-license/).
No subscription/purchase is required for this UI setup.

REAPER remains the recommendation for preserving our existing editable project work. Its
60-day evaluation is fully functional; current licenses cost USD60 discounted or USD225
commercial, plus applicable tax. Discount applies to personal use or commercial use with
annual gross revenue at or below USD20,000, among other listed eligibility categories.
Nick's eligibility/payment state has not been checked. [Official pricing](https://www.reaper.fm/purchase.php).
Embedded Lua/EEL can drive actions and most API functions. [ReaScript](https://www.reaper.fm/sdk/reascript/reascript.php).

Strictly windowless offline audio remains an OPEN workflow requirement. The installed Surge
CLI does not establish an offline file renderer. If Nick prioritizes zero windows, evaluate a
single existing cue in a code-based offline plugin host before selecting/purchasing a replacement.
[DawDreamer](https://github.com/DBraun/DawDreamer) is a candidate, not installed or verified here;
Surge plugin/preset parity and device-independent operation must be demonstrated. It does not
replace .rpp editing. No audio app/device settings were changed in this batch.

## Browser and later desktop distribution

Keep the current browser/PWA build as the main implementation. Improved source art and UI can
feed the existing TypeScript/Pixi/native-control runtime; players install none of these authoring tools.
Installed-PWA offline promises still follow the existing asset/save policies and Safari limits.

Steam is a store/distribution platform; Unity and Unreal are alternative engines. Steam does not
require either engine. A later Electron desktop package can bundle our local HTML and assets,
so players need no development server. This is a candidate architecture, not a tested Steam build.
Desktop save locations, installation/update behavior, offline operation, keyboard/controller
behavior, performance and any promised Steam integration still need design and verification.
[Electron local HTML](https://www.electronjs.org/docs/latest/tutorial/examples).

Steam Direct currently costs USD100 per app plus applicable tax, recoupable after USD1,000
Adjusted Gross Revenue; Valve also reviews the store/build. No payment or publication is authorized.
[Steam fee](https://partner.steamgames.com/doc/gettingstarted/appfee) ·
[Review](https://partner.steamgames.com/doc/store/review_process).

Unity could be a separate engine port with substantial runtime/UI reimplementation and renewed
seed/save/determinism verification. Unity 6.3 supports selected mobile browsers; do not repeat an
outdated blanket no-mobile-Web claim. [Browser compatibility](https://docs.unity3d.com/6000.3/Documentation/Manual/webgl-browsercompatibility.html).
Unreal would also require a substantial port. Its documented Pixel Streaming approach runs the
game remotely and streams it to the browser, introducing an online server dependency that differs
from the current offline-PWA objective. [Pixel Streaming](https://dev.epicgames.com/documentation/unreal-engine/overview-of-pixel-streaming-in-unreal-engine?lang=en-US).
Neither new engine nor a desktop wrapper is part of this setup batch.

## Evidence

`audits/UI_TOOLCHAIN_SETUP_20260905.json` records the new setup checks. Existing Blender/Surge/
REAPER readiness details remain in `audits/AAA_BATCH_A_RECONCILIATION_20260904.md`; earlier pilot
verification and preserved sources remain in `audits/AAA_PILOT_REFINEMENT_20260905.md`.
