# Second focused check — retained failure and test-source caveat

`browser-free-corrected.json` stopped at306PASS/2FAIL in20files. No TypeScript/art/root/native
stage followed. Product build and producer refresh succeeded; product source stayed unchanged.
The new art test incorrectly rejected Civet's canonical ear fillRect even though its Path2D
clip bounds the paint. Its correction follows save/clip/restore state and includes accepting
clipped and rejecting restored-unclipped controls. The scene itself still forbids all fillRect.
The existing lifecycle source test expected adjacent release/visibility calls; the correct new
try/catch now records release failure while allowing sibling cleanup. Its replacement enforces
release→failure capture→visibility order and rejects removed or reordered calls.

The art agent announced frozen source, then edited that assertion after discovering its mistake
while root's chain had started. The report clearly contains the old failing assertion, but exact
write/read timing was not measured; preserve this as potentially overlapping test-source mutation.
No immutable-input claim is made for this stopped run. Product source did not change. All agents
are now frozen; the successor chain starts from fresh paths with a before/after source inventory.
The earlier285PASS/1FAIL remains separately retained. Neither is a full admission certificate.
