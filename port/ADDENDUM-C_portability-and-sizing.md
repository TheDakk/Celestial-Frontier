# Addendum C — Portability assessment, re-derived

**Restores v3.1 §18. Slots into v4.0 as §17.0, immediately before the code-to-port matrix, and is read against §21.**

v4.0's §17 matrix is better than v3.1's §18 at the module level — 24 rows of preserve / rewrite / required parity evidence. What it does not have is an **aggregate**, and without one there is no way to sanity-check §21's "10–16 months for a focused five-to-seven-person team" against the actual shape of the codebase. That check is what §18 was for.

---

## C.1 What v3.1 claimed, and why it cannot be used as-is

v3.1 §18 gave three numbers:

| | v3.1 |
|---|---|
| Near-direct code reuse after TypeScript conversion | 20–30% |
| Rendering implementation reused as-is | < 10% |
| Existing gameplay design retained | > 80% |

**The first number does not follow from v3.1's own body text.** The same section states that "approximately 2,900 lines of explicitly deterministic domain code are prime candidates for near-direct TypeScript conversion", against a codebase §3 measured at 21,808 extracted JavaScript lines. That is **13.3%**, not 20–30%.

The gap is probably the medium-reuse tier being counted partly as reuse — defensible as an argument, but it makes the headline number unreproducible, and it is the number a schedule gets checked against. Re-deriving from v1.8.9 fixes both the staleness and the ambiguity.

## C.2 Re-derived against v1.8.9

Using v4.0's own §3.1 total (24,569 extracted JavaScript lines) and §3.2 layer table, sorted into v3.1 §18's three tiers plus the remainder §18 never accounted for:

| Tier | Content | Lines | Share |
|---|---|---:|---:|
| **A · Near-direct TypeScript conversion** | The 14 deterministic domain modules | 2,982 | **12.1%** |
| **B · Rules and data reusable, UI rebuilt** | Materials 1,433 · Fabricator 1,318 · Descent 1,006 · Compendium 896 · Ascent 784 · SaveSystem 553 · Charters 504 · Conquest 496 | 6,990 | **28.5%** |
| **C · Rebuilt against the design** | `hdart` 5,221 · Renderer 1,884 · audio 290 · `Fx` 224 | 7,619 | **31.0%** |
| **D · App/UI sections re-expressed as components** | the remaining ~31 app sections | 6,978 | **28.4%** |
| | | **24,569** | 100% |

**One ambiguity to resolve.** §3.2 lists "CombatCore domain — 814" as its own row while §3.4 lists `CombatCore` among the fourteen deterministic domain modules. If the 814 is *not* already inside the 2,982, tier A becomes **15.5%** and tier D **25.1%**. Worth settling when the extraction starts, because it changes the Phase 1 estimate by about 3% of the codebase.

## C.3 How to read these against §21

The three numbers that matter for scheduling:

**A = 12%** is the part that ports by conversion — types, tests, no design decisions. Fast, high confidence, and it is Phase 1. This is also the only tier where the golden-seed fixture is a complete acceptance test, which is why Phase 1 is the one phase that can be *finished* rather than judged.

**B + D = 57%** is the majority of the codebase and the honest centre of the work: the rules survive, the wiring does not. This is where a schedule goes wrong, because "the logic already exists" reads as cheap and the logic is 20% of the effort in that tier. v4.0 §6.4's reach-through problem is exactly this tier — a system whose rules are entangled with its DOM does not port, it gets untangled and then ported.

**C = 31%** is the rebuild, and it is where the *upgrade* lives rather than the port. §21.1's parity range (10–14 months solo, 4.5–7 for three engineers) is essentially A + B + D with C held at parity quality. §21.2's premium range is C done properly. The gap between those two tables — roughly 2× — is almost exactly tier C's share of the work, which is a useful independent check that §21's two tables are consistent with each other.

**Design retention.** v3.1's "> 80% of existing gameplay design retained" is a judgement rather than a measurement, and it is well supported: every one of the 24 rows in v4.0 §17 has a non-empty "Preserve" column, and tiers A + B + D — 69% of the code by line — retain their rules and content entirely. Restated defensibly: **100% of gameplay design is retained by intent (D1 — nothing is dropped); ~69% of the code retains its rules and data; ~12% converts near-directly.**

## C.4 The three tiers restated for v1.8.9

Tier A and B membership has not changed since v3.1 — the modules are the same and v4.0 §3.1 confirms "deterministic domain modules 14, app/service modules 6, app sections 45, unchanged". Tier C has grown: v4.0 §3.2 notes the visual hotspot is now **more than 8,000 lines** across renderer, HD art, thumbnails, galaxy art, species art, effects and cinematics, against `hdart` at 5,192 in v1.6.4 and 5,221 now.

**High reuse (A).** PRNG and hashing · noise · planet parameters · naming · world constants · star catalog · cell-based world generation · trait tables · genome synthesis · genetics · ecology · descriptors · combat formulas · share-code logic. *Ported, typed and regression-tested — not rewritten from memory.*

**Medium reuse (B).** Biomes · landing and descent rules · Compendium · Atlas · progression · conquest · mining · materials · fabrication · breeding · player state · Charters · chapters · Prime Codex · tutorial content · settings · events. *The formulas, IDs, content and outcomes are reusable. The UI wiring is not.*

**Low source reuse, high design reuse (C).** Canvas2D renderer · HD creature painter · vista painter · thumbnail generation. *Rebuilt — and the original code is the specification, per v4.0 §5's final line and §6.7.*

## C.5 Why the aggregate is worth carrying

The per-module matrix tells a developer what to do with `Genetics`. The aggregate tells whoever approves the budget whether a 10–16 month plan is the right order of magnitude, and it is the number that moves when scope changes. If the premium visual upgrade is deferred, tier C's 31% is what comes off the schedule; if it is not, §21.2 rather than §21.1 is the applicable table. Neither of those decisions is legible from a 24-row matrix.
