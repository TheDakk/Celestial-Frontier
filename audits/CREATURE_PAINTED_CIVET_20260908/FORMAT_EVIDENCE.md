# Retained evidence formatting — 2026-09-08

The full staged `git diff --check` returned 2 on 16 formatting observations: four raw test/typecheck
logs end in blank lines and twelve repeated locations in frozen compiled Pixi bundles have trailing
whitespace. These original bytes remain hash-bound to native reports and are preserved. The scoped
authored-source diff check passes; no handwritten source warning was excluded. This is a recorded
evidence-format exception, not a test, threshold, ruler or budget waiver.

```json
{
  "schema": "cf-civet-staged-format-evidence/v1",
  "fullDiffCheckExitCode": 2,
  "authoredDiffCheckExitCode": 0,
  "warnings": [
    "audits/CREATURE_PAINTED_CIVET_20260908/rig-focused-final.log:13: new blank line at EOF.",
    "audits/CREATURE_PAINTED_CIVET_20260908/rig-focused-first.log:13: new blank line at EOF.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-final/dist/assets/CanvasRenderer-xSO5tPZD.js:3040: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-final/dist/assets/CanvasRenderer-xSO5tPZD.js:5962: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-final/dist/assets/RenderTargetSystem-C8zObf9q.js:4109: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-final/dist/assets/study-DG2Wvep6.js:2197: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-first/dist/assets/CanvasRenderer-xSO5tPZD.js:3040: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-first/dist/assets/CanvasRenderer-xSO5tPZD.js:5962: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-first/dist/assets/RenderTargetSystem-C8zObf9q.js:4109: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-first/dist/assets/study-i6lNQhqi.js:2197: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-fixed/dist/assets/CanvasRenderer-xSO5tPZD.js:3040: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-fixed/dist/assets/CanvasRenderer-xSO5tPZD.js:5962: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-fixed/dist/assets/RenderTargetSystem-C8zObf9q.js:4109: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/study-native-fixed/dist/assets/study-DG2Wvep6.js:2197: trailing whitespace.",
    "audits/CREATURE_PAINTED_CIVET_20260908/v2-three-typechecks-final.log:4: new blank line at EOF.",
    "audits/CREATURE_PAINTED_CIVET_20260908/v2-three-typechecks-first.log:4: new blank line at EOF."
  ],
  "decision": "Retain byte-bound native compiled Pixi bundles and captured logs unchanged. Four raw logs contain terminal blank lines; twelve repeated compiler-bundle locations contain third-party whitespace. No authored-source formatting warning. This is a recorded exception for original evidence, not a test/budget/threshold waiver.",
  "excludedEvidencePaths": [
    ":(exclude)audits/CREATURE_PAINTED_CIVET_20260908/study-native-first/dist",
    ":(exclude)audits/CREATURE_PAINTED_CIVET_20260908/study-native-fixed/dist",
    ":(exclude)audits/CREATURE_PAINTED_CIVET_20260908/study-native-final/dist",
    ":(exclude,glob)audits/CREATURE_PAINTED_CIVET_20260908/*.log"
  ]
}
```
