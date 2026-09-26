# Preparation findings (no browser attempt)

The first materializer smoke check correctly refused a non-unique budget-path replacement: the v1 paired-baseline runner contained a second match. v2 now excludes that legacy baseline runner and its CLI route, and also excludes the legacy selftest CLI route. v1 remains untouched. The changed materializer passed syntax checks and 55 initial controls, then 56 controls including a raw native-heap negative control. Tests use explicitly synthetic in-memory carriers from retained observations, never newly labelled historical sample files.

The source chosen at the read-only remote check is signed b4f191c3538f78318a183705f89272b38b88118e, clean and including ffa1f126. Changes since the review head include operating-model documentation; the epoch deliberately freezes this exact pushed head. No calibration or certification attempt was consumed in preparation.
