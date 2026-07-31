# v4.0 Port Plan — Addendum A–D

Four pieces that exist in the v3.1 plan but not in `CELESTIAL_FRONTIER_V2_PORT_MASTER_PLAN_v4.0_v1.8.9.md`.

I checked this at content level, not by section title. **§7 through §14 of v4.0 are byte-identical
to v3.1** and §15 is 96.3% identical (+4 lines for the v1.8.9 audio migration note) — the entire
"what gets built" specification carried over verbatim. Of the 41 subsections outside §7–§15,
**41 have a v4.0 counterpart.** Most of what is not verbatim was correctly *replaced*: v3.1's
v1.6.4 measurements by v4.0 §3's v1.8.9 measurements, and v3.1's timeline by v4.0 §21, which
revised it upward and expanded it.

These four are the exceptions. None is a copy — each is restored and brought up to v1.8.9.

| Addendum | Restores | Slots into v4.0 as | Status |
|---|---|---|---|
| **A** | §2 Scope clarification and the creature rubric | **§2.6**, referenced from §10 and §27.4 | Restored verbatim, plus a scored rubric the AI-artist loop can optimise against |
| **B** | §17 Detailed code upgrade recommendations | **§17.1–§17.11**, ahead of the existing matrix | Restored and updated to v1.8.9; §17.10 rewritten against the current source |
| **C** | §18 Portability assessment | **§17.0**, read against §21 | Re-derived from v1.8.9 module sizes. v3.1's own two numbers disagreed — see inside |
| **D** | §25 External technology verification | **§28**, gate for Phase 0 | Re-verified 31 July 2026. Two findings that change cost and sourcing |

## The two things worth reading first

**Addendum C** finds that v3.1's headline "20–30% near-direct code reuse" was never derivable
from its own body text (2,900 domain lines against 21,808 total is 13.3%). Re-derived against
v1.8.9: **12.1% near-direct, 28.5% rules-reusable, 31.0% rebuilt, 28.4% app/UI re-expressed.**
Read against v4.0 §21's 10–16 months, that is the sanity check the plan currently has no way to
perform.

**Addendum D** finds that Spine's **Essential tier at $69 explicitly excludes meshes** — and mesh
deformation is the core of decision D3. Professional at **$379** is the floor, and **Enterprise at
$2,499 + $379/user becomes mandatory above $500,000 annual revenue.** Also: the community
`pixijs/spine-v8` repository is **archived**; the canonical runtime is now
`@esotericsoftware/spine-pixi-v8` under the official spine-runtimes 4.2 branch.

*Prepared 31 July 2026 against v4.0 (v1.8.9) and the v3.1 original. Code measurements are v4.0's
own §3.1/§3.2 figures unless stated; source greps are against v1.8.6 `0bfc904` and noted as such.*
