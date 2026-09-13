# Inkscape CLI requalification — September 7, 2026

Nick reported that normal GUI launch succeeds and authorized a new test. Under
the shared job lock and approved out-of-sandbox execution, the installed1.4.4
version query, 128px SVG→PNG export and ImageMagick dimension/channel/color checks
all passed. The produced image was visually inspected and correct. No update,
reinstall, private-document inspection or existing-window closure occurred.

This restores Inkscape for isolated vector/export work. Prior sandboxed GDK/GTK
launch crash reports remain retained in the U3 audit; this success does not prove
a universal crash root cause. Use out-of-sandbox launch for future Inkscape jobs.
Keep Nick’s chosen emoji UI; do not restart an unsolicited replacement-icon study.

The sandboxed process inventory failed because sysmond was unavailable. The
scoped out-of-sandbox inventory succeeded and showed only the existing caffeinate
process among these selected process names. Exact commands, logs and PNG/SVG hashes
are in manifest.json. No desktop or personal browser was captured.
