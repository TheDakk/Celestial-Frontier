# Celestial Frontier v1.8.2 — Full-Force Battery Summary

**Build reviewed:** v1.8.2 “Steady Hands” (`a9a13c7`)  
**Source SHA-256:** `bb64ecabe9d0592018da161f417eba2c9d0e2a0f2a94f13599b5db71d29825dc`  
**Scope:** four independent review lenses covering technical/security, training/UI/Momentum, creature/audio/fun, and performance/release readiness.

---

# Executive Verdict

## Overall status: **Conditional Gold — approximately 94% release-ready**

The core game is technically excellent. Generation, breeding, combat, universe creation, rarity, sharing, saving, responsive panels, and exploit protections all survived an unusually large fresh battery.

The v1.8 “Connection” feature arc is also directionally successful:

- Actionable denial messages are genuinely helpful.
- The stall detector suggests a concrete available action.
- The mini quest log is compact and useful.
- The conquest matchup meter is dramatically more truthful than the old power-ratio estimate.
- Breeding previews create anticipation without exposing the actual roll.
- Creature voice generation is deterministic and broad.
- Feed-care XP works with its intended anti-farm behavior.
- Closed Compendium and Fabricator drawers reduce initial visual overload.

However, two headline features contain confirmed defects:

1. **Successful breeding XP is awarded to a parent that is immediately consumed, so the XP disappears.**
2. **Turning master Sound off does not stop an already-running biome ambience loop.**

Two additional UI/accessibility defects should also be fixed:

3. **The training card blocks the Audio tab in Settings at most tested phone/desktop viewports.**
4. **Actionable denial buttons are marked `aria-disabled="true"` even though they remain keyboard-actionable guidance controls.**

## Overall scores

| Review lens | Score | Verdict |
|---|---:|---|
| Technical, security, exploits | **9.7/10** | Gold-ready core |
| Training, UI, Momentum | **8.5/10** | Strong, with two interaction defects |
| Creature, audio, fun, personas | **8.2/10** | Major improvement, but breeding XP and audio lifecycle need correction |
| Performance and release readiness | **8.8/10** | Strong single-file build; targeted optimization remains |
| **Combined release readiness** | **~94%** | Conditional Gold |

---

# Fresh Battery Scale

- 100,000 initial creatures
- 60,000 hybrids
- 50,000 exact-stat mirror duels
- 100,000 randomized ability duels
- 10,000 star systems
- 28,237 planets
- 1,000,000 corrected affix rolls
- 60,000,000 rarity seeds
- 120 conquest matchups with 160-simulation estimates and 2,000-run ground truth
- 17 Earth voice archetypes
- 54 panel openings across nine viewports
- Save corruption, injection, crafting, breeding, duplication, share-code, and affix probes
- Training-overlay tests across five viewports
- Actionable-denial, stall-detector, quest-log, care-XP, breeding-preview, closed-drawer, and audio-lifecycle checks

## Core failure count

- Invalid creatures: **0**
- Invalid hybrids: **0**
- Breeding determinism failures: **0**
- Duel determinism failures: **0**
- Creature-code round-trip failures: **0**
- Invalid systems/planets: **0**
- Corrected invalid affix rolls: **0**
- Rarity downgrades across 60 million seeds: **0**
- Random-duel runtime exceptions: **0**

---

# Highest-Priority Findings

## P1 — Breeding XP is functionally discarded

The build awards:

- +2 XP for a successful union
- +5 XP for a first-of-its-kind lineage

Both awards are applied to `aEntry`, then both parents are removed from the Compendium. The newborn receives zero XP.

This means the advertised care-based progression exists in the event log but provides no lasting progression benefit.

### Recommended correction

Award the XP after the child is stored:

```js
const born = _storeSpecies(child, ...);

awardXP(born.id, 2, "a successful union");
awardXPOnce(
  born.id,
  "lineage:" + lineageKey,
  5,
  "a first-of-its-kind lineage"
);
```

A lineage-wide progression account would also work, but the current parent award should not disappear with consumed parents.

---

## P1 — Sound Off leaves active ambience running

The biome ambience correctly stops when:

- the tab becomes hidden
- the vista closes
- its lifecycle handler runs

But toggling master Sound off only flips `sndOn`, updates text, and saves. It does not call `ambienceStop()`.

The fresh lifecycle probe showed:

- Before Sound Off: two started nodes, one looping source, zero stopped
- After Sound Off and waiting: still two started nodes, one looping source, zero stopped

### Recommended correction

```js
if (e.target.id === "sndopt") {
  sndOn = !sndOn;
  if (!sndOn) ambienceStop();
  ...
}
```

Also make Sound Off stop active voice/combat envelopes where practical.

---

## P2 — Training card blocks Settings › Audio

Settings is intentionally available during training, but the tutorial card has a higher z-index and overlaps the Audio tab.

Fresh result:

| Viewport | Audio tab clickable during welcome lesson? |
|---|---|
| 320×568 | No |
| 390×844 | No |
| 768×1024 | Yes |
| 1024×768 | No |
| 1366×768 | No |

The intercepted element was the training card, its text, or its action region.

### Recommended correction

When Settings opens during training:

- move the tutorial card to a nonoverlapping lane, or
- collapse it into a compact chip, or
- temporarily place Settings above it while retaining the spotlight state.

---

## P2 — Actionable denials claim to be disabled

Breed and Feed guidance buttons use:

```html
aria-disabled="true"
```

But they are intentionally focusable and pressing Enter opens the explanatory guidance/CTA.

That creates contradictory semantics for screen readers and assistive controls.

### Recommended correction

Do not use `aria-disabled` for an actionable guidance button. Use:

- normal button semantics
- a `needs` visual class
- an accessible name such as “Breeding unavailable — open guidance”
- `aria-describedby` for the shortfall explanation

---

# Strongest v1.8 Feature: Conquest Matchup Meter

The old flat power ratio was wrong often enough to be actively misleading.

Across 120 matchups:

- New 160-duel estimate mean absolute error: **~0.73 percentage points**
- Maximum observed error: **7.4 percentage points**
- Old power-ratio band disagreed with actual matchup band in **113/120**
- New estimate band matched the sampled ground-truth band

All 100 sampled “why” lines were nonempty and actionable, naming initiative, damage, endurance, or an ability.

### Small presentation improvement

With only 160 estimate simulations, display:

- `<1%` instead of `0%`
- `>99%` instead of `100%`

This avoids implying impossible certainty.

---

# Audio Assessment

## What was technically confirmed

- 17 Earth voice archetypes produced deterministic voice parameter sets.
- Shared creature codes preserve the same voice.
- Hybrid/Earth-anchor weakening changes voice deterministically.
- Voice, impact, critical, ability, denial, confirmation, arrival, and ambience events have distinct synthesis signatures.
- Creature Voice and Battle Sound toggles persist independently.
- Hidden-tab ambience stops correctly.
- No audio media files were added.

## What automation cannot honestly score

The fleet can verify structure, determinism, lifecycle, event coverage, and toggle behavior. It cannot hear emotional quality like a person can.

Therefore:

- **Audio implementation score:** approximately **8.4/10**
- **Human fun/retention lift:** not yet measured defensibly

Run a small human A/B before committing to a large production expansion:

- 12–24 players
- audio on vs off
- headphones and phone speakers
- first 30 minutes plus one creature-heavy session
- rate creature attachment, impact satisfaction, fatigue, clarity, and desire to continue

---

# Persona Outlook

These are heuristic scores based on DOM-visible flows and system outcomes, not claims of four real human reviews.

| Persona | Score | Main reaction |
|---|---:|---|
| Newcomer | **8.4** | Denials and quest guidance help; training/Settings overlap hurts |
| Explorer | **8.8** | Atlas CTA, spotlight, quest log, and ambience reinforce exploration |
| Rancher | **7.6** | Feed XP and breeding previews are strong; successful breeding XP disappears |
| Optimizer/Conqueror | **9.2** | True matchup meter is an exceptional improvement |
| Completionist | **8.7** | Quest log and closed shelves improve organization |
| Speedrunner | **8.1** | Clear guidance helps, though closed drawers add deliberate clicks |
| Mobile-first | **8.5** | Panel layouts pass; training Audio overlap remains |
| Accessibility/keyboard | **7.5** | Star Map support is good; denial semantics need correction |
| Audio-first | **8.1** | Broad procedural grammar; master-off lifecycle bug |
| Adversarial/exploit hunter | **9.6** | Core and security protections are unusually strong |

**Overall target-audience fun outlook:** approximately **8.2/10**, pending real human audio and rage-quit measurement.

---

# Rage-Quit Assessment

A defensible new numeric rage-quit rate was not produced. The attempted larger chaos fleet did not complete reliably enough to support a claim.

The direct human-facing evidence points in the correct direction:

- actionable denial tested successfully
- denial CTA opened the correct destination
- the stall detector suggested an available concrete action
- conquest risk is now truthful rather than reassuringly wrong
- closed drawers reduce immediate overload

This should reduce frustration, but a real A/B is needed to state by how much.

---

# Payload and Cold-Boot Assessment

## Payload

No audio samples were added.

Compared with v1.7.20:

| Measure | v1.7.20 | v1.8.2 | Change |
|---|---:|---:|---:|
| Main HTML raw | 1,864,723 | 1,909,672 | **+44,949 bytes** |
| ZIP-compressed HTML member | 639,536 | 654,572 | **+15,036 bytes** |
| Gzip-equivalent HTML | 637,577 | 652,545 | **+14,968 bytes** |
| Whole repository ZIP | 56,374,690 | 56,397,565 | **+22,875 bytes** |

So “zero added payload” is accurate in the sense of **zero audio-media payload**, not literally zero bytes.

## Cold boot

The architecture remains one-file and sample-free. A defensible fresh cold-boot timing comparison was not produced because the timing harness attempts were invalid and excluded.

---

# Gold Recommendation

## Fix before final v1.8.2 Gold

1. Move successful-union and first-lineage XP to the surviving child or a persistent lineage account.
2. Stop live ambience immediately when master Sound is switched off.

## Strongly recommended before public ship

3. Prevent the training card from blocking Settings › Audio.
4. Correct the semantics of actionable denial buttons.

## Optimization/backlog

5. Add `{ willReadFrequently: true }` to the two repeatedly read canvas contexts.
6. Render 132px thumbnails directly rather than generating HD first.
7. Continue the known burn/thorns, focus-memory, stacking-context, and Ambush backlog separately.
8. Run physical iOS/iPadOS Safari and a human audio A/B.

---

# Final Call

v1.8.2 is not a failed build. It is one of the strongest versions audited:

- the technical core is near production-grade
- exploit resistance is excellent
- the conquest meter is a major design win
- Momentum guidance is genuinely better
- procedural audio is structurally promising

Correct the two P1 defects and the two P2 interaction issues, then rerun the focused regression. That should put the build in a credible final-Gold position.
