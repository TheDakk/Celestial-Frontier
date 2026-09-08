# First native study — immutable red, 2026-09-08

`study-native-first/report.json` stopped at desktop breathing, 2,100 ms. The actual 440 px
contact strip changed 44 pixels; 300 px changed 23. The same tiny strip contained zero solid
ink at 300 and 132 px, revealing an additional vacuous measurement. Phone mode, subsequent
pixel/motion controls and owned in-page disposal were not reached. Browser and server closed;
there were no Runtime exceptions or cleanup errors. Native buttons had completed all three
finite clips before the pixel comparison stopped the run. This is a failed aggregate.

Source diagnosis: the analytic foot lock began at normalized Y .80, inside the mesh cell from
25/32 (.78125) to 26/32 (.8125). Its top vertices could still move, so texture interpolation
moved actual contact pixels even though individually sampled points at Y >= .80 were exact.
The first geometry checks measured points and missed whole triangles touching visible paws.

Correction: fix mesh rows beginning at Y .75, before the independently measured source paw
strip. Keep the zero changed-paw-pixel criterion. Extend the native contact ruler to include
real paw ink at all three portrait sizes; do not accept an empty strip. A new geometry control
moves only row 25 while all sampled points at/under .80 stay exact, and must still be rejected.
The first frozen source, dist, images and report remain unchanged. Fresh changed-input results
belong to a separate output directory; later success does not rewrite this first red.
