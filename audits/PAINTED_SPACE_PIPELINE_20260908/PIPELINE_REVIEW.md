# What actually produces our art

This document describes the local code inspected on 2026-09-08. The space-game design in
SPACE-GAME-PROMPT.md is a proposal; it has not been implemented or calibrated.

## The working chain

1. `tools/gen-art-worklist.mjs` derives subjects from built game data, merges repeated subjects
   and applies authored design overrides. `tools/lib/asset-queue.mjs` combines each brief,
   layout, contract anchor and reference identity into exact prompt text and a SHA-256.
   The operational handoff is `upload/ASSETS-universal.csv`; a separately written workbook
   carries the mirrored queue and review/history information. Older contract prose describing
   a three-file-only system is historical, not an accurate inventory of today's files.
2. The reviewer authorizes a bounded pass with a queue hash. The importer reads the pass
   manifest and answers fresh `prompt-json` requests with route, hashes and completion state.
3. Codex sends that text verbatim to its built-in image tool with the locked style sheet.
   Fresh design work uses only the style reference; polish attaches the current capture
   first and the reference second. There is one attempt per authorized row unless the
   reviewer grants a retry. Refusals are recorded rather than edited around.
4. The image tool saves its original PNG. The importer validates it, preserves the untouched
   capture, removes the deliberately flat magenta fill, and writes a true-alpha master.
5. WebP export resizes via premultiplied alpha, converts back to RGBA and validates the
   derivative. The current implementation uses quality 90 and method 6; these are existing
   token settings, not universal space-game settings.
6. Import records go to JSONL ledgers, with hashes and revision records. The gate runs intake
   and pixel checks. A reviewer checks each design against the intended subject separately.

The style comes from the anchor and reference together: confident oil strokes, weight,
weathered surfaces, warm/cool contrast, deep shadows and selective focal detail. Queue hashes
prevent stale instructions; they do not cause the painting style or guarantee repeat images.
The built-in tool has returned opaque captures in our workflow, so our production method
does not rely on its emitting transparency. This is an observed workflow constraint, not a
claim about every image model's current capabilities.

## Source map

| Included original | What to inspect | What must change for space |
|---|---|---|
| tools/lib/asset-queue.mjs | Prompt sections, layout profiles, contract extraction, hashes | New schema/profile rules and a space contract; remove incompatible negatives |
| tools/gen-art-worklist.mjs | Stable derivation, explicit looks, expressions, subject deduplication | Replace Foundry suite inputs and fantasy overrides with original game design data |
| tools/lib/art.mjs | IDs, slugs, aliases and collection paths | Replace Foundry paths with game asset registry lookups |
| tools/lib/statblock-derive.mjs, emblem-looks.mjs | Mechanical parsing and authored appearance rules | Examples only; fantasy mechanics and mappings are not space designs |
| import_builtin_image.py | Fresh prompt endpoint, route checks, capture retention, import/revision ledger | Decouple collection, handshake, schema, destinations and validation |
| chroma_key.py | Key detection, alpha ramps, spill control and rejection | Calibrate against space colours; separate emissive effects |
| generate_tokens.py | Prepared rows, validation, ledger utilities, atomic writes, WebP export | Reuse concepts; isolate shared processing from its separate legacy API runner |
| verify_gate.py, tools/check-art.mjs | Intake plus pixel checks and GO/STOP reporting | Choose target assets by type/profile and handle non-alpha images intentionally |
| review_sheets.py | Human review contact sheets | Add profile-specific views, gameplay scale and expected-design comparison |
| tests/*.py | Existing importer/keyer/regression assertions | Adapt fixtures and add new space-profile cases before production |

`generate_tokens.py` is included because the importer imports shared functions from it.
Its direct API generation path is not how the images in this conversation were made.
The snapshot's package and requirements files describe the original project, not a complete
portable setup. Node scripts depend on sibling suite builds/helpers; those are intentionally
not packaged. The snapshot is for code review, not a promise that its tests run in isolation.

## Lessons that should become requirements

- References can leak into the output. The banner cover included the sheet itself; another
  banner copied a miniature crowd. Inspect every image for accidental reference content.
- Requested dimensions and margins are not guaranteed. Our wide banners returned varying
  dimensions and ignored the requested central crop band. Approve compositions at the actual
  game aspect ratio; do not commission large batches assuming a later crop can save them.
- Polish is not pixel-preserving. The faces pass kept the general body and pose, repainted
  surface details, and barely changed the anatomy requested. Its generic preamble prohibited
  design changes. Resolve that conflict before expecting reliable local edits.
- Generic negatives can contradict subjects. Our spell prompts asked for a hand or flagstones
  while excluding hands or floor planes. Validate the assembled prompt, not only its pieces.
- A filter is not a canon reviewer. An image can pass alpha checks with the wrong head,
  expression, object or material. Visual approval remains a separate state.
- The latest faces gate failed on `getchannel("A")`. The inspected `--all` selector includes
  `masters/*/*.png` without excluding `_banners`; those originals are RGB. This is a concrete
  reason to separate profiles and check mode before alpha access in the new implementation.
  The production script is copied unchanged, not fixed in this handoff.
- A procedural universe is not an unlimited catalogue of unique generated paintings. Start
  with a curated vocabulary, use seeded variation within compatible families, and add
  authored rare discoveries where repetition would matter most.

## Validation boundaries

The demonstration code proves only stable metadata/prompt construction and seeded selection.
It makes no images, performs no keying and renders no browser scene. Its catalogue consists
of fictional proposed asset IDs, not approved existing paintings. Browser performance, memory
budgets, reference adherence and space-palette keying still require real calibration.

Preserve source licenses and provenance during review. The existing project licence is
included unchanged; this handoff does not redefine the terms of the source snapshot or art.
