# Review 2 of 4 — Training, UI, Momentum, and Human-Facing Guidance

**Lens:** UX designer + onboarding QA + mobile tester  
**Verdict:** **8.5/10**

---

# Momentum Layer Verdict

The v1.8 connection strategy is working. These are not cosmetic changes; they materially improve the player’s ability to understand what to do next.

## Actionable denials

Fresh Breed and Feed denials showed the missing requirement directly on the button:

- `Needs another fauna`
- `Needs flora`

Opening the denial produced:

- what was missing
- why the action could not proceed
- where to obtain it
- a destination CTA

The tested CTA opened the Star Atlas correctly.

**UX result: strong**

## Accessibility defect

The same buttons use `aria-disabled="true"` even though they remain interactive guidance buttons and Enter activates them.

This can cause assistive software to announce the control as disabled or suppress its expected action.

**Fix:** remove `aria-disabled`; expose the denial as an actionable “open guidance” control with `aria-describedby`.

---

# Stall Detector

After ten interactions without progress, the objective changed from a repeated goal to a concrete action:

> Accept a charter — First footfall: Mercury

The suggestion was available and appropriately directed to Charters.

**UX result: useful rather than vague**

A future refinement should add a cooldown/dismiss state if the same player ignores the same suggestion repeatedly.

---

# Mini Quest Log

Clicking the objective chip opened a compact log containing:

- the current chapter goal
- accepted charters
- live progress
- a route to the Charter board

At 390×844, the panel remained inside the viewport with no horizontal overflow.

**UX result: strong**

---

# Closed Drawers

## Compendium

With six species loaded:

- zero shelves auto-opened
- zero specimen cards were exposed until requested

## Shipyard

On open:

- no categories were expanded
- no recipes were displayed
- the summary still named the closest build and shortages

**UX result: reduced overload without hiding direction**

---

# Breeding Anticipation

Candidate rows showed information such as:

- candidate name and rarity
- temperament
- child power band
- reachable rarity ceiling
- success chance

Example:

> Fox · Common · stoic · Child ≈ 166–237 power · up to Uncommon · 95% success

The range creates anticipation without revealing the actual child.

**UX result: strong**

---

# Confirmed Training/UI Defect

## Training card blocks Settings › Audio

Settings is intentionally accessible during training, but the welcome lesson card sits above it.

| Viewport | Audio tab usable? |
|---|---|
| 320×568 | No |
| 390×844 | No |
| 768×1024 | Yes |
| 1024×768 | No |
| 1366×768 | No |

At blocked sizes, pointer hit-testing found the tutorial card or its contents over the Audio tab.

**Severity: Medium**

## Recommended behavior

When Settings opens during training:

- reduce the lesson card to a compact objective chip, or
- dock it away from Settings, or
- allow Settings to rise above it while retaining the tutorial state.

The player should be able to turn off new audio features during onboarding.

---

# Responsive Layout Matrix

Fresh tests opened:

- Charters
- Atlas
- Compendium
- Records
- Settings
- Shipyard

Across:

- 320×568
- 375×667
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1366×720
- 1440×900
- 1920×1080

Results:

- 54/54 panels opened
- 54/54 stayed within viewport bounds
- zero horizontal page overflows
- no browser errors

This is an excellent baseline.

---

# Training Evidence and Limitation

The supplied build notes report:

- 100/100 training simulations
- zero stalls
- smoke 527/0
- layout 561 checks across nine viewports

The complete jsdom/npm fleet could not be freshly reproduced in this environment because the ZIP did not include installed dependencies and offline retrieval was unavailable.

The UI-specific defects above were found through direct Chromium click and hit-test probes.

---

# Rage-Quit Outlook

A reliable numeric new rage-quit rate was not generated.

Nevertheless, the systems most likely to reduce rage quits are behaving correctly:

- denials redirect instead of dead-ending
- the stall detector suggests a feasible action
- quest state is visible
- dangerous conquest matchups are honestly labeled
- closed drawers reduce initial overload

The direction is positive. Quantifying it requires a matched human or stable DOM-driven campaign A/B.
