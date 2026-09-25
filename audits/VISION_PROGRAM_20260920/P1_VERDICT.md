# P1 verdict — Coconut Crab, generation 01 (Nick + Claude, 2026-09-20)

**Art: ACCEPTED by Nick ("the crab looks excellent to me").** The first procedural-roster creature painted from a
compiled Art Kit prompt with the painter canvas as anatomy guide reaches the Civet's level. The direction works.
Codex's packet: `/Users/nick/Projects/celestial-frontier-openai-mac/audits/VISION_P1_COCONUT_20260920/` (`c38acee4`),
one generation, exact prompt retained, tool `image_gen.imagegen`, no seed/model exposed, no retry, intake refused at
`checkFamilyGeometry: exact landmark inventory`. Codex's discipline was exactly right: nothing invented, nothing retried.

**Anatomy: the finding is a count-law error in the packet, not model drift.** The prompt demanded "eight walking
legs" because the packet compiler took the count from the brachyuran template's leg inventory. The real coconut
crab shows three walking pairs; its last pair is small and tucked under the carapace. The model painted the animal:
six visible walking legs, two claws, two stalked eyes, and hid the fourth pair, as the species does. The painter
canvas showed eight because the canvas painter draws the template. So the painting is anatomically right for the
species and wrong for the template, and the chain refuses because template legs are mandatory and "a hidden but
present appendage is NOT absent" (`anatomy-inventory.mjs`). The same thing will happen to every species whose
natural pose hides a limb, which is most of the roster. This is the first real lesson for Track T.

## Laws (Nick's program, applied)
1. **Count lines come from the species, not the template.** The packet compiler now carries a per-species visible-anatomy
   override (`SPECIES_COUNTS`); the coconut crab's line becomes "six visible walking legs, three per flank; two claws;
   two stalked eyes; the fourth walking pair small and hidden beneath the carapace". Generation 01 already satisfies it.
2. **Hidden is a declared presence class, distinct from absent.** A painted master may hide a present pair. The
   record declares it (`hidden`, never inferred from a missing landmark); its landmarks are placed by template
   inference from the visible pairs; its parts carry no paint; the contact solver plants only visible feet (this is
   the stance contract from R3-S applied per limb). Absent stays absent; hidden animates nothing and blocks nothing.
3. **The verifier verifies the visible.** T1 counts visible tips against the species' declared visible count and
   refuses extras and mergers; it can never confirm a hidden limb, so hidden pairs are declared by the record, and
   T2's human labels score the model on what is visible.
4. **Generation 01 stands.** No second generation, no changed prompt: it matches law 1 as painted.

## Direction for Codex (P1 continued, one bounded step)
- Implement the `hidden` presence class in the family record and intake (`cf.anatomy-presence/v2` gains `hidden`),
  for the brachyuran template first: leg3Far/leg3Near declared hidden; landmarks for the hidden pair placed by
  template inference (mirror of pair 2 with the template's rest proportions), parts empty, contact chains for
  hidden legs excluded, `checkFamilyGeometry` accepting a complete inventory with hidden joints flagged.
- Then finish P1 on generation 01: key/despill as delivered (alpha export, zero channel change), author the part
  masks for the six visible legs, two claws, eyes and body, landmarks, observed split, binding, native rows, film,
  and the sheet beside the Civet. Margins (21/29 px on 1254) are retained as delivered; no resize of the master.
- Both-way controls: a record that declares a hidden pair with paint present refuses; a record with a missing pair
  and no declaration refuses (as today); the painter crab (eight visible) still admits with nothing hidden.

## Claude next
- `compile-master-prompt.mjs` species override landed with this verdict; packets for the other four crabs (eight
  visible legs each, true crabs) queued so they are ready when P1 admits.
- T1 rule 3 folded into the verifier design; T1 steps 2–3 continue.
