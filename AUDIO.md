# AUDIO — creature voices, combat, ambience, feedback grammar

**STATUS:** matches code as of 2026-07-29 (verified against main.js).
**Shipped:** v1.8.0 "The Connection" · corrected and widened in v1.8.4 "Clear Ground".

**Purpose:** everything the game makes a sound with. Written after an external round found the
whole layer undocumented despite being the largest single feature of v1.8.

---

## 1. The one architectural rule

**Every sound is synthesised at runtime. There is never a sample.**

Zero `.mp3`/`.ogg`/`.wav`/`.m4a` references, zero `decodeAudioData`, zero audio bytes in the
payload. This is not an aesthetic preference — it is what protects the game's defining property:
one file, one link, instant. An externally measured paired A/B on an idle host put the whole v1.8
arc at **+8 ms load / +3 ms DOMContentLoaded**, and the arc's payload cost at **+2.4% gzip** for
*all* of v1.8, audio included.

> ⚠ Do not describe this as "zero added payload" — an external round correctly called that an
> overstatement. It is zero *audio-media* payload.

A second consequence: **a voice is a parameter set, not a recording.** The same genome therefore
sounds byte-identical on every device and through every shared creature code, which makes voices
part of the determinism guarantee rather than an exception to it.

---

## 2. Plumbing

| Function | Role |
|---|---|
| `ac()` | The AudioContext accessor. **Returns `null` when `sndOn` is false** — this is the master gate for everything *new*. Resumes a suspended context (iOS suspends on background). |
| `sfxOut(a)` | The single shared gain bus every synth exits through, so one slider rules them all. |
| `applySfxGain()` | Squared taper — the slider tracks how loud it *feels*, not raw amplitude. |

### The `ac()` gate and its one exception

Because `ac()` returns `null` while muted, no *new* sound can start. **The biome ambience bed is
the only voice that outlives its trigger** — it is an already-running looped `BufferSource` with a
live LFO — so it is the only thing that must be told about a mute explicitly.

This was a real defect (round 7, CF1802-19): `sndopt` flipped `sndOn` and nothing else, so the bed
sang on after the player asked for silence, and kept the AudioContext alive. `ambienceStop()` is
now called from the toggle. **Rule: if you add a looping or long-lived node, it must have an
explicit stop path — the `ac()` gate will not save you.**

### Toggles

| Setting | Flag | Save field | Absent ⇒ |
|---|---|---|---|
| Sound (master) | `sndOn` | `snd` | on |
| Volume | `sfxVol` | `vol` | 100 |
| Creature voices | `voiceOn` | `vce` | **on** |
| Battle sound | `combatSfxOn` | `cbx` | **on** |

Voices and battle sound are independent by design (Nick): someone may want the fight loud and the
menagerie quiet, or the reverse. With voices off, **zero oscillators are created** — the gate is
real, not a volume trim (externally verified).

---

## 3. Creature voices

### The model

`voiceOf(g)` resolves a genome to `{kind, f0, rich, nz, vib, vibD, dur, sweep}`, deterministically.

1. **A named Earth animal sounds like itself.** `_earthArt(name).rig` gives the rig, and the rig
   selects a `_VOICE` archetype — the *same taxonomy the art uses*, so a creature's voice and its
   portrait are derived from one shared idea of what it is.
2. **A hybrid drifts.** `_blendVoice(base, alien, 1-anchor)` uses the renderer's own
   `_anchorVal` law, so a bloodline's voice drifts alien at exactly the rate its body does. Earth ×
   Earth pins at anchor 0.90 forever; each alien cross weakens it.
3. **A wholly procedural creature** picks its family by hash of `g.seed`.

### The 18 archetypes

`mammal · primate · bird · bat · reptile · serpent · amphibian · turtle · fish · marine · ceph ·
insect · arachnid · crust · gastropod · jelly · sessile · legacy`

A wolf roars (mammal, 148 Hz), a sparrow chirps (bird, 2068 Hz), a blue whale sings (marine,
187 Hz over 1.20 s), a rattlesnake hisses (serpent, 630 Hz, noise 0.95).

`legacy` is documented as the fallback for a genome with no rig, but it is in `_VOICE_KEYS`, so
~5.5% of procedural creatures roll it as a first-class 18th family. Probably fine, probably not
intended — flagged, not changed.

### Genes the voice reads (v1.8.4)

Originally **three**: family (hash of seed), `size % 6`, and temperament. That is a closed set of
18 × 6 × 5 = **540 possible voices, 533 distinct after clamping** — and an external 200,000-genome
run measured a **91.3% chance that two creatures in a collection of fifty share an identical
voice.** The portrait reads fifteen-plus genes; the voice read two and a hash.

v1.8.4 folds in five more as **bounded multipliers** (`_vw(v, n, amt)` returns `1 ± amt/2` across
the gene's range, so nothing can escape the clamps):

| Gene | Affects | Amount |
|---|---|---|
| `trait` | `f0` | 0.20 |
| `body` | `f0` | 0.14 |
| `loco` | `dur` | 0.18 |
| `diet` | `rich` | 0.22 |
| `sense` | `nz`, `vib` | 0.12 |

No new branching, no payload, determinism untouched.

### Size and temperament

- **Size → pitch**, monotone: `sizeF = 1/(0.55 + (g.size % 6) * 0.22)`, tiny ≈ 363 Hz down to
  titanic ≈ 121 Hz. The `% 6` matches `FA_SIZE`/`FA_SIZE_M` exactly, so the voice always agrees
  with the size the card prints. (This looked like a wrap bug to an external reviewer and was
  checked and cleared — it is correct.)
- **Temperament → boldness.** `bold = _TEMPER_BOLD[g.temper % FA_TEMPER.length]`, moving `f0` 33%,
  `rich` 47% and `dur` 21%.

  > ⚠ Until v1.8.4 this read `(g.behavior % 5) / 4` — **the wrong gene, under the wrong modulus.**
  > `behavior` is the behaviour line ("hunting in coordinated packs"), not temperament, and
  > `FA_BEHAVIOR` has 12 entries. Distinct behaviours collapsed onto one tilt in arbitrary order:
  > "ambushing from camouflage" carried the boldest voice and "fiercely territorial" nearly the
  > meekest. `_TEMPER_BOLD` is now an explicit value per `FA_TEMPER` entry, in that array's order.

### Clamps

`f0` is clamped to 60–6000 Hz. Sitting *on* a clamp is a bug, not a safety net: at the clamp,
size and temperament stop changing the voice, so those creatures are audibly identical. An
external run found **1.98% of 200,000 creatures pinned at 6000 Hz, every one of them a bat**
(f0 was 5200, within one size step of the ceiling) and 0.93% at the 60 Hz floor (sessile, jelly).
Bat is now 3600, and `playVoice` tapers gain above 4 kHz — equal amplitude is not equal loudness
in the shrillest band of human hearing.

---

## 4. Combat

`playHit(frac, crit, ability)` — one sound per blow, wired into duel playback:

```js
playHit(L.dmg / Math.max(1, _mx), !!L.crit, !!(L.fs || L.ex || L.stp));
```

`frac` is the blow's damage as a fraction of the target's max HP, and it drives everything: the
body thump (`220 - heavy*120` Hz), the impact band (`900 + heavy*700`), the envelope and the tail.
Crits ring separately at 1760 → 2640 Hz; ability procs are a 330 → 880 Hz saw through a Q-4
bandpass. **Skipped playback is silent by design** (`!_skip`). Gated on `combatSfxOn`.

Before v1.8 a whole duel played exactly one sound, at the very end.

---

## 5. Planetfall and ambience

- `playArrival(tier)` — an arrival chord on planetfall, root pitched by world tier.
- `ambienceStart(key)` / `ambienceStop()` — a biome bed: two seconds of pink-ish noise, looped,
  through a bandpass whose frequency is swept by a slow LFO so it never sits flat. `_AMB` holds
  per-biome `{f, q, g, lfo}` for ice, tundra, desert, glass, ocean, coral, lava, magmasea, swamp,
  jungle, gas, carbon, plus `_def`.

**Lifecycle — the bed must never outlive its reason to exist.** It stops on: vista close
(`_vistaDismiss`), `visibilitychange` → hidden, master Sound off, and any `ambienceStart` (which
stops the previous bed first). Ramped down over 0.5 s, nodes stopped 700 ms later.

⏳ **Known, deliberate:** nothing restarts the bed when the tab becomes visible again, so returning
to a vista leaves it silent. Flagged as a design decision, not chosen silently.

---

## 6. The feedback grammar

The claim this layer makes is about a **contrast**: a blocked action must sound unmistakably
unlike a successful one, so a dead tap is recognisable before the words are read.

| Function | Meaning |
|---|---|
| `playDeny()` | 200 Hz → 150 Hz triangle pair. Refusal. |
| `playConfirm()` | 660 Hz → 990 Hz sine pair. Success. |
| `_denyPress()` / `_okPress()` | The **press-level** wrappers. Call these, not the raw tones. |

> ⚠ Two defects here are worth remembering because both were invisible to testing:
>
> 1. **`playConfirm` was defined, exported, destructured — and called from nowhere.** A grammar
>    built on a contrast shipped with one side wired. Nothing failed; the sound was simply never
>    heard.
> 2. **`playDeny` fired from inside `_denialHTML`, a markup builder.** Safe only by accident of
>    there being one call site outside a re-render loop — any future render path would have played
>    a refusal with no player action behind it.
>
> Hence `_denyPress`/`_okPress`: **a tone belongs to a press, never to a render.**

### Scope-trap warning

`_denyPress`/`_okPress` are defined at **true top level, after the `Fx` destructure** — not inside
the `Fx` module. The first cut put them next to `playDeny` inside the IIFE and every app-layer
caller threw `ReferenceError`. The export comment three lines above literally warns about this
trap ("the module-scope trap that cost rounds 4 and 5") and it still happened.

**Rule: a helper belongs in the scope of its callers, not its callees.**

### Where refusals sound

Specimen-card shortfall buttons (`.needs`, delegated) · the Fabricator shortfall button
(`.bclaim.need`) · the empty-picker denial · lesson-blocked verbs during training (`_tutRefuse`,
throttled to 600 ms so a mashed button cannot machine-gun).

---

## 7. Code anchors

`ac` 13516 · `sfxOut` 13485 · `_blendVoice` 13558 · `voiceOf` 13564 · `playVoice` 13609 ·
`playRaritySting` 13654 · `playFanfare` 16019 · `playHit` 16035 · `playArrival` 16082 ·
`ambienceStart` 16111 · `ambienceStop` 16132 · `playBlip` 16146 · `playDeny`/`playConfirm` 16162 ·
`_VOICE` 13526 · `_TEMPER_BOLD` just above it · `_AMB` near `ambienceStart`.

---

## 8. Testing

Audio is hard to gate and most of it is **not** covered by assertions on sound itself. What *is*
gated (smoke): the toggles round-trip; `_TEMPER_BOLD` has one entry per `FA_TEMPER` entry and the
most aggressive temperament is the boldest; two genomes differing only in `trait`/`diet`/`loco`
produce different voices; a bat-family voice still moves with size rather than pinning at the
clamp; `ambienceStop` exists and is callable.

**What no harness here can do is judge whether any of it sounds good.** Playwright runs with
`--mute-audio`, and no external persona fleet reads an audio signal, so a flat A/B from one is
meaningless rather than reassuring — an external round said exactly this and declined to score it.

**A human listening test is the only instrument that can answer it**, and the three prerequisites
an external round named (the mute lifecycle, the 540-voice vocabulary, the mis-keyed temperament)
are all now fixed — so that test is worth running before committing to any large audio expansion.
