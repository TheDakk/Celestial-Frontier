# Embedded font licenses

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
