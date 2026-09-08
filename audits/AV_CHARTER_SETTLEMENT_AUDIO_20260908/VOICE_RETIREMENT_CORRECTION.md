# Finite voice retirement observer correction

The ordinal-corrected native run reached the correct durable receipt and observed the complete
700ms sound, then stopped because the observer required the natural-completion counter to rise.
That requirement incorrectly excluded the existing finite voice owner. Audio runtime completion
(`packages/audio/src/runtime.ts`, natural at1244, watchdog at1628/1658, counters at2201–2203)
and pilot700ms cancellation can race without leaving any voice, sound or node alive.

Actual observations: first run completed1/stopped1; successor completed0/stopped2. Both began
with one music voice and ended with two total voices retired, zero active IDs/mix owners,
13 shared-runtime nodes, and no cleanup faults. The successor source lasted0.701333 context
seconds and reported ended before inspection. No product or timer change was needed.

The final observer retains the native source duration/start/end/owner-stop checks, requires
exactly one additional voice, exactly two total retirements (music+confirmation), no steal,
zero active/tracked voices or mix owners, no extra retained nodes and no cleanup/runtime fault.
Read-only replay accepts both actual outcomes and rejects12 missing-retirement/live-voice/
tracked-voice/mix-owner/node-leak/cleanup-fault mutations. See completion-observer-controls.json.
The first calibration's cross-realm array-comparison error is preserved separately: the helper
was evaluated in a VM but reports came from the main realm. Same-realm source evaluation fixes
that harness error without changing the actual native observer. Both earlier browser reports
and their original runner copies remain immutable; neither is relabelled PASS.
