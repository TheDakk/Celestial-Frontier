# Tree Frog repair — material corrected; pose correction rejected

The original unsupported material prose is corrected to existing **smooth skin**, with original master/presence/labels/landmarks unchanged in fit02. Record/IC-3 admission and exact source rest now pass (**0 changed RGBA channels**). Static02 measures **13 rows,9 failing rows** below. Every failure has an exact targeted diagnosis; no solver, limit, gate or accepted input changed.

| Row | Successful samples | First refusal ms | Finding |
| --- | --- | --- | --- |
| idle | 121 | — | PASS |
| alert | 121 | — | PASS |
| approach:hop | 58 | 203 | RecoverablePoseError: ARAP skin: unresolved folded triangles: 17 |
| melee:kick | 55 | 232.2222222222222 | RecoverablePoseError: ARAP skin: unresolved folded triangles: 59 |
| melee:bite | 28 | 118.22222222222221 | Error: Contact: joint limit foreFarPaw melee:bite@118.22222222222221: 47.94402136281136 |
| cast | 15 | 76.25 | Error: Contact: cast@76.25 exceeds scale compression bound |
| hit | 43 | 161.25 | Error: Contact: hit@161.25 hindNear RangeError: target outside two-bone reach |
| dodge | 11 | 25.666666666666668 | Error: Contact: dodge@25.666666666666668 exceeds scale compression bound |
| faint | 43 | 186.33333333333334 | Error: Contact: joint limit foreFarPaw faint@186.33333333333334: 46.96417433402339 |
| victory | 4 | 20 | Error: Contact: victory@20 exceeds scale compression bound |
| tame | 121 | — | PASS |
| feed | 121 | — | PASS |
| presentation | 375 | 6250 | RecoverablePoseError: ARAP skin: unresolved folded triangles: 116 |

contact-diagnosis-02 reconstructs actual attempted poses because the original report's contact-error pose retained the prior successful pose. All six exact errors reproduce: far foreleg compression requires35.539459/36.447786/41.964982px against33.682375px; near hind hit lies0.270042px inside minimum reach; far forepaw bite/faint counterrotation47.944021°/46.964174° exceeds±45°. Full precision remains in JSON. fold-diagnosis-02 reproduces17/59/116 folds in the near hind upper/lower mesh with no rejected output published.

The single corrected repaint requested a shallower crouch with hocks below hips and bent forearms. **candidate03 still has the tight high-hock Z and nearly straight far forelimb**; parent and independent visual review reject it. The second-paint rule ends this item. Both explicit presence declarations remain retained; no fabricated landmarks, false absence, third repaint or threshold relaxation. Candidate03 has no measured rig/static/native result. Native film and CPU are **unmeasured** for this repair.

Run **20260922-tree-frog-repair-02**, source predecessor4207748479e1ddeccb2f2f9f24c45e219f73956f. Fit02 record `c9c090cb8c2d4323643b160d1208b6c8fc23aaa52fcd61692cb1059a8504e768`; binding `bce045b5d90fa8b39cff69f3fdb6814dc86b34048fe8a19dfa884fcc9e826315`; original master `f2dc168f7208fc41101c658b3fa007e7fe4a8f07c898790a15e0c5a0398462d0`; rejected corrected master `67d17f2769afbcc1752ce2fb431dcb6fd9944f9e3a008a2b75e92b0a2d5293b3`. Exact original and corrected prompts, built-in tool receipts and hashes are in request/generation receipts and candidate03. manifest.json seals every output;55 static source hashes were verified unchanged.

[Measured-fit review sheet](review-sheet-02.png) and [rejected-paint sheet](candidate-03/review-sheet.png) separate the authorities and identify missing films. Original failed material attempt remains in ../../ARCHETYPE_SPRINT_20260922/06-hopper.

Paired next steps: Codex signs this packet then repairs Chimpanzee. Claude consumes signed results under Nick's integration direction; Nick reviews art and need not open Claude now. Tree Frog needs separate further-paint or representation authority to continue; no new hosted attempt, PR, merge, release or deploy.

Signing state: standard SSH and configured interactive1Password signers both refused; a later standard-agent retry also refused (signing-refusal-01/02/03.json). Complete packet is staged; HEAD remains4207748479e1 until runtime key use succeeds. No unsigned fallback or Chimpanzee work has begun.
