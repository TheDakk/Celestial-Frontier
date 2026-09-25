# training-restart-fixture.json — re-seal record

The fixture file is byte-exact capture output of `node tools/training-restart-fixture.js --capture` (the check compares the whole
object, so no note may live inside it — a note placed inside on 2026-09-21 made the hosted battery red on PR #43, run 35624302186).

- 2026-09-21: re-sealed against html `a65d5905…` (from `5d0844c4…`). {"date": "2026-09-21", "by": "Nick (decision), applied by Claude", "from": "5d0844c45efa29ef0bd4d9f8254daeb1662d6f9e0934ceb6e30219d04e477746", "reason": "TypeSafe batch a3bd835d changed celestial-frontier.html by 8 lines (3 _earthArt regex sentinels); validate.js fingerprint identical; the capture itself is unchanged"}
- 2026-09-23: the in-file note moved here; fixture rewritten as exact capture output (snapshot sha unchanged: `2e2f7c56…`).
