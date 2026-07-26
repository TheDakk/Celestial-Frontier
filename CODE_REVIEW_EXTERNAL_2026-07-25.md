# Celestial Frontier — Full Code Review, Exploit Audit, and Optimization Report

**Repository reviewed:** `Celestial-Frontier-main(4).zip`  
**Review date:** July 25, 2026  
**Source reviewed:** `celestial-frontier.html`, extracted `main.js`, build/deploy scripts, verification tools, design documentation, and bundled simulation reports  
**Source size:** approximately 23,805 HTML lines, including approximately 21,734 lines of JavaScript

---

# Executive Summary

## Release recommendation

**Hold code Gold until the High-priority findings are fixed.**

The underlying procedural, combat, rarity, universe, crafting, and responsive-layout foundations are strong. The project has an unusually substantial verification toolkit for a single-file browser game, and the deterministic systems performed very well under repeated simulation.

However, this review confirmed several defects that should be addressed before final code sign-off:

1. A normal gameplay sequence can preserve and later resurrect a destroyed gear affix.
2. Malformed saved Compendium origin text can execute HTML/JavaScript when search results render.
3. The saved-genome “hardening” cap still permits a roughly 320,000-Power creature.
4. Atlas thumbnails can push the save to approximately 4.6 MB, close to common browser-storage limits.
5. The portrait cache can retain hundreds of megabytes of encoded image data.
6. Exact stat-tie duels heavily favor the first slot.
7. The source is functionally v1.7, but all authoritative release metadata still says v1.6.4.

## Code-release readiness estimate

**Approximately 84–88% ready for Gold**, depending on whether local save tampering is considered within the supported threat model.

No critical remote/server exploit was found. Celestial Frontier is a local, serverless game, so several “exploits” require editing browser storage. They still matter because loaded data should never execute markup, corrupt the camera, or produce unsupported game states.

---

# Severity Summary

| ID | Severity | Finding | Status |
|---|---|---|---|
| CF-CR-001 | High | Stored HTML/JavaScript injection through saved Compendium `from` text | Confirmed |
| CF-CR-002 | High | Destroyed gear affix can resurrect after reacquiring the base item | Confirmed through normal API flow |
| CF-CR-003 | High gameplay integrity | Saved genome caps still allow extreme combat power | Confirmed |
| CF-CR-004 | High release/process | v1.7 code ships with v1.6.4 version metadata and notes | Confirmed |
| CF-CR-005 | Medium–High | Atlas image data can exceed safe localStorage budget | Confirmed |
| CF-CR-006 | Medium–High | Procedural portrait cache has a very large mobile-memory ceiling | Confirmed |
| CF-CR-007 | Medium | Exact mirror duels have a severe first-slot advantage | Confirmed statistically |
| CF-CR-008 | Medium | Prime Codex travel locations bypass the existing view sanitizer | Confirmed source inconsistency |
| CF-CR-009 | Medium robustness | Several save arrays are capped on save but not capped on load | Confirmed |
| CF-CR-010 | Low–Medium | Share-code decoders have no input-length ceiling | Confirmed |
| CF-CR-011 | Medium accessibility | Browser zoom is disabled and canvas navigation has no semantic alternative | Confirmed |
| CF-CR-012 | Medium performance | Full animation loop continues unconditionally | Confirmed |
| CF-CR-013 | Low–Medium | External Google Fonts weaken offline behavior and add a third-party request | Confirmed |
| CF-CR-014 | Medium process | Deploy script does not enforce validation or smoke tests | Confirmed |

---

# Test Coverage

## Independently executed in this review

- JavaScript syntax validation
- CSS brace validation
- Duplicate static-ID scan
- Domain determinism scan for `Math.random` and `Date.now`
- Class-to-rendering-rig audit across all 631 Earth fauna
- Color-atlas and biome-profile checks
- Rarity validation across **60,000,000 seeds**
- **100,000** generated genomes/stat blocks
- **20,000** creature-code encode/decode round trips
- **20,000** ordinary deterministic duels
- **5,000** exact mirror duels
- **20,000** generated star systems containing **56,511 planets**
- **100,000** affix rolls
- Recipe dependency, free-cost, negative-cost, missing-input, and salvage-return analysis
- Desktop and mobile browser layout checks at 320×568, 390×844, and 1366×768
- Intro, Charters, Compendium, and Atlas geometry/overflow checks
- Crafted-save and malformed-data tests
- Gear affix destruction/reacquisition exploit test
- Atlas save-size stress test
- Procedural portrait encoded-size sample

## Bundled repository evidence reviewed

The repository also contains prior generated reports showing:

- **546/546** UI-layout checks passing
- **3,000/3,000** UI/training simulations completing
- Deep synthetic campaigns with no recorded JavaScript errors, deaths, or reported soft locks
- Extensive fast, medium, deep, UI, and chaos-persona reports

The jsdom-based suite could not be independently rerun in this sandbox because its dependencies were not installed and dependency installation was unavailable. Its stored outputs were reviewed separately from the tests executed directly in Chromium during this review.

---

# Detailed Findings

## CF-CR-001 — Stored HTML/JavaScript Injection from Saved Compendium Origins

**Severity:** High hardening issue  
**Files:** `celestial-frontier.html`  
**Relevant locations:** approximately lines 13,918–13,940; 15,674; 15,969–15,995

### Root cause

Saved Codex entries restore their origin field directly:

```js
_storeSpecies(_sg, e.f, e.w || null, true);
```

`_storeSpecies` stores it without sanitization:

```js
from: from || 'Unknown world'
```

Search then concatenates the resulting values into `innerHTML`:

```js
'<div class="nm">' + o.nm + '</div>' +
'<div class="ds">' + o.ds + '</div>'
```

### Reproduction result

A Compendium entry with this saved origin was loaded into the search model:

```html
<img src=x onerror=window.__xss=777>
```

Searching for it caused the handler to execute. The test observed:

```text
window.__xss = 777
```

### Scope

There is no built-in full-save import function, so the immediate precondition is malformed or manually edited browser storage. It is still unsafe behavior. Stored data must never become executable markup, and this becomes more serious if cloud sync, save export/import, modding, or server persistence is ever added.

### Recommended fix

Apply both layers:

1. Sanitize on load/storage.
2. Escape at every HTML sink.

```js
const safeFrom = cleanName(e.f || '') || 'Unknown world';
_storeSpecies(_sg, safeFrom, sanitizeWhere(e.w), true);
```

And:

```js
'<div class="nm">' + esc(o.nm) + '</div>' +
'<div class="ds">' + esc(o.ds) + '</div>'
```

The safer long-term approach is to construct search rows with DOM nodes and `textContent`, not HTML strings.

### Retest

- Load `<img>`, `<svg>`, quotes, event attributes, and script-like text in every saved string field.
- Search and open the resulting Compendium entry.
- Confirm the text is displayed literally and no DOM element is created from it.

---

## CF-CR-002 — Destroyed Gear Affix Can Resurrect

**Severity:** High gameplay/economy exploit  
**Relevant locations:** approximately lines 20,595–20,636; 20,979–20,981; 21,072–21,081

### Root cause

Affixes are stored by equipment slot and base item ID:

```js
const equipAff = {}; // slot -> { k, v, forId }
```

Unequipping removes only `equip[slot]`; it does not remove `equipAff[slot]`.

Salvaging an unequipped last copy removes the item but also leaves the stale affix. When the same base item ID is acquired later and equipped, `_slotAffix` considers the old affix active again because `forId` matches.

### Confirmed sequence

1. Equip `rig1` with `+20% healing`.
2. Unequip it.
3. Salvage the final copy.
4. Reacquire or craft a new `rig1`.
5. Equip it.

Observed result:

```text
Before destruction:       +0.20 heal
After unequip:             affix object remains
After final salvage:       item count 0, affix object remains
After reacquire + equip:   +0.20 heal reactivates
```

### Impact

- Rare affixes effectively become permanent account unlocks.
- Salvaging no longer destroys the value attached to an item.
- Players can repeatedly recycle the base item while preserving a best-in-slot roll.
- Duplicate items cannot be represented correctly because affixes are attached to item type, not item instance.

### Immediate patch

When the last copy of an item is removed, clear every affix referencing it:

```js
function clearDestroyedAffix(itemId) {
  for (const slot of Object.keys(equipAff)) {
    if (equipAff[slot]?.forId === itemId && itemCount(itemId) <= 0) {
      delete equipAff[slot];
    }
  }
}
```

Call it from single salvage, bulk salvage, and any future destruction path.

### Correct architectural fix

Represent equippable gear as instances:

```js
{
  instanceId: 'gear_...',
  itemId: 'rig1',
  affix: { k: 'heal', v: 0.20 },
  createdAt: ...
}
```

Equip slots should hold `instanceId`, not the recipe/base-item ID. This also fixes ambiguity when owning multiple copies with different affixes.

### Retest

- Affixed equipped item → unequip → salvage → reacquire.
- Affixed item with two unmodified duplicate copies.
- Salvage All.
- Undo Salvage.
- Save/reload while equipped and while unequipped.

---

## CF-CR-003 — Saved Genome Hardening Still Allows Extreme Power

**Severity:** High gameplay integrity  
**Relevant locations:** approximately lines 15,506–15,514; 16,732; 16,773–16,806

### Root cause

Loaded saves clamp:

```js
brood <= 9999
fed   <= 9999
xp    <= 1,000,000
```

But combat directly adds:

```js
const bonus = brood * 22 + fed * 10;
```

Share-code normalization uses a much lower `brood`/`fed` cap of 200 and XP ceiling of 486.

### Confirmed result

A crafted save was reduced from 999,999 to the current caps but still produced:

- `brood = 9999`
- `fed = 9999`
- `xp = 1,000,000`
- approximately **320,172 total Power**

When exported to a creature code, the same creature normalized back to approximately **6,602 Power**. That means the save and share-code domains disagree substantially.

### Impact

- A local save can create a creature that trivializes duels and conquest.
- The game advertises save hardening, but the effective cap is still far outside supported balance.
- Internal and shared representations produce inconsistent versions of the same creature.

### Recommended fix

Do not necessarily destroy lineage history. Instead, cap its **effective combat contribution**:

```js
const effectiveBrood = Math.min(g.brood || 0, 200);
const effectiveFed = Math.min(g.fed || 0, 200);
const bonus = effectiveBrood * 22 + effectiveFed * 10;
```

Also clamp loaded XP to the actual supported level ceiling.

Alternatively, use diminishing returns so long bloodlines remain meaningful without linear runaway growth.

### Retest

- Values at 0, 200, 201, 9999, Infinity, NaN, strings, and negatives.
- Save → load → code export → decode should preserve supported combat stats.
- Confirm no legitimate naturally bred creature loses lineage display history.

---

## CF-CR-004 — v1.7 Source Still Ships as v1.6.4

**Severity:** High release blocker / process inconsistency  
**Relevant locations:** `package.json:3`; `celestial-frontier.html:18,200`; release notes beginning around line 18,203

### Evidence

The source contains extensive v1.7 implementation comments and systems, but:

```json
"version": "1.6.4"
```

and:

```js
const GAME_VERSION = '1.6.4';
```

The first release-note entry is also v1.6.4.

### Impact

- Live update detection and `version.json` will publish the wrong release.
- The Guide/footer will report the wrong version.
- Returning-player release notes will not represent the actual build.
- Bug reports and save migrations become harder to correlate with source.

### Recommended fix

Create one authoritative source, such as `release.json`:

```json
{
  "version": "1.7.0",
  "title": "The Forge",
  "date": "July 2026"
}
```

Generate all of these from it:

- `package.json`
- `GAME_VERSION`
- release-note heading
- deployment commit message
- `version.json`
- proof-sheet/version footer

Add a validation failure when the values disagree.

---

## CF-CR-005 — Atlas Thumbnails Can Exhaust localStorage

**Severity:** Medium–High progress-loss risk  
**Relevant locations:** approximately lines 15,447–15,449 and 15,706–15,711

### Root cause

The save strips thumbnails only when the Atlas ID begins with `p`:

```js
.map(e => e.id && e.id[0] === 'p'
  ? Object.assign({}, e, { thumb: null })
  : e)
```

Star, galaxy, moon, belt, comet, and related data URLs remain in the save.

### Confirmed stress result

A 120-entry Atlas containing representative 40,000-character thumbnail strings produced:

```text
Serialized save: 4,817,569 characters
Approximate size: 4.59 MB
```

That is close to or beyond common per-origin localStorage quotas after the rest of the save is included.

### Impact

- `localStorage.setItem` can throw.
- The game warns the user, but progress stops persisting.
- The risk is highest for long-running completionist/mobile saves.

### Recommended fix

Do not persist any generated image data.

```js
const log = [...logMap.values()].slice(0, 120).map(({ thumb, ...entry }) => entry);
```

Rebuild thumbnails deterministically from saved seeds and location metadata.

If a thumbnail cannot be regenerated, store a tiny semantic descriptor—not a base64 image.

### Retest

- 120 mixed planet/star/galaxy/moon bookmarks.
- Maximum Compendium and conquest state.
- Confirm serialized save remains comfortably below 1 MB.
- Test Safari private mode and low-quota conditions.

---

## CF-CR-006 — Portrait Cache Has a Very Large Memory Ceiling

**Severity:** Medium–High mobile performance risk  
**Relevant locations:** approximately lines 4,257–4,269

### Root cause

`speciesArtCache` stores up to 1,200 encoded portrait data URLs.

### Measured sample

For 100 generated portraits:

- Average encoded length: **297,175 characters**
- Total: **29,717,524 characters**
- Minimum: 249,014
- Maximum: 364,054

At 1,200 average entries, that implies roughly **356 million encoded characters**, before browser image decoding and GPU texture memory. UTF-16 string storage can make the worst-case memory footprint substantially larger.

### Impact

- Mobile Safari can terminate or reload the tab under memory pressure.
- Long Compendium sessions can become progressively slower.
- Data URLs duplicate encoded data and decoded image resources.

### Recommended fix

- Reduce the hot cache to roughly 128–256 entries.
- Use a real LRU, not insertion-only FIFO behavior.
- Cache card-size and zoom-size variants separately.
- Prefer `ImageBitmap`, canvas objects, or Blob URLs over large base64 strings.
- Revoke Blob URLs on eviction.
- Clear or trim caches on `memorypressure`, `pagehide`, and major mode transitions.

---

## CF-CR-007 — Mirror Duel First-Slot Advantage

**Severity:** Medium balance/fairness issue  
**Relevant location:** approximately line 16,814

### Root cause

Initiative is resolved with:

```js
let turnA = A.agi >= B.agi;
```

Every agility tie gives side A the first strike.

### Confirmed statistics

Across **5,000 exact mirror duels**:

- Side A wins: **4,676**
- Side B wins: **315**
- Draws: **9**

That is approximately a **93.5% win rate** for the first slot.

Ordinary mixed matchups were balanced overall, so this is specifically a tie-resolution problem.

### Recommended fix

Use a deterministic seeded tiebreaker:

```js
const tieFirstA = (hashInt(mine.genome.seed, theirs.genome.seed, 0x1A61) & 1) === 0;
let turnA = A.agi > B.agi || (A.agi === B.agi && tieFirstA);
```

Because the same matchup must remain deterministic, do not use `Math.random`.

Another fair option is simultaneous first-round damage when agility is equal.

---

## CF-CR-008 — Prime Codex `where` Bypasses Location Sanitization

**Severity:** Medium robustness / possible camera-state issue  
**Relevant locations:** approximately lines 15,738 and 18,685

### Root cause

Atlas and restored camera locations use sanitizers, but Prime Codex claims restore location data as:

```js
where: (f.where && typeof f.where === 'object') ? f.where : null
```

The UI later sends it directly to:

```js
travelTo(f.where)
```

### Dynamic result

A malformed location object was accepted and triggered a system-mode transition without throwing. It did not immediately crash in the short test, but it bypassed the same numeric protections added elsewhere specifically to prevent NaN-camera failures.

### Recommended fix

Create one shared `sanitizeWhere` function and use it for:

- saved view
- Atlas entries
- Prime claims
- CF1 codes
- daily/event locations
- any future quest target

Reject locations without enough valid data to resolve a deterministic destination.

---

## CF-CR-009 — Save Arrays Are Not Consistently Capped on Load

**Severity:** Medium robustness  
**Relevant locations:** approximately lines 15,664–15,674 and 15,714–15,715

### Affected examples

The loader iterates all supplied entries for:

- surveyed worlds
- galaxies
- surface visits
- systems
- star classes
- planet types
- event sets
- achievements
- Codex entries
- landed/contacted worlds

Some corresponding fields are capped during save, but the loader does not consistently enforce the same limits.

### Impact

A malformed multi-megabyte save can produce slow startup, excess memory use, and long synchronous portrait/descriptor work.

### Recommended fix

Define explicit schema constants and apply them in both directions:

```js
const SAVE_LIMITS = {
  codex: 1000,
  atlas: 120,
  landed: 4000,
  contacted: 4000,
  events: 200,
  notifications: 60
};
```

Use a single migration/validation layer rather than field-by-field ad hoc coercion.

---

## CF-CR-010 — Share-Code Decoders Have No Size Limit

**Severity:** Low–Medium input/availability risk  
**Relevant locations:** approximately lines 15,868 and 16,794

### Root cause

Both decoders base64-decode and JSON-parse the full supplied string without a maximum length.

### Impact

Pasting a very large CF1/CFB-like string can allocate unnecessary memory and temporarily block the main thread.

### Recommended fix

Apply strict limits before any decode:

```js
const raw = String(code || '');
if (raw.length > 8192) return null;
```

Also limit decoded JSON depth and expected array/object field count.

---

## CF-CR-011 — Accessibility: Zoom Disabled and Canvas Has No Alternative

**Severity:** Medium accessibility issue  
**Relevant locations:** `celestial-frontier.html:5`; approximately line 2,110

### Evidence

The viewport disables browser zoom:

```html
maximum-scale=1.0, user-scalable=no
```

The primary universe canvas is marked:

```js
aria-hidden="true"
role="presentation"
```

The game provides text-size settings and pointer controls, which help, but a keyboard or screen-reader user still lacks an equivalent way to browse galaxies, stars, and planets.

### Recommended fix

- Remove `user-scalable=no` where feasible.
- Restrict gesture handling to the canvas rather than the entire page.
- Add a DOM-based “Navigator” view listing nearby/selectable objects.
- Provide keyboard commands for pan, zoom, next target, inspect, and activate.
- Use real dialog semantics (`role="dialog"`, `aria-modal`, focus trapping/restoration) consistently.

---

## CF-CR-012 — Animation Loop Runs Unconditionally

**Severity:** Medium performance/battery issue  
**Relevant locations:** approximately lines 23,792–23,801

### Root cause

The loop always schedules another frame:

```js
requestAnimationFrame(frame);
```

There is no explicit pause/resume tied to document visibility, panel-only states, reduced motion, or idle scenes.

Browsers throttle hidden tabs, but relying solely on browser throttling still wastes CPU/GPU and battery during static or mostly static states.

### Recommended fix

- Stop the loop on `document.hidden` and restart on visibility.
- Add a dirty-frame mode for static scenes.
- Cap mobile rendering to 30 FPS when motion is reduced or the scene is idle.
- Skip expensive star/particle layers when covered by a full-screen modal.
- Profile each painter with `performance.mark` and log p50/p95 frame cost in development builds.

---

## CF-CR-013 — External Fonts Undermine Offline Capability

**Severity:** Low–Medium  
**Relevant locations:** `celestial-frontier.html:12–14`

The game requests Google Fonts despite otherwise being a self-contained single-file application.

### Impact

- Fonts fail offline.
- Startup performs third-party network requests.
- Privacy/content-blocking policies may block them.
- Initial text can shift after font loading.

### Recommended fix

Use the already-defined system font stacks as the default, or self-host properly licensed subsets in the deployed site. Do not embed font files directly into the Markdown/report or distribute them from this review environment.

---

## CF-CR-014 — Deployment Does Not Enforce the Test Gate

**Severity:** Medium release-process risk  
**Relevant locations:** `tools/deploy.js:9, 29–48`; `package.json:5–8`

The deploy script says validation and smoke tests should run first, but it does not execute them. `package.json` also exposes only `extract` and `validate`; there is no guarded `test`, `smoke`, `layout`, or `deploy` chain.

### Impact

A developer can deploy a build that was not validated, has stale version metadata, or differs from the last tested artifact.

### Recommended fix

Add scripts such as:

```json
{
  "scripts": {
    "test:static": "node tools/checks.js celestial-frontier.html",
    "test:validate": "node tools/validate.js",
    "test:smoke": "node tools/smoke.js",
    "test:layout": "node tools/uilayout.js",
    "test": "npm run test:validate && npm run test:smoke && npm run test:layout",
    "predeploy": "npm test",
    "deploy": "node tools/deploy.js"
  }
}
```

Add GitHub Actions to run the same suite on pull requests and release branches. Deploy the exact tested artifact, not a freshly rebuilt variant.

---

# Confirmed Areas That Passed

## Procedural and deterministic core

- 60 million rarity seeds produced zero downgrade violations.
- 100,000 generated genomes/stat blocks were finite and structurally valid.
- 20,000 code round trips preserved supported creature data.
- 20,000 ordinary duels replayed deterministically.
- 20,000 systems and 56,511 planets generated without invalid structures.
- 100,000 affix rolls stayed within their definitions.
- No `Math.random` or wall-clock dependency was found inside the designated deterministic domain modules.

## Economy and crafting

The recipe audit found:

- no zero-cost recipes
- no negative-cost recipes
- no missing recipe dependencies
- no recipe dependency cycles
- no salvage return exceeding the matching craft input

The stale-parent breeding guard is correctly implemented. A second call using already-consumed parent objects returned:

```js
{ ok: false, stale: true }
```

## Mobile/layout

Independent checks found:

- the intro CTA visible at 320×568
- lore scrolling internally instead of pushing the CTA below the viewport
- no horizontal body overflow at the tested phone, tablet/desktop widths
- Charters, Compendium, and Atlas panels remaining inside the viewport
- no browser page exceptions in the exercised flows

The repository’s bundled layout report contains 546 passing checks and no failures.

---

# Optimization Roadmap

## Priority 1 — Memory and save size

1. Remove all thumbnails from saved data.
2. Reduce portrait cache from 1,200 to 128–256.
3. Replace base64 data URLs with Blob URLs, canvases, or ImageBitmaps.
4. Add LRU behavior and mode-aware cache trimming.
5. Add a development save-size meter and warn at 1 MB, not only after storage fails.

## Priority 2 — Main-thread rendering

1. Pause/slow RAF when hidden, idle, or modal-covered.
2. Move large proof/portrait generation to `OffscreenCanvas` in a Web Worker where supported.
3. Break expensive 2,048-pixel galaxy haze generation into cached/lazy work.
4. Generate low-resolution previews first, then upgrade only when a card is opened.
5. Use `createImageBitmap` for decoded asset transfer.

## Priority 3 — Architecture

The source is impressively organized with module banners, but it remains one very large lexical scope.

Recommended source split while preserving single-file deployment:

```text
src/
  domain/
    rng.js
    universe.js
    genomes.js
    rarity.js
    combat.js
    economy.js
  app/
    saves.js
    tutorial.js
    progression.js
    codex.js
    atlas.js
    shipyard.js
  render/
    universe-canvas.js
    portraits.js
    vistas.js
  ui/
    panels.js
    input.js
    accessibility.js
  bootstrap.js
```

Bundle these into the existing single HTML artifact. This improves test isolation, ownership, code review, and tree-shaking/minification without changing the deployment model.

## Priority 4 — Save schema

Create a versioned schema/migration pipeline:

```js
const save = migrateSave(JSON.parse(raw));
const validated = validateSaveV4(save);
```

Every field should have:

- type
- bounds
- maximum count
- string length
- allowed enum values
- nested object sanitizer

This would eliminate repeated sanitizer drift such as Prime `where`, Codex `from`, and mismatched genome limits.

## Priority 5 — Test process

Add regression tests for every confirmed issue:

- saved-string XSS payloads
- affix destruction and reacquisition
- maximum effective genome power
- 120-entry Atlas save size
- portrait cache eviction
- mirror-duel tie fairness
- malformed Prime locations
- oversized share codes
- version-source consistency

---

# Prioritized Patch Order

## Before Gold

1. **CF-CR-001:** sanitize/escape saved Codex origin strings.
2. **CF-CR-002:** fix affix lifetime or move to item instances.
3. **CF-CR-003:** cap effective brood/fed/XP contribution.
4. **CF-CR-004:** bump and unify v1.7 metadata/release notes.
5. **CF-CR-005:** remove all saved thumbnail data.
6. **CF-CR-006:** reduce/redesign portrait cache.

## First post-fix regression

7. Seeded agility-tie resolution.
8. Sanitize Prime travel locations.
9. Cap all save arrays and share-code lengths.
10. Add deploy-time mandatory test gating.

## Accessibility/performance polish

11. Pause/slow rendering intelligently.
12. Add semantic navigator and browser-zoom support.
13. Remove or self-host external fonts.
14. Gradually split source modules while retaining a single deployed page.

---

# Gold Retest Checklist

- [ ] Search renders malicious saved text literally; no element or event executes.
- [ ] Destroyed affixed gear cannot regain its old affix after reacquisition.
- [ ] Multiple copies can carry independent affixes or the design explicitly prevents it.
- [ ] Maximum supported saved creature power matches the share-code/domain ceiling.
- [ ] Exact mirror duel first-slot win rate falls near 50% across large samples.
- [ ] A 120-entry Atlas remains comfortably below the chosen save-size budget.
- [ ] Portrait cache stays under the measured mobile memory target.
- [ ] Malformed Prime locations are rejected or safely normalized.
- [ ] Oversized CF1/CFB input is rejected before base64 decoding.
- [ ] v1.7 appears consistently in source, package, release notes, Guide, and deployment metadata.
- [ ] `npm run deploy` cannot proceed unless validation, smoke, and layout tests pass.
- [ ] Mobile intro, tutorial, Charters, Compendium, Atlas, Records, Shipyard, and Settings pass on iPhone SE through current Pro Max dimensions.

---

# Final Assessment

Celestial Frontier has a strong deterministic core and a more comprehensive internal verification system than many browser games at this stage. Most previously reported progression, duplicate-reward, breeding, tutorial, and responsive-layout issues have been addressed correctly.

The remaining blockers are focused rather than systemic. The project does not need a rewrite. It needs a concentrated hardening pass around:

- saved-data trust boundaries
- item-instance ownership
- cache/storage budgets
- deterministic tie fairness
- release automation

After the six pre-Gold items in the prioritized patch order are fixed and retested, the codebase should be in a much stronger position for a genuine v1.7 Gold release.
