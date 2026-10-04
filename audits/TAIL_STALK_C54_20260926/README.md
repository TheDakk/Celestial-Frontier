# C54 tail-stalk repair investigation — 2026-09-26

The Cod tail has a passing **ownership repair candidate**, not an admitted whole-fish repair. No shared author, split, rig, motion, solver bounds or acceptance tolerance changed. Perch/Carp/Arctic Fox remain open. C53 durable fish were rejected by Dakk; the earlier review-ready status is superseded.

## Measured cause and current candidate

Claude C55 correctly identified root-owned paint between the Cod stalk and caudal part. Independent reconstruction of his exact gap-filled pre-split packet finds `body-5--caudal` already IS an ordinary nearest anatomical join, automatically welded by the existing split. However, it spans only ONE original alpha edge; 102 root-body/caudal edges remain. See `c55-observed-joins.json`. There is no missing sibling-bridge contract for this interface.

`fill-gap-observed.mjs` follows positive source alpha for transparent originals, derives distance from the largest connected remainder-to-tail boundary, and adds a one-pixel contour collar before rasterization. Earlier priority owners remain unchanged. It refuses any lost requested gap pixels or stolen other-owner pixels before writing a packet. On Cod the measured distance is58px (the original fixed40px missed much of the seam); all4,550 requested pixels survive, plus128 remainder pixels from the contour collar. Source pixels and landmarks are unchanged. The ordinary join becomes96edges;7root/caudal fringe edges remain.

`08-cod/cover-04`: PASS_STATIC, exact rest and zero changed visible source RGBA channels. `native-cover-04`: unchanged stage harness PASS,0/0refusals,707frames,4msCPU p95 at4×, complete encoded film and stills. Full stalk is visible in retained stills; other body seams/stray slivers remain, so this is NOT full visual acceptance. Applying the old five selective body welds over this corrected packet (`cover-04-weld`) is RED. Do not admit it to the registry or replace the original reviewed packet.

Held-out controls block general adoption: Perch and Carp lose9/28 requested pixels when tracing fragmented regions, despite their static passes. Arctic Fox tail3→tail2 would steal another part's pixels. `ownership-controls.json` records all three failing before any output directory; the Cod positive replay reproduces authoring byte-for-byte. The initial Arctic probe wrote a partial packet before its guard and was accidentally fed to intake by the shell's next command; that compiled diagnostic is explicitly REJECTED. The final helper validates before writing, and no such packet can be admitted. Next work: component-preserving contour coverage for genuinely gapped held-out tails, then unchanged motion/native/seam/mutation checks. Claude received exact measured findings through our own mailbox.

## Rejected axial-weight approach

`axial-candidate.mjs` retains bounded alternatives: welded axial field; largest connected tissue only; monotone axis interpolation; caudal blend completed at its actual spine5 hinge; posterior-only collar; radial collar; original solver pins. Original paint/UVs/landmarks remain unchanged. Cod/Perch reach PASS_STATIC, but full native additive victory still folds (Cod2/0; Perch23/9). Carp and Arctic Fox also fail. These alternatives are not adopted. Each static report and first-fold diagnosis remains retained; temporary fit copies are scratch, not library assets.

`diagnostic-native-runner.mjs` is an audit copy of the real runner with a documented read-only bundler transform: it records the failed resolved pose without changing the solver. Cod axial07 reproduces two folded stage frames and exits1. `failed-poses.json`, instrumented source and hashes are retained. This also verifies the production runner's corrected nonzero exit on reported refusals; previous retained FAIL reports must never be treated as passes merely because the old CLI exited0.

## Reproduction and scope

Run the helper from the repository root with source packet, fresh output packet, tail part and proximal stalk part; then the unchanged `intake-authored.mjs`, G1 `harness/static-runner.mjs` and native runner. The durable Cod cover04 fit, packet metadata, film, stills and provenance are retained here; its original master is byte-identical to the tracked G2 master. Source inventories bind other scratch candidates before cleanup. No new G1 admission, generated-library pin, hidden-paint bridge, alpha edit or human-quality approval is claimed.
