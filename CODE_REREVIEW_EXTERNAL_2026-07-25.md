# Celestial Frontier — Fixed-Build Code Re-Review

**Repository reviewed:** `Celestial-Frontier-main 2.zip`  
**Authoritative source inspected:** `celestial-frontier.html`  
**Review date:** 2026-07-25  
**Review focus:** regression of all previously reported defects, security and exploit testing, save integrity, progression/economy logic, deterministic systems, responsive behavior, performance, maintainability, accessibility, deployment safety, and optimization opportunities.

---

# Executive Summary

## Release recommendation

**Hold code Gold for one short hardening pass.**

The replacement build fixes most of the previous report’s important findings. The deterministic gameplay foundation is strong, the immediate affix-resurrection exploit is fixed, Atlas saves no longer persist normal generated thumbnails, mirror combat is now balanced, oversized share codes are rejected, the intro fits tested phone sizes, browser zoom is restored, hidden tabs stop rendering, fonts are bundled, and deployment now runs the test gate.

However, this re-review found one new confirmed security defect and several remaining hardening/optimization items:

1. **High:** a crafted legacy Star Atlas thumbnail can still execute JavaScript when restored from save data.
2. **Medium–High:** malformed save fields can make the entire save fail to load rather than recovering valid sections.
3. **Release blocker:** the repository and runtime still identify themselves as **v1.6.4**, not v1.7.
4. **Balance decision required:** the new lineage cap prevents million-power creatures, but still permits approximately **6,592 Power**, far above the apparent Titan range.
5. **Medium architecture:** gear affixes are still attached to an item type/slot rather than an individual gear instance.
6. **Mobile performance:** the reduced portrait cache may still retain roughly 75 MB of encoded portrait data, before decoded-image memory.
7. **Mobile GPU cost:** the stylesheet contains approximately 80 `backdrop-filter` declarations and 81 blur filters.
8. **Accessibility:** the universe is still primarily a pointer-driven canvas without an equivalent semantic navigator.

## Readiness estimate

| Area | Assessment |
|---|---|
| Procedural determinism | Excellent |
| Combat determinism and fairness | Excellent after fix |
| Economy/crafting invariants | Strong |
| Save integrity | Improved, one security defect and recovery weakness remain |
| Mobile layout | Strong in tested and bundled reports |
| Mobile memory/GPU use | Needs optimization |
| Security hardening | One confirmed stored-injection path remains |
| Maintainability | Functional but constrained by a 23,883-line single-file source |
| Release process | Improved; version bump and CI remain |

**Estimated code readiness:** approximately **94–96%**, depending on whether the 6,592-Power lineage ceiling is intentional.

---

# Review Scope and Test Evidence

## Source metrics

| Metric | Result |
|---|---:|
| Main HTML size | 1,717,010 bytes |
| Main HTML lines | 23,883 |
| Approximate embedded JavaScript | 1,453,086 characters |
| Approximate embedded CSS | 233,468 characters |
| Gzip size | 588,289 bytes |
| `innerHTML` assignments | 91 |
| `insertAdjacentHTML` uses | 2 |
| `setTimeout` calls | 45 |
| `setInterval` calls | 6 |
| `requestAnimationFrame` calls | 8 |
| Canvas creation sites | 62 |
| Embedded font base64 | approximately 94 KB |
| SHA-256 | `621b791dcf6eceb19718d70ed68163d90006a88d16c1cd7cca1ffd0437cfedda` |

## Static and repository checks

The following passed:

- JavaScript syntax
- CSS brace validation
- No duplicate HTML IDs across 153 static IDs
- No `Math.random()` or `Date.now()` inside designated deterministic domain modules
- Package/runtime version consistency—both currently report v1.6.4
- All 631 Earth fauna mapped to valid rendering rigs
- All 193 sentinel classifications
- All 43 live biome profiles
- Deterministic color atlas validation
- Biome-layer audit
- Sixty million rarity seeds with zero downgrade violations

The full `npm test` chain could not complete in this sandbox because the uploaded repository did not contain an installed `jsdom` dependency and package installation was unavailable. The static section passed before that environment dependency failure. This is not evidence of a game-code failure.

The repository’s stored layout report reports **546/546 passing checks** across nine viewport profiles.

## Independent browser and simulation pass

A Chromium/Playwright harness was run directly against the supplied source logic:

| Test | Result |
|---|---:|
| Generated genomes/stat blocks | 50,000; zero invalid |
| Creature-code round trips | 10,000; zero failures |
| Generated star systems | 10,000; zero invalid |
| Generated planets | 28,146 |
| Duplicate planet seeds within a system | Zero |
| Deterministic ordinary duels | 10,000; zero mismatches |
| Exact-stat mirror duels | 5,000 |
| Mirror results | A 2,495 / B 2,450 / Draw 55 |
| Affix rolls | 100,000; zero invalid |
| Oversized location code rejection | Passed |
| Oversized creature code rejection | Passed |
| Normal 120-entry Atlas save | 20,449 serialized characters; no data image persisted |
| Browser page errors in exercised flows | Zero |
| Console errors in exercised flows | Zero |

Independent intro geometry passed at:

- 320×568
- 360×640
- 390×844
- 768×1024
- 1366×768
- 1920×1080

At each size, **Begin the Expedition** was visible, the document did not horizontally overflow, and long lore content scrolled inside its intended region.

---

# Prior-Finding Regression Matrix

| Previous finding | Current status | Re-review result |
|---|---|---|
| Compendium-origin stored XSS | **Fixed** | Names and origin text are escaped/sanitized in tested search flow |
| Destroyed gear affix resurrection | **Fixed** | Destroying the last copy clears the affix; reacquiring does not reactivate it |
| Million-power crafted saved creature | **Fixed as exploit** | 9,999 brood/fed now produces the same combat stats as 200/200 |
| Source mislabeled for v1.7 | **Not fixed** | Runtime and package still report v1.6.4 |
| Atlas thumbnail save bloat | **Fixed for normal writes** | 120 entries saved without embedded base64 thumbnails |
| 1,200-entry portrait cache | **Improved** | Reduced to 256-entry true LRU; still large for mobile |
| Mirror duel first-slot bias | **Fixed** | 5,000 ties were statistically balanced |
| Prime location skipped sanitizer | **Fixed** | Shared view sanitizer is now used |
| Save arrays unbounded | **Partially fixed** | Several arrays are capped, but many earlier loops remain uncapped or assume arrays |
| Oversized share-code processing | **Fixed** | 9,000-character test codes rejected |
| Browser zoom disabled | **Fixed** | Restrictive viewport setting removed |
| Hidden-tab render loop | **Fixed** | RAF stops while `document.hidden` |
| External Google fonts | **Fixed for offline use** | Font is embedded; caching/licensing optimization remains |
| Deploy bypassed tests | **Fixed** | Deploy runs validate/smoke/layout unless explicitly skipped |

---

# Confirmed Bugs, Exploits, and Risks

## CF-RR-001 — Crafted Atlas thumbnail can execute stored JavaScript

**Severity:** High security defect; practical remote exploitability currently limited by the local-save entry path  
**Status:** Confirmed dynamically  
**Source locations:** approximately lines 13,689–13,711, 13,764, 15,753, and 16,040

### Root cause

The load path accepts any string beginning with `data:image`:

```js
thumb:(typeof it.thumb==='string'&&/^data:image/.test(it.thumb))?it.thumb:null
```

`atlasThumb()` immediately returns the restored value:

```js
if(it.thumb) return it.thumb;
```

Two HTML sinks then concatenate the value directly into an image attribute:

```js
'<img class="t" src="'+_tu+'" alt="">'
```

and:

```js
(o.thumb?'<img src="'+o.thumb+'" alt="">':'<img alt="">')
```

### Confirmed reproduction

A crafted save used this thumbnail value:

```text
data:image/png;base64,x" onerror="window.__thumbXss=777
```

The save loaded successfully and `window.__thumbXss` became `777` when the Atlas rendered.

### Impact

The current game is client-side, so an attacker presently needs a way to alter or supply browser save data. That limits ordinary remote exploitation. Nevertheless, code execution inside the game origin can read or alter the entire save, tamper with progression, replace UI, or transmit data if any network endpoint is later added.

### Recommended fix

The safest approach is to **discard all persisted thumbnail strings during load**. The renderer already rebuilds planet, star, galaxy, moon, comet, and belt thumbnails from seed metadata.

```js
logMap.set(_id, {
  id: _id,
  title: _cs(it.title, 60) || 'Charted place',
  sub: _cs(it.sub, 120),
  thumb: null,
  sq: !!it.sq,
  badge: _cs(it.badge, 18),
  where: _cw(it.where),
  fav: !!it.fav,
  t: clamp(num(it.t), 0, 4102444800000)
});
```

Also stop constructing `<img>` strings. Create the node and assign the property:

```js
const img = document.createElement('img');
img.className = `t${it.sq ? ' sq' : ''}`;
img.alt = '';
img.src = atlasThumb(it);
```

If legacy data-image support is absolutely required, use all of the following:

- exact MIME allowlist: PNG, JPEG, or WebP
- strict base64 character validation
- no quotes or control characters
- hard decoded and encoded length limit
- property assignment rather than HTML concatenation

### Retest

- Load values containing quotes, spaces, control characters, SVG, HTML, and event-handler text.
- Verify no event executes in Atlas or search.
- Verify old saves still rebuild supported thumbnails correctly.

---

## CF-RR-002 — Malformed save field can invalidate the entire save

**Severity:** Medium–High data-integrity risk  
**Status:** Confirmed dynamically  
**Source locations:** load-save block around lines 15,547–15,794

### Root cause

A safe `_capA()` helper exists, but it is declared midway through `loadSave()` and is not used for several earlier or later fields.

Examples include:

```js
for(const kv of (data.names||[]))
for(const kv of (data.conq||[]))
for(const s of (data.setsc||[]))
for(const kv of (data.cargo||[]))
for(const kv of (data.cgx||[]))
for(const t of (data.tech||[]))
for(const kv of (data.items||[]))
for(const n of (data.notifs||[]))
for(const e of (data.codex||[]).slice(0,1500))
for(const s of (data.chs||[]))
for(const s of (data.chacc||[]))
for(const s of (data.land||[]))
```

If one of these values is an object rather than an array, iteration or `.slice()` throws. The outer catch returns `false`, so one bad field prevents all otherwise valid save data from loading.

### Confirmed reproduction

Supplying `{}` for each of these fields caused `loadSave()` to return `false`:

- `names`
- `conq`
- `setsc`
- `cargo`
- `cgx`
- `tech`
- `items`
- `notifs`
- `codex`
- `chs`
- `chacc`
- `land`

### Impact

A partially corrupted save can look like no save exists. If the user then starts a new expedition and the game saves, valid older progress may be overwritten.

Several fields are also still uncapped during iteration, including `seen`, `bx`, and the fields listed above. A crafted multi-megabyte array can produce a slow boot even if every individual value is later rejected.

### Recommended fix

Move schema helpers to the top of `loadSave()` and use them consistently:

```js
const arr = (v, max) => Array.isArray(v) ? v.slice(0, max) : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const finite = (v, fallback = 0) => Number.isFinite(+v) ? +v : fallback;
```

Then apply explicit limits to every collection:

```js
for (const kv of arr(data.names, 5000)) { ... }
for (const kv of arr(data.conq, 20000)) { ... }
for (const kv of arr(data.cargo, Object.keys(MATERIALS).length + 20)) { ... }
for (const e of arr(data.codex, 1500)) { ... }
for (const s of arr(data.land, 60000)) { ... }
```

### Recovery improvement

Do not make the entire save all-or-nothing. Add:

1. `SAVE_KEY.backup` containing the last known-good serialized save.
2. A schema version and migration function per version.
3. Per-section recovery so a broken Atlas does not discard inventory, Codex, or progression.
4. A visible recovery dialog: “Some optional save sections were repaired.”
5. A checksum or hash to detect incomplete writes.

### Retest

Fuzz every save field with:

- `null`
- object instead of array
- array instead of object
- deeply nested objects
- very large arrays
- strings, `NaN`, infinity, negative values

The game should load valid sections, reject invalid sections, and preserve the original backup.

---

## CF-RR-003 — v1.7 release candidate still identifies itself as v1.6.4

**Severity:** Release blocker / metadata inconsistency  
**Status:** Not fixed  
**Source locations:** `package.json:3`, `celestial-frontier.html:18260`

```json
"version": "1.6.4"
```

```js
const GAME_VERSION='1.6.4';
```

The internal consistency check passes because both values agree, but the repository contains the v1.7 rarity, art, gameplay, and HUD systems being prepared for Gold.

### Recommendation

At the actual v1.7 release commit:

- bump `package.json`
- bump `GAME_VERSION`
- add the v1.7 release note as the first `RELEASES` entry
- stamp the Git commit/build ID
- have the deploy script fail when the release version does not match an explicit command-line release target

Example:

```bash
node tools/deploy.js ../site --release 1.7.0
```

The deploy script should verify all three release sources before copying files.

---

## CF-RR-004 — Lineage cap prevents absurd saves but may still overpower endgame

**Severity:** Medium balance/design risk  
**Status:** Exploit fixed; balance confirmation required  
**Source locations:** approximately lines 16,777–16,833

The new effective combat contribution is bounded:

```js
const bonus = Math.min(200, g.brood || 0) * 22
            + Math.min(200, g.fed || 0) * 10;
```

This successfully prevents the previous multi-million-power creature. A genome with 9,999/9,999 now produces the same stats as 200/200.

However, the measured total at that ceiling was approximately **6,592 Power**. Source comments elsewhere describe Titan-class values around the high hundreds. If 6,592 is not a deliberate postgame ceiling, a locally edited save can still trivialize every fight.

### Recommended design

Separate visible lineage history from combat contribution:

```js
const broodBonus = Math.floor(22 * 18 * Math.log1p(brood) / Math.log(19));
const fedBonus   = Math.floor(10 * 18 * Math.log1p(fed)   / Math.log(19));
```

Or use a bounded saturation curve:

```js
function saturatingBonus(value, maxBonus, halfLife) {
  return Math.round(maxBonus * value / (value + halfLife));
}
```

Recommended invariant:

- legitimate maximum bloodline power should remain within a documented ratio of the strongest authored encounter
- a save-loaded creature should never exceed that same ratio

This should be resolved by a balance target, not guessed during implementation.

---

## CF-RR-005 — Affixes are still attached to item type, not item instance

**Severity:** Medium economy architecture issue  
**Status:** Immediate exploit fixed; structural limitation remains  
**Source locations:** approximately lines 20,660–21,128

The current model is:

```js
equipAff[slot] = { k, v, forId: itemId };
```

This means all copies of `rig1`, for example, are fungible. The game cannot represent two copies of the same base item with different affixes. It also cannot know which physical copy was salvaged, equipped, or retained.

The last-copy resurrection exploit is correctly fixed by `_clearDeadAffixes()`, but the model remains fragile as loot depth grows.

### Recommended long-term model

```js
{
  instanceId: 'gear_8ff31...',
  itemId: 'rig1',
  affix: { k: 'yield', v: 0.24 },
  acquiredAt: 1234567890
}
```

- inventory stores instances
- equipment slots store `instanceId`
- salvage consumes one exact instance
- affixes travel with the instance
- stackable materials remain count-based

This is best done before adding rerolls, multiple affixes, durability, trading, or named equipment.

---

# Performance and Optimization Findings

## CF-RR-006 — Portrait cache is improved but still large for mobile

**Severity:** Medium mobile-memory risk  
**Source location:** approximately lines 4,260–4,277

The cache was reduced from 1,200 FIFO entries to 256 true-LRU entries, which is a major improvement.

The source itself estimates approximately **75 MB encoded worst case**. Prior measurement averaged roughly 297 KB encoded per generated portrait, so 256 entries can approach 76 MB of string data. Decoded images/canvases can add substantially more memory.

There is no cache clear on `pagehide`, memory pressure, mode transitions, or long inactivity.

### Recommended optimization

- Phone cache: 64–96 portraits
- Tablet cache: 128 portraits
- Desktop cache: 192–256 portraits
- clear cold entries on `pagehide` and after closing the Compendium
- use low-resolution thumbnails in lists and generate HD only for the open specimen card
- prefer `ImageBitmap` or Blob URLs over long data-URL strings where browser support allows
- cache by requested resolution, not only genome key

### Retest

On physical iPhone Safari:

- scroll through 500+ specimens
- repeatedly open/close Compendium
- switch tabs and return
- monitor tab reloads, memory warnings, and frame time

---

## CF-RR-007 — Heavy glass/blur styling can overwork mobile GPUs

**Severity:** Medium performance optimization  
**Evidence:** approximately 80 `backdrop-filter` declarations, 81 blur filters, and 91 box-shadow declarations

The UI looks cohesive, but simultaneous translucent panels can trigger expensive offscreen compositing on iOS Safari.

### Recommended optimization

Create a shared low-power glass mode:

```css
@media (max-width: 600px), (prefers-reduced-transparency: reduce) {
  .glass,
  .panel,
  .dock,
  .sheet {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: rgba(5, 7, 15, 0.96);
    box-shadow: 0 8px 24px rgba(0,0,0,.45);
  }
}
```

Also:

- avoid nested blurred parents and children
- use one shared overlay blur behind a modal stack
- disable decorative blur during combat or rapid camera movement
- use `contain: paint` carefully on isolated panels
- test compositing in Safari’s Web Inspector

---

## CF-RR-008 — Visible-tab animation loop always renders at full rate

**Severity:** Low–Medium battery/thermal optimization  
**Source location:** approximately lines 23,872–23,878

Hidden tabs now stop correctly. While visible, however, the full frame loop continues even when:

- the camera is stationary
- a full panel covers interaction
- the player is reading a static card
- no animation state is changing

### Recommended optimization

Use a dirty-frame or adaptive-rate scheduler:

- 60 FPS during active pan/zoom/combat
- 30 FPS on mobile during passive animation
- 10–15 FPS for mostly static map ambience
- suspend canvas draw while a fully opaque modal covers it
- restart immediately on input, animation, resize, or visibility change

A simple pattern:

```js
let dirty = true;
let activeUntil = 0;

function invalidate(ms = 250) {
  dirty = true;
  activeUntil = Math.max(activeUntil, performance.now() + ms);
}

function frame(now) {
  const active = dirty || now < activeUntil;
  if (active) {
    frameInner();
    dirty = false;
  }
  setTimeout(() => requestAnimationFrame(frame), active ? 0 : 66);
}
```

---

## CF-RR-009 — Single-file architecture increases regression and parse cost

**Severity:** Medium maintainability optimization  
**Evidence:** 23,883-line HTML; approximately 1.45 million characters of JavaScript

A single deployable HTML file is useful, but the source does not need to be maintained as a single unit.

### Recommended source structure

```text
src/
  domain/
    rng.js
    rarity.js
    genomes.js
    combat.js
    economy.js
  state/
    save-schema.js
    migrations.js
    progression.js
  render/
    universe.js
    species.js
    vistas.js
  ui/
    panels.js
    hud.js
    tutorial.js
  app.js
```

Then bundle into the current one-file distribution artifact.

Benefits:

- smaller review units
- clearer dependency boundaries
- easier unit testing
- fewer global name collisions
- stronger dead-code elimination
- source maps for development
- safer security review of all HTML sinks

The extracted dead-code audit currently reports:

- `_cbT`: no runtime or tooling references—remove it
- `resolveMapDot`, `_titanElemOf`, and `ELEM_ICES`: tooling-only references—either formalize them as test exports or move them to fixtures

---

## CF-RR-010 — Embedded font works offline but cannot be independently cached

**Severity:** Low optimization/process issue

Bundling the font fixes the external-network dependency, but approximately 94 KB of base64 font data is reparsed whenever the HTML changes.

### Options

- Keep it embedded if the one-file artifact is a hard product requirement.
- Otherwise serve a versioned local `.woff2` file with long-lived cache headers.
- Include the font license/attribution in the repository and release bundle.

Do not share font files outside the project distribution unnecessarily.

---

# Accessibility and UX Improvements

## CF-RR-011 — Canvas universe lacks an equivalent semantic navigator

**Severity:** Medium accessibility gap

Browser zoom is now enabled, which is an important fix. The primary universe remains a canvas-driven pointer experience, however. A keyboard or screen-reader user does not receive an equivalent list of nearby galaxies, stars, planets, and actions.

### Recommended solution

Add an optional “Object Navigator” panel backed by the same current-view data:

- list visible objects by distance or screen position
- arrow-key navigation
- Enter to inspect
- shortcut to survey, land, bookmark, or travel
- proper focus return when closing a panel
- `aria-live` for discoveries, hazards, and completed objectives
- `role="dialog"`, `aria-modal`, and labelled headings on modal sheets

This also benefits controller support and players who prefer menus over precise touch targets.

---

# Security Hardening Beyond the Confirmed XSS

The code still contains 91 `innerHTML` assignments. Most currently use generated or escaped values, but this remains a broad future attack surface.

## Recommended policy

1. User/save/share-derived text must enter the DOM through `textContent`.
2. HTML strings may contain only hard-coded templates and already-built trusted fragments.
3. URL attributes must be assigned as DOM properties, never concatenated.
4. Create one audited helper for allowed rich text rather than many local sanitizers.
5. Add automated payload tests for every save/import field.

### Suggested regression payloads

```text
"><img src=x onerror=alert(1)>
<svg onload=alert(1)>
data:image/svg+xml,<svg onload=alert(1)>
javascript:alert(1)
&#34; onerror=alert(1)
```

The test must verify both that no script executes and that the text remains readable where appropriate.

---

# Economy and Exploit-Resistance Improvements

## Save-scumming and action RNG

The designated procedural domain modules are deterministic, but several live gameplay outcomes still use `Math.random()`—capture, hazards, feeding, breeding, and some reward paths.

For a local sandbox game this may be acceptable. If outcome integrity matters, a player can potentially reload before an action and reroll it.

### Optional stronger model

- store a per-save action RNG seed and action counter
- derive each action roll from `{saveSeed, actionType, counter}`
- increment and save the counter before presenting the result
- preserve deterministic replay for bug reports

This is a design improvement, not a confirmed release-blocking exploit.

---

# Deployment and Test-Pipeline Improvements

## What is fixed

`tools/deploy.js` now runs:

- validation
- smoke tests
- UI layout tests

before deployment, unless `--skip-gate` is supplied.

## Remaining improvements

### Add CI

No GitHub Actions workflow was present. Add a workflow that runs on pull requests and the release branch:

```yaml
- npm ci
- npm test
- node tools/rarity-sanity.js
- node tools/biome-audit.js
- node tools/deadcode.js
```

Also archive:

- layout JSON
- screenshots on failure
- the assembled HTML hash
- test seed and build version

### Harden emergency bypass

`--skip-gate` is useful, but easy to normalize culturally. Require an explicit environment acknowledgement:

```text
CF_EMERGENCY_DEPLOY=I_ACCEPT_UNTESTED_RELEASE
```

and write a visible marker to the release log.

### Lock dependencies

Ensure `jsdom` and every test dependency are installed in `devDependencies`, committed through the lockfile, and verified by `npm ci` in CI.

---

# Recommended Priority Order

## P0 — Before code Gold

1. Remove or strictly validate restored Atlas thumbnail strings.
2. Replace thumbnail HTML-string concatenation with DOM property assignment.
3. Apply safe-array helpers to every save field and add last-known-good recovery.
4. Bump the shipping release to v1.7 and update release notes/build metadata.
5. Confirm whether 6,592 lineage Power is intentional; lower it if not.

## P1 — High-value post-hardening work

6. Reduce/adapt the portrait cache on mobile.
7. Add a low-power/non-blur phone presentation mode.
8. Introduce adaptive or dirty-frame rendering.
9. Migrate gear to instance-based inventory before adding deeper loot features.
10. Add CI and harden the deploy bypass.

## P2 — Maintainability and accessibility

11. Split source modules and bundle back into the single-file release.
12. Add a semantic Object Navigator and keyboard flow.
13. Replace external-data `innerHTML` sinks systematically.
14. Remove dead symbols and formalize tooling exports.
15. Decide whether to externalize the embedded font for caching.

---

# Gold Retest Checklist

## Security

- [ ] Crafted Atlas thumbnail cannot create attributes or execute script.
- [ ] Atlas and search render URLs through DOM properties.
- [ ] All save/import text payloads pass the injection regression suite.

## Save integrity

- [ ] Every save collection uses an array/type guard and explicit cap.
- [ ] A malformed optional section does not discard valid progression.
- [ ] Last-known-good backup restores after truncated/corrupt primary data.
- [ ] Save migration tests cover all supported schema versions.

## Gameplay/economy

- [ ] Affix resurrection remains fixed.
- [ ] Mirror ties remain statistically balanced.
- [ ] Maximum legitimate lineage power matches the documented endgame target.
- [ ] No recipe, salvage, reward, or resource-conversion loop creates net value without a bounded input.

## Performance

- [ ] 500-specimen browsing does not reload or terminate iPhone Safari.
- [ ] Mobile glass/blur composition stays within the frame-time budget.
- [ ] Idle/static views reduce CPU/GPU use.
- [ ] Large Atlas and Codex saves remain below storage budget.

## Accessibility/UI

- [ ] All major universe actions have keyboard/semantic equivalents.
- [ ] Dialog focus is trapped and restored correctly.
- [ ] Notifications and progression changes are announced accessibly.
- [ ] Intro and panels continue to pass all target viewports.

## Release process

- [ ] `GAME_VERSION`, `package.json`, release notes, and deployment target agree.
- [ ] CI passes from a clean `npm ci` environment.
- [ ] Release artifact hash is recorded.
- [ ] Emergency gate bypass is absent from normal release history.

---

# Final Assessment

The fixed build is materially stronger than the previous submission. Most earlier blockers are genuinely resolved rather than merely hidden:

- normal Atlas save bloat is fixed
- immediate affix resurrection is fixed
- million-power save creatures are bounded
- mirror combat is fair
- share-code limits work
- intro responsiveness works
- zoom and hidden-tab behavior are improved
- offline fonts and deployment gates are in place

The remaining work is focused. The only confirmed new code-execution defect is the legacy Atlas-thumbnail path, and the most important reliability improvement is making save restoration schema-driven and recoverable.

Once those items, the version bump, and the lineage-power decision are closed, the codebase is suitable for a Gold release. The rest of the recommendations are high-value optimization and maintainability work rather than reasons to redesign the game.
