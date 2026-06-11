# CLAUDE.md — Celestial Frontier

Single-file HTML/Canvas game. **Read `HANDOFF.md` first**, then consult
`celestial-frontier-codebase-reference.md` for deep detail (architecture §3,
combat math §6, save format §10). If the source and the reference disagree,
the source wins — then update the reference.

## Project layout
- `celestial-frontier.html` — the entire game (~8,000 lines; one `<style>`, markup, one `<script>` from ~line 948). No build step, no runtime dependencies. Run by opening in a browser.
- The script is organized on SOLID lines (see the ARCHITECTURE comment at its top): `@module … [domain]` blocks are pure/deterministic revealing-module IIFEs (Rand → WorldGen → Genome → Descriptors → CombatCore, …); `@module … [app]` blocks are art/service modules (ThumbArt, GalaxyArt, SpeciesArt, Fx, SaveSystem, Renderer); `@section` blocks are UI/state/wiring. Put new code in the unit that owns the concern. A module's non-exported names are private; to export one more, extend the banner's `API:` line, the `Object.freeze({...})` return, and the destructuring line beneath it (all three list the same names).
- `celestial-frontier-codebase-reference.md` — full technical reference, keep it in sync with the source.
- `tools/` — verification toolkit (`npm install` once, then see `tools/README.md`).
- **Live site:** https://thedakk.github.io/ — deployed from the sibling repo clone at `..\thedakk.github.io` via `node tools/deploy.js` (run only after validate + smoke pass, and only at user-approved milestones). This repo is the source of truth; never edit the site repo directly.
- `original/celestial-frontier-v1.0.html` — pristine pre-refactor build (the determinism baseline was captured from it).

## Hard rules
1. **Never break determinism.** All world/genome/descriptor content derives from seeds (`mulberry32`, `hashInt`, `cellRng`). No `Math.random()` / `Date.now()` in anything that feeds generation, or share codes and cross-device parity break.
2. **Edit by exact, unique string match only.** Verify match count before writing; a bad match must never silently corrupt the file. Work on a copy, not in place.
3. **Encoding caution:** the source mixes literal `\uXXXX` escape text in JS strings with real UTF-8 chars (—, ·, ❤, emoji). When a match fails, inspect true bytes (`cat -A`) before retrying. Prefer HTML entities in static markup.
4. **After every batch of edits, run `node tools/validate.js`.** It reassembles the html from `main.js` (use `node tools/extract.js` first to get `main.js`), then runs: `node --check`, CSS brace balance, duplicate-id check, a no-`Math.random`/`Date.now`-in-domain-modules grep, a headless jsdom boot (zero errors required), and a 49-probe determinism fingerprint that must match the v1.0 baseline byte-for-byte (`tools/baseline.json`). Never regenerate the baseline just to make a failure pass — a mismatch means observable behavior changed. Recreate targeted assertions as you touch each area; never weaken a test's intent to make it pass.
5. **Don't break live saves** (`localStorage['cfcc_save_v1']`). Shape changes require versioning + migration. Preserve the load-time hardening (sanitize/coerce/clamp). New fields must default safely when absent — e.g. `tut` absent ⇒ tutorial treated as done (veterans never see Field Training), `tips` absent ⇒ tooltips on.
6. **Run `node tools/smoke.js` after UI changes** — it boots the game in jsdom and drives real flows (the full 18-step Field Training, the Guide, tooltips, veteran-save and skip paths; 64 checks). Keep the tutorial's `gameEvent` emissions intact when touching the systems they report from.
7. **Preserve audited invariants:** flora consumed on eat; both breed parents consumed; rare-find stardust only for genuinely new species; conquered worlds can't be re-won; caps (art cache 1,200; DPR 3; notifications 60).
8. **Naming:** species catalogue = "Compendium"; "Prime Codex" and "Cosmic Codex" deliberately keep "Codex" — do not rename.
9. **Mobile-first.** Primary device is iPhone; unified topbar layout relies on `--topbar-h`/`--row1-h` via `syncTopbarH`. Test touch + small viewports.

## Key anchors
Home galaxy seed `999` @ `{x:90,y:-60}` · Sol seed `424242` · Earth seed `133` ·
`PLAYER_SEED 0x50A1E5` · `HARVEST_CD 3600e3` · save key `cfcc_save_v1`.
