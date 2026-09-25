# C15 batch 1 — Impala painting, rig, masks and motion findings

**Not admitted: motion remains open.** Plain tan male Impala base with pale shading, two ringed horns, four independently visible legs/hooves, upright ears and short tail. One built-in imagegen master; exact retained kit/genome/part prompt in prompt.txt, receipt in generation-receipts.json. No hidden/absent/folded anatomy inferred. Horns belong to the head paint; no new unsupported horn joints. All31 parts and landmarks manually authored.

Candidate fit-01: exact rest and independent source-pixel reconstruction PASS; **18/19 static rows PASS**. Faint refuses foreFarAnkle at344ms, -105.44503724592258 degrees. Continuous presentation independently refuses faint at351.6918115342669ms, -106.14589939336607 degrees. All other static actions pass. No limit or solver change.

**native-phone4x-01 FAIL**:602 frames at4×CPU, stage CPU p95 **5.799999952316284ms**, frame delta p95 **16.700000000000728ms**. Left29/right7 rig refusals, contact compression bound during approach:walk (left931.666666666667ms,right915.8333333333335ms). Left kick/right headbutt. Both face inward; film/stills retained. Passing isolated walk is not passing blended playback. No desktop-per-rig or real-phone result claimed.

All six masks PASS conservation: nonempty, alpha no greater than keyed alpha, zero pixels outside, outside-pixel mutant refused. Exact sent mask prompts and hashes in markings.json; built-in outputs in mask-generation-receipts.json. No image resize, translation or registration. Root fixed patch is on the torso; remainder is spine so stray unassigned alpha does not become a world-fixed root. The complete source is preserved.

Hashes:
- master `abad16f380bf27e2a17123882dd1ba027e196f10a180f299dbb470663e2b031a`
- recipe `67995957626fe39620ab4600fef284c497b07998c5011c6d5a0a4920df823670`
- binding `e347dca4508c73c3b606cce17b153558a19001519da01e0b14a83e5459ba9dfc`
- markings `49d904630c7e9a4be00b8fa691a7241bd01c77128635ed9d6a5f0ad5ac8fb0c7`
- film `c408c1762e64807c5111c5d2cbb2fd806169d0e163aee553e931020d470a988d`

Evidence: static-01.json; native-phone4x-01/report.json and battle-10s.webm; review-sheet.png; six-mask-sheet.png; root-validate.log PASS. One review-sheet command initially used misspelled nonexistent audits/ARTETYPE_SPRINT_20260922/review-sheet.mjs (MODULE_NOT_FOUND, no outputs); corrected to this packet's actual script. No certificate, picker admission or coverage gain. Accepted bindings/S2/source limits untouched.

Paired next steps: Codex continues Marmot/Bass/Cattle/Tang and repairs motion after the painting batch; Claude keeps Impala out of the live arena and diagnoses walk blends/faint alongside Cougar. Nick reviews the ten-item art sheet, no message relay needed. This signs finished art/evidence, not completed runtime acceptance.
