# CLAUDE.md — Celestial Frontier

Single-file HTML/Canvas game. **Read `HANDOFF.md` first**, then consult
`celestial-frontier-codebase-reference.md` for deep detail (architecture §3,
combat math §6, save format §10). If the source and the reference disagree,
the source wins — then update the reference.

## Project layout
- `celestial-frontier.html` — the entire game (~7,225 lines; one `<style>`, markup, one `<script>` from ~line 948). No build step, no dependencies. Run by opening in a browser.
- `celestial-frontier-codebase-reference.md` — full technical reference, keep it in sync with the source.

## Hard rules
1. **Never break determinism.** All world/genome/descriptor content derives from seeds (`mulberry32`, `hashInt`, `cellRng`). No `Math.random()` / `Date.now()` in anything that feeds generation, or share codes and cross-device parity break.
2. **Edit by exact, unique string match only.** Verify match count before writing; a bad match must never silently corrupt the file. Work on a copy, not in place.
3. **Encoding caution:** the source mixes literal `\uXXXX` escape text in JS strings with real UTF-8 chars (—, ·, ❤, emoji). When a match fails, inspect true bytes (`cat -A`) before retrying. Prefer HTML entities in static markup.
4. **After every batch of edits:** extract the `<script>` block to `main.js` and run `node --check main.js`; verify CSS brace balance; verify no duplicate element ids. Original v1.0 assertion suites are not in this package (see HANDOFF §4) — recreate targeted checks as you touch each area; never weaken a test's intent to make it pass.
5. **Don't break live saves** (`localStorage['cfcc_save_v1']`). Shape changes require versioning + migration. Preserve the load-time hardening (sanitize/coerce/clamp).
6. **Preserve audited invariants:** flora consumed on eat; both breed parents consumed; rare-find stardust only for genuinely new species; conquered worlds can't be re-won; caps (art cache 1,200; DPR 3; notifications 60).
7. **Naming:** species catalogue = "Compendium"; "Prime Codex" and "Cosmic Codex" deliberately keep "Codex" — do not rename.
8. **Mobile-first.** Primary device is iPhone; unified topbar layout relies on `--topbar-h`/`--row1-h` via `syncTopbarH`. Test touch + small viewports.

## Key anchors
Home galaxy seed `999` @ `{x:90,y:-60}` · Sol seed `424242` · Earth seed `133` ·
`PLAYER_SEED 0x50A1E5` · `HARVEST_CD 3600e3` · save key `cfcc_save_v1`.
