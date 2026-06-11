# Celestial-Frontier
Master the infinite

**Celestial Frontier: Cosmic Codex** — a single-file, offline-capable HTML/Canvas
game: a deterministic, procedurally generated, effectively infinite universe.
Survey worlds, catalogue alien life, breed hybrids, conquer planets, complete
the Prime Codex.

## Play

Open `celestial-frontier.html` in any modern browser. No build, no server,
no dependencies. Saves live in `localStorage`.

## Code

The whole game is one `<script>` inside the html, organized on SOLID lines into
deterministic **domain modules** (`@module … [domain]`), **art/service modules**
(`@module … [app]`) and **app sections** (`@section …`). Read the
`ARCHITECTURE` comment at the top of the script, then `HANDOFF.md`,
`CLAUDE.md`, and `celestial-frontier-codebase-reference.md`.

## Develop

```
npm install                # once (acorn + jsdom, dev-only)
node tools/extract.js      # html  -> main.js  (edit main.js)
node tools/validate.js     # main.js -> html, then all checks:
                           #   syntax, CSS braces, duplicate ids,
                           #   determinism grep, headless boot,
                           #   49-probe fingerprint vs the v1.0 baseline
```

`original/celestial-frontier-v1.0.html` is the pristine pre-refactor build the
determinism baseline was captured from. Hard rule: nothing nondeterministic may
feed world/genome/descriptor generation — share codes and cross-device parity
depend on it.
