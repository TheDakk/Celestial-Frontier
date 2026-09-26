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

## Proposed release bullets (for Codex's batched C17/D19 re-measure; the sealed inventory is not edited here)
- **Under the Hood:** "📱 DEVICE CHECK: a hidden page (?deviceProbe=1) measures how smoothly the painted battles run on your phone, over a longer stretch as it warms up, and what the painted art keeps in memory, and gives you one block to copy. It sends nothing anywhere."
