# Celestial Frontier — UI / Presentation System

**STATUS:** matches code as of 2026-07-31 (verified against main.js + the html). Three addenda at the end: THE ART-HOLD LAW (v1.8.5), THE TRAINING LAYOUT CONTRACT (v1.8.6) and its part two (v1.8.7) — a raised board must clear BOTH the lesson card and the dock.
the end of this file: **THE ART-HOLD LAW** (shipped in v1.8.5) — nothing expensive may be synthesised
behind a blocking full-screen surface — with the *painted ≠ answerable* distinction that found it;
and **THE TRAINING LAYOUT CONTRACT** (round 8, CF1805-01) — a surface that can be raised above the
lesson card must also join the `--tut-bot` positioning contract, or the raise buries the instruction.
**Purpose:** the mobile-first presentation layer — the unified topbar, the one-panel-at-
a-time manager, the "fold language", the vista box, the cards, and the platform caps —
plus the headless layout gate that guards them.

> **2026-08-10 v2 correction:** the Pixi slice now enforces the same mobile heat
> law as the legacy build: coarse-pointer/touch devices cap renderer DPR at 2,
> desktop at 3. Static species portraits are deterministic Canvas images in DOM
> cards; Pixi living actors/mesh animation remain future work. The reset's staged
> graphics path is anatomy/lineage continuity first, an explicit resolution-aware
> portrait seam second, a bounded Pixi living-preview proof third, and a later
> mesh/skeletal production pipeline only after those gates. Pixi filters cannot
> repair a wrong silhouette or disconnected anatomy. See
> `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`.

> **B15–15.5 LANDING VISTAS (render-only, fp 50/50):** two dedicated sub-surface scenes now route from
> `showVistaBox` — `_hdReefScene` (Coral-Shallows → bright reef: caustics, coral colonies, fish schools,
> in-column creatures) and `_hdAbyssScene` (the deep; now draws the world's ACTUAL genes as pressure-dark
> silhouettes). Both draw fauna ONLY when genes are supplied → an empty vista carries zero fauna. Global
> hero SCALE clamp 1.4 + stronger `_hdPlaceBeast` ground-contact/occlusion. `_hdBiomeDress` gained/
> strengthened cases: jungle canopy · canyon vertical walls · glass shards · saltflat(cracks) vs
> saltpan(brine) · rocky cluster (geode amethyst crystals, cratered rings, carbon spires). ICE/GREY/HAZE
> worlds now PLACE creatures (they were skipped by the land block). Gas giants (`_hdDeckScene`) carry
> native AERIAL life (Earth life unsupported). Coverage sheets: `tools/sheets/biome-coverage.js`
> (MODE=earth|proc, EMPTY=1); integrity gate: `tools/biome-audit.js`.
**Source of truth:** this doc is the DESIGN spec; main.js + tools/ implement it.

## 1. Overview
Primary device is **iPhone** (CLAUDE.md rule 10). The whole chrome hangs off a single
unified topbar whose height is measured, not guessed, and published as CSS custom
properties so every surface aligns. Panels obey one law — opening one closes the rest, a
corner ✕ closes it, a tap on empty space closes it — while true modals (fights, prompts)
stand apart. jsdom runs logic but does NO layout, so a dedicated CDP gate
(`tools/uilayout.js`) drives real headless Edge across 9 viewports to catch the bugs the
logic battery is blind to by construction.

## 2. Rules & mechanics

### Unified topbar & height sync
- `resize()` (main.js 107–118) sets `DPR = Math.min(window.devicePixelRatio||1,
  TOUCH?2:3)` then calls `syncTopbarH()`.
- `syncTopbarH()` (119–128) writes two CSS vars on `:root`:
  - **`--topbar-h`** = the topbar's measured `offsetHeight`.
  - **`--row1-h`** = the bottom of `#bellwrap` (row 1: search + bell), so the right rail
    (Prime Codex / Compendium / Star Atlas) hangs from row 1, not the whole bar.
- Re-synced on `resize`, `load`, `orientationchange` (twice, +250 ms), and via a
  `ResizeObserver` on `#topbar` (129–133). Renders that change the bar's height also
  call it (e.g. 9851).

### Panels + the sticky ✕ (the one panel law)
The panel manager (`@section` at ~16019, `PANELS` 16027–16050) lists every dismissible
surface with `{id, el, btn, x, open, close}`:
- **Rail panels (`x:1`, get a ✕):** `log` (Star Atlas), `codex` (Compendium),
  `charters`, `events`, `sheet` (character screen), `yard` (Shipyard), `records`.
- **Header panels (`x:0`):** `tray` (bell), `set` (settings), `guide`, `prime`
  (Prime Codex).
- **`closePanels(except)`** (16051–16053) — the "open one closes the rest" enforcer.
- **Tap-empty-to-close** — a document `pointerdown` handler (16056–16069) closes any open
  panel unless the tap is inside the panel, on its rail button, on a `MODAL_SEL` element,
  or during training (`!tutDone` bails; the tutorial keeps its own locks).
- **The corner ✕** — one delegated `click` handler (16070–16076) on `[data-pnx]`. Buttons
  are built by `_mkPnx(id)` (16079) and seated **first + sticky** by a `MutationObserver`
  per rail panel (16085–16093), so the ✕ rides the top even as the list under it scrolls,
  and re-seats itself after any innerHTML rebuild. Seating waits for `tutDone`.

### The "fold language" (word-pills, not arrows)
Detail groups collapse behind an **expand/close word-pill** rather than a chevron arrow.
The `.chev` pill's CSS `::after` content is literally the word **`expand`** when closed
and **`close`** when open (celestial-frontier.html 853–854). Folds:
- Toggled by `[data-gtoggle]` / `[data-lifetoggle]` headers (main.js 7971, 7985, 8307–
  8329); the class `.grp.open` reveals `.gbody`.
- Remembered in the **`cardExpand` bitmask** (declared 7375; saved as `cx`): **bit 1 =
  Environment**, **bit 2 = census/civ**, **bit 4 = specimen field notes (reveal card)**.
- Toggle happens **in place, no rebuild** — so keyboard focus stays put — and it marks
  `_panelDirty` to remeasure (an expanded card that isn't remeasured hangs off the bottom
  of the screen unscrollable, a fixed regression). The panel-key's `|cx…` suffix is
  patched to match, then `queueSave()`.

### Smooth zoom (navigation)
- **`zoomAt()`** wheel / double-tap now accumulate onto a TARGET and ease toward it each frame
  (`_stepZoomGlide`, factor 0.32), cursor-anchored, so a discrete mouse-wheel notch glides
  instead of snapping across the universe / galaxy / system scales. Pinch and programmatic
  zooms stay immediate; Motion:Reduced zooms instantly (glide gated on `motionOK()`); a pan /
  pinch / mode-change cancels an in-flight glide; the step runs **before** `checkTransitions`
  so mode-change thresholds read the eased z.

### The vista box (landing picture)
- **`showVistaBox(P, tod, wx, era, genes, aurora, flora, climSnow, water, xtra)`**
  (7274) paints the landing scene onto a canvas (`_hdDeckScene` for gas giants, surface
  scenes otherwise), mounts it via `_vistaMount(head, cv, vtTxt)`, and shows
  `#vistabox` with a `requestAnimationFrame`→`classList.add('on')` fade (guarded by
  `_vistaShowSeq`).
- **Tap-to-continue** — the caption reads `'local <tod> — tap to continue'`. State is
  cached in `_lastVista`; `reshowVista()` re-opens it, and the card's `[data-act="vista"]`
  button rebuilds it from `_lastDesc` in a fresh session.
- **Tap-to-zoom** (`#vistabox.zoom`) — in live play, tapping the vista canvas zooms it
  full-screen; ✕ or the backdrop closes the zoom. During training the tap keeps its
  tap-to-continue meaning.
- **Full-screen button** — the vista card now carries a visible "⛶ Full screen" pill (in a
  `.vrow` beside "⇪ Save postcard") that adds `#vistabox.zoom`; tapping the image still zooms
  too. Semantics: while zoomed, tapping ANYWHERE steps back OUT to the windowed card (never
  dismisses); only the ✕ closes everything; training keeps tap-to-continue (the pill is inert
  until `tutDone`).

### Cards
- **World / survey panel** (`#panel`, `@section` at ~7364) — the object card with the
  folds above; the Life-forms roster and 🐾 Tame / 🌿 Scavenge actions live inside the
  Life fold.
- **Reveal card** (`#reveal`) — new-species reveal; its field-notes fold (`#rev-fold`,
  `cx` bit 4) opens straight to the roster; reading inside it never dismisses the card.
- **Item card** (`#itemcard`, created 13747) — the loot/gear detail popover.
- **Character sheet / paperdoll** (`#sheetcard`, opened by tapping `#rank`,
  `open`/`close` via `openSheet`/`closeSheet` 16303) — a centered Diablo-style home:
  full-length painterly explorer (`paperdollAvatar()` 10945, `DOLL_ANCHORS`) with nine
  gear sockets pinned to the body, stats column, and Cargo/Fabricator/Research beneath.
  Phones stack paperdoll → stats → hold. The Shipyard (`#yardcard`, `openYard`/
  `closeYard` 13884) and Records board are their own surfaces (v1.5.2 split).

### Rail buttons
`#chbtn` Charters · `#codexbtn` Compendium · `#logbtn` Star Atlas · `#recbtn` Records ·
`#cargobtn` Shipyard · `#pcdxbtn` Prime Codex · `#bell`/`#bellwrap` notification tray ·
`#setbtn` Settings · `#helpbtn` Guide · `#rank` character screen. (Naming per CLAUDE.md
rule 9: the catalogue is "Compendium"; "Prime Codex"/"Cosmic Codex" keep "Codex".)

### `MODAL_SEL` + escape handling
- **`MODAL_SEL`** (16055) = `#reveal,#pickbox,#duelbox,#sharebox,#namebox,#platebox,
  #itemcard,#deathbox,#endingbox,#relbox,#tutbox,#helppop,#vistabox,#toasts,#descbox` —
  true modals the panel manager never auto-closes (a stray tap must never eat a fight).
- **Escape** (keydown 2765–2798) closes one dismissible overlay per press, in priority
  order: rename dialog (but the *initial* name prompt insists on a name), descent-confirm
  (`Escape` = stay in orbit), then the first visible of
  `reveal,pickbox,duelbox,sharebox,itemcard,platebox,primebox,guidebox,setpanel`, then the
  character sheet. During training (`!tutDone`) Escape bails so the lesson keeps its
  modals. The search box has its own Escape (10512); a tooltip closes on Escape (12524).

### Mobile-first rules
- **DPR caps:** `Math.min(dpr, TOUCH ? 2 : 3)` — phones cap at 2 (v1.2 heat pass:
  iPhones report DPR 3 = 2.25× the pixels for barely-visible sharpness and the biggest
  GPU/heat cost), desktop keeps 3 (main.js 112).
- **Notification tray cap 60** — trimmed on push (`notifications.length=60`, 9576) and on
  load (`<60` guard, 10212); 50 persisted to save.
- **Art cache cap 1,200** — `speciesArtCache.size>1200` evicts oldest (1900); portrait/
  icon masters render at 144px so a 50px tile stays crisp at DPR 3.
- **Thumb cache cap 500** — a second bounded cache: `thumbCache` is capped at **500**
  via `_thumbSet` (distinct from the 1,200 `speciesArtCache` cap).

## 3. Key names & numbers (REAL values)
- CSS vars: **`--topbar-h`**, **`--row1-h`** (set by `syncTopbarH`).
- DPR cap: **2** touch / **3** desktop. Notification cap: **60** (50 saved). Art cache
  cap: **1,200**; thumb cache cap: **500** (`_thumbSet`). Icon/portrait master: **144px**.
- `PANELS`: 11 surfaces (7 rail with ✕, 4 header). `MODAL_SEL`: 15 modal ids.
- Layout gate: **9 viewports** (see §6).

## 4. Data / save fields
UI presentation persists via settings fields (full list in SAVE_SYSTEM.md): `tips`
(tooltips), `vol` (`sfxVol*100`), `rm` (`motionMode`), `cx` (`cardExpand` fold bitmask —
bit1 Environment, bit2 census, bit4 field notes), plus `fs`/`tone`/`font`/`snd`/`fx`/
`chart`/`shake`/`notif` toggles and `view` (last camera). Panel open/closed state,
sticky-pick, and vista state are **transient** (not saved). Absent-field defaults:
`tips`⇒on, `cx`⇒0 (collapsed), `rm`⇒Auto, `vol`⇒full (SAVE_SYSTEM.md §2).

## 5. Determinism (how this system interacts with the fingerprint)
The UI layer is entirely `[app]` — it may use `Date.now()`, `devicePixelRatio`, DOM
state, and wall-clock freely because none of it feeds world/genome/descriptor
generation. It reads the deterministic core (portraits from `hdGenesFor`, cards from
descriptors) but never seeds it, so no UI change touches the fingerprint. Portrait art
IS pinned (via the `speciesPortrait`→`hdGenesFor` probe), so changing the genome→visual
contract is the one UI-adjacent path that needs a re-pin — see DETERMINISM.md.

## 6. Code anchors
- Topbar / DPR — main.js viewport `@section` **102–133** (`resize` 107, `syncTopbarH`
  119, DPR cap 112).
- Panel manager — `@section` at **~16019**; `PANELS` 16027, `closePanels` 16051,
  tap-close 16056, ✕ delegate 16070, `_mkPnx` 16079, sticky seat 16085.
- `MODAL_SEL` 16055; Escape handler 2765–2798.
- Fold language — CSS `.chev::after` celestial-frontier.html **853–854**; JS folds
  7971 / 7985 / 8307–8329; `cardExpand` decl 7375.
- Vista — `showVistaBox` **7274**; reshow via `[data-act="vista"]` 8298.
- Cards — `#itemcard` 13747; character sheet `openSheet`/`closeSheet` 16303/16329,
  `renderDoll`/`paperdollAvatar` 10945; Shipyard `closeYard` 13884; reveal fold 8878.
- Caps — notification 9576 / 10212; art cache 1900; 144px masters 14151.
- Layout gate — **`tools/uilayout.js`**: VIEWPORTS list (9): iphone-se, iphone,
  iphone-max, android, ipad-port, ipad-land, laptop, desktop, wide (uilayout.js 29–39);
  SURFACES 41–50; laws = ✕ corner, z-order, no side-scroll, no clipped text; drives real
  Edge over CDP; proof sheets to `tools/uisheets/`; exit 1 on any FAIL.

## 7. Open questions / pending
- `ROADMAP.md` shows ongoing device-pass / overlay-eater work — the layout gate exists
  precisely because jsdom can't see layout; keep adding surfaces to `SURFACES` as new
  panels ship.
- The fold bitmask has 3 bits defined (1/2/4); `cx` is clamped 0–7 on load, leaving room
  for future folds without a save-shape change.

## 2026-07-24 additions (v1.7 polish arc — verified in main.js)
- **THE BOTTOM DOCK** (Nick picked Proposal A): the five rail pills (Prime Codex / Star
  Atlas / Compendium / Shipyard / Records) are a bottom-center dock — same element ids,
  slot-centered via translateX; phone (<=520px) folds labels (.lbl) into icon+count chips.
  Hint bar, ?/⚙ and bottom-pinned training cards step above it (safe-area aware).
- **Chips**: #pinchip (pinned Fabricator recipe — live missing-materials, green READY,
  tap → Shipyard) under the charter button; #chchip (first accepted charter progress,
  tap → board) beneath it. Both hide when idle/in-training.
- **WINDOWED CINEMATIC**: the reveal core is a solid glass card (tier-colored border/glow,
  rays behind). The breed reveal shows the newborn's portrait (speciesPortrait).
- **ADVANCED BRIEFINGS**: a 🎓 row atop the Guide menu (post-training) launches five
  zero-lockdown walkthrough drills (Hold / Forge / Prospecting / Stars / Discovery) —
  tutorial visuals via #tutbox/#tutspot, direct rect spotlighting, smoke-driven.
- **Records board**: the EXPEDITION JOURNAL strip (last 12 landings — world · rolled
  region · date) above the statistics ledger.
- **QoL slate shipped**: NEW-entry dots in the Compendium (.newdot until card viewed) ·
  Atlas quick-filters (🏴 settled / ❋ life) · batch craft ×5 on parts/comps · bulk feed
  ('Mend — safest meals', halts on first toxic bite) · salvage UNDO (6s toast window) ·
  sticky hold tab · dynamic ❤ heal-hint tooltip.
- **Training**: feed/breed steps bottom-pinned (rail-block fix); the horizon step teaches
  the GUARDIANS (how signatures/titans work); the finale spotlights the charter board.
- All '(right rail)' copy now reads '(bottom dock)'.

## 2026-07-25 THE ONE-BAR LANGUAGE (v1.7 UI pass — matches code as of 2026-07-25)
- **THE SHELF** (topbar): ONE row on desktop — nameplate · HP pill (inline, flex 160-340px) ·
  search · bell; `--topbar-h` shrinks and every rail offset gains the row back. Phones keep
  the two-row stack (HP full-width row 2). Trail hidden as before.
- **THE DOCK** (bottom): ⚙ Settings and ? Guide now FLANK the five pills — desktop at ±330
  translateX slots, phones as fixed edge bookends (left:10/right:10 — fits any width).
  Same element ids everywhere: training spotlights, TUT_ALWAYS lockdown, and smoke targets
  unchanged. Dock reads: ⚙ | Prime Codex · Star Atlas · Compendium · Shipyard · Records | ?
- **TEXT SYNC**: 5 stale position refs updated to the dock era (charters "top left, under
  the shelf"; ⚙ "bottom dock, left edge"; Prime Codex + ? Guide "bottom dock"; shipyard
  comment). Training's focus lockdown verified end-to-end (smoke drives all 21 steps).
- **PROOF RIG**: `tools/uishot.js` — headless-Edge UI screenshots via an exactly-sized
  IFRAME (window-size is unreliable under Windows display scaling; the iframe gives a true
  CSS viewport). Seeds a veteran save (`{me, tut:1, rn:GAME_VERSION}`) so the live UI boots
  without intro/release popups. 13 shots: main/settings/charters/compendium/atlas/records/
  prime/guide × desktop+phone.

## 2026-07-25 FINAL LAYOUT — UI v8→v11 (matches code as of 2026-07-25, Nick-directed)
The settled cross-device layout after Nick's iteration rounds 8–11:

**DESKTOP / TABLET (≥701px)**
- ✦ **Prime Codex** — the VERY top, centered in the shelf line (keeps its 0/9 count — the only
  button that keeps a count).
- **Left stack** under the topbar: 📜 Charters over 📖 Compendium (equal pill metrics, uniform pitch).
- **Right stack**: 🌍 Star Atlas over 🛠 Shipyard. SEARCH RESULTS open in their own fixed lane
  BELOW the stack (typing never covers the pills).
- **Bottom-right corner**, evenly pitched 42px, all CIRCLES, order: 🏆 Records · 🔔 Notifications ·
  ? Guide · ⚙ Settings. Records is trophy-only (no label). Corner panels rise from their buttons;
  the SETTINGS panel centers between Prime and the caption; every bottom dialog opens ABOVE the
  caption text lane.

**PHONE (≤700px)** — everything docked, two rows, even slots:
- Row 1 (boards): 📜 Charters · 📖 Compendium · ✦ Prime (0/9) · 🛠 Shipyard · 🌍 Atlas — equal-width
  58px chips, 64px slot pitch.
- Row 2 (utilities): 🏆 Records · 🔔 Notifications · ? Guide · ⚙ Settings — 34-36px circles, 64px pitch.
- Every panel opens as an aligned SHEET above the hover-hint; the guide launcher has its own lane.

**Shared language**: emoji icons everywhere; status dots and counts RETIRED (only Prime keeps 0/9);
SELECTION = a gold-wash HIGHLIGHT on the open board's button (synced from the PANELS registry via
.sel — highlight over growth so spacing never moves); HP bar polished (quarter ticks in the trough,
lit-top depth + bright leading tip on the fill, continuous green→amber→red hue held from before).
Bell is a circle everywhere. `tools/uishot.js` captures 20 canonical screens per run.

**2026-07-25 addendum (Nick's phone-sheet pass)**: on ≤700px the character-sheet paperdoll is
capped at `min(62vw,240px)` (it was eating ~75% of the viewport) so the effects bar, all three
inventory tabs, and the first material families surface without scrolling; sockets hold the 44px
touch floor. Every sheet/panel scrolls internally (`overflow-y:auto` + styled scrollbar) — mouse
wheel and touch drag both work. `tools/uishot.js` now also carries `SEED_FULL`, a populated save
(5 material families + ✦ exceptionals, craftables, mixed-tier loadout worn with affixes) powering
the Shipyard/inventory/paperdoll proof shots — outDir must be ABSOLUTE (headless Edge silently
drops relative screenshot paths).

## 2026-07-28 THE TRAINING STACK LAW (v1.8.3 — matches code as of 2026-07-28)

**The law: during training, the surface the CURRENT lesson points at is the top surface.**
Nothing else is raised, and nothing is raised for the whole of training.

### Why a static z-index cannot work
Training has two opposite needs on adjacent steps:
- **Step 5 / 7** ("open the Star Atlas" / "open your Compendium") — the *board* must win, or the
  lesson opens it underneath Earth's survey card and the recruit is stuck with no way through.
- **Step 6** ("press Land on Earth's card") — the *card* must win, or a board still open from
  step 5 buries the button the lesson names.

v1.7.17 answered the second with a blanket `body.training #panel{z-index:58}`, which broke the
first. On desktop nothing collided (the card owns its own column); on a phone every board shares
that column, so the card buried whichever surface the lesson had just asked for. Nick hit it on a
physical iPhone at both steps.

### How it works
`_tutPri()` (main.js, beside `_tutShow`) reads the current step's own `spot` + `allow` selectors
and marks any surface in `TUT_PRI_SURF` — `#panel #log #codex #chpanel #records #vistabox` — with
`.tutpri`. It runs on step change *and* on the spotlight's 200 ms tick, so a board opened
mid-step takes the stack as soon as it exists, and clears every mark when training ends.

Matching is **exact-token**: `#log` must not be lit by a step that only allows `#logbtn`
(`new RegExp(id + '(?![\w-])')`) — the same trap the focus-lockdown token set documents.

### ⚠ The specificity trap (this cost a full gate cycle)
The CSS rule **cannot** be written `body.training .tutpri{z-index:58}`. That scores 0 ids / 2
classes, and every surface it must override declares its layer through an **id**
(`#panel{z-index:9}`, `#codex{z-index:22}`) — **one id outranks any number of classes.** The mark
applied, the class-level tests passed, and the fix did nothing. It is written as an explicit
per-surface list (`body.training #panel.tutpri, body.training #log.tutpri, …`) whose members
mirror `TUT_PRI_SURF`; **change one and change the other.**

### Companions
- `body.training #setpanel{z-index:60}` — Settings is deliberately reachable mid-training
  (it is in `TUT_ALWAYS`), so it must outrank both the lesson card (50) and any raised surface (58).
- `body.training #vistabox{justify-content:flex-start}` + a `--tut-bot` margin on `.vcard` —
  the Planetside joins `#reveal`/`#pickbox`/`#namebox` in yielding *below* the lesson. Putting it
  *above* the card (the intuitive fix) hides the sentence telling you to tap it. `.zoom` is exempt.
- On ≤900px the survey card's `max-height` reserves the bottom dock (126px + safe-area), because
  steps 5 and 7 point at chips down there.

### How it is gated
- **smoke** proves the JS half: at steps 5 / 6 / 8 the right surface carries `.tutpri`, `#logbtn`
  never masquerades as `#log`, and the marks clear at graduation.
- **tools/uilayout.js** proves the half smoke cannot see — a `training` probe on all 9 viewports
  that publishes `--tut-bot` the way `_tutSpot` does, then **hit-tests** (`elementFromPoint`) the
  dock chips, each open board, the card on the LAND step, and Settings › Audio.
  Replayed against the v1.8.2 build with `--url=`, it reproduces the original report on all three
  phone viewports — which is the only reason to trust it.

## 2026-07-29 ROUND 7 ADDENDA — the stack law, extended (v1.8.4)

Three additions to the training-stack law recorded above, all from round 7.

### The specificity trap, confirmed twice in one week

The law's own implementation hit it (`body.training .tutpri` — 0 ids / 2 classes — losing to
`#panel{z-index:9}`), and an external round found the *same* trap in shipped code:

```css
body.training #tutspot{z-index:49}   /* (1,1,1) */
#tutspot.overtop{z-index:59}         /* (1,1,0) — permanently DEAD */
```

`CF1720-07` was declared fixed and verified by a check that asserted the **source string of the
dead rule**. Now `body.training #tutspot.overtop{z-index:59}` — a rule that can actually win.

> **Two rules, both earned:**
> 1. A class-level override cannot govern surfaces that declare their layer through an **id**.
> 2. Never assert a selector's *spelling*. Assert the **law** it implements — a computed
>    comparison, or better, a hit-test.

### Settings outranks the lesson

`body.training #setpanel{z-index:60}` — above the lesson card (50) and above any raised surface
(58). Settings is deliberately reachable during training (`TUT_ALWAYS`), and an external round
measured its Audio tab as unclickable on 4 of 5 viewports. Gated by **clickability**, per viewport,
the way they measured it — not by a z-index assertion.

### The 744px band

`744×1133` is now a permanent layout-gate viewport. An external harness found **no spotlight ring
at all** there at step 5, where every phone and desktop profile rendered one. It sits just under
the 900px dock breakpoint — the dock layout applies but the tablet band's sheet widths do not,
which is exactly the seam a bug hides in. We believe the missing ring was downstream of the stack
bug (`_tutSpot` deliberately draws nothing when its target's centre is covered), and the band
passes now, but it stays in the gate because no one was watching it before.

## 2026-07-29/30 THE ART-HOLD LAW (shipped in v1.8.5 "First Touch" — matches code as of 2026-07-30)

**Nothing expensive may be synthesised behind a blocking full-screen screen.** A surface the
player cannot see is not worth a frame, and on the first run the thing hidden behind it is the
*only* control on screen.

### What was happening

`ThumbArt.getPlanetSprite` and `GalaxyArt.getGalaxySprite` both use the house "instant lo → async
hi" pattern: return a cheap sprite now, schedule the HD master on a short timer (30ms / 45ms).
A brand-new expedition calls `startNewGame()` 120ms into boot, which `goTo()`s Sol and queues one
HD upgrade **per body**, plus the galaxy face. Each HD render is a 300–800ms main-thread block
(`n2` → `fbm` → `renderPlanetSprite` / `makeGalaxySprite`).

Meanwhile `askExplorerName(true)` runs *synchronously* in boot, so the naming screen is in the DOM
before `DOMContentLoaded`. Measured on a 4× CPU-throttled iPhone-class profile
(`tools/bootperf.js`):

| arm | gate painted | gate **answerable** | main thread blocked first |
|---|---|---|---|
| new player (`--save=none`) | 393ms | **6440ms** | 5818ms |
| returning player (`--save=done`) | n/a | n/a | **0ms** |

The gate was painted at 0.4s and would not answer a tap until 6.4s. The returning player, who
never builds a new system, blocked 0ms — which is what named the cause. After the fix: **1905ms**,
and the remainder is V8 compiling the 1.9MB inline script (`(program)` ≈ 2s at 4×), which is the
payload problem the v2.0 port plan owns, not this one.

### The law in code

`_hdLater(fn, ms)` (main.js, top of the game IIFE, just after `@end PlanetGen`) replaces the bare
`setTimeout` at both upgrade sites. While `_introUp()` is true it re-polls at 250ms instead of
rendering.

- **Precedent, not invention.** Toasts already wait on exactly this condition — see the notify
  section's `_toastQ`, *"toasts held while the title / explorer-name screen is up"*. Art now waits
  on the same predicate.
- **Scope.** Defined at game-IIFE top level deliberately: both callers live inside *different*
  nested module IIFEs (`ThumbArt`, `GalaxyArt`), and a helper belongs in the scope of its
  **callers**, not its callees. (The `_denyPress`/`_okPress` ReferenceError was this trap.)
- **A re-poll, not a flush queue.** The hold lifts however the screen closes — commit, cancel or
  Escape — so there is no hook to forget. One pending sprite costs one timer.
- **Determinism-safe by construction.** Sprites derive from seeds, never from *when* they are
  drawn, so deferring one cannot move the fingerprint. Confirmed: MATCH 50/50.

### The gate

`node tools/bootperf.js --save=none --cpu=4 --cpuprofile --assert` fails if art self-time behind
the intro exceeds 900ms. **Why it needs no clock correlation:** in the `--save=none` arm the
harness never types a name, so the intro is up for the whole observed window — art self-time over
the entire CPU profile *is* art time spent behind the intro. Mapping profiler microseconds onto
`performance.now()` is exactly where such a check would otherwise quietly go wrong.

Negative-controlled in both directions against the shipped v1.8.4 build recovered from git:
**3611ms → exit 1** unfixed, **495ms → exit 0** fixed, with the 900ms budget clear of both rather
than hugging either.

### What this cost us to learn about our own gates

The first cut of `bootperf.js` stopped observing the moment the gate went responsive, so a
deliberate 1500ms block injected at 600ms reported **0ms and passed**. A longtask census whose
window closes at TTI is not a census. A second control was equally instructive: a `setTimeout`
block *cannot* preempt the parser, so it ran after the gate had legitimately painted and proved
nothing — only a **synchronous** block placed before the game script manufactures the real defect.
Both controls found bugs in the instrument, not the build. This is the fourth time on this project
that a check has passed while the thing it guarded was broken; it is the first time the check was
a performance gate.

---

## ADDENDUM 2026-07-30 — THE TRAINING LAYOUT CONTRACT (round 8, CF1805-01)

**The rule:** any surface that `_tutPri()` can raise above the lesson card MUST
also join the `--tut-bot` / `--tut-cap` positioning contract. A raise without the
geometry does not reorder two surfaces — it *buries the instruction*.

v1.8.4 fixed the mobile training wall by raising a lesson's own surface to
`z-index:58`. The lesson **card** sits at 50. `#panel` was the only board that had
ever joined the positioning contract, so it renders *below* the card; `#log`,
`#codex`, `#chpanel` and `#records` got the raise and not the geometry, so they
rendered *through* it. On iPad mini at step 8 the card measured **0% reachable,
63/63 sample points blocked by `#codex`** — the instruction and its Skip button both
invisible, with no way forward. The fleet saw the same wall from the player's side:
once steps 5 and 7 were cleared, stalls at step 8 went **8 → 29**.

Two things make this contract work, and both are easy to get wrong:

**`--tut-bot` already encodes both card positions.** `_tutSpot()` publishes the free
band: card at the top → the band *below* it; card dodged to the bottom → the band
*above* it. So one rule (`top: var(--tut-bot)`, `max-height: var(--tut-cap)`) keeps a
raised board clear either way. There is no need to branch on the card's side.

**`bottom` and `min-height` must be released explicitly.** Under
`@media (max-width:900px)` those four boards are pinned `top:auto !important` with a
`min-height`, and in CSS **`min-height` beats `max-height`**. A `top:`-only rule
would have been present, correct and completely inert — this project's signature
failure mode, and the reason `uilayout.js` exists.

**The gate.** `uilayout.js` now measures the card's reachability on a 63-point grid
against each of the four surfaces, in **both** card positions, across 10 viewports.

⚠ The first version of that gate measured only the top-pinned card and came back
**clean on the exact case the round reported**, because a top-pinned card and a
bottom-anchored board never share a band on a tablet. Their card had dodged. Adding
the dodge pass reproduced their measurement verbatim. *Reproduce the reported
geometry, not a convenient one.*

---

## ADDENDUM 2026-07-31 — the training layout contract, part two (round 9, CF1806-02)

The contract added in v1.8.6 (previous addendum) was right about the geometry and **dropped the
reason those boards were pinned in the first place**.

Under `@media (max-width:900px)`, `#log`/`#codex`/`#chpanel`/`#records` are pinned
`bottom: calc(142px + env(safe-area-inset-bottom,0px))` **to clear the bottom dock**. The v1.8.6
rule released `bottom` — correctly, so the board could sit in the free band — and then reserved a
flat **24px**, so the board grew straight down over the dock instead. Measured with `#chpanel`
raised (the state training step 20 `charter-first` creates):

| device | dock reachability |
|---|---|
| iPhone SE (667) | **0%** — all six controls buried |
| Galaxy S8 (740) | **0%** — all six |
| iPhone 14 Pro (852) | 19% row 1 · 94% row 2 |
| iPad mini (1133) | 95% — clear |

`#panel` — the one board that had joined this contract before — has carried the allowance since
2026-07-28: `126px + env(safe-area-inset-bottom)`. **A new rule must inherit the constraints of
the sibling it is modelled on, not just its selector shape.**

**The fix is a variable, not a second rule.** `--tut-dock` is `126px` below the breakpoint and
`24px` above it, and the `.tutpri` rule reads it. That shape was chosen after the obvious one
failed: the first attempt added a *duplicate* `max-height` inside the media block, which sits
**earlier** in the sheet than the `.tutpri` rule at ~1876 and has **equal specificity**, so it
lost and changed nothing. Both rules were `!important`; both were mine.

> **Two CSS laws, earned one release apart, both about a rule that was present and inert:**
> `min-height` beats `max-height` (v1.8.6), and **an equal-specificity override that appears
> earlier in the sheet loses** (v1.8.7). Neither is exotic; both cost a release.

**The gate.** `uilayout.js` now asserts, on every viewport at or below the 900px breakpoint and
for each of the four raisable boards, that **every dock control is the topmost element at its own
coordinates** — not merely that the lesson card survives. The card-only pass added in v1.8.6 is
why CF1805-01 is genuinely fixed and is also exactly why this was missed: the card was fine
throughout; it was everything *below* the board that was not.

⚠ The new pass needed three corrections before it measured anything real — a key collision that
silently clobbered an existing check, **empty** boards that collapse under `min-height:0` and never
reach the dock, and stale `--tut-bot` left over from the dodge pass. In its first two forms it
passed on the shipped build the external round had already proven broken. *Reproduce the reported
geometry, populate the surface, and control against the broken build — every time.*
