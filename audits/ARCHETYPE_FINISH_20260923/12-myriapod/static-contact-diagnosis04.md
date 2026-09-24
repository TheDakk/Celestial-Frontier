# Centipede fit11 presentation return-step refusal

The contact-only replay reproduced the first retained static07 presentation refusal exactly after 704 successful contacts: sample index 704, global time 11733.333333333334 ms, `tame` age 722.6853397116065 ms. The canonical timeline and full presentation schedule match static07. The action itself is 640 ms long; presentation is fading its completed translated pose back into idle with weight 0.4748343953390537.

The source owner deliberately converts this fade into one signed return step: base 0.03429175472477672, stride −0.03429175472477672, progress 0.5251656046609463, in normalized image coordinates. `leg0Far` belongs to group 0 and is just beginning its second-half backward swing (`at` 0.05033120932189261). Its foot has barely returned while the body has already returned about halfway. The raw and travel-adjusted root dx are both exactly 0.047483439533905374, matching the authored final dx 0.1 multiplied by the blend weight. This is a return-step reach incompatibility, not a mismatch between the source root and blended root arithmetic.

| Attempt | Hip px | Target px | Distance px | Original maximum px | Excess px |
| --- | --- | --- | ---: | ---: | ---: |
| Anatomical endpoint, pass 0 | (1042.4187623932976, 638.8920514061444) | (1099.607488072759, 558.1178054769377) | 98.96983959910557 | 97.75666971315175 | 1.213169885953818 |
| Rest-support geometric candidate | same | (1103.6074880727588, 563.3178054769378) | 97.23953310276949 | 96.673344630615 | 0.5661884721544757 |

Both targets are above the hip. The existing downward-only accommodation cannot decrease either distance. The original error and nested `support candidate outside accommodatable reach` error are retained. The mixed support remains mixed; the candidate is rejected before any claim about its full-LBS publication can be made.

The static report's `firstRefusal.pose` is the last published pose; `firstRefusal.contact` is null because the failed resolve never returned. The diagnostic instead captures the actual attempted pose and phase immediately before contact.resolve, plus every reach check and target contributor for the first failure. The preceding successful sample is retained for comparison.

The evidence supports considering an explicit compact-model return-step cadence declaration. It does not establish that any particular subdivision passes all contacts or the full presentation. No runtime, policy, mesh, input, threshold or limit was changed. No ARAP solve, full static run, browser, film or CPU measurement was performed.

Evidence: `static-contact-diagnosis04.ts`, orchestration `.mjs`, `.json`, `.log`, `.sources.json`, and the exact current contact-owner snapshot `static-contact-diagnosis04-owner.ts`. Source insertions are observational and exactly invertible; the receipt compares loaded source bytes against static07 and checks them again after execution.
