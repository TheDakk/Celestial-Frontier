# FINISH sprint — v2 release candidate (Dakk 2026-11-04, D55/D57/D58/D59)

Dakk: "let's just finish it at this point, we're closer than I thought. Can we build a full continuous sprint?"
End point (D59): v2 merged into develop through ONE authorized hosted run, then a develop→main release candidate with
release notes and the full production chain run locally. Dakk does the iPhone check and gives the release/deploy word.

Sprint mode: phases run back to back; routine calls are made and written down; a blocked item is recorded and the rest
continues. First red in any gate chain stops THAT chain (zero retries); fix forward with a new head, never weaken a test,
threshold or seal. Disk: own scratch deleted at each phase end; nothing heavy starts under 42 GiB free.

## Phases (Claude unless marked)

| # | Phase | Product change? | Done when |
|---|---|---|---|
| F1 | **D57** — replace the v1 Compendium browser step (local chain + hosted `test.yml`) with a named verification of the active v2 I5 certificate against the built producer; v1 commands stay as history; negative controls both ways | no (gate tooling) | tool + workflow + tests green, controls red on a mismatched certificate |
| F2 | **D55** — `library` check profile: the full per-creature battle battery over every delivered creature; `develop` keeps hand-listed + newest batch; wired into the develop→main chain | no (test tooling) | profile runs green on the current 100; develop time unchanged |
| F3 | **D50 tier 3** — deliver every remaining certified species that passes the unchanged gates (the 281 of D50's 381, plus O3's 3 where eligible); regenerate; library profile green | **yes** | develop + library green, one expected I5 red |
| F4 | Fresh I5 epoch on the F3 head (C502 procedure); select | evidence | PASS + develop + validate green |
| F5 | Local develop browser boundary on the clean committed head: v2 certificate verify (F1) → Slice → Glass, named verifiers | — | all PASS |
| F6 | **D58** — `anthropic/v2-release`: one signed commit on top of `develop` with the current tree, home path scrubbed to `~`; full battery again on that exact head; pre-push guard dry run | — | guard clean, battery green |
| F7 | Push `anthropic/v2-release`, open the PR into develop (copy-ready text), close #44 with a pointer; label `actions-full-chain-approved` ONCE when local is green; merge on a green hosted run (standing merge authority) | — | merged into develop |
| F8 | Release candidate: `V2_DRAFT_RELEASE` notes, develop→main RC branch, production chain locally (SceneMemory activation per D59 → Compendium v2 → Slice → Glass → Recovery) | notes only | RC report + iPhone checklist for Dakk |

## Codex (openai/mac)
O4 runs only while Claude is in F1–F3 code work (CPU-light). Codex drains to a TERMINAL row when Claude posts `DRAIN`
in TO_CODEX (before F4); no native/browser work after that until F8 is reported. O4 scope: the O3 ledger's 48 HOLD +
9 prerequisites, payoff order; accepted species join the NEXT release, not this candidate. Evidence paths are written
with `~` (C590). No push/PR/label.

## Not in scope
D53 new body families and D54 colour-hold fixes (next release); default battle2 switch (waits for the iPhone probe).

## Progress (2026-11-04)
- F1 D57 DONE `e9705e5657` — compendium-certificate gate; on the clean committed head 731d25db09: PASS + named verify PASS.
- F2 D55 DONE `545483eb68`/`993974cfa9` — library profile; everyday develop now ~2.5 min.
- F3 DONE `221a5ef47d` — 382 delivered + 38 hand-listed = 420 painted archetypes; library profile PASS over all 420 (46 min).
- F4 DONE `731d25db09` — epoch C594 PASS and selected after two measured fixes (C592/C593 stopped; diagnostic heap snapshot);
  develop 6110 green, validate fingerprint match.
- F5 RED at Slice (first red stops the chain): 6 findings in `f5-slice-red/slice-smoke-report.json` — settings pressed/group
  state, Guide inventory (41 topics now 37 partial / 4 unavailable vs sealed 35/6), release feed + feature-truth controls,
  Survey dock trusted pointer. Accumulated product/instrument drift since the last green Slice; fixed forward on a new head.
- F5 (cont.) Slice realignment so far, each diagnosed, never loosened: settings switches + reset-confirm group; Guide counts
  37/4; Feed meal-row pattern (instrument bug); live combat/duel claims; Survey dock covered by #pinchip (PRODUCT bug, fixed,
  epoch C595); tame toast span markup; Feed v2 new-taste preview; Arc 5 loser-reload diagnostics; legacy-mirror xp from the v2
  ownership row (D13 care XP). Remaining at 77090916af: ARC 5 FEED COMMIT (sealed around Feed policy v1: witness digests,
  unchanged Arc 4 fingerprint, v1 notification) and the Compendium rarity fixture list timeout; later arcs unknown. The small-
  phone Glass canary is instrument-red (floating-trail collision control). Slice/Glass last ran green ~2026-09-05; the product
  has changed a lot since, so the browser instruments have drifted broadly.
