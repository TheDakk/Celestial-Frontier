# P1 Coconut Crab — accepted painting, hidden-pair rig and native film

**Deliverables recorded; full animation admission remains open on CPU and root continuity.**
Nick's acceptance of generation01 art stands. The six visible walking legs are correct under
the species count law; the final pair is declared present-but-hidden. The earlier count-law
refusal is superseded, not evidence of model drift. No new painting or revised prompt.

[Final comparison sheet](comparison-sheet.png) · [Final full-row film](native-02/family-full-rows.webm)
· [Compact results and diagnoses](completion-summary.json) · [CPU table](CPU.md).

## Final inputs and contracts

- Original [master](../generation-01/coconut-crab-master.png) remains **1254×1254**, SHA256
  `7954331dc3ce80bf3b4e2e3759bd0b5c576d659ff5fcb4d01b8efc536bba8890`.
  Delivered alpha and every RGBA channel are unchanged. The original exact prompt, tool and
  unavailable-seed receipt remain in `../generation-01/`. Margins remain as Nick accepted them.
- Current [observation04](observation-04.json), [record](fit-04/record.json),
  [new-painting masks](fit-04/parts/ownership.png), [part intake](fit-04/parts/receipt.json),
  [observed split receipt](fit-04/receipt.json), [binding](fit-04/binding.json).
  **21 visible parts, 3838 field vertices, six visible contact supports, no hidden part entries.**
  The guide's painter labels and landmark coordinates were never reused.
- `cf.anatomy-presence/v2` explicitly carries `hidden:["leg3Far","leg3Near"]` and `absent:[]`.
  Hidden joints stay in the complete skeleton and are flagged in the resolved contract and
  bounds receipt. Offline inference mirrors pair2 vectors about the template body axis at
  an extrapolated pair3 root, preserving pair2 segment lengths1:1. It is explicit, validated
  inference; admission does not fill missing joints. Only hidden alpha-proximity checks and
  contact chains are excluded. Hidden paint ownership/positive skin weights refuse before decode.
- Nick additionally authorized measured brachyuran contact limits in this session.
  [Six-subject ledger](contact-measurement.json): all five painter crabs plus P1, every row and
  presentation, **12,318 samples**. Max planted Knee17.1176319°, Foot50.0539666°; the approved
  ceil((max+10°)/5°)×5° rule gives **Knee±30° / Foot±65°**. Raw limits stay±35°, raw clips
  unchanged. No source pixel, painted landmark, contact tolerance or CPU gate changed.

## Native result

Signed hidden/limit producer **580a6ffb** ([signature](producer-signature.json)); signed
mask-correction producer **670fe8b6** ([signature](mask-producer-signature.json)).
Native02 ran on670fe8b6 using the final fit04 and the repository-relative current motion producer,
under the shared toolchain lock. Browser/source provenance and all samples are in
[native report](native-02/report.json). Final evidence receives its own signed commit.

| Check | Result |
|---|---|
| Native full rows | All12 actions recorded, including faint; zero refused frames |
| Film | 14.218220s;853 encoded frames;1400×800 |
| Exact pixel rest | 0 changed channels before and after motion |
| Planted paint drift | 0.00107112px maximum, against0.25px |
| Endpoint error | 4.578e−16 normalized maximum |
| Seams / folds / post-IK limits | Every action row passes |
| Seam negative control | Deliberately displaced part fails,12.54003px gap |
| Full-motion framing | Inside; no cropped motion |
| Approach CPU | **RED:2.10ms p95**, strict target<2ms |
| Recorded rig CPU | **RED:3.20ms p95**; whole-frame CPU3.30ms |
| Full-row root continuity | **RED during faint recovery:**9.10410px per-sample step versus8.09505px stride bound; exact values below |

Exact continuity values are retained in `completion-summary.json` and `native-02/report.json`.
Worst root sample index607 is around10116.7ms overall,448.3ms into faint. This flags the
existing per-sample root-step/stride check during the full-row presentation; it is not a
contact, seam, fold or post-IK limit refusal. No threshold or root key was adjusted.
The earlier10-second static presentation does not exercise the full native faint transition;
its passing result does not overrule the native continuity finding.

`masterIntakeAccepted:true` and Nick's art acceptance stand; **animationReady:false** while
these leaves and the moving-rig review remain open. No gameplay adoption or phone claim.

## Controls and retained findings

- [Shared static controls](shared-controls/static.json): all five crabs bit-identical to R2c′;
  Civet sentinel green; exact rest for all six. No S2 regression.
- [Final P1 static rows](static-04.json): all12 actions plus presentation, exact rest.
- [Node tests](node-tests-01.log): hidden paint present refuses in both polygon and labelled
  intake; missing pair without declaration refuses; actual eight-visible painter admits.
  Invalid/duplicate/absent-as-hidden declarations also refuse.
- [35 runtime tests](runtime-tests-02.log): hidden-only poses move no visible parts and have
  six contacts; forged hidden paint refuses before decode; excessive planted loading still
  hits contact limits; five-crab motion/pinch and repeated-topology controls pass.
- [Typecheck](typecheck-02.log), [root validate](validate-02.log) PASS. Runtime sources were
  unchanged after these checks; later changes are authored masks, captures and documentation.
- [Initial faint-limit finding](static-02.json) and [measurement](faint-measurement.json) retained;
  resolved by Nick's measured-limit authorization, not a landmark move.
- [Native01](native-01/family-full-rows.webm) retains the initial mask's displaced claw-tip fragment.
  [Final correction](mask-change-final.json) moves873pixels from body to Far claw only,
  with unchanged landmarks/master/other limbs. The detached fragment is gone in native02.
  Fit03 broad-outline diagnostic is rejected because it touched neighboring limb ownership;
  [that finding](mask-change.json) remains. Fit04 is the precise tip-only correction.
- All earlier fit/mask states remain history; neither film is an unchanged retry. No further
  variant or capture was performed for CPU numbers. [Execution log](EXECUTION_LOG.md).

The sheet displays accepted Civet and P1 masters plus the eight-visible painter control,
then actual native pinch/faint poses. Images are fitted for review only; source files are not
resized. [Sheet provenance](sheet-receipt.json), [artifact integrity](integrity.json).

## Handoff

Bounded hidden-pair implementation, authorized contact-limit extension, masks, landmarks,
observed split, binding, native rows, film and sheet are delivered with the two leaf classes
above. Further CPU/root-continuity rework is not represented as completed or silently broadened.
Roster and the other four crab packets remain held. Codex R9 is canonical for a separately
controlled future re-merge; PR42 stays parked. No fetch, push, PR, merge, release or deploy.

Codex next: retain the exact fit04/film and leaf diagnoses; do not start the other packets or
an unchanged retry. Claude next: review this signed packet read-only and reconcile the shared
hidden-presence contract; no sync or sibling edits. Nick need not open the other app for Git.
The animation sheet verdict and remaining leaf disposition are the next review items.
