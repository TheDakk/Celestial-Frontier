Review this as an addendum to the continuous-skin C2 and universal pose reviews. Do not treat
calibration stripes or synthetic landmarks as painted-creature qualification.

1. Verify family-record.mjs and family-contracts.mjs against the read-only motion producer
   provenance and contracts-01.json: all fourteen graphs, body axes, bounds, joints and clip IDs.
   Check corrupted hashes, missing alpha, stale bounds, absent joints and unknown templates fail
   before Pixi allocation. Ensure old quadruped controls still fail and its behavior is unchanged.
2. Follow the actual loadCreatureRigV1 and part-mask paths. Verify one atlas, family-relative
   transforms, root displacement once, stable depth, exact rest transforms, disposal and atomic
   invalid-pose refusal. Legacy quadruped seam mode must not leak into other families.
3. Read atlas-01/report.json and its receipts: two builds per family, identical PNG/bindings,
   zero original pixel changes, missing/foreign labels refused. These are synthetic tool controls.
4. Inspect painter-topology.ts and the four actual painter integrations plus dispatcher wiring.
   Check observations consume no randomness, change no Canvas commands, clear after failures,
   preserve all real arms/legs/tentacles and return null for unobserved owners. Do not infer
   anatomy completeness from a partial feature inventory. Check owner materials against paint.
5. Examine the retained failures and final tests, typechecks and root validation. Require real
   source alpha/masks and moving images before declaring any new painted family ready. Keep
   count-aware motion, hidden surfaces/turns, ordinary two-combatant integration and physical
   iPhone qualification open unless new evidence actually closes them.

Return actionable code defects with file/line and a failing control. Separate technical intake
acceptance from whole-animal visual acceptance. No kit edits, source-master edits, GitHub writes,
PR42 changes, history rewrite or blanket family-coverage claim is authorized by this review.
