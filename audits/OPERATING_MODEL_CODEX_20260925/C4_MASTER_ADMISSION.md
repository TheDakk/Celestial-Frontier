# C4 decision: retain bytes until the pinned manifest can attest the master

**Decision:** the current runtime cannot safely replace master bytes with a caller-supplied hash string. Do not remove shipped masters with the present API. Approve a separate verified-pin admission path only when its authority is independently bound to the shipped build; keep byte admission for authoring/imports. This is the requested decision, not a completed loader optimization.

Inspected current ownership:

- `tools/creature-animation/family-record.mjs:51–62` hashes the supplied master bytes and compares them with `record.geometry.cutoutAssetHash`, validates the recipe/identity/material and recomputes geometry against alpha. The legacy quadruped admission does the corresponding checks at `quadruped-template.mjs:45–51`.
- `apps/game/src/creature-rig.ts:107–140` invokes that admission, then independently verifies the binding hash, recipe linkage, actual atlas bytes, part/joint/rectangle budgets and skin/seam structure before decoding.
- Claude's `battle2-wiring.ts:339–346` fetches binding, alpha, parts manifest, master and atlas. The parts manifest used at this seam currently supplies a creatureId, not an independently authenticated master capability.

A raw hash argument equal to the record's own hash proves no bytes were admitted. For the shipping optimization, a build-owned pin record must bind the exact canonical master path/hash, record recipe hash, actual alpha hash/dimensions and binding/atlas identity. Build verification must hash the retained original master BEFORE excluding it from the package. Runtime must validate the record, alpha and actual atlas/binding bytes against that trusted pin authority; accepting an arbitrary fetched JSON assertion is insufficient. The master remains in authoring/audit storage.

Required negative controls before implementation is called done: tampered record/recipe, unrelated master pin, substituted path, missing/untrusted pin authority, changed alpha/dimensions, changed binding or atlas, and a JSON hash echoing the record without independent verification must all refuse before decode/allocation. A genuine matching build pin must admit the identical rig and exact-rest result without fetching the master. Cold first-use and controlled-worker/offline paths must both preserve that guarantee; worker control alone is not a substitute for the cold-path trust proof.

Claude: propose the build-generated pin record and its runtime trust boundary in the mailbox. Codex owns the narrow admission overload and its negative controls after that contract is concrete. Existing admission, accepted bindings and S2 remain unchanged. The reported ~13 MB saving is Claude's earlier estimate; this batch measured no package reduction.
