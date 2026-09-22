# 13. Salmon marking masks

**PASS: six masks; zero pixels outside keyed alpha; zero alpha values above keyed alpha.** Nick’s art acceptance remains pending. Run ID: `archetype-sprint-13-fish-markings-01`. One finishing/conservation execution, no certificate/static/native rerun. Plain has no mask; iridescent is emissive with no mask.

All masks are1254×1254 in the unchanged Salmon master pixel space. Delivered alpha is generated alpha × keyed alpha /255, rounded; RGB is white. No resizing, translation, registration repair or anatomical exclusions. The original master, record, binding, keyed image and atlas hashes stayed unchanged. The valid control passes; a one-pixel outside-alpha mutant is refused.

[Six-mask composite sheet](six-mask-sheet.png) · [markings.json](markings.json) · [conservation evidence](conservation.json). markings.json carries per-pattern file, SHA-256, raw image hash, exact prompt text/base64 bytes, prompt hash and tool provenance. generation-receipts.json retains every tool receipt, raw file, initial rejection and final composite assessment. manifest.json hashes the packet.

| Pattern | Nonzero alpha pixels | Opaque-equivalent pixels | Outside alpha | Mask SHA-256 |
| --- | --- | --- | --- | --- |
| striped | 51902 | 11242.227450980392 | 0 | e36778f8072f7e8ab69247d1fcb5762b4b6024ea5a9e7354380c283ba5e8610e |
| spotted | 12077 | 6674.35294117647 | 0 | 907034cc101216b3b02c0aac317cbfa9e5aba556f99c47d5b2c896fcfd871ccc |
| banded | 96742 | 44191.87843137255 | 0 | 5bc2e8296c60c0954eff873cdbb78fc671d1008f13b7ccdcca6656958e788600 |
| mottled | 39101 | 19017.580392156862 | 0 | 64f04894485f6030998777ad20a74bd297049f32e1f14542a08e3ae4fc180f7d |
| marbled | 14317 | 5662.678431372549 | 0 | e318bab2e04b050dfaab0f0e5660927c226e48b96e3c020acd5d3928aed656df |
| eye-spotted | 42489 | 20140.835294117645 | 0 | 0668dd14e0c76b1cb80186120f78ecea2a0659d280d951cb3f5a0f6d23c7d66a |

Painting history: eleven outputs total: six first attempts and one corrected re-prompt for each of five initially rejected layers. Banded uses its first output. All originals and prompt bytes are retained. There was no third painting attempt. The inline generator previews suggested heavy fill; the saved final composites show separate markings. Manual follow-up alpha samples in stripe gaps and eye-spot centers are0or1/255 (alpha-review-samples.json), not opaque fill. Those tiny residues remain unchanged and disclosed for Nick’s review. Initial “second failure” preview judgments for striped/eye-spotted were superseded by the actual saved-alpha/composite evidence, not by changing a gate.

These are mask candidates, not a new film or CPU measurement. Salmon’s earlier native arena refusal remains red; this mask result does not certify its rig or PR43.

Signing: initial final-item attempts were refused by 1Password (exit 128); every failed attempt is retained in signing-refusals.json. Signing retries are explicitly authorized; no unsigned fallback.

Paired next steps: Codex signs this item, closes the ledger, performs the authorized normal final openai/mac push, then holds. Claude consumes the signed packets and diagnoses retained reds under Nick’s integration direction. Nick reviews all art and this sheet; he may open Claude after the final push. No fetch/sync, PR, label, hosted battery, merge, release or deploy.
