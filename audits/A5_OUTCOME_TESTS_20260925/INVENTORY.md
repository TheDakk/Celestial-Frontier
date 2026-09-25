# A5 / Phase 8 gate — outcome-test inventory for every v1.8.9 player action

Scoped 2026-09-25 on `anthropic/mac` @ 7713ed60. Read-only survey. No code changed.

**The law (CLAUDE.md rule 7).** Assert the outcome, not the code path. A real outcome test presses the real control in the real app, then reads the committed save or ledger to prove the effect landed.

**Sources.**
- The v1 anchors are `main.js` line numbers.
- The v2 owners are in `port/v2/apps/game/src/`, with `main.ts` line numbers.
- Test paths are relative to `port/v2/`.
- `S:` means `port/v2/tools/slicesmoke.mjs`, `C:` means `tools/slicesmoke-contract.mjs` and `G:` means `tools/glassmatrix.mjs`.

## Classes

| Class | Meaning |
|---|---|
| **UI** (OUTCOME-UI) | Presses the real control in the real app. This is either CDP mouse, touch or key in slicesmoke or Glass, or a native `.click()` on code sliced from main.ts in JSDOM. It then reads committed durable state: F4 revision, receipt rows, v5 rows, IndexedDB `meta.save` or `readSaveV5`. For view-only actions (Kind V), the visible result counts as the outcome. |
| **DIRECT** (OUTCOME-DIRECT) | Drives the action owner or transaction against a real persistence backend and asserts the committed state. The usual stack is `createMemoryBackend` + `initializeFreshV5` + F4 runtime + `readSaveV5`. There is no control press. |
| **CODE** (CODE-PATH-ONLY) | Source-text wiring tests (the 41 `*-main-wiring` files read main.ts as a string), component tests with stub callbacks, or pure projections. Two related cases are also graded CODE: a real control pressed but only in-memory `api.state()` read (marked "UI-live"), and main.ts code run against fakes. |
| **NONE** | Ported, but no test of any kind asserts the outcome. |
| **UNPORTED** | No v2 control or owner found. The v1 action does not exist in the slice yet, or was dropped by an approved decision. This needs a parity decision, not a test. |
| **DORMANT** | Already disabled in v1.8.9 (`EVENTS_DORMANT = true`, main.js:23844). Out of scope. |

"Kind" is D if the action writes the save and V if it is view-only.

## Summary counts (124 v1.8.9 actions)

The table has 131 rows. The counts cover 124 of them, one row per v1 control or control group. They leave out six v2-only rows (#5, 28, 29, 54, 77, 131) and the cross-reference row #18.

| Class | Count | Durable (D) | View-only (V) |
|---|---|---|---|
| OUTCOME-UI | 43 | 33 | 10 |
| OUTCOME-DIRECT | 27 | 26 | 1 |
| CODE-PATH-ONLY | 10 | 3 | 7 |
| NONE | 5 | 3 | 2 |
| UNPORTED | 36 | 20 | 16 |
| DORMANT | 3 | 2 | 1 |

What the counts show:
- **85 actions are ported. 65 of them write the save.** Of those 65, 33 have a true UI outcome test, 26 are proven only at the transaction level (DIRECT), and 6 have code-path or no evidence.
- **Every durable UI outcome test but one lives in `slicesmoke.mjs`.** That instrument runs only locally on demand or in the hosted full lane. It is not in the browser-free `check-profile --profile=develop` battery (tools/check-profile.mjs:17-22).
- **The one browser-free UI outcome test** is the explorer-meal JSDOM slice (tests/explorer-meal-action.test.ts:595).
- **No vitest test boots main.ts.**
- **The 36 UNPORTED rows cover about 40 v1 controls**, because #9 and #117 each group several. They need parity decisions, not tests.

## Full table

Notes on the table:
- Most refusal and fault cases are left out; the table only names them where they are the best evidence.
- "Hook + durable" means slicesmoke triggers the action through `window.__CF_SLICE__.api` rather than a control. That counts as DIRECT.

### A. Navigation, survey card, landing

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 1 | Pan, zoom and mode transition (drag, wheel, pinch) | D (arrival receipt) | 3111, 3204, 3376 | main.ts:19185 input, then `settleArc9DirectTravel` 10735 | S:10156 sets the camera by hook, then S:10330 checks the `arc9-galaxy-arrival-v1` receipt → **DIRECT** | A real wheel or pinch should produce the arrival receipt |
| 2 | Survey an object by canvas tap | D (survey receipt) | 3111, 11773 | `surveyStar` 5809, `surveyPlanet` 7810, arc9-survey-action.ts | S:6314 CDP mouse, then S:6327 requires the `arc9-survey-v1` receipt (C:3683) → **UI** | — |
| 3 | Survey by keyboard | D | 3262 | same | S:6229/6244 CDP arrows and Enter, then S:6251 → **UI** | — |
| 4 | Close the survey card | V | 11787 | main.ts:8919 `[data-survey-close]` | S:13385 CDP pointer, save unchanged → **UI** | — |
| 5 | Survey dock reopen | V | (v2 dock) | main.ts:2572 | S:13524 CDP pointer, save unchanged → **UI** | — |
| 6 | Card fold (`gtoggle`, persists `cardExpand`) | D | 11807 | none (`cardExpand` is absent in v2) | — → **UNPORTED** | Parity decision |
| 7 | Life-forms roster fold and species row | V | 11826, 11850 | planetside roster `sideEl` (main.ts:8969) | — → **NONE** | Pressing a roster chip should open a catalogued card or refuse an uncaught one (the CF1802-09 anti-mint law) |
| 8 | "More" opens the Compendium from the card | V | 11834 | none found | — → **UNPORTED** | — |
| 9 | Vista reshow, fullscreen, tap-to-zoom | V | 11790, 10253, 10285 | none (the v2 vista is automatic) | — → **UNPORTED** | — |
| 10 | Save postcard | V | 10260, 10204 | none | — → **UNPORTED** | — |
| 11 | Depart / leave world | D (nav) | 11798 | main.ts:8938 `leaveworld`, then `goUp` | S:24097 CDP Enter and S:25330 touch read live mode only → **CODE** (UI-live) | Add a durable route read after the press |
| 12 | Land (card `landcta`) | D | 11862, 11180, 11007 | `doLand` 8128, arc0-landing-action.ts | S:28935 CDP mouse, then S:28937 `arc0-land` receipt and S:28993 reload; phone S:25267 → **UI** | — |
| 13 | Wave-off (failed descent) | D | 10980 | arc0-landing-action.ts | S:28957, then S:28951 `assessBoundedDescentWaveOff` → **UI** | — |
| 14 | Descent confirm "Stay" (decline) | V | 11199, 11167 | none (Land is direct) | — → **UNPORTED** | — |
| 15 | Pinch or zoom into a planet to land | D | 3376 | main.ts:19249 pinch; landing path unknown | — → **NONE** | Confirm a gesture landing commits the same `arc0-land` receipt |
| 16 | Bioscan / Discover Life (hazard, scout absorbs) | D | 11836, 12430, 10686 | `runArc9Bioscan` 11519, bioscan-action.ts | tests/bioscan-action.test.ts:516 (`readSaveV5` :374) → **DIRECT**. The control is never pressed anywhere (the agent sweep found 0 `data-act="bioscan"` presses in slicesmoke) | **Top gap** |
| 17 | Add to Atlas | D | 11885, 11947 | `addToAtlas` 8558, arc0-atlas-action.ts | S:28918 CDP mouse, then S:28921 `arc0-atlas` receipt; phone S:25543 → **UI** | — |
| 18 | Card fav, home, del | D | 11886-11899 | moved to Atlas rows (§B) | see #30-33 | — |
| 19 | Share this world (CF1) and copy code | D (share receipt) | 11869, 14651, 14670 | `commitArc9ShareSend` 7978, `copyShareCode` 7928 | S:28907 CDP mouse, then S:28909 `assessArc9ShareSendSettlement` (C:4509); copied code checked S:28908 → **UI** | — |
| 20 | Close the share box | V | 14673 | v2 has no share modal | — → **UNPORTED** | — |
| 21 | Card travel (`data-act="travel"`) | D | 13147 `travelTo` | main.ts:8927, `settleArc9DirectTravel` | tests/arc9-travel-action.test.ts:429 (`readSaveV5` :469) → **DIRECT**. The UI presses at S:6193, S:25155 and S:24017 read F4 writable plus live route only (UI-live) | Assert the receipt kind after the press |

### B. Star Atlas

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 22 | Open the Atlas | V | 12186 | `#dockatlas`, `fillAtlas` 4084 | S:29051 CDP mouse, rows checked in DOM → **UI** | — |
| 23 | View tab (list or chart) | V | 12131 | main.ts:4138 `data-atlas-view` | tests/star-atlas-panel.test.ts (pure) → **CODE** | — |
| 24 | Chart tap → travel | D | 12133 | `data-atlas-chart-point` → travel | — → **NONE** | — |
| 25 | Filter | V | 12145 | `data-atlas-filter` | — → **NONE** | — |
| 26 | Go home (travel home) | D | 12147 | `data-atlas-travel-home` | tests/arc9-travel-action.test.ts:429 → **DIRECT** | — |
| 27 | Row travel | D | 12181 | main.ts:4206 `jumpToProvenNav` | S:29087 CDP mouse, then S:29097 `arc9-galaxy-arrival-v1` receipt → **UI** | — |
| 28 | Row travel refusal (outer or unavailable route) | D (no write) | — | same | S:10567 and S:23563, then save bytes checked unchanged → **UI** | — |
| 29 | Cluster drill (v2 only; the v1 list was flat) | V | — | `data-atlas-cluster` 4158 | — → **NONE** | — |
| 30 | Favorite toggle (+`curator`) | D | 12148, 11891 | `runArc9AtlasFavoriteChange` 11319 | tests/arc9-atlas-favorite-action.test.ts:301 (`readSaveV5` :336) → **DIRECT** | UI press |
| 31 | Set or clear home | D | 12150, 11897 | `runArc9AtlasHomeChange` 10914 | tests/arc9-atlas-row-actions.test.ts:283 → **DIRECT** | UI press |
| 32 | Remove | D | 12162 | `runArc9AtlasRemove` 11040 | tests/arc9-atlas-row-actions.test.ts:349 (reload :405) → **DIRECT** | UI press |
| 33 | Undo remove (timed) | D | 12160, 13369 | `runArc9AtlasUndo` 11188 | same file, reload :461 → **DIRECT** | UI press inside the undo window |

### C. Compendium and specimen card

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 34 | Open the Compendium | V | 12896 | codex panel | S:23409 CDP Enter → **UI** (view) | — |
| 35 | Open a species card (row or pick) | V | 12892, 12555 | main.ts:4475 `fillCodexDetail` | S:23409, then S:23419 live detail → **UI** (view) | — |
| 36 | Rarity and kingdom filter chips | V | 12868-12871 | text query only (`codexFilter`) | — → **UNPORTED** | — |
| 37 | Category group fold | V | 12872 | virtual list, no groups | — → **UNPORTED** | — |
| 38 | Travel to the species' origin (`data-go`) | D | 12881 | none found | — → **UNPORTED** | — |
| 39 | Reveal queue next, skip all (`rev-x`) | V | 12751 | none found | — → **UNPORTED** | — |
| 40 | Field-notes and lineage folds (`cardExpand` 4/8) | D | 12716, 12726 | none | — → **UNPORTED** | — |
| 41 | Feed (picker: choose flora, confirm, retry) | D | 12738, 16725, 16455 | compendium-feed.ts, `runCompendiumFeedAction` 13525 | S:18994 `arc5FeedClick`, S:19453 confirm, then S:20156 `assessCompendiumFeedCommittedOutcome` → **UI** | — |
| 42 | Breed (picker) | D | 12737, 16703, 16365 | compendium-breed.ts, `runCompendiumBreedAction` 14341 | tests/arc5-breed-action.test.ts:370 (`readSaveV5` :471) → **DIRECT** | **Top gap** |
| 43 | Scout set or clear | D | 12739 | compendium-scout.ts, `runCompendiumScoutAction` 15073 | tests/arc5-scout-action.test.ts:245 (Charter join :317) → **DIRECT** | UI press |
| 44 | Rename species | D | 12748, 22133 | compendium-rename.ts, `runCompendiumRenameAction` 14666 | tests/arc5-rename-action.test.ts:222 → **DIRECT** | UI press |
| 45 | Voice on reveal / audition | V (audio) | 12568 | compendium-audition.ts, `runCompendiumAudition` 5111 | tests/compendium-audition.test.ts:229 (stubbed playback) → **CODE** | — |
| 46 | Share creature (CFB code) | V | 12734, 16006 | none | — → **UNPORTED** | — |
| 47 | Share champion (CFB) | V | 12735, 16018 | none | — → **UNPORTED** | — |
| 48 | Duel from card | D (XP) | 12736, 15977 | none (battle2 dev duel is URL-only) | — → **UNPORTED** | — |
| 49 | Discovery record | V | 12749, 16029 | none | — → **UNPORTED** | — |
| 50 | "Mend — safest meals" bulk feed | D | 16581 | none | — → **UNPORTED** | — |

### D. Capture and combat

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 51 | Tame (hit, miss, stale, storage fault) | D | 11876, 12407 | capture-card.ts, arc4-capture-action.ts, `runCaptureCardAction` 16014 | S:18387 CDP Enter, then S:18393 `assessArc4CommittedMiss`; hit S:17049/17117 → **UI** | — |
| 52 | Sample | D | 11878 | same | S:17650 `pressArc4Keyboard`, then S:17692 durable read (arc4-browser-contract.mjs:1963) → **UI** | — |
| 53 | Scavenge | D | 11877 | same | tests/arc4-capture-action.test.ts:353 (receipt and ownership, but no `readSaveV5` reload) → **DIRECT** | **Top gap**: the only verb never pressed |
| 54 | Capture disabled-button suppression | D (no write) | — | capture-card.ts | S:15604, then S:15673 save unchanged → **UI** | — |
| 55 | Conquer a world: choose champion and fight | D | 11872, 18543, 16664, 18583 | combat-card.ts, arc6-combat-action.ts, `runArc6CombatCardAction` 16450 | packages/persistence/test/combat-settlement.test.ts:801 (real writer, reload) → **DIRECT**. The app-level tests/arc6-guardian-champion.test.ts:317 uses a stub writer | **Top gap #1** |
| 56 | Guardian battle | D | 18583 | arc6 guardian | combat-settlement.test.ts:1201, :1292 → **DIRECT** | UI press |
| 57 | Titan felled → Prime Signature claim | D | 18662, 21975 | arc6 titan plus prime | combat-settlement.test.ts:1421, :1636 → **DIRECT** | UI press |
| 58 | Lead a conquest yourself (mercy law, <25% HP refused) | D | 16668 | combat-card.ts `player` champion | tests/arc6-combat-card.test.ts:386 (stub) → **CODE** | — |
| 59 | Play-time stardust harvest | D | 11873, 18754 | none (only the `harvests` counter survives) | — → **UNPORTED** | — |
| 60 | Share battle log | V | 15728 | `copyCombatChronicleLog` 7944 | tests/combat-chronicle.test.ts → **CODE** | — |

### E. Explorer HP, Shipyard, cargo

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 61 | Eat flora / heal (the ❤ picker) | D | 23743, 16690, 16882 | compendium-explorer-meal.ts, `runCompendiumExplorerMealAction` 13911 | tests/explorer-meal-action.test.ts:595 native "Eat 1" click on JSDOM-sliced main.ts code, then `readSaveV5` :637 → **UI** (the only browser-free one) | — |
| 62 | Death → wipe (`deathok`) | D | 16913, 18278 | none (v2 HP is nonlethal "brink") | — → **UNPORTED** | Confirm it was dropped by design |
| 63 | Open Shipyard, tabs, category fold | V | 20541, 20550-20554 | engineering-panel.ts | G:13711-13775 CDP → **UI** (view) | — |
| 64 | Mine (drill deploy) | D | 11874, 19055 | `mineCurrentSurface` 13067 | S:12840 `pressEngineeringPointer`, then S:12970 `assessArc3EngineeringAction` → **UI** | — |
| 65 | Skim a star | D | 11875, 18899 | `skimCurrentSystem` 13106 | S:14151 CDP Enter, then S:14155 → **UI** | — |
| 66 | Research purchase (`buyTech`) | D | 20556, 19090 | `purchaseEngineeringResearch` 13132 | S:13450, then S:13459 → **UI** | — |
| 67 | Craft (fabricate) | D | 20575, 20803 | `fabricateFixedEngineeringRecipe` 13153 | S:13698, then S:13706; fault cases S:14421 → **UI** | — |
| 68 | Craft ×5 | D | 20559 | none | — → **UNPORTED** | — |
| 69 | Pin recipe | D | 20557 | none | — → **UNPORTED** | — |
| 70 | Press a shortfall "Need…" button | V | 20571 | engineering-panel.ts disabled reason | tests/engineering-panel.test.ts:710 → **CODE** | — |
| 71 | Open an item or material card | V | 20398, 20296 | inventory-panel.ts | S:11918 → **UI** (view) | — |
| 72 | Equip / unequip (item card) | D | 20379, 20855 | inventory-panel.ts, `commitArc2InventoryAction` 12659 | S:11918/11935 → S:11953 and S:12232 → S:12286; also G:13325 → G:13499 → **UI** | Browser-only; no vitest runs the inline transaction (main.ts ~12703) |
| 73 | Equip via the explorer doll slot picker | D | 24317 | same owner, inventory panel | as #72 → **UI** | — |
| 74 | Salvage with confirm | D | 20389 | same | S:12232 press, S:12246 confirm, then S:12280 → **UI** | — |
| 75 | Salvage "don't ask again" | D | 20391 | none (`save.salvageConfirm` is read at main.ts:4461 but has no control) | — → **UNPORTED** | — |
| 76 | Salvage all junk (armed) | D | 20400, 20359 | none | — → **UNPORTED** | — |
| 77 | Claim pending loot (v2 carrier) | D | — | inventory `pending-claim` | S:12325, then S:12286 → **UI** | — |

### F. Charters, Records, Prime Codex, progression

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 78 | Open the Charter board, chip, quest log | V | 22732, 22572, 22634 | `fillCharters` 4226, objective chip | S:23773 in-page `objchip.click()`, DOM only → **UI** (view) | — |
| 79 | Accept a starter Charter | D | 22730, 22420 | `runStarterCharterAccept` 10258 | tests/starter-charters.test.ts:330 (no `readSaveV5` reload) → **DIRECT** | **Top gap** |
| 80 | Accept a weekly Charter (v2 design of the hunt board) | D | 22730 | same path, weekly-charters.ts | tests/starter-charters.test.ts:647 (`fixtureAt(save, activePlayMs)` :569) → **DIRECT** | UI press |
| 81 | Charter / Ascent goal banking and completion (passive) | D | 22407 | inside each action transaction | tests/arc3-app-backend.test.ts:709; arc5-scout :317; arc0-landing facts → **DIRECT** | Assert after a UI action |
| 82 | Achievements, rank, XP awards (passive) | D | 14005, 15766 | arc9-progression-action.ts | tests/arc9-progression.test.ts:335 (`readSaveV5` :377) → **DIRECT** | The rule-7 lesson: no test reads the ledger after a UI action |
| 83 | Open Records, tabs, achievement group fold | V | 24195, 24200 | records-rank-panel.ts | S:28854 CDP, then reload DOM count S:29002 → **UI** (view) | — |
| 84 | Binder set claim | D | 13073 | `runArc9BinderSetClaim` 10535 | tests/binder-sets.test.ts:149 (no reload) → **DIRECT** | **Top gap** |
| 85 | Binder Paragon: open or track travel | D (travel) | 13056 | main.ts:4386, paragon-finder.ts | tests/paragon-finder.test.ts:74 (pure) → **CODE** | — |
| 86 | Stats rows fold, rank → stats sheet | V | 24323, 24334 | records-rank-panel | tests/records-rank-panel.test.ts:91 (render) → **CODE** | — |
| 87 | Open Prime Codex | V | 18253 | prime-codex-panel.ts | tests/prime-codex-panel.test.ts:54 (pure) → **CODE** | — |
| 88 | Travel to a filled signature slot (`data-pgo`) | D | 18260 | none | — → **UNPORTED** | — |
| 89 | Track an unclaimed Titan (`data-tgo`) | D | 18264 | none | — → **UNPORTED** | — |
| 90 | Choose a Frontier ending | D | 18272, 18274, 22082 | `runArc9FrontierEndingChoice` 12171 | tests/arc9-frontier-ending-action.test.ts:190 (`readSaveV5` :222) → **DIRECT** | UI press |

### G. Search, share codes, duel

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 91 | Type a search (discoveries) | V | 14751, 14717 | search-travel.ts | tests/search-travel.test.ts:266 (stub seam) → **CODE** | — |
| 92 | Pick a search result → travel or card | D | 14773 | `commitArc9AcceptedSearchRoute` 4636 | S:9961-10030 reads live `persistence.lastOutcome` only; durable proof in arc9-travel-action.test.ts:429 → **DIRECT** | Read IndexedDB after the press |
| 93 | Paste a CF1 code → follow | D | 14768, 14676 | `commitArc9FollowedSearchRoute` 4675, arc9-sharing-action.ts | S:28774 `driveControlSearch`, then S:28885 `arc9-share-follow-v1` receipt, reload S:29119 → **UI** | — |
| 94 | Name a world carried by the code | D | 13094 `goTo` | `commitArc0WorldNameForSearch` 4500 | same run, `arc0-world-name` receipt S:28885 → **UI** | — |
| 95 | Paste a CFB code → duel | D | 14768, 15992 | none | — → **UNPORTED** | — |
| 96 | Duel: load code | V | 15992 | none | — → **UNPORTED** | — |
| 97 | Duel: fight (+8 XP win) | D | 16000, 15596 | none (deploy-dev picker smoke is URL-driven and DOM-only) | — → **UNPORTED** | — |
| 98 | Duel: skip animation | V | 15882 | none | — → **UNPORTED** | — |
| 99 | Duel: close | V | 15965 | none | — → **UNPORTED** | — |
| 100 | Traveler's Beacon | D | 14849 | — | — → **DORMANT** | — |
| 101 | Cosmic Events: open | V | 23863 | — | — → **DORMANT** | — |
| 102 | Cosmic Events: witness | D | 23874 | — | — → **DORMANT** | — |

### H. Notifications, settings, identity

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 103 | Bell open (marks all read after 900 ms) | D | 13472 | notification panel (no auto-read) | — → **UNPORTED** (behavior) | — |
| 104 | Toggle one entry read | D | 13482 | notification-history.ts:98 `data-notification-read` | tests/notification-history.test.ts:97 (real button, real checkpoint codec, no StorageBackend or F4) → **DIRECT** | Real backend, UI press |
| 105 | Mark all read | D | 13488 | none | — → **UNPORTED** | — |
| 106 | Clear all (armed) | D | 13492 | none | — → **UNPORTED** | — |
| 107 | Toast tap → go to surface | V | 13359, 13381 | none found | — → **UNPORTED** | — |
| 108 | Settings text size / tone / font | D | 23613-23617 | main.ts:2916 `data-pref` | S:11065 in-page click, then S:11102 durable read and S:11115 `assessWritableSettingPersistenceReceipt` → **UI** | — |
| 109 | Sound on/off (stops the ambience loop) | D | 23618 | `#setsnd` 2899 | same harness → **UI** | — |
| 110 | Volume slider | D | 23734 | `#setvol` 2905 | same → **UI** | — |
| 111 | Creature voices | D | 23701 | `#setvoice` 2911 | same → **UI** | — |
| 112 | Charts toggle (settings and dock) | D | 23629 | `#setcharts` 2924, dock 2618 | same → **UI** | — |
| 113 | Effects toggle | D | 23636 | `#setfx` 2931 | same → **UI** | — |
| 114 | Shake toggle | D | 23643 | `#setshake` 2937 | same → **UI** | — |
| 115 | Motion mode | D | 23672 | `[data-motion]` 2942 | same → **UI** | — |
| 116 | Glass tint slider | D | 23740 | `#setglass` 2996 | same → **UI** | — |
| 117 | Combat-sound, notification and tooltip toggles | D | 23706, 23679, 23692 | none | — → **UNPORTED** | Covers three toggles |
| 118 | Explorer name (name box, doll, plate box) | D | 22190, 24315, 22229, 22145 | `runArc9ExplorerNameChange` 12015 | tests/arc9-explorer-name-action.test.ts:163 (`readSaveV5` :198) → **DIRECT** | UI press |
| 119 | Nameplate colour (plate box and stats plates) | D | 22226, 24324 | `runArc9NameplateChoice` 12310 | tests/arc9-nameplate-action.test.ts:157 → **DIRECT** | UI press |
| 120 | Reset expedition (armed wipe) | D | 23711-23722, 14544 | none | — → **UNPORTED** | — |

### I. Training, Guide, release notes, app

| # | Action | Kind | v1 anchor | v2 owner | Best existing test → class | Gap |
|---|---|---|---|---|---|---|
| 121 | Training: advance a step, lesson refusal | D (held) | 23516, 11783 | training.ts | S:27471, then S:27315 `recordTrainingReceipt` checks the save stays held and unchanged → **UI** | — |
| 122 | Training: skip → confirm | D | 23522, 23531 | training.ts:220, `completeTraining` 16930 | S:21090, then S:21102 `assessTrainingCanonicalTransaction` → **UI** | — |
| 123 | Training: finish and sandbox release | D | 23407 | `completeTraining`, training-restore.ts | S:28051, then S:28094 `assessDtrainReleaseConvergence`; unit f4-runtime-authority.test.ts:1771 → **UI** | — |
| 124 | Restart training (Settings, armed) | D | 23659 | `#setrestart` 2948 | S:21458, then S:21462 raw read → **UI** | — |
| 125 | Guide: open, search, topic, category | V | 17238, 17189, 17198 | main.ts:3290/3293 | S:7047-7059, DOM only → **UI** (view) | — |
| 126 | Guide browse tour (`brnext`, `brquit`) | V | 17106 | none | — → **UNPORTED** | — |
| 127 | Release notes history | V | 18182, 18139 | `renderReleaseHistory` 3182 | S:23798 `showReleaseFixture` hook, then S:23819 reads `meta.save.rn` → **DIRECT** | — |
| 128 | Update popup dismiss (`rnSeen`) | D | 18174 | `showUnseenV2Release` 3258 | same S:23819 → **DIRECT** | — |
| 129 | Update pill → reload to the new build | D (reload safety) | 18208 | pwa-update.ts, `reloadForPwaUpdate` 16737 | tests/pwa-offline.test.ts (code path) → **NONE** | Reload with a pending write must not lose it |
| 130 | Panel ✕ close, outside-tap close, cinematic dismiss | V | 24042, 16318 | panels.ts | G:10486 CDP → **UI** (view) | — |
| 131 | Ecology "listen" (v2 only) | V | — | main.ts:9247 | — → **NONE** | — |

Counting rule: rows #5, 28, 29, 54, 77 and 131 are v2-only, and #18 is a cross-reference. All are excluded from the summary counts. Each row's class is the first `→ **CLASS**` in its test column.

## Shared harnesses that make UI outcome tests cheap today

1. **Slicesmoke "collision" controls section.** This is the cheapest real-browser route, and it runs alone with `node tools/slicesmoke.mjs --profile=develop --outcome-controls-only` (S:474). The primitives are:
   - `nativeControlClick(session, selector)` (S:28722): scrolls the control into view, hit-tests it, sends a CDP mouse press and returns a trusted-pointer receipt.
   - `readControlF4AuthoritySnapshot` (S:28688) and `waitControlF4Writable` (S:28694).
   - `waitForControlCommitSequence({session, label, beforeAuthority, expectedKinds, persistencePrefix, assessSettlement})` (S:28705).
   - `driveControlSearch` (S:28774).
   - IndexedDB readers: `READ_F4_AUTHORITY_EXPRESSION` (S:1239), `READ_PRIMARY_EXPRESSION` (S:1206).
   - Assessors: `assessSingleF4ActionCommit` (C:4206) and `assessF4ActionCommitSequence` (C:4299).

   A new test works like this:
   - Stage the state with an existing hook (`surveyOn`, `landHere`).
   - Snapshot the authority.
   - Call `nativeControlClick(session, '#survey [data-act="bioscan"]')`.
   - Call `waitForControlCommitSequence` with the expected receipt kind.
   - Assess the committed rows, then reload once and re-read.

   Feature pressers already exist:
   - `pressArc4Keyboard(verb)` S:15709
   - `arc5FeedClick` S:18994
   - `runArc2InventoryOperation` S:12201
   - `pressEngineeringPointer` / `pressEngineeringKeyboard` S:12656/12685
   - phone `touchNav` S:25121
   - Glass `activateRealControl` G:10382

   **Cost:** it needs a real Chromium (on macOS, out-of-sandbox approval), so it runs only locally or in the hosted full lane. It is not in the `develop` browser-free profile.
2. **JSDOM "exec-slice" of main.ts.** This is the browser-free route, in tests/explorer-meal-action.test.ts:
   - `executableMainExplorerMeal` (:113) cuts exact `main.ts` declarations and compiles them with rolldown `transformSync`.
   - It runs them in `new Function('env','with(env){…}')` against JSDOM, the real component and a real memory backend plus F4 runtime.
   - `mainMealHarness` (:333) mounts the controller. `fixture` (:236) builds the backend. The test clicks the native button and reads `readSaveV5`.

   The same slicing pattern (without persistence) is in runtime-hardening, arc4-main-wiring (:807), bioscan-main-wiring (:153), audio-settings-wiring (:85) and notification-history (:435). This is the route to put UI outcome tests into `npm test`. A full JSDOM boot of the 19k-line Pixi `main.ts` is not practical; no test imports `main.ts`.
3. **Per-file durable fixtures (DIRECT level).** `createMemoryBackend` + `initializeFreshV5` + `readSaveV5` (from `@cf/persistence`) + `createF4RuntimeAuthority`.
   - This is hand-rolled in 25 files: `runtimeFixture` in 9, `fixture` in about 12, `seededRuntime` in arc3-app-backend, and `fixtureAt(save, activePlayMs)` in tests/starter-charters.test.ts:569.
   - **There is no shared module.** `test-support/` holds only `bounded-child.ts` and `tracked-v1-source.ts`, and `tests/baseline.ts`/`parity.ts` are determinism and parity helpers.
   - Extracting one `test-support/durable-fixture.ts` is the first step. It makes every item in the list below cheap.
4. **JSDOM component tests.** These include compendium-feed/breed/rename/scout, inventory-panel, engineering-panel, capture-card, combat-card and training.
   - Each builds its own `new JSDOM` (58 files). None uses a `@vitest-environment` pragma, and the config defaults to node.
   - They already press real component controls with stub `onAction`s. Wiring `onAction` to the real owner plus harness 3 turns each into a component-level outcome test. That is below the main.ts slice, but far above CODE.

## Top 15 gaps to close first

The ranking weighs player-visible value and the risk of silent breakage.

1. **Conquest / Guardian / Titan combat through the combat card (#55-57).** It moves the biggest rewards (conquest, XP, injuries, the Prime Signature, and the Frontier unlock at nine Signatures). It is proven only at the persistence-writer level, and the app-level test uses a stub writer. No instrument presses it. This is the exact shape of the v1.8.x duel-XP defect.
2. **Bioscan / Discover Life (#16).** It is the core first loop (Stardust plus the Earpiece in one CAS, hazard, scout routing), but it is never pressed in any instrument. Add a slicesmoke collision press on a surveyed living world.
3. **Breed (#42).** It is a nonlethal-parent transaction with a large ownership write, but it is DIRECT only. Add a JSDOM exec-slice test (clone the explorer-meal harness) plus a slicesmoke press.
4. **Starter and weekly Charter accept (#79-80).** DIRECT without a `readSaveV5` reload, and there is no UI press. Weekly depends on the active-play cycle (`fixtureAt`), so a real-clock bug would be invisible.
5. **Binder set claim (#84).** It pays Stardust, and v1 re-verifies the deed at payment (CF1715-28). There is no reload and no UI press.
6. **Scavenge (#53).** It is the only capture verb never pressed, and its DIRECT test never reloads. It is one `pressArc4Keyboard('scavenge')` call.
7. **Rename species and Scout (#43-44).** DIRECT only. Scout silently changes who takes bioscan damage, so it needs a press followed by a hostile-scan outcome.
8. **Atlas favorite / home / remove / undo (#30-33).** DIRECT only, with no press. Undo is time-windowed, and that timing is exactly what a UI press would catch.
9. **XP, achievement and rank ledger read after UI actions (#81-82).** Progression is proven only through its own transaction. Add ledger assertions to the existing Land, capture and Feed UI runs (the rule-7 lesson).
10. **Frontier ending (#90).** An irreversible endgame choice with no UI press.
11. **Explorer name and nameplate (#118-119).** The settings-panel controls are never pressed, although the settings durable harness (C:367) already exists.
12. **Travel durability after a real press (#11, 21, 92).** Card travel, search pick and leave-world are pressed but read only live state. These are cheap upgrades: add `waitForControlCommitSequence` with the receipt kind.
13. **Inventory transaction in vitest (#72-77).** It is UI-proven only in the browser. The inline main.ts transaction (~12703) has no browser-free durable test, so a develop-lane regression goes unseen until the full chain runs.
14. **Notification mark-read against a real backend (#104).** The only test goes through the codec, with no StorageBackend or F4 revision.
15. **PWA update reload with a pending write (#129).** There is no outcome test, and a reload that drops an in-flight commit is silent data loss.

**Separately (parity decisions, not tests):** 36 UNPORTED rows (about 40 v1 controls) have no v2 owner. The largest are:
- friendly duels and CFB codes (#46-48, 95-99)
- play-time harvest (#59)
- reset expedition (#120)
- craft ×5, pin recipe, salvage-all, "don't ask again" and mend-bulk (#50, 68-69, 75-76)
- Prime slot travel and Titan tracking (#88-89)
- Compendium origin travel, filters and reveal queue (#36-39)
- notification mark-all, clear-all and bell auto-read (#103, 105-106)
- combat-sound, notification and tooltip toggles (#117)
- postcard and vista zoom (#9-10)

Each needs a DECISIONS.md line that says either "port" or "dropped by design" before A5 can close.
