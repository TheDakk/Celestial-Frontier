# IC-4 status — the intake compiler against PROGRAM §6's bar (Claude, 2026-09-21, commit after `657fd938`)

Bar (PROGRAM §6): every accepted crab fit reproduced with landmark error inside a recorded bound, identical hidden
set, static rows green, zero hand edits; erased-leg, duplicated-leg and wrong-template-guide mutants refused.
Runner: `port/v2/tools/anatomy-verify/{score,ic4,sheet}.mjs`; declarations from Codex's `presence.json` (folded
applied 2026-09-21); comparison truth = the hand records, never an input. Verdict is STRICT (Nick).

| Subject | verdict | named feet ≤ 25 px | worst named foot | hidden/folded set | wrong feet inside an ADMIT |
|---|---|---|---|---|---|
| coconut | REFUSE (unused endpoint at declared-hidden leg3Far — the painting shows it) | 4/6 | leg1Near 416, leg2Near 259 | exact | — |
| crab | REFUSE (leg3Far read as a claw finger) | 5/6 | folded leg0Far 68 | exact | — |
| freshwater | **ADMIT** | 6/7 | leg3Near 206 | exact | **1** (leg3Near) |
| mud | **ADMIT** | 6/7 | folded leg0Far 158 (the false loop won the folded slot) | exact | **1** (leg0Far) |
| vent | **ADMIT** | 5/8 | leg2Near 429, leg3Near 439 | exact | **2** |
| Civet | **ADMIT** | 3/5 (all four paws ≤ 31 px) | foreFar 31 | exact | 0 at a 31 px bound |
| Wolf | **ADMIT** | no hand truth (declaration only) | — | exact | — |

Mutants: wrong-template REFUSE 7/7; erased REFUSE 6/10; duplicated REFUSE 7/10 (the seven absorbed are named in
README slice 26; an erased FOLDED leg is undetectable by loop evidence by construction).

## Reading
- **The verdict passes 5/7 but the landmark bar passes 1/7** (the Civet at a 31 px bound; the Wolf has no truth).
  Three ADMITs carry wrong feet; a strict verdict that cannot see a wrong NAME is not yet the gate §6 asks for.
- The next compiler item is therefore not another candidate rule: the verdict must carry a per-slot confidence
  (cost margin between the chosen assignment and the runner-up, plus the candidate's evidence kind) and REFUSE a
  slot whose margin is thin — so a wrong name becomes a refusal, not an admission. Then the folded-slot waiver
  (no length penalty) must be replaced by "the loop nearest the slot's expected position along the side".
- Hand edits: zero on every subject. Static rows (Codex's IC-3): not run — writers frozen; the compiler does not yet
  write records, so "static rows green" is unmeasured.
- Sheets: `sheet-01/*.png` beside this file.
