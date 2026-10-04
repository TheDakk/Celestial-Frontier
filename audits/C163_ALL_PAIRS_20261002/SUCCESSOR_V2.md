# C163 preparation successor

The first frozen preparation is retained as refused history. Independent review
found that trailing fit-directory slashes disagreed with the exact frozen runner
boundary. Those slashes also produced double-slash input paths whose lookup in
the canonical source map returned undefined, serialized as null. The first
manifest therefore could not launch a pair. No native matrix run occurred.

The additive `prepare-v2.mjs` canonicalizes both fit and marking directories.
`validate-v2.mjs` requires canonical, non-null inputs with complete exact fit
inventories, SHA-256 and byte counts bound to the shared source inventory. It
refuses the historical manifest before a supervisor can dereference a null.
`run-sweep-v2.mjs` uses this successor validator; the frozen native runner and
entry remain unchanged. The new current preparation is `prepared-v2/`.

`paths-v2.test.mjs` executes the exact extracted frozen pre-launch guard against
every prepared case. It also exercises trailing-slash and alternate-path
refusals, null/noncanonical/unbound/missing inputs, duplicate sources and a lost
Jellyfish declaration path. The existing 36 synthetic controls and their first
PASS receipt remain frozen. Successor outcomes and hashes are recorded in
`delivery-v2.json`. Both preparations remain audit-only; no native matrix or
60 fps qualification is claimed. A future sweep uses the successor driver and
manifest, requires a native reservation, and remains blocked by the C12 strict
performance hold.
