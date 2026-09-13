# Tooling additions for the 2D animation, effects and arena track

Recorded 2026-09-12 at Nick's request. Everything here supports the command line.

## Installed on the Mac by Claude (Homebrew, machine-level, not repository state)

| Tool | Version | Use | Command line |
|---|---|---|---|
| pngquant | 3.0.3 | lossy PNG size reduction for archived masters and review sheets | `pngquant --quality=80-95 --speed 1 --output out.png in.png` |
| oxipng | 10.2.1 | lossless PNG optimization for masters kept as PNG | `oxipng -o 4 --strip safe in.png` |

Already present and sufficient: ffmpeg (captures, Opus/AAC), ImageMagick (keying, masks), cwebp/dwebp (shipping WebP), Blender (engine-port assets only), Inkscape, Node/npm, REAPER.

## To add to port/v2 by Codex (its worktree; pinned; no other new dependency)

| Package | Pin | Use |
|---|---|---|
| `gsap` | 3.15.0 | tweening between key poses: easing, anticipation, overshoot, timelines. Verify whether it is already declared in `port/v2` or only in `tools/ui-motion`; if the latter, add it to the game app. |
| `@pixi/particle-emitter` | 5.0.10 | motion of ability effect sequences: launch, travel, impact bursts. Art comes from the kit's Effects class. |
| `free-tex-packer-core` | 0.3.9 | pack a rigged creature's parts into one atlas per creature (phone memory). |
| `free-tex-packer-cli` | 0.3.0 | the same from the command line inside the pack build. |

Install line for Codex, from `port/v2` (adjust workspace path to the game app if needed):

```bash
npm install --save-exact gsap@3.15.0 @pixi/particle-emitter@5.0.10 && npm install --save-dev --save-exact free-tex-packer-core@0.3.9 free-tex-packer-cli@0.3.0
```

## Toolchain integration

- `tools/development-toolchain.mjs --check` should detect `pngquant` and `oxipng` and record their versions like the other CLI tools; absence is a warning, not a failure, since shipping assets are WebP.
- `UI_TOOLCHAIN.md` lists both under approved idle tools with the same update policy as ImageMagick.
- The asset intake check (kit section 8, "pixels are the arbiter") may run `oxipng` on retained PNG masters after hashing the original; the original bytes and hash are what the kit binds, so optimize copies, never the master.
- The parts-atlas build runs `free-tex-packer-cli` deterministically (fixed sort, fixed padding, no timestamps in output JSON) so atlases hash stably.

## Deliberately not installed

Spine, DragonBones or any GUI animation tool (poses are authored in the pipeline; a dev-only in-browser pose editor is the right tool if hand-tuning is wanted); Aseprite (not pixel art); a game engine (port-time decision); Python torch/optimum (only if a tier-1 finisher candidate needs conversion from safetensors).
