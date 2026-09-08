# Earth material local preview — September 8, 2026

Open [the local material study](http://127.0.0.1:55500/?planetturn=1&planetmaterial=1).
Skip Training, select Earth in Sol, press Land, then close Survey. The globe turns briefly
under stationary lighting and separate clouds. Remove `planetmaterial=1` for plain shading.
Use `?avpilot=1` for the wider prior audiovisual comparison; it can hide the Earth globe.

This is a subtle technical material proof, below the approved painted finish. It includes
prior audio/UI/third-star work, not offline Wolf rigs or generated concept sheets. Phone and
desktop here mean isolated Edge viewports, not physical iPhone/Safari qualification.

The server is PID53959 / exec75189 and serves the immutable local package
`port/v2/apps/game/smoke/dev-preview-earth-material-local-20260908` (dirty-local-only,
publishable:false, source parent837db4aaa0ef5d3d8bffc79c70f62dcc2503032d).
ContentSHA88ecc9a8282cf12e3bd7deaea7ed663e8f262b882b154027f513287122dc0658;
manifestSHA9bbdcf4c82c9877b8def214162486b6fa545302bb9ec448e5cee6ec2ac4070ce.
Package integrity and isolated native boot/Skip/Guide smoke passed. No diagnostic API or corner
badge ships in this package. Separate evidence build/captures live in the material audit.
No hosted dev/production content changed, and no save migration claim is made.

If this process has ended, start the same verified package with a fresh receipt path:

```sh
node audits/AV_EARTH_SURFACE_MATERIAL_20260908/serve-preview.mjs /Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/dev-preview-earth-material-local-20260908 /private/tmp/cf-earth-material-preview-restart.json
```

It selects a fresh local port and prints the URL; it must never overwrite an existing receipt.
Old55005/53304/50689 packages remain separate. The full quality and verification gap is recorded
in [the material audit](../../audits/AV_EARTH_SURFACE_MATERIAL_20260908/README.md).
