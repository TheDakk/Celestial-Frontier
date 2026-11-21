# Celestial Frontier

A procedural space-exploration creature game: survey seeded worlds, catalogue alien life, breed hybrids, conquer planets and complete the Prime Codex.

This branch, `celestial-frontier-v2`, is the clean code base for version 2. Code is ported here one system at a time; it holds only what the game needs to build, run and test.

Reference documents from version 1 live on the `celestial-frontier-v1-reference` branch.

## Usage

- Install: `npm install`
- Test: `npm test`
- Typecheck: `npm run typecheck` (the root project only; the gate also typechecks the diagnostics app, audio and persistence, each with its own tsconfig)
- Gate (clean-branch check, purity check, typecheck, tests; must pass before merging): `npm run gate`
- Renderer diagnostics page (recomposes the recorded creatures and reports whether every hash matches; `--host` makes it reachable from a phone on the same network): `npm run dev -w @cf/diagnostics -- --host`
- Check an art pack (one or more art text files, joined in order; reads only those files, writes nothing; exit code 0 only when there is no error): `node tools/check-pack.mjs <file> [more files...]`

### Recorders

These rewrite files under `fixtures/`. Fixtures are protected: re-record only when Dakk says so.

- Gameplay fixtures, from the current game: `node tools/record-fixtures.mjs --source <path to the current game's v2 folder> --only <name>`
- v1 fixtures (`fixtures/v1/recorded/`), from the v1 game file: `node tools/record-v1-fixtures.mjs --ref <folder holding celestial-frontier.html> [--only <name>]`
- Art golden hashes (`fixtures/art/quadruped-v1.json`), from the placeholder catalogue: `node tools/record-art-hashes.mjs`

Working rules for contributors and agents are in `CLAUDE.md` and `AGENTS.md` at the repository root.
