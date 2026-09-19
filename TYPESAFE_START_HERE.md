# TypeSafe (Jev) in Celestial Frontier — Start Here

TypeSafe's System One model **Jev** answers typed questions (Choice / Noul / Score)
over text or JSON with calibrated probabilities. It does not generate text, does
not see images, cannot count or do arithmetic, and reads dates as text. Docs:
<https://docs.typesafe.ai/llms.txt>. Model `jev-latest` (= jev-1.13.0), 32k-token
state, $0.042 per million input tokens, output free.

## Where it fits here (decided 2026-09-19)

| Fit | Tool | Judges | Reads |
| --- | --- | --- | --- |
| 1 | `npm run typesafe:rig` | `_earthArt(name)` regex name→rig classifier | the 631-name Earth fauna roster |
| 2 | `npm run typesafe:reference` | `posture` and `eyes` in `port/v2/reference/fauna.json` | each row's name + mustRead + note |
| 3 | `npm run typesafe:judgetag -- --dir <smoke run>` | vision-judge verdict prose | `judge/*.json` defect/fix text |

Every tool prints **suspects for a human to confirm**. None writes back to the
source, the reference table, or the sentinel list.

## Where it does NOT fit

- **Not the art judge.** Jev is text-only. GOLD/POLISH/FAIL verdicts on PNG strips
  stay with the vision agent and Dakk's engine.
- **Not in the shipped game.** `main.js` and the v2 runtime are deterministic,
  offline, and have no server to hold a key. Nothing under `tools/typesafe-client.js`
  may be imported by game code.
- **Not numbers.** Aspect ratios, headFrac, rarity ladders, balance and fun-index
  math stay in code.

## Laws

1. The key lives only in the `TYPESAFE_API_KEY` environment variable of the shell
   running the tool. Never in a file in this repo, never in a commit, never in a
   handoff.
2. Every tool has `--dry-run`: it prints the first request and sends nothing.
   Review the question design there before spending.
3. Answers cache under `tools/reports/*.cache.json` (gitignored). A re-run pays only
   for new items; `--fresh` ignores the cache.
4. A disagreement between Jev and the code is a SUSPECT, never a verdict. The fix
   for a confirmed regex miss is a new `[name, rig]` row in `SENTINELS` in
   `tools/rig-audit.js`, so the build gate owns the truth, not the model.
5. Thresholds (`--min-confidence`) are starting points from the docs, to be tuned
   on our own data. Confidence summarizes the probability spread, not correctness.

## Setup

```bash
npm install
export TYPESAFE_API_KEY="<paste in this shell only>"
node tools/rig-secondopinion.js --dry-run
```

## The prompt (paste into a coding session)

```text
Before editing, verify that the repository root is
/Users/dakk/Projects/celestial-frontier-anthropic-mac and the branch is
anthropic/mac; if not, stop and report. Read CLAUDE.md, ROADMAP.md,
PROCESS_LAWS.md and TYPESAFE_START_HERE.md.

Use the typesafe-ai skill for this task. Jev is text-only and offline-tooling-only
in this repo: never route it into main.js or the v2 runtime, never write the key
to a file, never let it grade PNGs.

Task: run the TypeSafe second-opinion battery and turn confirmed suspects into
permanent gates.
1. Run `node tools/rig-secondopinion.js` (full roster). For every disagreement,
   decide by eye whether the regex in _earthArt or the model is wrong. For each
   confirmed regex miss, add a [name, expectedRig] row to SENTINELS in
   tools/rig-audit.js and fix the regex so `node tools/rig-audit.js` passes.
   List model misses in the batch log; change nothing for them.
2. Run `node tools/reference-secondopinion.js`. For each STRONG disagreement,
   check the real animal; correct port/v2/reference/fauna.json only when the
   stored value is wrong, and record each change with the reason.
3. If a judge run exists under port/v2/apps/game/smoke/<run>/judge, run
   `node tools/judgetag.js --dir <run>` and add the faulted-part counts per family
   to the run's GOLD_PASS notes so the fix queue is grouped by part.
Run `node tools/validate.js` after any main.js or reference change. Report token
spend from each tool's usage line. Commit locally with a descriptive message; do
not push, merge, or deploy unless Dakk authorizes it. Update ROADMAP.md's handoff.
```

## Design notes (for extending)

- State is a JSON object of named items; each question references its item with a
  backticked path (`animals.a3`). Independent questions go in ONE request, which
  runs them in parallel.
- Choice criteria use `{ what, not_for }` objects because the rig classes are
  routinely confused by name collisions; the `not_for` line carries the collision.
- Noul answers carry a single `noul` probability (no separate confidence).
- Batch sizes (30 names, 20 reference rows, 8 verdicts) keep each request well
  under the 32k-token state cap; the tools print `Items total` and batch counts on
  `--dry-run`.
