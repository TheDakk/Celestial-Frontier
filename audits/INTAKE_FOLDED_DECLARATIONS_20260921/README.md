# Applied folded declarations — 2026-09-21

Nick authorized exactly this IC-3 change. Source: the sibling lane’s `audits/INTAKE_COMPILER_20260921/FOLDED_DECLARATIONS.md`, read-only; no sibling edits or sync.

**Schema decision:** retain `cf.anatomy-presence/v2` and add optional `folded: string[]`; omission means `[]`. V1 stays unchanged. Folded legs are explicitly declared, present and painted, disjoint from hidden/absent. They retain ordinary joint, painted-alpha, geometry and contact requirements. The declaration cannot synthesize a missing landmark. `anatomy-inventory.mjs` validates names against the template’s leg inventory; no inferred folded state or graph change is made.

**Application:** each accepted fit receives a standalone `presence.json` for the compiler. Its absent/hidden sets are copied from the sealed record (Vent’s undeclared presence becomes explicit empty sets). Records, recipe hashes, part declarations, landmarks, masks, bindings and rigs remain byte-identical. Changing sealed records would invalidate their existing binding receipts; these separate compiler inputs avoid that. Claude must read these files explicitly rather than the old records’ anatomy fields.

| Presence file | Folded | SHA-256 |
| --- | --- | --- |
| `audits/VISION_P1_FOUR_CRABS_20260920/intake-02/crab-fit-01/presence.json` | `leg0Far` | `74079125ddbd944323bdd95af0be0d4b915f0176611818e4ea00c23f9a0e1a7c` |
| `audits/VISION_P1_FOUR_CRABS_20260920/intake-02/mud-crab-fit-01/presence.json` | `leg0Far` | `0d8172a0175d0f4db7fe70a4e84dd2d8f27f4da09a0409ac8ccc445b634564c1` |
| `audits/VISION_P1_FOUR_CRABS_20260920/intake-01/vent-crab-fit-01/presence.json` | `leg0Near` | `c4cbd45b197d171b6d91babf6ba8b5652a2d8ca3fae01d56df174663decfc329` |

**Focused validation:** `node --test port/v2/tools/creature-animation/folded-anatomy.test.mjs`: 3/3 pass. Controls cover legacy omission and empty lists, unchanged brachyuran/quadruped inventories, malformed/unknown/duplicate entries, hidden/absent overlap, V1 rejection, all three accepted geometry/contact comparisons, and missing-foot refusal. `application.json` hashes every file in the three fit trees; all prior files matched HEAD exactly. The first preparation’s missing Vent anatomy-field assumption is retained there; the correction explicitly declares its existing empty absent/hidden sets. No battery, fit, bind or native run occurred.

**Handoff:** Codex holds again; IC-3 writers are frozen. Claude points `score.mjs`/`ic4.mjs` at these three applied presence files and removes the temporary `FOLDED` proposal map. Nick has nothing to decide; no animation decision is pending for this change. No fetch, push, PR, merge, release or deployment. Existing staged four-crab delivery work remains separate.

**Authorization resolution:** the first commit attempt was blocked before execution because automatic approval review applied the earlier IC-3 freeze. `commit-refusal.json` retains that history. Nick subsequently repeated the complete folded-only authorization directly in this Mac task, including the signed local commit. The implementation and focused-test results are unchanged; no battery or test rerun is needed. This packet is prepared for the signed folded-only commit.

**Signing history:** the first authorized signing attempt returned `agent returned an error`; `signing-refusal.json` retains that receipt. Nick subsequently confirmed 1Password is ready. The unchanged implementation and prior focused results are being signed without a battery rerun.
