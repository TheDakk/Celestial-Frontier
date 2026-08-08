• # Celestial Frontier v2 — Read-Only Code Review

  Date: 2026-08-08
  Scope: C:\Projects\Celestial-Frontier\port\v2
  Review type: Bugs, exploits, UI/UX issues, and training issues
  Status: Read-only review; no files were modified

  ## Prioritized findings

  ### P0 — Field Training restart can reload before the save completes

  File: port/v2/apps/game/src/main.ts
  Location: Around line 253

  The restart handler sets save.tutDone = false, starts persistView() without awaiting it, and immediately reloads the page. Because IndexedDB writes are asynchronous, the reload can interrupt the write and leave training marked complete.

  Specific change:

  - Make the click handler asynchronous.
  - Disable the restart button while saving.
  - Await persistView().
  - Reload only after the write succeeds.
  - Display an error instead of reloading if persistence fails.
  - Change persistView() to report failure rather than swallowing all storage errors.

  ———

  ### P0 — Save import accepts almost-empty objects that can overwrite a real expedition

  File: port/v2/apps/game/src/main.ts
  Location: Around lines 461–473

  The import gate accepts an object if it contains any one recognized key. Inputs such as {"tut":true} or {"essence":0} therefore pass. importSaveV2() fills absent fields with defaults, producing a valid but nearly empty save that replaces the player’s expedition.

  Specific change:

  - Require the parsed value to be a plain object, not an array or primitive.
  - Require a supported save-version field.
  - Validate multiple structural anchors, such as identity, progression, and collection fields.
  - Reject inherited properties by using own-property checks.
  - Show an import summary before replacement.
  - Require explicit overwrite confirmation.
  - Add negative tests for:
      - Single-field objects
      - Arrays
      - Objects with inherited save fields
      - Unsupported versions
      - Structurally invalid collections

  ———

  ### P0 — Imported saves are not guaranteed to retain the promised byte-for-byte backup

  File: port/v2/apps/game/src/main.ts
  Location: Around lines 473–479

  The importer overwrites the IndexedDB primary before attempting to store the untouched original in localStorage. Failure to create the keepsake is silently ignored. Later saves from the port may discard veteran fields not yet represented in the port schema.

  Specific change:

  - Store the untouched original before replacing the primary.
  - Verify that the backup can be read back successfully.
  - Prefer storing it in the repository’s journal or backup store.
  - Make backup creation and primary replacement atomic where possible.
  - Abort the import and notify the player if the original cannot be preserved.
  - Add a recovery test in which backup storage fails.

  ———

  ### P1 — The save-import modal appears underneath interactive game UI

  Files:

  - port/v2/apps/game/src/main.ts
  - port/v2/apps/game/index.html

  Locations:

  - main.ts: Around line 177
  - index.html: UI z-index rules

  The import sheet uses z-index: 11, while the dock, top chrome, panels, and survey card use z-indices between 18 and 23. Players can therefore interact with controls rendered above the modal overlay.

  Specific change:

  - Place the modal above all normal application surfaces.
  - Mark background application content as inert while it is open.
  - Add role="dialog" and aria-modal="true".
  - Move focus into the dialog when opened.
  - Trap focus inside the dialog.
  - Close it when Escape is pressed.
  - Restore focus to the button that opened it.
  - Add a browser test that uses hit-testing to prove background controls cannot be activated.

  ———

  ### P1 — Partial training is recorded as fully completed

  File: port/v2/apps/game/src/training.ts
  Locations: Around lines 25–64 and 173–183

  The port currently provides only the navigation, survey, Atlas, and landing portion of Field Training. Finishing that short arc sets the shared tutDone flag. Players who complete it may never receive future cache, feeding, breeding, duel, injury, and healing lessons when those
  systems are added.

  Specific change:

  - Replace the single completion boolean with versioned training progress.
  - Persist a stable completed-step or curriculum-version identifier.
  - Do not mark the complete 21-step curriculum finished after the preliminary arc.
  - When new lessons ship, resume eligible players at the first unfinished lesson.
  - Preserve an explicit “skip all training” state separately from partial completion.
  - Add migration tests for saves from each partial curriculum version.

  ———

  ### P1 — Training focus lockdown can be bypassed with the keyboard

  File: port/v2/apps/game/src/training.ts
  Location: Around lines 138–169

  The lockdown changes pointer-events and opacity, but disallowed controls remain keyboard-focusable. Global keyboard commands also remain active. Players can use Tab and Enter to activate blocked controls or Escape to change navigation during a locked lesson.

  Specific change:

  - Apply inert to disallowed UI regions, with an appropriate fallback.
  - Remove disallowed controls from the tab order while training locks them.
  - Constrain focus to the tutorial card and allowed controls.
  - Make global keyboard and navigation handlers consult the training allow-list.
  - Restore prior focusability when the step changes or training ends.
  - Add tests that attempt Tab, Enter, Escape, and keyboard navigation during every locked step.

  ———

  ### P1 — Training progress is lost on reload

  File: port/v2/apps/game/src/training.ts
  Location: Around lines 76–97

  Whenever unfinished training initializes, stepIdx returns to zero. Only final completion is stored. A reload during training therefore restarts the player at the welcome screen, even if Earth has already been surveyed or charted.

  Specific change:

  - Persist the current stable step ID after every advancement.
  - Restore the saved step during initialization.
  - Validate restored steps against the current curriculum.
  - Resume at the closest safe step when a saved step no longer exists.
  - Persist any state snapshot needed to keep sandboxed training lossless.
  - Test reloads at every event-driven boundary, especially:
      - After surveying Earth
      - After adding Earth to the Atlas
      - After opening the Atlas
      - Before and after landing

  ———

  ### P2 — Reduced-motion settings do not cover CSS transitions

  Files:

  - port/v2/apps/game/src/main.ts
  - port/v2/apps/game/src/training.ts

  Locations:

  - main.ts: motionOK() and toast transition
  - training.ts: Tutorial spotlight transition

  motionOK() prevents some canvas motion, but CSS transitions for the tutorial spotlight and toast remain active regardless of the player’s motion setting or operating-system preference.

  Specific change:

  - Publish the effective motion preference as a root class or data attribute.
  - Add CSS that disables transitions and animations under reduced motion.
  - Include a prefers-reduced-motion: reduce fallback.
  - Update the effective class immediately when the setting changes.
  - Test both the explicit Reduced setting and Auto with the OS preference enabled.

  ———

  ### P2 — Panel focus and assistive-technology state are incomplete

  File: port/v2/apps/game/src/panels.ts
  Location: Around lines 45–72

  The panel manager remembers the opener but does not move focus into an opened panel, announce expanded state, or consistently hide closed panels from assistive technology. Keyboard users can remain focused behind an open panel.

  Specific change:

  - Set aria-expanded on panel-opening buttons.
  - Set aria-hidden on closed panels.
  - Focus the panel heading or first interactive control when opened.
  - Contain focus where the panel behaves modally on small screens.
  - Restore focus to the opener when closed.
  - Give close buttons meaningful labels using the visible panel name instead of an internal ID.
  - Add keyboard-only open, navigate, close, and focus-restoration tests.

  ## Recommended implementation order

  1. Fix the save-import validation and backup sequence.
  2. Fix the asynchronous training-restart write.
  3. Make the import dialog genuinely modal.
  4. Introduce versioned, reload-safe training progress.
  5. Enforce training lockdown for keyboard input and focus.
  6. Complete reduced-motion coverage.
  7. Improve panel accessibility and focus management.

  ## Verification expectations

  After implementation, run the relevant repository gates plus targeted negative controls. In particular:

  - Prove malformed and minimal save imports are rejected.
  - Prove a failed backup prevents primary replacement.
  - Prove training restart survives an immediate reload.
  - Prove training resumes at every saved step.
  - Prove forbidden controls cannot be activated by pointer or keyboard.
  - Prove the import modal blocks hit-testing against background controls.
  - Prove reduced motion eliminates both canvas and CSS motion.