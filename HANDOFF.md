# Celestial Frontier — Engineering Handoff (v1.0)

**Date:** June 11, 2026
**Status:** Shipped at v1.0, fully playable, no known open bugs. Security/perf audited at v1.0.
**Audience:** Any engineer (or Claude Code session) picking this project up cold.

---

## 1. What you're inheriting

**Celestial Frontier: Cosmic Codex** is a single-file, offline-capable HTML/Canvas game: a deterministic, procedurally generated, effectively infinite universe. The player zooms universe → galaxy → star system → planet surface, surveying worlds, cataloguing alien life (Microbe / Flora / Fauna / Fungi), breeding hybrids, conquering planets, and completing the **Prime Codex** (9 "Signatures") to reach an ending. Mobile-first (primary test device is an iPhone), runs in any modern browser, persists via `localStorage` only — no server, no build step, no dependencies.

| File | What it is |
|---|---|
| `celestial-frontier.html` | **The entire game.** ~7,225 lines / ~404 KB. One `<style>` block, markup, one big `<script>` starting ~line 948 (~6,275 lines of JS). |
| `celestial-frontier-codebase-reference.md` | **Read this next.** Full technical reference: architecture, world-gen, genome/breeding, combat math, progression, save format, UI map, glossary, dev history. It mirrors the source as of v1.0; if they ever disagree, **the source wins — then update the reference.** |
| `CLAUDE.md` | Condensed working rules for Claude Code sessions. |
| `HANDOFF.md` | This file. |

To run the game: open `celestial-frontier.html` in a browser. That's it.

---

## 2. The five-minute architecture tour

- **Rendering:** full-screen Canvas2D (`#cosmos`), `requestAnimationFrame` loop (`frame` → `frameInner`). DPR capped at 3 for mobile GPUs. Four modes in `st.mode` — `universe / galaxy / system / surface` — each with its own `draw*` function; `checkTransitions` handles zoom-driven mode changes.
- **Determinism is sacred.** The whole universe derives from seeds (`mulberry32`, `hashInt`, `cellRng`) and on-demand cell-based generation (`galaxiesInCell`, `starsInCell`, …). Descriptors (`planetDescriptor`, `starDescriptor`, …) are **pure functions** of position/seed. This is what makes the universe identical on every device and share codes work. Never introduce nondeterminism (e.g. raw `Math.random()`, `Date.now()`) into anything that feeds world content, genomes, or descriptors.
- **Key anchors:** home galaxy seed `999` at `{x:90, y:-60}`; Sol system seed `424242`; Earth = planet seed `133` (conquered from game start); save key `cfcc_save_v1`; `PLAYER_SEED = 0x50A1E5` keeps duels vs. the player deterministic.
- **Life:** `makeGenome` / `crossGenome` / `evolveGenome`; per-kingdom SVG portraits via `speciesPortrait` (cache capped at 1,200). Twelve rarity tiers, Common → Transcendent (the four "deep spectrum" tiers past Unique arrived in v1.3).
- **Combat:** five player stats (vit/fer/res/agi/ins, start at 50, grown by eating flora). Duels (`runDuel`) and conquest (`conquerPlanet` → `runConquestBattle`) are deterministic per matchup. 11 biome-themed ability families.
- **Progression:** Compendium (species), Star Atlas (bookmarks), stardust economy (harvests on 1-hour cooldown, conquest spoils, rare-find bonuses), 10 ranks, stepped frontier expansion (`REGIONS`), and the 9-Signature Prime Codex win track with multiple endings.

Everything above is expanded, with exact formulas and function names, in the codebase reference — sections are numbered; §3 (architecture), §6 (combat math), §10 (save format) are the ones you'll reach for most.

---

## 3. How to make changes safely (the established workflow)

This file is too large and too interdependent to freehand-edit. The proven loop:

1. **Work on a copy** (e.g. `work/celestial-frontier.html`), never the original in place.
2. **Edit via exact-string replacement** — historically a Python `rep(old, new, count, label)` helper that **asserts the match count and aborts before writing** if it's wrong. A bad match must never silently corrupt the file. (Claude Code's `str_replace`-style editing with unique-match enforcement serves the same purpose.)
3. **Validate after every batch:**
   - Extract the `<script>` block to `main.js`, run `node --check main.js`.
   - CSS brace-balance check.
   - Duplicate-element-id check.
   - Run the test suites (see §4).
4. Only then ship the updated file.

### Encoding landmines (read before your first edit)
The source **mixes encodings**: some unicode lives as literal `\uXXXX` escape *text* inside JS strings (decoded at runtime), some as real UTF-8 characters (—, ·, ❤, emoji). Consequences:

- In Python here-docs, `\uXXXX` decodes to a real char while `\\uXXXX` stays literal — easy to write a "matching" string that doesn't actually match the bytes on disk.
- Prefer HTML entities (`&middot;`, `&mdash;`) in static markup to avoid escape-text rendering bugs.
- When a match mysteriously fails, `cat -A` (or hexdump) the region to see the true bytes before retrying.

---

## 4. Testing — important caveat

> **Update (June 2026, SOLID restructure):** a replacement toolkit now lives in
> `tools/` — `node tools/validate.js` runs the invariant checks below **plus** a
> headless jsdom boot and a 49-probe determinism fingerprint pinned to the v1.0
> baseline. See `tools/README.md`. The pristine v1.0 build is kept at
> `original/celestial-frontier-v1.0.html`. The rest of this section is the
> original v1.0 context.

v1.0 was validated by ~25 Node assertion suites (`phaseAtest` … `feedback19test`, `primetest`, `atlastest`, `realmtest`, `finaltest`, `esc_check`) plus the invariant checks above and a Playwright smoke test (every panel, all four settings toggles, Escape handling, search, heal picker, reset flow — zero console errors).

**Those test scripts lived in the previous working environment and are *not* included in this package** — only the game and its reference survived. Practical implications:

- The invariant checks (`node --check`, CSS brace balance, duplicate ids) are trivial to recreate and should be your minimum bar on any change.
- The assertion suites were mostly regex checks of structural/behavioral properties of the extracted `main.js`. Recreate targeted ones as you touch each area rather than rebuilding all 25 up front.
- House rule preserved from v1.0: when an intentional change breaks an assertion, **update the stale assertion — never weaken the intent behind it.**
- A fresh Playwright smoke test is the highest-value thing to rebuild first if you plan sustained work.

---

## 5. Gotchas and invariants to respect

- **Naming is deliberate:** the species catalogue was renamed **Compendium**, but "**Prime Codex**" (win track) and "**Cosmic Codex**" (app subtitle) intentionally keep "Codex." Don't "fix" this.
- **Save compatibility:** players have live `cfcc_save_v1` saves. `loadSave` hardens against tampering (sanitized names, coerced/clamped counters, essence clamped 0–1e9, conquest timestamps clamped to now, notifications capped at 60). If you change the save shape, version it and migrate — don't break existing saves.
- **Economy is audited:** flora is consumed on eat, both breed parents are consumed, feed multipliers are normalized and capped, rare-find stardust only triggers on genuinely new species, conquered worlds can't be re-won. Keep these invariants when touching adjacent code.
- **Performance budgets:** art cache ≤ 1,200, DPR ≤ 3, notifications ≤ 60, survey panel rebuilds only on content change, FX particles self-clean. Mobile is the primary target — test there.
- **UI conventions:** unified topbar layout on all platforms (`--topbar-h` / `--row1-h` measured live via `syncTopbarH` + ResizeObserver); global Escape closes the topmost overlay in a defined order; all modals close on backdrop click; toasts/actions use Title Case; settings toggles (text size, sound, effects, screen shake, notifications) all persist.
- **`cleanName` guards every user/code-supplied string** (strips `<>&"'`, 24-char cap), including names embedded in `CF1-` share codes and `CFB-` duel codes. Any new string input must go through it.

---

## 6. State of play & sensible next steps

There is **no open bug list** — v1.0 closed out 19 feedback rounds plus a hardening pass (full history in reference §13). The game is in a "done unless extended" state. If work resumes, the natural first moves are:

1. Recreate the invariant checks + a Playwright smoke test (per §4) so you have a safety net.
2. Skim reference §13 (development history) to absorb the taste/judgment behind past decisions before proposing UX changes — many current behaviors are the result of explicit iteration.
3. Keep the codebase reference updated as you go; it exists precisely so future sessions don't have to re-read 7,200 lines.

Credit line in-game: "Celestial Frontier · v1.0 · Developed by Dakk".
