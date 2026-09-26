# Painted Mars local preview — September 8, 2026

Open [the local painted Mars study](http://127.0.0.1:56099/?paintedvista=1). Skip Training, select Mars in Sol,
press Land, then close Survey. The native panorama shows the new rich dune/rock treatment.
This scene is static and exact to barren canonical Mars. The older globe and existing UI placement
remain visible; this is not the final integrated biome composition or an all-universe upgrade.

The package also includes prior Earth turn/material, star, audio and UI work. To inspect Earth,
use `?planetturn=1&planetmaterial=1`; `?avpilot=1` opens the prior wider audiovisual comparison,
which can hide the native globe. Offline Wolf/rig masters and reference sheets are not installed.

Read-only server PID58886 / exec66980 serves
`port/v2/apps/game/smoke/dev-preview-painted-mars-local-20260908`.
Source parent `837db4aaa0ef5d3d8bffc79c70f62dcc2503032d`, **dirty-local-only / publishable:false**.
Content SHA256 `8721f86dce95a43e7c773f96d3b82b9a59150bedcf70053a224b3f0a79423651`;
manifest SHA256 `5c058b509b105440e4e7142e4885dd0997d424533e15a72fa088df47529d46d6`.
Package integrity and isolated native boot/Skip/Guide identity smoke passed, without diagnostic
API or corner badge. Separate evidence build: fixed phone390×844@2, desktop1440×1000@1 and exact
missing-asset fallback passed; this is not physical iPhone/Safari, PWA or full game certification.

If this process ends, restart the same verified package with a fresh receipt path:

```sh
node audits/AV_PAINTED_MARS_20260908/serve-preview.mjs /Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/dev-preview-painted-mars-local-20260908 /private/tmp/cf-painted-mars-preview-restart.json
```

It chooses a fresh port and prints the URL. Earlier previews remain separate immutable packages.
No remote dev/production publication occurred. [Review and limitations](../../audits/AV_PAINTED_MARS_20260908/README.md).
