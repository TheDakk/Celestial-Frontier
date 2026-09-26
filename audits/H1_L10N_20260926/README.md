# H1 device probe (performance / heat / memory) and A6 localization scaffolding (Claude, 2026-09-26)

Branch `claude/h1-probe-l10n` from `832dc18b`.

## 1. H1 device probe: the sections that gate D6 and Phase 9

`?deviceProbe=1` already had its codec check (D15). It now also has three sections, all measured inside the page and fully offline.

**PERFORMANCE**, one run per pair:
- The two pairs are the heaviest shipped pair, **Centipede vs Chimpanzee** (the C3/C12 skin cost), and an ordinary pair, **Civet vs Wolf**.
- Each pair plays the real painted battle2 stage (the matchup picker's scripted bout) for 20 s, on the app's own ticker. A bout that finishes is replayed.
- Reported numbers:
  - rAF frame intervals: p50/p95/max, and the count ≥ 25 ms.
  - The battle2 stage's own ticker work per frame, timed with `performance.now`: p50/p95/max, and the count over 1000/60 ms.
  - A verdict against the 60 Hz pacing budget.
- Frames while a study is loading, or between bouts, are excluded from the numbers and counted separately.

**HEAT / THROTTLE:**
- 3 minutes of the heaviest pair, bout after bout.
- Each 30 s window is judged by the same pacing budget. The page reports the drift in interval p95 and stage-work p95 between the first and last judged windows.
- iOS exposes no temperature to a web page, so this is a frame-time **proxy**, and the page says so.

**MEMORY:**
- The JS heap only where `performance.memory` exists. On iOS Safari it reads "unavailable" and is never estimated.
- The painted card archetypes resident, against their limit of 2.
- The morph atlas cache: entries, bytes, borrowed, produced and evicted, against 8 entries / 96 MiB.

**Budgets are read, never changed:**
- The pacing budget is `inspectFramePacing` (`port/v2/tools/quadruped-proof/motion-proof-contract.mjs`): fps ≥ 57, interval p95 ≤ 25 ms, max ≤ 100 ms, at least 570 playing frames. A test checks the probe's table against the owner at its boundaries: p95 25/26, max 100/101, 30 Hz and 56 fps.
- The long-interval and busy-frame counts are the ones Codex's native summaries use.

**Tests** (`port/v2/tests/device-probe-performance.test.ts`, 12):
- The analysis for every outcome, including a **control**: a fake long-frame trace (one 120 ms frame) and a 30 Hz trace report a FAIL, never a pass. Removing the max check fails this test and the parity test.
- Budget parity with the owner, and the heat windows and drift.
- The recorder on a fake stage: the stage's ticker work is timed, a finished bout replays, non-playing frames are excluded, the matchup is disposed, and a failed study is reported with its reason.
- Memory honesty, the page's Copy text, and flag-gating: `main.ts` never imports the sections, and only the flag-gated probe does.

**Trap found on the way:** statically importing the morph atlas cache into the probe module pulled pixi's WebGPU types into the strict root program (C24's clean state; 184 errors). `main.ts` now supplies the cache counters through a dynamic import, which is the same module instance the stage uses.

### How Nick runs it on the iPhone
1. Open the dev URL in Safari: `https://dev-celestialfrontier.github.io/?deviceProbe=1`. If Field Training appears behind it, the probe overlay is still on top.
2. Plug the phone in or keep it at a normal charge. Close other apps. Leave Low Power Mode off, unless you want a second run with it on.
3. **Run codec check** (a few seconds).
4. **Run performance (≈45 s)**. Keep the screen on and don't touch it; the two fights play behind the overlay.
5. **Run heat (3 min)**. The phone may warm up; that is the point.
6. **Read memory**.
7. **Copy results**, then paste the whole block into chat.

These numbers gate D6 (battle2 as the default) and the Phase 9 budgets. The probe changes no budget.

## 2. A6 localization scaffolding: Settings, the first extracted surface

**Pattern** (`port/v2/apps/game/src/i18n.ts`): source-string catalogs, gettext-style.
- Each surface owns one catalog of its exact English strings: visible text plus `title` / `aria-label` / `placeholder`.
- A locale maps each source string to its translation.
- After the surface renders its unchanged English markup, `localizeElementV1` swaps every catalogued string once.
- **English is the identity.** No localizer is registered unless `?locale=` names a non-English locale (`panels.ts` `setPanelLocalizerV1`, registered by `main.ts` behind that check). The default game is therefore byte-identical by construction, and `fillSettings` itself is not edited.
- **Fallbacks:** a missing translation falls back to English with a dev warning. An uncatalogued string is left as rendered and warned the same way. Player data is marked `data-l10n-skip` and never touched.

**Catalog and locales:**
- `SETTINGS_CATALOG_V1` holds all 50 strings the Settings template renders (collected by rendering the exact shipped `fillSettings`).
- Locales: `en`, and `qps-ploc`, a pseudo-locale: accented, about 40% longer and bracketed, so a missed string or a clipped control is obvious.

**Tests** (`port/v2/tests/l10n-settings.test.ts`, 4), all on the exact shipped `fillSettings` in JSDOM:
- **Completeness in both directions:** every rendered string is catalogued, and every catalogued string is rendered. Control: a catalog missing one string is caught.
- **English:** byte-identical.
- **Pseudo-locale:**
  - every catalogued string is translated;
  - the markup is structurally identical (the same elements, ids, `data-sel`, pressed states, classes and hidden flags);
  - the localized Folded survey card switch still lands its press.
- **Fallback warnings,** and the `data-l10n-skip` guard.

**Not proven here:** JSDOM cannot lay out text, so the pixel fit of the ~40% longer strings needs a real-browser run: the uilayout harness or the dev URL with `?locale=qps-ploc`, then open Settings. The Settings rows use the panel's existing wrapping rules; nothing was restyled.

**Extending it:**
1. Collect the surface's rendered strings, as the test does.
2. Add a `<SURFACE>_CATALOG_V1`.
3. Register the panel's localizer, or call `localizeElementV1` after the surface renders.
4. Copy the four tests.

The next surfaces are the explorer-name and nameplate rows inside Settings (they have their own owners), then the Guide and the Compendium. Real translations come after that; adding a locale is one table.

## Proposed release bullets (for Codex's batched C17/D19 re-measure; the sealed inventory is not edited here)
- **Under the Hood:** "🌐 READY FOR OTHER LANGUAGES: the Settings panel now draws its words from a translation table (English unchanged); more screens follow."
- **Under the Hood:** "📱 DEVICE CHECK: a hidden page (?deviceProbe=1) measures how smoothly the painted battles run on your phone, over a longer stretch as it warms up, and what the painted art keeps in memory, and gives you one block to copy. It sends nothing anywhere."
