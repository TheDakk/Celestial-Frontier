# Proposed bounded Eagle performance repair

Evidence: fit08 passes every static row, exact rest and native zero-refusal checks, but native run20260922-eagle-native-03 measures per-rig p95left8.800000071525574/right8.199999928474426ms against3.5ms. Source-owned mask corrections reduced left from18.3ms. Selected actual native poses prove the remaining expensive work includes up to64 forward orientation sweeps and active projection, with unchanged positive-orientation publication gates.

Proposed next scope is implementation optimization in port/v2/tools/creature-animation/orientation-projector.mjs and, if needed, a bounded compiled kernel module beside the existing wasm-arap-sweep.mjs. Preserve Float64 operation order and resulting coordinates, every hard pin, all64-sweep/active-visit budgets, area goals, refusal rules and final Float32 publication. Keep a JS fallback. This is a proposed implementation route, not a guarantee of passing performance.

Before another native film: establish byte-level parity and refusal parity against the existing implementation on retained Eagle poses and the applicable unchanged S2 fixture inputs, including deliberate negative controls. Halt on any shared-path regression. Run only affected deterministic checks; no repeated full certification batteries. Then one changed-source native measurement determines whether3.5ms is met.

No contract, numerical limit, threshold, gate, accepted binding or S2 sentinel input changes. Claude lane remains read-only. No hosted write or broader solver redesign is proposed.

Nick replied to the concrete solver exception request: “Keep going with the sprint and provide all feed back at the very end, do not stop.” This authorizes this bounded implementation optimization. It does not authorize changing any numeric budget, constraint, gate, output, protected binding or S2 input. Prior proposal and pending status are historical; implementation now proceeds with exact parity and negative controls.
