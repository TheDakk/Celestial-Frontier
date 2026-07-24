# Celestial Frontier — Save System

**STATUS:** matches code as of 2026-07-24 (verified against main.js + tools/).
**Purpose:** persist the player's *progress* (never the universe — that's regenerated
from seeds) to `localStorage` under one hardened key, with load-time coerce/clamp so a
tampered or truncated save can never inject markup or poison the numbers.
**Source of truth:** this doc is the DESIGN spec; main.js + tools/ implement it.

## 1. Overview
Module `SaveSystem [app]` (main.js 10000–10359) owns a debounced write, a hardened
load, and the reset/wipe paths. The save is **local only** — there is no server and
the universe needs no saving. Since the v1.5 fresh start the key is **`cfcc_save_v2`**;
the old `cfcc_save_v1` is read exactly once at boot to mine its rarest catalogued find
for a farewell card, then removed. There is **no migration** — the key bump *is* the
wipe (Nick's call). The universe (seeds, worlds, genomes, share codes) never changed.

## 2. Rules & mechanics

### Write path
- **`queueSave()`** (10046) — debounced: `setTimeout(doSave, 900)`; no-ops while
  `_loading` or `_wiping`. Called after every progress-affecting action.
- **`doSave()`** (10047–10103) — serializes one JSON object to `SAVE_KEY`. Header
  `v:4`, `epoch:COSMIC_EPOCH`, `at:Date.now()` (wall-clock stamp that anchors
  offline-accrual clamps on load). On failure (quota / private mode) it toasts once
  (`_saveFailWarned`) and the session continues unsaved.
- Bound to `beforeunload` and `visibilitychange→hidden` (10353–10355) so a close or
  tab-hide flushes; `pageshow` with `persisted` reloads (bfcache safety).

### Load path — hardening is mandatory
**`loadSave()`** (10104–10282) treats the save as hostile input:
- `num(v,d)` coerces every counter to a finite number (10111); `clamp(...)` bounds
  ranges (essence 0–1e9, hp 1–HP_MAX, pstats 1–330, etc.).
- Names run through `cleanName` (strips markup, caps length); `explorerName`,
  custom world names, prime-record strings are all re-sanitized.
- Enum/class fields are **whitelisted** before use: `fs`∈{fs-lg,fs-xl}, `tone`∈
  {tone-bright,tone-max}, `font`∈{font-sys,font-mono} — each becomes a body class, so
  an arbitrary value could otherwise inject a class.
- Set-membership validated against real tables: cargo materials via the `MATERIALS`
  registry (47-entry; superseded the 42-symbol `ELEM_NAME` table), items
  via `ITEM_BY`, tech via `TECHS`, charter ids against `CHARTER_STARTERS`/
  `CHARTER_POOL`, binder sets via `BINDER_SETS`.
- Exploit clamps: mined timestamps clamped to at most one accrual window before the
  save's own `at` stamp (10139–10141, defeats the "edit timestamp to 0 → 30 preloaded
  extractor pulls" edit); conquered-world **harvest** stamps get the parallel anti-edit
  clamp on load — at most one `HARVEST_CD` before the save's own stamp; conquered/mined
  unioned into `land` so cap eviction can't re-hide a held census.
- Notifications are escaped + coerced on load (the tray sink uses `esc()`), so a
  hand-edited save can't inject markup through the notification tray.
- `_loading=true` for the whole pass so nested writes don't re-enter `queueSave`.

### "New fields must default safely when absent" (the veteran-save rule)
A field missing from an older save must resolve to the *safe* default — never force a
regression on a held run:
| field | absent ⇒ | code |
|---|---|---|
| `tut` | tutorial **done** (never force training on a veteran) | 10270 |
| `tips` | tooltips **on** (`tipsOn=data.tips!==0`) | 10198 |
| `vol` | **full** volume (pre-slider saves) | 10202 |
| `rm` | **Auto** (-1) — keep following OS reduce-motion live | 10204–10206 |
| `chart` | orbit charts **off** (clean sky is default) | 10195 |
| `cx` | all card folds **collapsed** (0) | 10209 |
| `asc` | Ascent **chapter 1** (the canon opening) | 10178 |
| `mx` | every mined world counts **1 pull** (finite reserves never refill) | 10145–10153 |
| `hd` | **ignored** — HD is always on now (ship decision) | 10210 |
| `chacc` | **nothing accepted** (board offers chains fresh) | 10238 |

### Reset / wipe
- **`resetMemoryState()`** (10283–10321) — belt-and-suspenders clear of every in-memory
  container (codex, logMap, conquered, mined, items, ascent, claimed sets, nameplate
  hue, charter badge…) so a soft-navigate is as clean as a hard reload.
- **`wipeSaveAndReload()`** (10322–10352) — arms `_wiping` (unload guard), removes the
  key, resets memory, drops any share-link hash, and rebuilds the opening expedition in
  place (works in sandboxed frames where reload is blocked); explicitly hides the death
  and ending overlays first (a past soft-lock bug).

### Versioning & migration policy
Shape changes require **versioning + migration** (CLAUDE.md rule 5). The current schema
is `v:4`. The v1.5 transition was deliberately NOT a migration — the key bump
`v1`→`v2` served as the wipe, no data grandfathered, and it cost one documented
single-key baseline re-pin of the constants probe (`note_saveKey_repin_v15`; see
DETERMINISM.md). Preserve the load-time hardening on any future change.

## 3. Key names & numbers (REAL values)
- **`SAVE_KEY = 'cfcc_save_v2'`** (10012). **`LEGACY_SAVE_KEY = 'cfcc_save_v1'`** (10013).
- Schema header **`v:4`**; debounce **900 ms**; log slice **120** entries (planet thumbs
  nulled, rebuilt from seed); notifications persisted **50** (tray cap 60 on load,
  10212); `land`/`cont` capped **4000**; `wvo` (wave-off pity) capped **400**.
- Related caps (enforced elsewhere, see UI_PRESENTATION.md): notification tray 60,
  art cache 1,200, DPR 3 desktop / 2 touch.

## 4. Data / save fields (full list, from `doSave` 10052–10097)
Settings & player: `v`, `epoch`, `at`, `view`, `hp`, `pstats`, `me` (explorerName),
`nh` (nameHue), `essence`.
Settings toggles: `fs`, `tone`, `font`, `snd`, `fx`, `chart`, `shake`, `notif`,
**`tips`** (tooltips), **`vol`** (=`sfxVol*100`), **`rm`** (=`motionMode`), **`cx`**
(=`cardExpand` fold bitmask), `guide`, **`tut`** (=`tutDone`), `rn` (release-notes seen),
**`sv`** (=`salvageConfirm` — confirm-before-salvage toggle, default **on**), **`gt`**
(=`glassTint` panel-tint slider, 0..1; absent ⇒ 0.72).
Exploration: `land` (settled ∪ conquered ∪ mined), `scout`, `landings`, `cont`
(contacted), `surveyed`, `gals`, `surf`, `sysv`, `starK`, `ptypes`, `evts`, `evann`,
`home`, `conq` (conquered → {t,tier}).
Economy / engineer track: `cargo`, **`cgx`** (v1.7 §5 — exceptional sub-counts per
substance, load-clamped `cgx[k] <= cargo[k]`), `minedw`, `mx` (pulls per world), **`skx`**
(stellar-skim samples per star — mirrors `mx`), **`bx`**
(=`bioX` — v1.6 Biosphere Yield: `[attempts, epochStamp]` per world), `tech`, `items`,
`eq` (equipped), **`ea`** (=`equipAff` — v1.6 worn loot-core affixes `{k,v,forId}`),
`asc`/`ascp` (Ascent chapter + progress).
QoL fields (2026-07-24, all absent-safe): **`jrn`** (Expedition Journal — up to 24
`{s,n,w,t}` landing lines, strings clamped on load), **`pin`** (pinned Fabricator
recipe id, validated vs `ITEM_BY`), **`ctb`** (sticky hold tab `mat|craft|gear`),
**`seen`** (viewed-specimen ids for the NEW dots — intersected with the codex on save).
Charters: `chs` (done), `chw` (week), `chp` (progress), **`chacc`** (=`chacc` — v1.5.2
accepted-but-unfinished ids), `charters` (count).
Records / stats: `notifs`, `breeds`, `breedwins`, `feeds`, `feedfails`, `harvests`,
`essenceEarned`, `guardians`, `paragons`, `br` (bestRank), `setsc` (claimed binder
sets), `mines`, `crafts`, `minedout`, **`skims`** (stellar-skim stat counter),
**`cosmics`** (cosmic-material stat counter), `shares`, `jumps`, `anomalies`, `anomKey`,
`events`, `duels`, `duelwins`, `ach` (unlocked achievements).
Codex & world: `codex` (`[{g:genome,f:from,w:where}]`), `names` (custom names), `log`,
`prime` (Prime Codex signature records), `frontier`, `ending`.

## 5. Determinism (how this system interacts with the fingerprint)
The save stores no generated content — only progress keyed by seed/id, so the same
share code always rebuilds the same world regardless of what's saved. The one point of
contact with the fingerprint is `SAVE_KEY`'s literal value, which the `constants` probe
pins; that is why the v1→v2 bump was an authorized single-key re-pin. `SaveSystem` is an
`[app]` module, so it may (and does) use `Date.now()` freely — its output never feeds
generation.

## 6. Code anchors
- `SaveSystem` module — main.js **10000–10359**; keys 10012–10013; `readLegacySave`/
  `legacyFarewell` (farewell card) 10017–10043; `queueSave` 10046; `doSave` 10047–10103;
  `loadSave` 10104–10282; `resetMemoryState` 10283–10321; `wipeSaveAndReload`
  10322–10352; unload/visibility hooks 10353–10355; freeze/export 10356–10358.
- Tooling: `tools/smoke.js` drives save/load, veteran-save and skip paths;
  `tools/uilayout.js` asserts a positive `"tut":true` in `cfcc_save_v2` after training
  (proves the debounced flush landed).

## 7. Open questions / pending
- Schema is `v:4` but `loadSave` is version-tolerant by field presence rather than a
  `switch(data.v)` migration ladder — intentional (fields default safe when absent), but
  a future breaking shape change would need an explicit migration branch keyed on `v`.
- `mx` is stored uncapped while some sibling structures cap; documented as intentional
  in-code (the finite-reserve refill audit), noted here for future maintainers.
