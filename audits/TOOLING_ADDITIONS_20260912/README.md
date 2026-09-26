# September 12 tooling setup receipt

Requested exact dependencies are installed: game app gsap 3.15.0 and
@pixi/particle-emitter 5.0.10; port/v2 devDependencies free-tex-packer-core 0.3.9 and
free-tex-packer-cli 0.3.0. npm added transitive dependencies (including the emitter's
Pixi 7 peers); no pre-existing locked package version changed. No peer override,
legacy-peer-deps flag, Pixi downgrade or unrelated direct package was added. npm reported
an unapproved fsevents install script; it was not approved as part of this work.

The supplied tooling note is verbatim in ../CLAUDE_FULL_REVIEW_20260910/.
Its role is supporting evidence. Nick's explicit copies-only rule controls PNG optimization.
The active kit remains SHA-256 7abf7834fab0056cadc673d1df4f3f614538cb279089236c5ed1951344d7a457.
No master or accepted painting was altered; no model/browser/production pack run occurred.

- toolchain-check.json: updated --check PASS, pngquant 3.0.3 / oxipng 10.2.1 executable
  versions recorded. No tool update; uninterrupted September 12 startup receipt reused.
- focused-tests.txt: 9 PASS. Missing/bad optional CLI versions warn; required failures remain
  red. Synthetic CLI atlas repeated with reversed input order is byte-identical across PNG,
  JSON and receipt, preserves every source pixel, and rejects hash mismatch, duplicates,
  existing output directory and overflow into a second atlas. No checkout lock in tests.
- package-verification.json: exact installed pins and paused GSAP midpoint/end/replay outcome.
  The first receipt attempt hit Pixi's package.json export restriction; the corrected read
  uses its installed manifest directly. No runtime retry or rendering was involved.
- typecheck.txt: all three v2 TypeScript configurations PASS.
- validate.txt: root validator PASS, including 50-probe v1.0 fingerprint.

Use tools/creature-animation/rig-atlas.mjs from port/v2 for one hash-bound creature manifest.
It stages copies in temporary storage, uses the pinned CLI/core with fixed options, validates
output cardinality/frame names/dimensions, strips variable metadata, and creates a new output
directory. No optimizing command is invoked. Synthetic capability is not a rigged-Civet atlas.

GSAP timelines and the emitter are selected for the pending proof, not yet wired. Emitter
5.0.10 declares Pixi >=6.0.4 <8 peers while the game uses Pixi 8.19.0, and contains default
Math.random/shared-ticker behavior. Resolve that integration boundary before travel/impact
rendering; do not silently change pins, patch global randomness or add a second renderer.
Arena/Effects v4.2 approval remains pending. No GitHub step; PR42 parked.
