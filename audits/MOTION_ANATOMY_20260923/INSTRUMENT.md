# M1 instrument and M2 baseline

Run `node port/v2/tools/motion-anatomy-audit/run.mjs REGISTRY NEW_OUTPUT` from the repository root. Controls: `node --test port/v2/tools/motion-anatomy-audit/metrics.test.mjs`.

The adapter uses the same motion compiler, contact owner and skeleton program as static/native evidence. It retains 241 samples per offered action, raw and contact-resolved poses, joint world coordinates, foot observations, contact errors, compressed per-rig samples, input/source hashes, JSON and a complete criterion table. This does not replace painted static or native CPU gates. Its world coordinates are action-local; path-following therefore refuses without a real stage history rather than inventing locomotion.

Five control groups pass: travelling versus standing/anti-phase/reverse; missing/nonfinite chains; correct tripod versus swapped leg/forced .5 duty; true matched world paths versus displaced/missing history; rapid versus slow strike. The actual unchanged Python fails travel, independently retained in baseline/standing-python-control.json. Source-specific raw baseline remains immutable; later instrument revisions must not silently overwrite it.

Baseline before product fixes: 18 rigs, 234 actions, 1875 criterion rows, 73 FAIL rows; qualitative anatomy verdicts remain UNMEASURED rather than falsely PASS. The table is baseline/TABLE.md; severity ordering is baseline/ranked.json. Counts come from baseline/report.json. New tool output has no certificate authority. M0's mistaken Fiddler label was corrected to the actual Coconut Crab record; no source record changed.

Defects reproduced once: Freshwater reach .072643 against sealed .07165014577259474; override graph42 art+5 transitive rejects Object.prototype use in fixed-attachments. Logs retained. Source path defect is present in selected records; historical records will remain byte-identical. Writer repair must normalize before hashing new records.

The accepted Centipede is a rigid trunk with explicit fixed sockets; it cannot demonstrate axial travel. The Starfish has no tube feet; Octopus lacks per-sucker support observations. Those are evidence/representation gaps, not numerical tolerance issues. Full path-following requires Claude's stage displacement and head-history integration. Nick's all-thirteen art acceptance is retained, separate from new motion results.

## Post-baseline corrections and limits (2026-09-24)

The final adapter adds amplitude-envelope, end-rest, full walking-support inventory and root-relative neck recruitment. It also matches the static owner’s compiled realm and melee travel context. Earlier raw adapter outputs are retained unchanged; context-audit is the final action-local table. Ground-only projections in after-gait-01 are explicitly separate from compiled aerial context. See EXECUTION.md for the causal 27 → 2 contact-refusal-row correction; no product limit moved.

The original strike-extension-speed metric includes root translation. A PASS there is never sufficient for a biological neck-strike claim; strike-neck-recruitment and actual stage history are required. The 0.017411361201458392 body-axis Python head excursion fails that additional criterion. Wavelength estimates use equally indexed links rather than measured anatomical arc lengths. Authored-rest-start examines raw clip phase, whereas static exactRest restores the actual painted rig; these answer different questions.

context-audit contains 18 rigs / 234 actions / 1,977 rows: 812 PASS, 47 FAIL, 229 UNMEASURED, 889 N/A; no admission exceptions. Each remaining FAIL has an individual diagnosis in FINDINGS.md. The prospective universal stabilization target has known flight/hop interpretation limitations, retained visibly instead of silently revised after the baseline.
