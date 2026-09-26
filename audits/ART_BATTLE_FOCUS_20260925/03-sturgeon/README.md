# C15 batch 1 — Sturgeon, painted rig and six masks

**Motion-facing finding: do not wire into the picker yet.** Three retained masters culminate in a complete plain-coat Sturgeon, manually authored anatomy/parts, 13 static rows PASS and exact source-pixel rest PASS. Four barbels, scute rows and asymmetric tail are present; an extra flank fin was removed by imagegen. All rejected masters/prompts remain in generation-01/02; generation-03 is the technical candidate. Framing is narrower than the prompt requested but the silhouette is complete. Original alpha is unchanged, including disclosed low-alpha export residue.

The native battle2 run `native-phone4x-01` reports DIAGNOSTIC_PASS with zero left/right rig refusals. The image review nevertheless FAILS: both fighters face outward. This master is left-facing; the stage assumes a right-facing source. The tail-to-tail approach still is retained in review-sheet.png. No visual acceptance, picker admission or new coverage is claimed.

Measured in isolated Edge at 4× CPU: 602 frames; stage CPU p95 3.3000000715255737 ms; frame delta p95 16.700000000000728 ms. These are phone-proxy whole-stage values, not desktop per-rig values or an iPhone measurement. Film: native-phone4x-01/battle-10s.webm. Both sides attack; lake medium, approach/strike/reaction/return stills retained. All source files are listed in the native report. This is not a certificate or full-library phone gate.

Six generated marking masks pass conservation: zero pixels outside keyed alpha, alpha never exceeds keyed alpha, nonempty masks. One outside-alpha mutation is refused. No scaling, translation or registration repair. Master coordinates remain 1254×1254. Source prompt is bound separately from each exact standalone mask prompt, which avoids repeating conflicting whole-creature instructions. One initial stripe-mask rejection and its exact prompt are retained. The actual composites show separate marks despite noisy inline alpha previews. Plain and iridescent have no masks. See six-mask-sheet.png, markings.json, conservation.json and generation-receipts.json. The fit-local markings.json changes relative paths only for the native harness; the primary manifest is at packet root.

Hashes:
- master PNG: `d7f7ad90c7813efb3bf9f700d81dbb5acbc8a50d14b504cfc51d9bc85b8f0f14`
- record recipe: `a4a4808d50893eadd4b38691b74ba40490c318506f4787d6adf3b003a0c55f79`
- binding: `5abaaf2a118d1068d8cfc1ac02af175d1c0b0725347f5b4243b8a3df8d3b6382`
- primary marking manifest: `1171d2fc4ed6eecaf02062fa02e7c625d7355f91686862254e62860f1b942c0b`
- native film: `8b7ceff5d1924f94f73bbfc9904106b0c5f6ccce39e855ee499683cee82dc04b`

Run receipts: intake-01.log / fit-01/intake-provenance.json; static-01.json (13 rows × 121 samples); native-phone4x-01/report.json; conservation.json. Root validate passes. No runtime, family, solver, threshold, accepted binding or S2 change.

Paired next steps: Claude adds an explicit source-facing seam (left-facing Sturgeon, current right-facing assets unchanged) or requests a right-facing re-authoring; then verifies inward-facing approach/contact and picker smoke before wiring/republishing. Codex continues the ranked paintings, requesting right-facing masters, and retains the two earlier anatomy repaint findings. Nick reviews the batch sheet; no relay is required.
