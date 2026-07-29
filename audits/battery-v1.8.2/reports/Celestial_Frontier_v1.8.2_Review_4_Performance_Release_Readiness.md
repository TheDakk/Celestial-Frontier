# Review 4 of 4 — Performance, Payload, Maintainability, and Release Readiness

**Lens:** performance engineer + release manager  
**Verdict:** **8.8/10 — Conditional Gold**

---

# Payload

The audio system is procedural and added no audio sample files.

Compared with v1.7.20:

| Measure | v1.7.20 | v1.8.2 | Delta |
|---|---:|---:|---:|
| Main HTML raw | 1,864,723 | 1,909,672 | +44,949 |
| ZIP-compressed HTML | 639,536 | 654,572 | +15,036 |
| Gzip-equivalent HTML | 637,577 | 652,545 | +14,968 |
| Whole repository ZIP | 56,374,690 | 56,397,565 | +22,875 |

This is a modest increase. “Zero added payload” is accurate for audio media, not for total code bytes.

---

# Cold Boot

The architecture remains:

- one primary HTML runtime
- no audio sample downloads
- no added media request chain for the new sound system

A valid fresh comparative timing result was not obtained; invalid timing-harness attempts were excluded rather than reported.

Cold boot should still be verified on:

- low-end Android
- physical iPhone Safari
- iPad Safari
- throttled CPU/network
- first uncached load and repeat load

---

# UI Performance

## Responsive geometry

Fifty-four panel opens across nine viewport sizes passed with:

- all panels inside bounds
- zero horizontal overflow
- no browser errors

## Canvas readback warning

Chromium warned that repeated `getImageData` calls would benefit from:

```js
canvas.getContext("2d", { willReadFrequently: true })
```

Two source areas repeatedly read canvas pixel data.

**Severity: Low–Medium optimization**

Add the hint only to contexts that are genuinely read frequently; it can change the browser’s backing-store strategy.

---

# Thumbnail Pipeline

Direct 132px rendering remains open backlog.

The current first-paint process generates HD before downscaling. This increases:

- main-thread work
- peak encoded memory
- decoded image memory
- mobile Safari tab-kill risk
- first-open delay for large collections

Recommended architecture:

```js
renderSpecies(genome, {
  size: 132,
  quality: "shelf",
  reducedEffects: true
});
```

Then consider:

- OffscreenCanvas
- worker queue
- ImageBitmap
- Blob URLs
- two to three jobs per frame
- adaptive cache based on `navigator.deviceMemory`
- list virtualization

---

# Source Metrics

| Metric | Count |
|---|---:|
| Main-file bytes | 1,909,672 |
| Main-file lines | 26,421 |
| `innerHTML` assignments | 95 |
| `insertAdjacentHTML` calls | 2 |
| `backdrop-filter` tokens | 85 |
| Blur tokens | 100 |
| Shadow declarations | 97 |
| `setInterval` calls | 6 |
| `requestAnimationFrame` calls | 8 |
| Event-listener registrations | 150 |
| `eval` | 0 |
| `new Function` | 0 |

---

# Maintainability

The game remains impressively validated, but a 26,000-line authored runtime increases the cost of:

- cross-scope errors
- CSS cascade conflicts
- review ownership
- dead-code detection
- feature regression isolation
- merge conflict resolution

Recommended authoring structure:

```text
src/
  audio/
  creatures/
  combat/
  world/
  economy/
  save/
  training/
  ui/
  accessibility/
  app.js
```

Bundle this back into the self-contained release HTML.

---

# Security Maintenance

The current hostile-save corpus passed. However, 95 `innerHTML` assignment sites remain an ongoing audit burden.

Continue migrating save/player-derived data toward:

- `textContent`
- safe element factories
- typed render models
- keyed updates
- event delegation

Do not interpret the current passing injection test as permission to stop auditing new string interpolation.

---

# Audio Resource Lifecycle

## Correct

- hidden tab stops ambience
- vista lifecycle can stop ambience
- voice/combat toggles suppress their systems
- procedural generation adds no media fetch

## Incorrect

- master Sound Off leaves active ambience running

This should be a release gate because user intent is unambiguous: Sound Off must mean silence and no continuing audio loop.

---

# Release Gates

## P1

1. Move breeding XP to a surviving target.
2. Stop active ambience immediately on master Sound Off.

## P2

3. Resolve tutorial/Settings Audio overlap.
4. Remove contradictory `aria-disabled` semantics from guidance buttons.

## Performance follow-up

5. Apply `willReadFrequently` where justified.
6. Render thumbnails directly at 132px.
7. Add performance budgets for first Compendium open.
8. Add physical Safari memory and background-audio checks.

## CI and evidence

Every generated report should contain:

- game version
- build ID
- source SHA
- test script version
- browser version
- viewport/device
- UTC time

The supplied notes report strong internal gates, but fresh complete jsdom reproduction was unavailable because dependencies were absent.

---

# Final Release Verdict

The technical engine is robust enough for a Gold candidate. The build should not be held for broad performance redesign.

It should be held briefly for the two headline P1 corrections because they affect the exact systems v1.8 is meant to introduce:

- care-based progression
- trustworthy procedural audio

After those fixes, rerun the focused audio lifecycle, breeding XP, training Audio access, denial accessibility, and core exploit regression.
