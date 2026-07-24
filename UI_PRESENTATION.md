# Celestial Frontier — UI / Presentation System

**STATUS:** matches code as of 2026-07-23 (verified against main.js + tools/).
**Purpose:** the mobile-first presentation layer — the unified topbar, the one-panel-at-
a-time manager, the "fold language", the vista box, the cards, and the platform caps —
plus the headless layout gate that guards them.

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
