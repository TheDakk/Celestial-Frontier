# First calibration refusal: painted ownership observability

Run `i5-v2-b4f191c3538f-calibration-1` on clean product `b4f191c3538f78318a183705f89272b38b88118e` with signed instrument `cfd6e7fb7428460a42691ab03ea8d7c2ae17a955` stopped after 39,339 ms. Lifecycle completed. The report's producer and browser matches are both true, so the previous authority blocker was crossed honestly by a new epoch record. No v1 sample was rebound.

The exact failing stage is phone `middle-scroll-list thumb settlement`, following `scroll visibility 750`. All seven visible images report ready and decoded at 132×132. `cmem-0748` and `cmem-0752` have neither a leasedIndex nor a cachedIndex in the broker inventory. The remaining five have both. Queued and active broker jobs are zero. The observation remains falsy until the unchanged deadline; this is not a late CDP response. The sealed classifier records INSTRUMENT-FAIL, with all 78 outcomes blocked. The partial report retains the full command/settlement evidence and two phone screenshots. No numeric growth verdict or completed calibration sample exists.

Source inspection (no additional browser run) finds a concrete coverage gap:

- Product `species-art-loader.ts:700` constructs artDiagnostics solely from `this.broker.diagnostics()`.
- Its `leaseThumb` at line707 and painted return at line710 deliver `paintedThumbLease` directly; the broker fallback is line711. The analogous portrait branch is lines720–722.
- `morph/painted-card-source.ts:76` owns a separate painted card cache; lines94–97 implement its own lease lifetime.
- The unchanged collector `compendiummem.mjs:899` obtains leased/cached keys only from `art.keys`, and the unchanged evaluator at `compendiummem-contract.mjs:2086` requires each raw image key to appear in that broker inventory.

These source facts explain how a legitimately ready painted card can be absent from the observed broker inventory. This is the leading diagnosis for the two recorded rows, not proof that their painted memory ownership has been measured correctly. Do not fix it by dropping the inventory check or pretending painted leases belong to the broker. The report's one cumulative paint error is not independent proof of a new painter defect; this collector also runs an intentional producer-error control.

Paired next work: Claude supplies truthful painted lease/cache/pending/resident-archetype ownership and resource diagnostics through the app's diagnostic surface, including release/trim behavior; Codex can then extend v2's ownership observation and negative controls to account for both paths while preserving the numeric growth guard. Exact rows and raw keys must agree with the correct owner's inventory, and painted decoded/encoded residency must count toward the relevant totals. No code in either lane was changed to hide this refusal. A changed source/instrument requires a separately authorized fresh epoch; this epoch stopped and is not resumed.
