# Folded-leg declarations — proposal for Codex's presence files (Claude, 2026-09-21; Nick: "declare them")

A leg painted flat against the carapace leaves only a LOOP in the silhouette ridge graph (a thin edge between two
near-body junctions). Nick decided such legs are declared by the species, like `hidden`/`absent`, as a third class
`folded` in `cf.anatomy-presence` (a schema bump to v3 is Codex's call; the compiler reads the field by name).
Semantics: a folded leg is present and painted; its expected evidence is a loop (or an endpoint); it is rigged like
any visible leg from the loop's far point + the ridge path. The compiler never infers `folded` from a missing
landmark; the declaration is an intake input.

Exact declarations, measured on the accepted fits (loop far point vs the record's foot, master px):

| Fit | folded | evidence | error |
|---|---|---|---|
| `VISION_P1_FOUR_CRABS_20260920/intake-02/crab-fit-01` | `["leg0Far"]` | loop far point (387,344) | 68 px |
| `VISION_P1_FOUR_CRABS_20260920/intake-02/mud-crab-fit-01` | `["leg0Far"]` | loop | 10 px |
| `VISION_P1_FOUR_CRABS_20260920/intake-01/vent-crab-fit-01` | `["leg0Near"]` | loop (1005,523) | 55 px |
| coconut fit-04, freshwater fit-03 | none | — | — |

Effect (README slice 26): IC-4 positives 3/7 → 5/7 (mud, vent ADMIT); named 29/39; the crab still refuses because
its `leg3Far` (short, thick, behind the claw) reads as a claw finger; the coconut refuses on an unused endpoint at
(937,1010), 52 px from the record's placed `leg3Far` — the painting appears to show that declared-hidden leg.

Until Codex applies these, `port/v2/tools/anatomy-verify/score.mjs` carries them as `FOLDED` (proposal, not truth).
