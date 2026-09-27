# Independent check of Codex's foreleg side repair (the elbow flap), Claude 2026-09-27

**Subject:** `audits/C59_REPAIR_20260926/foreleg-side-labels.mjs` (`separateUpperForelegs`) and its seven `*-side` candidates: C54 Tiger/Leopard/Ocelot, C56 Mink/Fisher, and the C57 Snow Leopard/Clouded Leopard re-paints. Script: `check.mjs`; results: `results.json`.

| Check | Result (all 7) |
|---|---|
| **Independent re-implementation** of the stated rule (not importing Codex's function), compared pixel-for-pixel with Codex's committed candidate labels | **0 pixels differ.** Moved: Tiger 15,929; Leopard 11,053; Ocelot 12,614; Mink 8,718; Fisher 9,234; Snow Leopard 12,304; Clouded Leopard 10,616 |
| Conservation | 0 non-foreleg owners changed; 0 same-side transfers; 0 pixels gained or lost an owner |
| Idempotence (the rule applied to its own output) | 0 further changes |
| Moved share of the foreleg paint | **10.2–12.4 %** |
| **Mutation:** near/far landmark sets swapped (wrong chain identity) | moves **61.5–68.0 %** of the foreleg paint. The rule itself has no guard against this |

**Proposed guard** (for Codex's `compile-side.mjs`): refuse when the moved share exceeds **25 %**. That sits between the real maximum (12.4 %) and the swapped-chain minimum (61.5 %), with a margin of about 2× on each side. It catches a mislabelled or mis-transferred chain, which is the same class as the wrong tail name (C59).

**Full-size look** (`elbow-after.jpg`, the approach stills of Codex's native runs): **the hanging elbow flap is gone on all seven.** Residual hairline seams remain at the chest–foreleg junction:
- Tiger: faint vertical line, left fighter;
- Ocelot: small notch, left fighter;
- Fisher: thin pale strand, right fighter.

These are minor, but visible at full size.

**Verdict: ACCEPTED** by Claude's independent check, with the proposed 25 % guard. The candidates remain post-verdict placement: no G1 verdict change and no library admission.
