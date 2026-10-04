# Fit01 contact-pin refusal diagnosis

The original intake stopped at `Observed surfaces: contact conflicts with fixed
owner`, before regional influences or diffusion. The cause is visible walking
limb paint and fringe left in the fixed body remainder by the first mask
envelopes. It is not evidence that contact limits need changing.

One packet-local diagnostic execution (`78189c`, exit 0) reconstructed the
existing pre-split binding through the unchanged splitter's contact-selection
step. An exact local source copy returned observations immediately before the
failed lock-admission loop. It produced no fitted binding and did not rerun
intake. Original and diagnostic writer copies, exact replacement text, hashes,
all 28 selected contacts, and every conflict are retained in `report.json`.
All seven recorded source/input files stayed hash-identical during diagnosis.

The first conflict is exact:

- Endpoint `leg0FarFoot`; painted owner `leg0-far`.
- Authored source endpoint `[1057,558]`.
- Selected projected part vertex 18 is `[1061,551.9]`, distance
  `7.294518489934773` source pixels from that endpoint.
- Its admitted positive barycentric supports would be split vertices 288 and
  286, with weights approximately 0.2 and 0.8.
- Split vertex **286** is original field vertex **279**, source **[1057,548]**.
  Its welded owners are `leg0-far` / `body`, hence its fixed owner is **root**.
  Contact admission requires `leg0FarFoot` on that same support and correctly
  refuses the conflicting assignment.
- The relevant source adjacency samples lie within
  **x1019–1049, y551–582** along the far foot's outer distal edge. Body-labelled
  examples include `[1048,551]` alpha 1, `[1034,565]` alpha 20, and
  `[1033,566]` alpha 32. No alpha threshold was applied.

The diagnostic inspected all selected contacts on this one retained binding:
**43 root-lock conflicts across all 28 Foot endpoints**. These are prospective
conflicts in the reconstructed metadata, not 43 separate intake runs; the real
run stopped at the first. `contact-summary.json` records each endpoint's exact
split/original support IDs, selected source point, distance, and source-weld
bounds. Some root-owned supports also join neighboring limb meshes through the
body remainder. Merely removing a root pin would therefore also conceal an
ownership error between distinct limbs.

The problem includes substantial visible paint. For example, `leg1-far`'s
source frame contains body-labelled `[977,556]` with alpha **242**. Viewing the
actual candidate03 master and the body cutout confirms recognizable diagonal
distal shaft strips above the trunk and shin/foot-edge fragments below it. The
body cutout also contains ultimate-appendage edges, but these are not among the
28 walking contact endpoints and are not counted as this refusal's contacts.

`root-leakage-footpoints.png` shows every positive-alpha body-labelled pixel in
magenta, with the 28 authored Foot points marked. The overlay amplifies alpha
for visibility only; it preserves all source files unchanged. The display
highlights **73,630 total body-labelled pixels**, including the correctly owned
trunk; that number is not a count of erroneous pixels. Its exact input/output
hashes are in `root-leakage-footpoints.receipt.json` (tool `091ea9`).

Minimal source repair: author one fresh mask candidate that extends each of the
28 existing whole-limb polygons over its complete observed shaft, distal point
and retained adjoining fringe. Keep each limb separate, preserve the actual
trunk/socket boundary, and keep existing priority order where projected paint
overlaps. Reassign only source pixels justified by the observed limb contours;
do not broadly transfer every body pixel inside a bounding box or classify it
by nearest joint. Retain master RGBA, all 63 landmarks, 31 fixed sockets,
presence, regional declarations and every numeric guard. No pin release, alpha
discard, contact-probe substitution, shared splitter change, or solver change
is indicated by this evidence.

The parent and source-authoring agent own the new mask candidate and any next
intake. This diagnostic makes no claim that a future fit, static row, or native
film will pass.
