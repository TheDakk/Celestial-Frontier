# User-requested Inkscape retest — 2026-09-08

Nick reported that the GUI starts successfully and explicitly requested another test.
One isolated CLI version/export chain ran outside the Codex macOS sandbox under the shared
foreground toolchain lock at 07:38:54–07:38:55 UTC. The existing uninterrupted-session startup
receipt remains `audits/TOOLCHAIN_STARTUP_20260907/manifest.json`.

**PASS:** Inkscape 1.4.4 exported the synthetic SVG to a correct 128×128 RGBA PNG. Version,
export and ImageMagick inspection all exited zero. The PNG is byte-for-byte identical to the
September 7 successful output, SHA256
`d92fb5e826d2faca239fe5dc946caa48de27a88adfd1a15b073c48f7ad81b3a3`.
Visual inspection confirms the blue planet, gold diagonal band, white dot and dark background.
The existing GDK CVDisplayLink warning was nonfatal. No crash was reproduced.

Inkscape remains qualified for isolated vector artwork and PNG exports outside the sandbox.
Earlier sandboxed registration crashes retain an unproven exact cause. The prior September 8
ImageMagick text-parser red remains untouched; this check uses direct PNG byte equality.
No GUI window, user document, installation, game asset, runtime code or dependency was changed.
No new icon study is implied; the colorful emoji preference remains in force.

## Local checkpoint and next work

OpenAI/Codex × macOS × `/Users/nick/Projects/celestial-frontier-openai-mac` × `openai/mac`,
tracking `origin/openai/mac`; HEAD `837db4aaa0ef5d3d8bffc79c70f62dcc2503032d`, 38 ahead/0 behind.
SSH origin remains `git@github.com:TheDakk/Celestial-Frontier.git`; the session's established
TheDakk authentication/repository-read proof is reused. Existing staged audiovisual work and
its immutable protostar recovery patch are preserved. This adds only the retest evidence and
current tool/handoff notes. Signing still awaits restored 1Password agent evidence; no retry
or unsigned fallback. No product validation rerun is needed for this tool-only confirmation.
The next bounded coding candidate remains `audits/AV_PROTOSTAR_DISK_20260908/NEXT_AUDIO.md`.

Codex next: continue the authorized local campaign on openai/mac. GitHub step: none; PR details:
not needed for this confirmation. Claude Code on macOS/anthropic/mac need not open or sync now
and does not have the unmerged changes. After a later authorized openai/mac → develop merge,
Claude fetches and merges origin/develop into its own clean branch; no manual file copying.
Develop, main, hosted dev and production are unchanged. Actions remains UNFROZEN/public,
private fallback cap 3,000; zero current hosted-run authority, attempts or cost.
