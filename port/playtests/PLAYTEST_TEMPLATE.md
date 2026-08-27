# Celestial Frontier Development Playtest

Copy this file; do not fill in the template itself.

## Binding

- Date/time and timezone:
- Tester identifier or anonymous label:
- Session type: HUMAN / MODERATED HUMAN / AUTOMATED PERSONA
- Preview URL:
- Full 40-character source commit:
- `preview.json` content SHA-256:
- Source branch:
- Browser and exact version:
- Device / OS / screen resolution / device-pixel ratio:
- Input: touch / mouse / keyboard / controller / assistive technology:
- Network or CPU constraint, if any:
- Starting save: fresh / imported copy / synthetic fixture / other:
- Moderator supplied a copied, non-production save blob before import: YES / NO / NOT APPLICABLE
- Guide showed **Celestial Frontier v2.0 development** and its full 40-character commit matched
  `preview.json`: YES / NO (stop if NO)
- Floating corner DEV badge was absent: YES / NO (stop and report a packaging defect if NO)

## Player lens

Choose one primary lens per session. Several separate people are better than one person
pretending to represent every audience.

- [ ] First-time player with no instructions outside the game
- [ ] Returning/veteran player importing a copy of an expedition
- [ ] Phone-first touch player
- [ ] Keyboard-only player
- [ ] Screen-reader or other assistive-technology player
- [ ] Low-vision, large-text, zoom, or high-contrast player
- [ ] Motion-sensitive / Reduced Motion player
- [ ] Explorer who surveys, searches, uses Atlas, and shares CF1 codes
- [ ] Completionist who uses Compendium, Records, objectives, and Charters
- [ ] Adversarial/speedrun player probing duplicate rewards, stale actions, and invalid codes
- [ ] Low-power or constrained-device player
- [ ] Other (describe lived experience without recording private medical information):

## Before play

- [ ] Confirm the page is on the approved separate preview origin.
- [ ] Open the in-game Guide and confirm **Celestial Frontier v2.0 development** plus the full
      40-character commit matches `preview.json`.
- [ ] Confirm there is no floating corner DEV badge; its presence is a packaging defect.
- [ ] Moderator confirms the tester's source save remains untouched and that a separate copied blob was prepared outside the preview.
- [ ] Start screen recording or note timestamps if the tester consents.
- [ ] Moderator gives no control hints unless the session explicitly tests guided play.

## Core journey observations

Record what the player actually did and understood; do not mark a step passed merely because
the corresponding button exists.

| Journey/outcome | Completed unaided? | Time / attempts | Confusion, delight, failure, or workaround |
| --- | --- | --- | --- |
| Understand the opening objective | | | |
| Begin or intentionally skip Field Training | | | |
| **Survey** an opportunity and explain the next useful action | | | |
| **Gather** finite resources from a world or star | | | |
| **Build** one available item in Engineering | | | |
| **Tame** fauna through the Planetside full-biosphere action | | | |
| **Visibly improve the ship** by equipping or applying the built upgrade | | | |
| **Reach farther** than the expedition could before that improvement | | | |
| **Return** to Sol/home and explain what persisted and what goal comes next | | | |
| Complete that Survey → Gather → Build → Tame → improve → farther reach → Return loop without a hidden-system workaround | | | |
| Distinguish Survey from the explicit Enter/Land action; add/reopen an Atlas destination; land and leave | | | |
| Find help in the Guide without outside instruction | | | |
| Open Compendium, Records, and Charters | | | |
| Share or follow a CF1 code without unintended progression | | | |
| Change Settings and verify the visible/audible result | | | |
| Import the moderator-provided expedition copy and reload without losing progress | | | |

## Accessibility and responsive checks

- [ ] Every required action is reachable with the tester's input method.
- [ ] Keyboard focus is always visible and follows a sensible order.
- [ ] A screen reader or the tester's named assistive technology exposes useful names, roles,
      states, status/live announcements, and the same required actions without visual-only clues.
- [ ] Escape/back closes only the top expected surface.
- [ ] Browser zoom / text size does not hide actions or force horizontal scrolling.
- [ ] High contrast / glass tint keeps text readable over the brightest art.
- [ ] Reduced Motion changes the experienced motion, not only a saved preference value.
- [ ] Screen rotation, safe areas, and the smallest tested viewport preserve controls.
- [ ] No overlapping panel, Guide, lesson, survey card, or dock steals the intended press.
- [ ] Audio controls and mute state behave honestly.
- [ ] Heat, battery drain, stutter, and delayed response are noted with elapsed time.

## Adversarial checks

- [ ] Repeated Land/award actions do not duplicate progression or currency.
- [ ] A stale survey card cannot act on a different seed/coordinate identity.
- [ ] Garbage, truncated, future-version, and wrong-type imports are refused without overwrite.
- [ ] A failed clipboard operation does not claim success.
- [ ] Rapid open/close, rotation, reload, and background/foreground cycles preserve state.
- [ ] Search and share inputs render as text and cannot inject markup or script.
- [ ] Unavailable Charter travel fails clearly without moving the player.

## Findings

Create one block per issue.

### PT-YYYYMMDD-01 — Short outcome-focused title

- Severity: blocker / major / moderate / polish
- Player lens:
- First seen at journey step:
- Reproduction from a fresh reload:
  1.
  2.
  3.
- Expected player-visible outcome:
- Actual player-visible outcome:
- Frequency: every time / intermittent (`x/y`) / once
- Screenshot/video/log reference and SHA-256 if external:
- Save/code needed to reproduce (redact private names):
- Suspected system, if known (do not require the tester to diagnose):
- Workaround, if any:
- Automated coverage that should be added or corrected:
- Retest commit/report: OPEN

## Session result

- Could this tester complete the bounded v2 slice? YES / WITH HELP / NO
- Did any existing behavior regress? YES / NO / UNCERTAIN
- Highest-severity finding:
- Three clearest strengths:
  1.
  2.
  3.
- Three highest-value improvements:
  1.
  2.
  3.
- Tester comfort/fun summary in their own words (short, with consent):
- Moderator interpretation (keep separate from tester words):

## Development handoff

- Findings accepted for this batch:
- Findings deferred, with reason/owner:
- Source files likely affected:
- In-game Guide/Training/release-note copy affected:
- System/reference Markdown affected:
- Tests to add and their deliberate failing controls:
- Exact next implementation step:
- Exact next retest lens and viewport/device:
- PR number/status:
- `develop`, `main`, production site, and preview-site state:
