# Backlog sweep 1 — 2026-10-04 (Claude)

Dakk asked for larger passes. Every delivered original (all `pilot.json` / `pilot-selected.json` under `audits/`) whose species is
not yet accepted is re-scored in ONE run against today's state: the 19-entry qualified pool
(`audits/C204_SHORT_TAIL_REFERENCE_20261004/reference-pool-preserved-plus-reindeer.json`: c223 extras + Octopus + Reindeer), the
current product (f8ff0413e-certified) and Codex's re-sealed fish owner (C287). 505 packets, 250 species; ids are prefixed with the
source batch so identical batch ids never collide. Bowfin stays held (framing REFUSE). Pilot: `audits/G1_AUTO_AUTHOR_20260926/pilots/sweep1.json`.
Command: `score-batch.mjs audits/SWEEP1_20261004 sweep1 --fish-seams --extra-refs=<pool> --pilot=<pilot>`; review with
`review-sheets.mjs`. Native passes are candidates only; acceptance is the full-size review.
