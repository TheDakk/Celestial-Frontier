# Celestial Frontier

A procedural space-exploration creature game: survey seeded worlds, catalogue alien life, breed hybrids, conquer planets and complete the Prime Codex.

This branch, `celestial-frontier-v2`, is the clean code base for version 2. Code is ported here one system at a time; it holds only what the game needs to build, run and test.

Reference documents from version 1 live on the `celestial-frontier-v1-reference` branch.

## Usage

- Install: `npm install`
- Test: `npm test`
- Typecheck: `npm run typecheck` (the root project only; the gate also typechecks the diagnostics app, the game app, audio and persistence, each with its own tsconfig)
- Gate (clean-branch check, purity check, app structure check, typecheck, tests; must pass before merging): `npm run gate`
- App structure check, run by the gate: no file under `apps/` over 500 lines; in the game app, a system folder imports only itself, `bus`, `events`, `platform/` and `ui/`, and only `main.ts`, `layout-main.ts` and `screens/` import other systems, by their `index.ts`
- Layout check (not part of the gate; run it before merging any change to a screen): `npm run layout`. It builds the layout page, serves it on this machine only, opens it headless in an installed Chromium-family browser (`CF_BROWSER`, else the usual places of Edge, Chrome and Chromium) and lays out every screen state at six sizes, under touch and mouse, at the smallest and largest text size, in English and the pseudo-locale. It fails on clipped text, a control overlapping a control or text, a control under 44 px under touch, text with no solid surface under it, anything off the screen, and words of the map wider than the view. Exit 0: no problem; 1: problems; 2: it could not run. `--selftest` only proves the check on planted faults; `--plant <fault>` plants one in every case. About ten seconds
- Game (`--host` makes it reachable from a phone on the same network): `npm run dev -w @cf/game -- --host`; build: `npm run build -w @cf/game`
- Renderer diagnostics page (recomposes the recorded creatures and reports whether every hash matches; `--host` makes it reachable from a phone on the same network): `npm run dev -w @cf/diagnostics -- --host`
- Check an art pack (one or more art text files, joined in order; reads only those files, writes nothing; exit code 0 only when there is no error; its `coverage:` lines count the generated creatures the pack cannot draw in full, which is an error only with `--require-coverage`): `node tools/check-pack.mjs [--require-coverage] <file> [more files...]`

### Recorders

These rewrite files under `fixtures/`. Fixtures are protected: re-record only when Dakk says so.

- Gameplay fixtures, from the current game: `node tools/record-fixtures.mjs --source <path to the current game's v2 folder> --only <name>`
- v1 fixtures (`fixtures/v1/recorded/`), from the v1 game file: `node tools/record-v1-fixtures.mjs --ref <folder holding celestial-frontier.html> [--only <name>]`
- Art golden hashes (`fixtures/art/quadruped-v1.json`), from the placeholder catalogue: `node tools/record-art-hashes.mjs`
- Map golden hashes (`fixtures/art/space-v1.json`, `fixtures/art/space-v2.json` for the maps with their passes on, `fixtures/art/space-v3.json` for the maps as the map screen draws them, sized by the camera, with their words, and `fixtures/art/space-v4.json` for those words stood clear of each other, of their bodies and of the top bar and the dock), from the placeholder interface sheet: `node tools/record-space-hashes.mjs`

Working rules for contributors and agents are in `CLAUDE.md` and `AGENTS.md` at the repository root.
