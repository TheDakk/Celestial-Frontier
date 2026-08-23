# Arc 1 Compendium recalibration — 2026-08-23

PR #33 run `32611053651` passed the repaired D-ART stage and then failed closed before Compendium
measurement. The active historical ruler expected producer `d3223177…`; Arc 1's built index/owner
produced `5a316197…`. The worker and painter were byte-identical, but the whole measured ownership
path is producer authority, so no prior sample or ceiling was rebound.

Calibration source was clean commit `c348e51e0e18c9241387896ff34b28d0dc41d401`. Every run used
exact Edge `151.0.4129.101`, revision `@cc1d9f4080fd9140611a9600b8d1615db310105d`, JavaScript
`15.1.23.9`, protocol `1.3`, one attempt, and zero retries.

| Evidence | Raw SHA-256 | Deterministic gzip SHA-256 |
|---|---|---|
| candidate 1 report | `84a2350fbe29ac64a4c9ab718363e4e9f031d5a815dbf4d20c8fd650ac775100` | `d7076216d6274dbde09687051c65f57e3388a59da2100360fff095f483800d6a` |
| candidate 2 report | `6dad66cd3ee7484cec8d986c021b05090dd1cc1140e559c9353188d7f96703d2` | `d4254913700f134e4fa0fd6fe421fd81a1459b271fdf1b8cf2804ba216b87a99` |
| candidate 3 report | `7777ecb5c7930ec12fafbdb7bf2b1472300691201849b64c3f4d46a655cf8b71` | `f378b645447510dd03b23a82912fde734d84881f85bf5598f34482b95f2a547e` |
| paired baseline sample | `3d99883d925487e2dd0a827431644a3acc2eb7d5642143f00fb8936486ade9c3` | `334d0d933717d42ebd057a9b55bc91301acbef9ab641123beffe69596880ff7c` |
| independent certificate | `f45e1da50f6f053d55e666bede4f5e545501c79f26168c25a2ae57733a93c0c5` | `cef1d5593b69c68f9bcdf9024b9d967d10b91cf16255a20bb9d86de779c20722` |

All three candidates completed lifecycle cleanup with 78/78 calibration outcomes and no findings.
The paired exact legacy product `38447019517147319bd08c598202d097ee866874` retained all four
sealed faults and breaches 14 phone / 13 desktop fields under the selected ceilings. The durable
test decompresses every archive, verifies both hashes, re-derives every candidate metric/evidence
object from its raw profile, exact-compares those objects to the budget, and exact-compares the
paired baseline carrier.

Tracked active-budget bytes are SHA-256
`9e36bdfb8d0a425beb6e3c131c3a0fc4e5154a23b504213b76e8dc4fe6170311`. Independent clean source
`23e177a4eebdcac8890f9b7d6a02456a948e4ab2` then passed run
`20260823-arc1-current-product-certification` 78/78 with complete lifecycle, empty findings, matching
browser/producer/budget authority, and a passing named verifier. The later evidence/docs descendant
does not retroactively become that exact certified source.
