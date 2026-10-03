# First native contact failure and source-grounded ruler repair

The immutable `study-native-first/report.json` remains **FAIL**. At its first sampled
breathing pose, raw GPU contact pixels changed44/23/0 at440/300/132. The original two-row
contact strip observed only4/0/0 solid pixels, making the smaller views empty rulers.

Read-only inspection of the retained PNGs and their native-recorded mesh transforms shows
that source rows393–415, from `contactY-20` through `contactY+2`, contain all four paws.
The expanded region has827/388/65 solid paw pixels at440/300/132; whole-band ink also
includes a small part of the tail tip. All four paws are distinct in the440px and132px
rasters. The two front clusters touch at300px, so connected-component count alone is not
a valid four-paw ruler at that size. Four source-x partitions `[270,325)`, `[325,385)`,
`[428,486)` and `[486,548)` retain independent counts without changing their geometry.
The [independent analysis](contact-analysis.json) and [per-foot counts](contact-foot-partitions.json)
bind the original PNG hashes, mesh transforms and analysis code.

The harness now measures that20-row band and reports solid/changed counts for each foot.
The existing whole-band acceptance still requires **zero changed raw GPU pixels**.
This enlarges observed anatomy; it does not weaken the zero-motion criterion. Parent-owned
rig work separately moves the hard lock to grid row24 (`y=.75`) so triangles over the
measured paw band have fixed endpoints. This packet does not claim that corrected rig has
yet passed a new native render.

The independent PNG decoder verified chunk CRCs, all rows and exact original solid-alpha
counts. Its first attempt wrongly required encoded PNG RGB differences to equal raw GPU
array differences: it observed42/22 instead of44/23. That analysis failure and its exact
source are preserved in `contact-analysis-first-failure.json` and the adjacent script.
Canvas PNG encoding is a different color carrier and may round premultiplied RGB; this is
a diagnosis boundary, not a proven universal cause. Both observations retain nonzero
movement. No raw-pixel threshold, source result or first native report was rewritten.

Only audit analysis/ruler source changed in this subtask. No browser, product build, rig
test, full certificate or hosted action ran. Python’s optional Pillow import was unavailable;
the retained analysis uses standard-library PNG/zlib decoding and installed no dependency.
