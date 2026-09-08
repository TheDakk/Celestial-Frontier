# Metadata demo verification — 2026-09-08

**PASS**, scoped to the supplied Python metadata example. OpenAI/Codex on macOS, owned `openai/mac` checkout. No game/product source was edited; no browser, provider, art generation or game battery ran.

The complete executed command, inline harness, source hashes, assertions and results are recorded in [demo-verification.json](demo-verification.json). The harness used isolated Python (`-I`) with bytecode writes disabled (`-B`) and only the standard library. Reviewed source imports only `hashlib`, `json`, `pathlib.Path` and `sys`; it reads the adjacent style text and computes/prints JSON.

The actual demo CLI was run three times as:

```text
/Library/Developer/CommandLineTools/usr/bin/python3 -I -B /private/tmp/cf-painted-space-review-20260908/demo/procedural_plan.py frontier-001
```

Results:

- Three independent CLI outputs were byte-identical, with exit 0 and empty stderr. Parsed output matched the supplied `example.json` and direct `build` result. Queue and prompt hashes recomputed correctly.
- All 720 permutations of the six-entry catalogue preserved the complete `frontier-001` output.
- Identical and conflicting-brief duplicate IDs were rejected by both `queue` and `build` with `ValueError: Duplicate asset ID` (four negative controls).
- Twenty seeds (`frontier-000` through `frontier-019`) produced 8 distinct faction/ship/planet combinations, covering 2 factions, 4 ships and 2 planets. Every selected ID had the expected kind/faction; reversing the catalogue preserved each selection.
- All three inspected input hashes remained unchanged.

Exact inspected inputs:

- `/private/tmp/cf-painted-space-review-20260908/demo/SPACE-ANCHOR.txt` — SHA256 `6cf19739882ae4f232bc33d9b6ae2ba9dd42fa09758a26f77fdb87694b9f3428`
- `/private/tmp/cf-painted-space-review-20260908/demo/example.json` — SHA256 `ef0629073d28c5a259e815be102a67546da08583b47ee54064970464af8fe1a5`
- `/private/tmp/cf-painted-space-review-20260908/demo/procedural_plan.py` — SHA256 `1587ded528cee8c9fb07671e7b2d55391c27ca10d5eb2dce4743d90bcf90a7b0`

Declared identity: `sector-demo-1` / `proposal-1` / `frontier-oil-01`. Runtime: Python 3.9.6.

This validates deterministic metadata selection only. No art exists or is accepted through this check; all six jobs remain `blocked-reference-review`, with null reference hashes, and sector output remains `proposal-only-no-art-exists`. Direct `sector` calls do not independently reject duplicate IDs; `build` performs that validation through `queue`. The twenty-seed sample is not evidence of distribution quality, gameplay balance, cross-language parity or game/runtime integration. No full game battery was needed for these untouched external demo inputs.
