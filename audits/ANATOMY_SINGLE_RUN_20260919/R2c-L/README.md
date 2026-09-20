# R2c-L — measured post-IK contact limits

Measurement pending. Nick explicitly authorizes §12, superseding no-limit-moves only for
measured contactLimitsDeg. Node26.9.0 uninterrupted startup retained. Reviewer is read-only;
no sync/copy. Runtime source and raw clip limits/battery are unchanged during measurement.

`run-report-limits.mjs --reportLimits` transforms only the existing post-IK throw in an
isolated temporary static-sweep bundle; the production file is untouched. Its explicit flag
is tool-only, no runtime flag. Exact-span guard, original/diagnostic hashes and all source
hashes are retained. It records subject/row/ms/joint/degrees, root/spine/chest and world hip
drop; all other gates stay live. All six subjects/all rows/presentation, five crabs must have
zero exceedances. Any other shared red stops. Measurement is not admission.

If measurement completes, derive quadruped contact limits from observed maximum+10°, rounded
up to5°, record beside values in CREATURE_ANIMATION.md. Other templates default to limitsDeg.
Keep raw limitsDeg/169-action battery unchanged. Controls: crouch×3 rejects, crab bit-identity,
raw battery, absent contactLimitsDeg fallback identity. Then §10 acceptance and R2d→R3.
No fetch/push/PR/merge; PR42parked. Every producer signed and verified.
