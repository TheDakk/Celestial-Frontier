# Embedded font licenses

## Opt-in v2 audiovisual pilot — matches code 2026-09-05 local

The pilot serves Inter Variable locally (normal, weights100–900, `font-display:swap`)
for headings and body text, with the existing system/monospace accessibility choices retained.
Source: [official Inter project](https://github.com/rsms/inter),
[font file](https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/InterVariable.woff2)
and [license](https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt).
Copyright 2020 The Inter Project Authors; SIL Open Font License1.1. The complete license
is committed beside the font and linked from the pilot provenance so it ships in the build.
No third-party runtime font request or purchase.

- Font: 352240B; SHA256 `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`.
- License: 4380B; SHA256 `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a`.

## Production v1.8.9

`celestial-frontier.html` embeds two latin-subset variable WOFF2 fonts as base64
`@font-face` data (CF-CR-013: self-hosted so the game makes zero third-party
requests and works fully offline).

| Font | Weights served | License |
|---|---|---|
| **Space Grotesk** (Florian Karsten) | 400–600 variable | [SIL Open Font License 1.1](https://openfontlicense.org) |
| **Inter** (Rasmus Andersson) | 400–500 variable | [SIL Open Font License 1.1](https://openfontlicense.org) |

Both are licensed under the SIL Open Font License 1.1, which permits embedding
and redistribution as part of an application, provided the fonts are not sold
by themselves. The subsets were obtained from Google Fonts (latin ranges as
served by the css2 API, 2026-07-25). Include this notice in any release bundle
that redistributes the built HTML.
