# Source-empty wing spans

Matches code as of 2026-11-19.

Canonical authored intake accepts the optional boolean `pruneSourceEmptyWingSpans`.
Undeclared and false preserve the ordinary binding. True is an offline fit operation
for insect and membrane-flyer records; it changes no runtime or solver policy.

The helper verifies the encoded atlas hash, then removes only wing triangles whose
entire Source bounding box plus a fixed two-texel guard has zero alpha. Alpha 1 is
paint and prevents removal. It remaps surviving indices and pins while requiring
complete contact selections and every Source join/excluded sample and effective
driver to remain exact. Source pixels, landmarks, caps and surviving rest weights
are conserved. If pruning would disconnect a retained paint-support vertex, the
helper keeps all of that vertex's original incident field faces. This preserves
zero-coefficient support indices and surviving pinned constraints without changing
ARAP admission. The fit records the actual removals and helper provenance.

The initial actual Source helper controls are Damselfly and Vampire Bat. Their
normal DEFAULT and opt-in intakes, full static checks and fresh native reviews are
separate acceptance steps. No performance improvement or physical clearance is
inferred from removing invisible triangles. Source and ordinary/D61 budgets remain
unchanged.
