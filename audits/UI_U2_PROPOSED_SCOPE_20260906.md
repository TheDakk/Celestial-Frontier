# Proposed next checkpoint: U2 sheets and stacking

**Status: proposed for Nick's approval; no U2 implementation has started.**
This proposal changes the original “Do not start U2–U4” boundary and carries an honestly open
U1 phone gate into the next checkpoint. U1's accepted visual design is retained. It does not
claim checkpoint PASS or waive any check required before integration.

## Concrete first correction

The clean b457a7a small-phone report measured Planetside at y210–390 and the bottom guidance at
y367.5–444 on 320×568@2: a real 22.5px overlap. U2 owns sheet/hint/toast lane separation.
Use this retained geometry as its first failing case, including larger-text preferences.
Measure live hint height, safe area and dock position; keep useful sheet content and 44px targets.

## One bounded U2 checkpoint

1. Consolidate panel/sheet header, native Close and internal scrolling under one presentation
   owner. Phones place sheets above the measured hint lane; larger screens preserve their
   existing anchors, with Settings centered according to the established behavior.
2. Consolidate stacking and lanes. Preserve the earned behavior that explicitly opened Settings
   stays above Training; Training stays above ordinary sheets. This explicitly resolves the
   pasted brief's conflicting Training-above-Settings line in favor of the shipped fix. Separate
   sheet, toast/achievement, caption and dock rectangles, including the retained 22.5px case.
3. Apply the existing motion/state tokens: 150–250ms transitions, reduced-motion preference,
   visible focus and stable pressed/selected/disabled controls. Preserve native focus ownership,
   Close/Escape behavior, emoji, gameplay, saves, persistence receipts and Training steps.

## Evidence and stop

Retain the current RED and make deliberate geometry/order faults fail before accepting restored
results. Check the affected small-phone/larger-text and other U2 viewport compositions. Run the
required static, Slice and both phone checks once on the completed clean committed checkpoint,
with the existing no-unchanged-retry/stop-on-red rule. The retargeted native Charts Settings flow
must actually run; it has 12 focused tests but the preceding Planetside RED prevented its browser
execution. U1's gate stays open until the relevant checks pass, and neither old unknown cause is
closed by nonrecurrence.

U3 panel reskins, U4 layout-gate implementation, Phase 2 audiovisual work, hosted actions, PRs,
merges and releases remain outside this proposal. Claude's worktree stays untouched. Codex owns
this checkpoint in openai/mac; Claude can wait until a future approved develop integration.
