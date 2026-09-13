# Painted Mars composition preview — September 8, 2026

Open [the local preview](http://127.0.0.1:56749/?paintedvista=1). Skip Training, select Mars in Sol, press Land and
close Survey. A first descent can wave off; use the displayed guaranteed learned approach if it
does. The full painted panorama is now visible without the old globe in front. It remains static.
Phone keeps the complete horizontal picture in a centered band; large starfield gaps remain.

The package includes prior star/audio/UI/Earth work. Use `?planetturn=1&planetmaterial=1` for the
older Earth proof and `?avpilot=1` for the prior audiovisual comparison. Offline Wolf rigs and
reference sheets are not installed. Earth species rules and existing UI placement remain binding.

Server PID63914 / exec26352 serves
`port/v2/apps/game/smoke/dev-preview-painted-mars-composition-local-20260908`.
Source parent837db4aaa0ef5d3d8bffc79c70f62dcc2503032d, dirty-local-only, publishable:false.
ContentSHA a740b005c7c054b22e5d3ab30ead610cbdb39e9f6336443ec3f771d7fa1024c7;
manifestSHA 8b3c459bcab86afd9d4a352abd70898bdbeb2c81b7d93b9f420b89d6e9e15a40.
Package/native boot/Skip/Guide checks passed. No diagnostic API or corner badge. Separate native
phone/desktop/default/blocked-image checks passed; this is not physical iPhone/Safari/PWA UAT.

If stopped, restart the same verified package using a fresh receipt filename:

```sh
node audits/AV_PAINTED_MARS_COMPOSITION_20260908/serve-preview.mjs /Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/dev-preview-painted-mars-composition-local-20260908 /private/tmp/cf-mars-composition-preview-restart.json
```

The server prints its new loopback port. Older previews remain separate. No hosted publication.
[Review evidence and remaining work](../../audits/AV_PAINTED_MARS_COMPOSITION_20260908/README.md).
