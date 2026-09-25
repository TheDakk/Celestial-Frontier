# D13 stage 1 — companion care and bond (Claude, 2026-09-25)

Nick decided D13 ("yes", N3 Option B). This is stage 1, which Claude owns: stages 1a–1e of `audits/PROPOSALS_20260925/N3_COMPANION_DEPTH.md`.
Branch `claude/d13-care-bond`, based on `anthropic/mac` `e118af50`. Every commit is signed G.

## What landed
| Stage | What | Owner files |
|---|---|---|
| 1a | Tastes lifted **verbatim** from v1.8.9 `faunaTastes`, parity-tested over 5,000 seeds against the tracked legacy script, with a wrong-salt control. The Feed policy v2 table. The known/hidden taste projection. Bond levels 0–5 from distinct firsts, which unlock sidegrades only and never decay. The Rest duration. | `packages/domain/acquisition/src/companion-care.ts` |
| 1b | **Feed policy v2**, with no roll and no companion poison. Loved: +2 (+3 for flora tier ≥ 4) and mends 0.25. Neutral: +1 and mends 0.10. Disliked: 0, and harmless. First meal +1 XP, and +2 for each newly tasted flavour, each paid once via bond memories stamped with the committed active-play time (witness v2). Availability is projected on the active-play clock. The Compendium Feed preview shows the exact outcome, but keeps an untasted flavour's gain hidden ("A new taste: Meals N → ?"). Main verifies the request against the preview. | `feed.ts`, `arc5-feed-action.ts`, `compendium-feed.ts`, `main.ts` |
| 1c | **Rest.** One receipt seals the heal (`hurt` → 0) and a `rest:<readyAt>` lock, where `readyAt` is the committed snapshot plus 2 active minutes per 0.1 `hurt` (at most 20). `projectCompanionAvailabilityV1` releases the lock at that exact boundary, like Recovery. Until then it locks breed, combat, dispatch and Feed. The first recovery from Injured or worse becomes the bond memory `recovered:injured`. | `rest.ts`, `companion-availability.ts`, `arc5-rest-action.ts` |
| 1d | The **Care & bond** panel in the Compendium detail, iPhone first with 44 px targets. It shows the condition (v1 labels) or "Resting — N min of play left"; a "Rest (N min of play)" button; ♥ Favors / ⊘ Dislikes, with "?" until tasted; and the bond meter with its next unlock. Main's Rest runner claims the product-action barrier and publishes only the verified fixed point. | `companion-care-panel.ts`, `main.ts` (placed outside every executed test slice) |
| 1e | Outcome tests through the real controls; details below. | `tests/arc5-feed-action.test.ts`, `packages/domain/acquisition/test/{companion-care,feed}.test.ts` |

**Outcome tests (1e):**
- **Feed:** a press of Use 1 on the real Compendium Feed controller commits exactly the preview the player confirmed. The meal follows the taste table and reads back durably from the runtime's committed extensions. A repeat of the same flavour pays no more XP.
- **Rest:** a press of Rest on the care panel reads Injured, then Resting.
- **Clock skew:** moving the **device clock ±1 day** releases nothing. Only the active-play boundary does.
- **Mutation controls:** an unwired Rest press, a Rest that never releases, a feed capture that drops the clock, and a seed-only v1 salt all make the tests fail.

**A deliberate refinement of N3.** N3 said a Rest's heal would be "applied by the next receipt write". Instead, the heal is sealed at the Rest's own commit, and the companion is locked until the boundary. Every reader of `hurt` (combat, breed, the card) therefore agrees at every moment, and there is no deferred writer. The companion can't be used while resting, so the player sees the same thing either way.

**A bug found and fixed on the way:** Feed's exact-key input capture would have refused every live meal once Main passed the clock (`f2cbeeb0`). It is negative-controlled.

## Gate (`port/v2`, final head)
- `check-profile --profile=develop`: 5,405 passing. There are 2 reds, both already present on `e118af50`:
  - **I5**, the standing red.
  - **`slicesmoke-sixth-red-contract` "Guide and release oracle".** The sealed draft-bullet hash no longer matches the rendered bullets. It was introduced by Codex's `7ea28e02` (C23 pinned loader), which edited `release-content.ts`. I did not touch it; see ask 1 below.
- Run by hand, all clean: `tsc --noEmit --noUnusedLocals` (root), the app and worker typechecks, `artaudit`, `overridecheck` and `speccheck`.
- Two inventories I legitimately changed were updated: the acquisition package exports pin and the no-DOM domain inventory (92 → 94 files; both new files are scanned).

## Proposed player-visible bullets (Codex's sealed inventory — for the batched C17 re-measure, not edited here)
- **New Features & Systems:**
  - "🍃 COMPANION TASTES — every companion loves two flavours and dislikes one. Feed it to find out: a loved meal grows it faster and mends its wounds, a disliked one is simply eaten. No companion is ever poisoned."
  - "💤 REST — a wounded companion can rest at home: 2 minutes of play per step of injury (at most 20). It heals fully and returns when you've played that long. Nothing heals while the game is closed."
  - "💞 BOND — six levels, Wary to Soulbound, grown only from new shared firsts. Bond unlocks small perks, never combat power, and never fades."
- **Gameplay:** "Feeding is now deterministic: what your companion likes decides the result."

## Proposed Guide text (the Guide is sealed; for the same batch)
"**Care & bond.** Open a companion in the Compendium.
- Feeding reveals its tastes: ♥ loved flavours grow it faster and mend wounds, ⊘ disliked ones do nothing.
- Rest heals it on your play time.
- Bond grows from new experiences together, never from repeating the same thing, and never fades."

## Asks for Codex
1. **Re-measure the sealed release inventory.** It includes the pre-existing `7ea28e02` bullet-hash red, and it can take the bullets above in one pass.
2. **N3 stage 2a (later):** the mission rate table and the economy-share instrument. The `mission` assignment kind is shared with Rest (`rest:` prefix); keep that prefix reserved.
3. **Optional review:** the Feed witness v2 fields, and the fact that a disliked meal leaves `fed` unchanged but still consumes the flora (the v1 "the meal is always consumed" rule).

## Open questions (for Nick)
- **The Compendium mirror's `g.xp`.** Feed's care XP lands on the ownership row, which the progression surface reads. It does not yet land on the legacy Compendium mirror genome's `g.xp`, as the friendly duel's does. Should care XP also update that mirror?
- **The fed cap.** A companion at the 200-meal cap still refuses meals, as before, so a capped companion can't be mended by food (Rest still works). Keep that?
