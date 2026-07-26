# Celestial Frontier v1.7.3 — fix list

**Build:** v1.7.3 `b4a02df` (2026-07-26T13:52Z)
**Source of findings:** 1,000 automated sessions on an identical plan to the v1.7.0 baseline, a clean
21-device responsive sweep, and 12 persona playthroughs. Every item below was confirmed in the source
of `index.html`; line numbers are from this build.

**Context:** v1.7.3 is a clear improvement — mean fun factor 4.92 → 5.71, all 12 personas up, none
down, and 12 of 14 previously reported findings verified fixed. Everything below is either a
regression introduced by those fixes, or a fix that didn't reach as far as intended.

---

## Priority order

| # | ID | Severity | One line |
|---|---|---|---|
| 1 | `CF173-01` | **Critical** | Null-deref crashes the survey card render when the view leaves a system |
| 2 | `CF173-02` | Major | Panel-model fixes are scoped to `≤900px`; 901–1599px gets none of them |
| 3 | `CF173-03` | Major | `#panel` isn't in the panel registry, so bigger boards now bury the survey card |
| 4 | `CF173-04` | Major | The Cratered/Carbon world fix is cancelled by `text-transform:uppercase` |
| 5 | `CF173-05` | Major | Craft button quotes only the first missing material |
| 6 | `CF173-06` | Major | Toasts render behind the Field Training card |
| 7 | `CF173-07` | Major | Toasts collide with panels on short (not narrow) viewports |
| 8 | `CF173-08` | Minor | Records and Notifications print their title twice |
| 9 | `CF173-09` | Minor | Disabled Craft buttons are un-hoverable and un-tabbable |
| 10 | `CF173-10` | Minor | The control-hint pill truncates, hiding a core gesture |

Still open from round 1, unchanged in v1.7.3: `CF170-C1` (keyboard access) and `CF170-m1`
(first tap dead) — both at the bottom.

---

## CF173-01 — Null dereference crashes the survey card render
**Severity:** Critical · **Regression** (v1.7.0 threw zero uncaught errors across 1,000 sessions)
**File:** `index.html` · `describePick()` starts at **line 5089**, throws at **line 5096**

### What happens
```
TypeError: Cannot read properties of null (reading 'x')
    at describePick (index.html:5096)
    at renderPanel (...)
```
Hit 3 times across the fleet, on `laptop-768` and `laptop-720`, by the `speedrunner` and `skimmer`
personas — the two fastest, most zoom-heavy profiles. Both zoom out aggressively with a survey card
open, which is the triggering sequence. Because it throws inside the frame loop, it repeats every
frame while the condition holds.

### Current code (line 5096, the `planet` branch)
```js
else if(p.kind==='planet'){ d=planetDescriptor(p.data.P, p.data.sys, p.data.pl);
  where={type:'planet', gal:slimGal(st.gal), star:{x:st.star.x,y:st.star.y,seed:st.star.seed}, pseed:p.data.P.seed}; }
```
There is **no guard on `st.star` anywhere in `describePick`**. When the camera leaves a star system
while a panel is still rendering, `st.star` is null and `st.star.x` throws. The same unguarded
pattern appears in the `starsys`, `moon` and `comet` branches immediately around it.

### Fix
Resolve the star reference once at the top of the function and build `where.star` only when it exists:
```js
function describePick(p){
  let d=null, where=null;
  const S = st.star || null;                 // may be null if the view already left the system
  const starWhere = S ? {x:S.x, y:S.y, seed:S.seed} : null;
  ...
  else if(p.kind==='planet'){ d=planetDescriptor(p.data.P, p.data.sys, p.data.pl);
    where={type:'planet', gal:slimGal(st.gal), star:starWhere, pseed:p.data.P.seed}; }
```
Apply `starWhere` to every branch that currently reads `st.star.*` (`starsys`, `planet`, `moon`,
`comet`). Downstream consumers of `where.star` need a null check too — if a share link can't be built
without a star, omit the share action rather than throwing.

### Acceptance
Open a survey card, then zoom/pan out of the system until the star is dropped. No console error, and
the card either closes cleanly or renders without its share/travel affordance.

---

## CF173-02 — The panel-model fixes are scoped to phones
**Severity:** Major · **Highest leverage item in this list**
**File:** `index.html` · panel-model block inside `@media (max-width:900px)` starting **line ~1716**;
tablet band **line 1740**; wide block **line 1749**

### What happens
The "ONE panel model" batch — the titled sheets, the `min-height:min(42dvh, 380px)` floor, the scrim,
and the top toast lane — all sits inside `@media (max-width:900px)`. The new tablet band is
**nested inside that same block**:
```css
@media (max-width:900px){
  ...  /* sheet model, min-height floor, ::before titles, scrim */
  @media (min-width:701px) and (max-width:900px){ ... }   /* line 1740 */
}
@media (min-width:1600px){                                 /* line 1749 */
  #codex,#log{width:400px}
  #records{width:380px}
  #chpanel{width:380px}
  #panel{width:340px}
}
```
So the entire range **901px – 1599px receives none of the panel-model work**, and the 1600px+ block is
five width declarations with no sheet model at all.

### Devices that get nothing
| Device | Width |
|---|---|
| Surface Pro | 912 |
| iPad Pro 13" | 1024 |
| iPad Air (landscape) | 1180 |
| Small laptop | 1280 |
| Laptop 1366×768 | 1366 |
| MacBook Pro 14" | 1512 |

Six of 21 tested profiles, including **every laptop**. Four testers hit this independently. The
in-build changelog states the tablet band covers "iPads, Surfaces and everything up to 900px" — a
912px Surface Pro misses it by 12px.

### Fix
1. Lift the sheet model (titles, `min-height` floor, scrim, close affordance) out of the
   `max-width:900px` wrapper so it applies at all widths, and let the *dimensions* vary per tier
   rather than the *model*.
2. Un-nest the tablet band and widen it, or add a mid tier for `901px–1599px` that at minimum gives
   boards the min-height floor, a title and a scrim.
3. Give the `min-width:1600px` block the sheet model too, not just widths.

### Acceptance
Open Star Atlas, Compendium, Charters, Records and Notifications at 912, 1024, 1180, 1280, 1366 and
1512px. Each shows a title, respects a minimum height, and sits above a scrim — the same model phones
already get.

---

## CF173-03 — The survey card is excluded from the panel model
**Severity:** Major · **Regression in effect** — the panel-model fix made this collision worse
**File:** `index.html` · `PANELS` **line 23776** · `closePanels()` **line 23800** · `MODAL_SEL`
**line 23812** · `panelEl` **line 2233**

### What happens
Overlapping-interactive-control defects measured across the 21-device sweep went **85 → 243**. Every
top offender is a board sitting on top of the still-open survey card:

| Overlap | Devices |
|---|---|
| Star Atlas row ∩ `Land` | 8 |
| Guide topic row ∩ `+ Add to Star Atlas` | 8 |
| 📌 pin chip ∩ `Planetside` | 8 |
| `⛏ Mine Deposits` ∩ `⇪ Save postcard` | 6 |

Cause: `#panel` appears in **neither** the `PANELS` registry that `closePanels()` walks, **nor**
`MODAL_SEL`. The panel-model work gave every board a min-height floor, a title and more width, so the
boards are now considerably larger — and they cover far more of a card that never closes. The fix is
sound; the omission inverts its benefit.

There is a second-order effect: because `#panel` is absent from `MODAL_SEL`, clicking the survey card
also closes every open board.

### Fix
Add the survey card to the registry so opening a board dismisses it:
```js
const PANELS=[
  {id:'panel', el:()=>panelEl, btn:null, x:1,
   open:()=>!!(panelEl && panelEl.style.display && panelEl.style.display!=='none'),
   close:()=>{ panelEl.style.display='none'; }},
  ...
];
```
and add `#panel` to `MODAL_SEL` (line 23812) so a click on the card is not treated as a click on the
background.

### Acceptance
With a survey card open, open each of the nine boards in turn. The card closes; no board overlaps it.
Clicking inside the card does not close an open board. Re-running the sweep should bring overlap
defects back toward the v1.7.0 count of 85 or below.

---

## CF173-04 — The Cratered/Carbon world fix is cancelled by CSS
**Severity:** Major · Found independently by **5 of 12 testers**
**File:** `index.html` · header built at **line 12608** · style at **line 1651**

### What happens
Round 1 reported that the landing vista said `PLANETFALL — CARBON WORLD` while the survey card for the
same planet said `CRATERED WORLD`. The fix at line 12608 lowercases the landing region so it reads as
subordinate to the world's name:
```js
const head5='Planetfall — '+(_vwn?_vwn+' · '+String((wb5&&wb5.n)||TYPE_LABEL[type]||'world').toLowerCase():...);
```
with the comment "the header now leads with the world's NAME and the landing region follows lowercase,
visibly subordinate".

But line 1651 uppercases the whole header again:
```css
#vistabox .vh{font:600 11px var(--ui);letter-spacing:.16em;text-transform:uppercase;color:var(--plasma)}
```
`text-transform` runs after the string is built, so **the fix cannot render** and the contradiction
appears exactly as it did in v1.7.0.

### Fix
Drop `text-transform:uppercase` from `#vistabox .vh` and let the JS control casing, or wrap the region
in its own span and exempt it:
```css
#vistabox .vh{...}                        /* no text-transform */
#vistabox .vh .vh-name{text-transform:uppercase}
#vistabox .vh .vh-region{text-transform:none;opacity:.75}
```

### Acceptance
Land on Mercury. The vista header reads `PLANETFALL — Mercury · carbon world` (or similar), and the
region is visibly subordinate rather than shouting a second, different world type.

---

## CF173-05 — Craft button quotes only the first missing material
**Severity:** Major · **Regression** introduced by the disabled-Craft-button fix
**File:** `index.html` · `_craftNeed()` **line 21101**, offending loop **line 21105**

### What happens
```js
for(const k in (it.cost||{})){ const short=it.cost[k]-(cargo.get(k)||0); if(short>0) return 'Need '+short+'× '+matName(k); }
```
It returns on the **first** shortfall. A recipe needing 3× Iron and 1× Chromium renders a button
reading `Need 3× Iron` while its own cost line lists both. Five of nine tier-1 recipes quote a price
that isn't the price, so a player mines exactly what the button asked for, comes back, and the button
has changed its mind — turning one trip into two.

### Fix
Accumulate every shortfall and summarise:
```js
const short=[];
for(const k in (it.cost||{})){ const n=it.cost[k]-(cargo.get(k)||0); if(n>0) short.push(n+'× '+matName(k)); }
for(const k in (it.parts||{})){ const n=it.parts[k]-itemCount(k); if(n>0) short.push(n+'× '+((ITEM_BY.get(k)||{}).name||k)); }
if(it.sd && essence<it.sd) short.push('☄ '+(it.sd-essence));
if(short.length) return 'Need ' + (short.length<=2 ? short.join(' + ') : short[0]+' +'+(short.length-1)+' more');
```

### Acceptance
Open the Shipyard on a fresh save. Every disabled button's requirement matches that recipe's own cost
line — either in full, or as "first item +N more" with the full list still visible on the card.

---

## CF173-06 — Toasts render behind the Field Training card
**Severity:** Major · **Regression** introduced by the top-toast-lane fix
**File:** `index.html` · `#toast` **line 813** · mobile reposition **line 1842** · `#tutbox` **line 1185**

### What happens
```css
#toast{position:fixed;right:18px;bottom:54px;z-index:40; ...}          /* 813  */
#tutbox{position:fixed;z-index:50; ...}                                 /* 1185 */
@media (max-width:900px){
  #toast{top:calc(var(--topbar-h,110px) + 8px);bottom:auto;right:8px;left:auto; ...}   /* 1842 */
}
```
Moving the toast lane to the top on ≤900px put it in the same band as `#tutbox`, which sits at
`top: topbar-h + 6px`. With `z-index:40` against the training card's `50`, toasts fired during Field
Training render **behind** it and are never read — including the "✓ Expedition saved" toast added in
this build specifically for the cautious first-timer persona. Found by 3 testers.

### Fix
Either raise the toast lane above the training card (`z-index:55`) — appropriate, since a toast is
transient and a lesson card is persistent — or, while `#tutbox` is visible, offset the toast lane
below it:
```css
@media (max-width:900px){
  #toast{ top:calc(var(--topbar-h,110px) + 8px); z-index:55; }
  body.tut-open #toast{ top:calc(var(--topbar-h,110px) + var(--tutbox-h,180px) + 14px); }
}
```

### Acceptance
Start Field Training on a 375px viewport. Every toast that fires during training is fully visible and
does not cover the training card's buttons.

---

## CF173-07 — Toasts collide with panels on short viewports
**Severity:** Major · **Regression**
**File:** `index.html` · guards at **line 15070** and **line 23806**

### What happens
Above 900px wide the toast lane stays bottom-anchored (`bottom:54px`, `z-index:40`, 320px wide). On a
short viewport it now overlaps the bottom of the Records panel and the notification tray, swallowing
clicks. Measured at 1280×720: the lane occupies roughly x942–1262, y512–668, over a Records panel
spanning y200–660.

Both guards that would prevent this are gated on **width**, not height:
```js
if (except && window.innerWidth<=900 && typeof toastEl!=='undefined'){ ... }   // 23806, closePanels
...innerWidth<=900...                                                          // 15070, _showToast
```
So the collision exists precisely when the viewport is *short*, not narrow — every 720p laptop.

### Fix
Gate on available height as well as width, e.g.
`if (except && (window.innerWidth<=900 || window.innerHeight<=820) && ...)`, or better, make the toast
lane yield whenever any board is open regardless of viewport, which is the behaviour phones already
get.

### Acceptance
At 1280×720, open Records and the notification tray with toasts pending. No toast overlaps either
panel, and clicks on panel rows behind the old lane position land on the row.

---

## CF173-08 — Records and Notifications print their title twice
**Severity:** Minor · **Regression** introduced by the sheet-title fix
**File:** `index.html` · `::before` titles **lines 1727–1731** · Records' own heading **line 23898**

### What happens
The sheet model adds a `::before` title to five boards:
```css
#log::before{content:'🌍 Star Atlas'}      /* 1727 */
#codex::before{content:'📖 Compendium'}
#chpanel::before{content:'📜 Charters'}
#records::before{content:'🏆 Records'}
#tray::before{content:'🔔 Notifications'}  /* 1731 */
```
Records and Notifications already rendered their own heading in markup, so both now show it twice —
visible in the storyboard as `🏆 RECORDS` immediately above `🏆 Records`. Reported by 5 testers.

### Fix
Remove the in-markup heading from those two panels and let the `::before` be the single source, or
drop `#records::before` / `#tray::before` and keep the markup headings. Whichever you pick, apply it
consistently to all five boards.

### Acceptance
Every board shows exactly one title, at the same size and position, on every viewport width.

---

## CF173-09 — Disabled Craft buttons are un-hoverable and un-tabbable
**Severity:** Minor
**File:** `index.html` · **line 21152** (`disabled>` in the Fabricator button markup)

### What happens
All nine Fabricator buttons now ship the literal `disabled` attribute. That is a real improvement over
hiding them, but a `disabled` button receives no pointer events and is removed from the tab order — so
a keyboard user can't reach the recipe to read what it needs, and a mouse user gets no tooltip on
hover, while a charter is actively telling them to "Fabricate 4 basic parts".

### Fix
Use `aria-disabled="true"` plus a `.is-disabled` class for styling instead of the `disabled` attribute,
keep the button focusable, and no-op the click handler. The shortfall text stays as the accessible
name.

### Acceptance
Tab reaches every recipe button; hovering or focusing an unaffordable one surfaces its full
requirement; activating it does nothing.

---

## CF173-10 — The control-hint pill truncates, hiding a core gesture
**Severity:** Minor
**File:** `index.html` · `#hint`

### What happens
On a 375px viewport the hint renders as
`Tap a planet to survey it · press Land on its card · dou…` — the third gesture (double-tap to zoom) is
cut off. Double-tap is not documented anywhere else in the UI, and round 1 found it can silently
trigger an assisted landing. So the one place it is taught is the one place it doesn't fit.

### Fix
Allow the pill to wrap to two lines under 420px, or rotate the three hints on a timer, or move the
third gesture into the Guide and keep two on screen.

### Acceptance
Every gesture the game relies on is fully readable at 344px.

---

## Still open from round 1

### CF170-C1 — The game board is unreachable by keyboard or screen reader
**Severity:** Critical · unchanged in v1.7.3
`index.html:2224` sets `aria-hidden="true"` and `role="presentation"` on `#cosmos`, and
`ArrowUp|ArrowDown|ArrowLeft|ArrowRight` still appear **0 times** in the file. Survey, land, pan and
leave have no non-mouse path.

Worth noting what *did* improve this round, because it narrows the remaining work: Escape now closes
all nine boards, all 75 `role="button"` controls are Enter/Space-operable, the rails carry text
labels, and the Guide is a properly-roled `aria-modal` dialog. The shell is in good shape. What
remains is the canvas itself plus focus management — the panel's accessibility persona scored 2.5
against a mean of 5.71, now the single largest gap in the build.

Minimum viable version: an arrow-key cursor over pickable bodies with Enter to survey, `+`/`−` to
zoom, a focus trap and focus restore on dialogs, and one `aria-live` region for toasts (there are
currently zero in the file, so every event is silent to assistive tech).

### CF170-m1 — The first tap of the game does nothing
**Severity:** Minor · unchanged
`index.html:2066` — `<button id="nameok" type="button" disabled>`. The largest, most button-shaped
element on the first screen is inert until a name is typed, with no explanation. Prefill a generated
explorer name, or keep the button enabled and focus the field with a "Pick a name first" hint on tap.

---

## Verification

The harness that produced these findings is reusable and the v1.7.0 and v1.7.3 datasets are both
retained, so a re-run reports deltas per issue and per persona automatically: 1,000 sessions on a
fixed plan, a 21-device sweep, 12 persona playthroughs, and a paired frame-rate A/B.

Regression checks worth gating on:

| Check | v1.7.0 | v1.7.3 | Target |
|---|---|---|---|
| Distinct JS errors | 0 | **1** | 0 |
| Overlapping-control defects | 85 | **243** | ≤ 85 |
| Cross-device layout defects (all kinds) | 163 | **345** | ≤ 163 |
| Escape closes panels | 2 / 9 | 9 / 9 | 9 / 9 |
| Completionist dead-click rate | 34.0% | 14.3% | < 10% |
| Median time to playable | 11.8s | 10.4s | < 4s |

**One note on performance:** earlier rounds of this audit reported a frame-rate degradation curve on
high-DPR devices. That was measurement noise on the test VM, not the game. Measured properly — both
builds served side by side, alternating, under identical host state — every device runs at 60fps on
both v1.7.0 and v1.7.3. There is no performance work outstanding.
