# M1 instrument and M2 baseline

Run `node port/v2/tools/motion-anatomy-audit/run.mjs REGISTRY NEW_OUTPUT` from the repository root. Controls: `node --test port/v2/tools/motion-anatomy-audit/metrics.test.mjs`.

The adapter uses the same motion compiler, contact owner and skeleton program as static/native evidence. It retains 241 samples per offered action, raw and contact-resolved poses, joint world coordinates, foot observations, contact errors, compressed per-rig samples, input/source hashes, JSON and a complete criterion table. This does not replace painted static or native CPU gates. Its world coordinates are action-local; path-following therefore refuses without a real stage history rather than inventing locomotion.

Five control groups pass: travelling versus standing/anti-phase/reverse; missing/nonfinite chains; correct tripod versus swapped leg/forced .5 duty; true matched world paths versus displaced/missing history; rapid versus slow strike. The actual unchanged Python fails travel, independently retained in baseline/standing-python-control.json. Source-specific raw baseline remains immutable; later instrument revisions must not silently overwrite it.

Baseline before product fixes: 18 rigs, 234 actions, 1875 criterion rows, 73 FAIL rows; qualitative anatomy verdicts remain UNMEASURED rather than falsely PASS. The table is baseline/TABLE.md; severity ordering is baseline/ranked.json. Counts come from baseline/report.json. New tool output has no certificate authority. M0's mistaken Fiddler label was corrected to the actual Coconut Crab record; no source record changed.

Defects reproduced once: Freshwater reach .072643 against sealed .07165014577259474; override graph42 art+5 transitive rejects Object.prototype use in fixed-attachments. Logs retained. Source path defect is present in selected records; historical records will remain byte-identical. Writer repair must normalize before hashing new records.

The accepted Centipede is a rigid trunk with explicit fixed sockets; it cannot demonstrate axial travel. The Starfish has no tube feet; Octopus lacks per-sucker support observations. Those are evidence/representation gaps, not numerical tolerance issues. Full path-following requires Claude's stage displacement and head-history integration. Nick's all-thirteen art acceptance is retained, separate from new motion results.
