# Preserved raw-output whitespace

The complete staged whitespace check reports only twelve terminal blank lines in immutable
raw tool output. These are retained byte-for-byte; they are not source formatting errors.
The subsequent check excludes only the twelve exact paths below and must pass for every
other staged file. No failed test result or source was rewritten to clear this check.

```text
audits/AI_LANDFALL_CONTINUATION_20260909/fidelity/focused-first.log:27: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/fidelity/focused-type-correction.log:27: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/runtime-pack/build-01/build.stdout.json:34: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/runtime-pack/build-01/verify.stdout.json:12: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/validation-01/viewer-lifecycle.stdout.log:9: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/validation-02/inspection-sequence.stdout.log:9: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/validation-02/typescript.stdout.log:4: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/validation-03/semantic-focus.stdout.log:9: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/validation-03/typescript.stdout.log:4: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/viewer-controls-01/stderr.log:25: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/viewer-controls-01/stdout.log:11: new blank line at EOF.
audits/AI_LANDFALL_CONTINUATION_20260909/viewer-controls-02/stdout.log:9: new blank line at EOF.
```
