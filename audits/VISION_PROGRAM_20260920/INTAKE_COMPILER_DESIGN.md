# The universal intake compiler — design (Nick's direction, 2026-09-20 night: "a universal system that will work for
# all creatures, Earth and procedural; get the crab to work in that mold")

Author: Claude (anthropic lane). Status: design + build order; supersedes the crab-specific naming work in
`port/v2/tools/anatomy-verify/README.md` slices 12–14, which are demoted to calibration notes. Codex's delivery packet
`openai-mac/audits/VISION_P1_DESKTOP_DELIVERY_20260920/` (all four films delivered, geometry green, three one-run CPU
readings at 3.6–4.0 ms against 3.5) is accepted as the frozen regression set; the CPU reads are not chased per crab.

## 1. The rule that makes it universal
**The compiler contains no creature and no family. It contains a graph matcher.** Every family already declares its
anatomy as a template (`family-contracts.mjs`, `specialized-templates.mjs`: joints, graph, legs, optional parts, rest
proportions, limits). The compiler reads a painting into a graph of the same kind and matches the two. A crab, a
civet, a bird, a fish or a procedural six-legged glider are the same problem with different templates. If a step
needs the word "crab", it is wrong.

## 2. Pipeline (every stage generic; the crab is instance 1, the Civet instance 2)
| Stage | Input → output | Status |
|---|---|---|
| P0 key | RGBA (opaque key-painted or alpha export) → alpha | done (`alphaOf`) |
| P1 field | alpha → working mask, exact distance transform | done |
| P2 graph | mask+DT → ridge graph: nodes (ends/junctions by crossing number), edges (length, DT profile), spur pruning by the disc rule fixed on the original skeleton | done, connected on all five paintings |
| P3 body | graph → body subgraph = largest thick component at a fraction of max DT; body outline = its boundary ring | body fraction needs a principled choice (P3 note) |
| P4 appendages | graph → appendage chains from the body to each tip, with attributes: length, thickness profile, terminal class (thin end / thick forked end / knob), **separation point** = last node shared with any other chain, projected onto the body outline (the ordering primitive) | partly done; separation point not yet built |
| P5 template match | template appendage classes (legs per side, forked appendages, stalks, tails, fins, wings…) × painting chains → assignment by a generic cost: side, outline order, thickness class, length ratio; unfilled slots → hidden candidates | to build; generic from day one |
| P6 landmarks | each matched chain → joints at the template's rest segment ratios along the chain's path; hidden slots → inferred by the template's mirror/adjacent rule (already implemented by Codex for the record) | to build |
| P7 labels | painting pixels → parts by geodesic distance to chain paths within the mask; body = remainder; fringe rule from the freshwater fit-03 repair | to build |
| P8 writers | record, declaration, masks, atlas, paint skin, split, binding, static/native gates | Codex, frozen, generic already |
| P9 verify | landmark error vs hand fits, hidden-set equality, static rows, mutants | IC-4 bar in PROGRAM §6 |

P3 note: "thick" must be defined by the template's proportions (body radius vs limb radius at rest), not a magic
fraction; the template already carries bone lengths and bounds, so the body/limb thickness ratio is derivable per
family. That removes the 0.45 constant.

## 3. Template appendage classes (the vocabulary the matcher speaks)
- **leg**: long chain, thin terminal, ends at a free tip or a touching tip; ordered along the body outline per side.
- **forked appendage**: chain with a thick section that forks into two thin tips (crab claws, pincers, antlers, forked tails).
- **stalk-knob**: short chain ending thicker than its stalk (eye stalks, antennae clubs).
- **tail / fin / wing**: chain classes by length ratio and attachment zone (rear, dorsal, lateral) — defined in the
  template, matched by the same cost.
Each template lists its appendages in this vocabulary with side, count and outline order. The crab's list is
8 legs (4 per side), 2 forked appendages (front), 2 stalk-knobs (top). The Civet's: 4 legs, 1 tail, 2 stalk-knobs
(ears), head. Nothing else changes between them.

## 4. Build order (this lane), each step scored on the five crabs AND the Civet before the next
1. P4 separation point + P3 template-derived body ratio.
2. P5 generic matcher with the crab and quadruped templates expressed in §3's vocabulary.
3. P6 landmarks + hidden inference; P7 labels.
4. IC-4 run on the five crab fits; then the Civet through the same code as the first Earth quadruped.
5. Only then the roster, through the compiler, with the law: a hand step is a compiler bug.

## 5. CPU
Not a compiler input today. When the compiler owns the paint skin, mesh resolution becomes a compiler setting derived
from the tier (desktop painted / phone painter), applied to every creature the same way; the three 3.6–4.0 ms one-run
readings are recorded findings until then.
