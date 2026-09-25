# A5 gaps, CFB export and D18 folded card (Claude fork, 2026-09-25)

Branch `claude/a5-cfb-d18`, cut from `anthropic/mac` `8aaea885`. All commits are signed. Nothing was pushed.

## What landed

| Item | Commit | Test (outcome, real presses, durable read-back, mutation controls) |
|---|---|---|
| **D18 folded survey card:** an option, off by default | `986cf35b` | `tests/d18-survey-folds-outcome.test.ts` (4) |
| **D16 CFB export:** Share code, plus a 🏆 Champion code once the companion has XP | `81965e22` | `tests/d16-cfb-export-outcome.test.ts` (5) |
| **A5 #11:** leave world is durable | `a5ce8844` | `tests/a5-leave-world-outcome.test.ts` (3) |
| **A5 #92:** a search pick is durable (Follow receipt) | `3e8ea2eb` | `tests/a5-search-pick-outcome.test.ts` (3) |
| **A5 #81/#82 on Land:** the Charter bank and ledger | `b7d9a1e5` | `tests/a5-land-ledger-outcome.test.ts` (3) |
| **A5 #73:** the slot picker (v1's doll → v2's Inventory slot select) | `99446763` | `tests/a5-inventory-outcome.test.ts` (+2) |

### D18: how the folded card works
- **Storage.** The switch (Settings → "Folded survey card", `#setfold`) is a device preference in guarded localStorage, never the save. Its open/closed memory reuses the save's existing `cardExpand` bits 1 and 2, as in v1.
- **Default stays flat.** The preference rides on the card element (`data-survey-folds`). `showSurvey` keeps its original flat row expression, so the default card is byte-identical. The test proves this, and its control shows the folded markup differs.
- **Placement in Main.** The fold press sits in the card listener *after* `const act`. That respects the Arc 4 close-control law, which forbids a `persistView` before `const act`.
- **Tests stay green.** The flag and the row helper were placed outside every other test's executed slice. Only `a5-settings-identity-outcome` needed one env name (`surveyFoldsOn`).

### CFB export: how sharing works
- **Codec.** It uses v1's `encodeCreature` verbatim; decode still strips injuries and level, except for a champion code.
- **Delivery.** The code is shown in a read-only box and offered to the clipboard. Sharing writes nothing.
- **Round trip.** The test pastes explorer 1's code into explorer 2's real Duel. That settles one durable receipt against the same name, seed and battle stats.

## Still open
- **#57, a Titan fought through the card to the Prime Signature.** The fixture needs a Titan placed within reach at the fixture's ascent stage, and a champion that can win. The Guardian harness is the template.
- **The capture ledger.** The only capture fixture that is pressed (Scavenge) pays 0 Stardust and moves no Charter goal. A ledger read there passed even with the publication mutant, so I reverted it rather than ship a vacuous check. It needs a rare-find tame fixture.
- **The Feed ledger.** v2 Feed has no XP yet. D13's first-award XP will bring it, with its own tests.

## Proposed release bullets (for Codex's batched C17/D19 re-measure — the sealed inventory was not touched)
- **UI Enhancements:** "📂 FOLDED SURVEY CARD — an option in Settings folds a world's environment and census rows behind remembered toggles, as in the original; the card stays fully open by default."
- **New Features & Systems:** "🔗 SHARE YOUR CREATURE — a companion's Friendly duel panel now gives its battle-ready CFB- code (and a 🏆 champion code once it has earned XP) for a friend to paste into their own duel."

## Notes for Codex
- **Settings panel height.** Settings gains one row (`#setfold`), so re-check any Settings capacity or Glass measurement.
- **Default card unchanged.** The survey card markup is unchanged by default. When the option is on it adds `.grp` / `.ghead` / `.gbody` (CSS in `index.html`), with 44px header targets.
