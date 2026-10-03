# Second native study — immutable instrument red, 2026-09-08

`study-native-fixed/report.json` stopped on desktop document geometry: document.clientWidth was
1,425 and the runner demanded the emulated window width of 1,440. The review document is taller
than the viewport; classic vertical scrollbar space is legitimate. The failed assertion wrongly
required client and viewport widths to be identical, instead of checking horizontal overflow.
Only the failing scalar was retained; the full compared geometry was assigned after the assertion
and is not available from this original stop. No retrospective exact geometry claim is made.

Before the stop, actual breathing, brace/thrust and recoil passed; the expanded paw strip had
zero changed pixels with all four feet nonempty at 440/300/132. Constant-rest and shifted-paw
mutants were rejected by the same pixel acceptor, and rest was restored exactly. Native finite
buttons, Reduced Motion, Effects Off, DOM Hide/Show and synthetic document-hidden cancellation
passed. Eight probes and four controls are retained. In-page disposal and phone were not reached.
Zero Runtime exceptions or cleanup failures; owned browser/server closed. This remains FAIL.

Correction changes only the review runner: retain geometry before assertions, verify actual
innerWidth/innerHeight/DPR against emulation, require positive clientWidth no greater than the
viewport, and require scrollWidth === clientWidth. Existing canvas-fit and page-extent checks
remain. No tolerance was added to painted-paw checks and no creature, shader, pose, asset or
product source changed. The first two native runs remain immutable; the new runner is checked
before one fresh changed-input run.
