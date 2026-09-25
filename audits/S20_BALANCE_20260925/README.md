# §20 / C19–C20 — balance instrument and measured findings

**Tool delivered; game balance RED.** Final run `measured-04` uses clean signed Claude source `4093ebca66d80d4ef3bd73d19dbe82c330264d6b`. It bundles the real resolver and registered Guardian/Titan projector read-only. All 51 bundled source modules are hashed and checked again at completion. No game constants, rewards, recovery durations, contracts or thresholds were changed. This is not a Compendium certificate, full develop gate, or campaign-wide balance approval.

## Run and scope

From the repo root:

```sh
node --test port/v2/tools/s20-balance.test.mjs
node port/v2/tools/s20-balance.mjs --source-root=/absolute/path/to/committed/repo --out=/new/output/directory
```

Requires a good signed source HEAD and clean `port/v2`; refuses an existing output directory. The current local lane does not yet contain Claude's encounter engine, so use Claude's read-only source until it is reconciled. The normal Node tools test owner discovers the new tests automatically. Exit2 means measured RED or incomplete scope; a thrown error is an instrument failure. This tool is deliberately not added as a required develop owner before the corpus/dossier contract is complete.

The instrument chooses one fixed policy using 128 training fixtures, then evaluates it on 512 disjoint fixtures. Wild fights search four stances. Guardian/Titan parties search all 384 full-party order/stance combinations (six orders × four stances per slot). Each party is unchanged between its Balanced baseline and planned comparison. It does not choose a plan from evaluation outcomes. All four corpora contain 128/512 unique plans; complete genomes and training scores are retained.

Difficulty uses **declared raw-stat power ranges**, never measured wins: easy defender180–220 and fighter1.8–2.2×; normal defender250–350 and fighter0.9–1.1×. Guardian/Titan slots use0.45–0.60,0.50–0.65,0.55–0.70× defender power. These are benchmark definitions, not shipped difficulty bands. One registered Guardian world and one registered Titan world, region0, are represented; all party genomes come unchanged from deterministic fauna pools. The Guardian/Titan cohorts are nearly all losses and expose a poor readiness range; their small Command edge must not be presented as general proof that Swap is unnecessary.

Command exhausts every offered decision branch for the training-selected plan, including phase/next-fighter/low-HP breaks, Swap and Withdraw. It continues after finding a win; Withdraw never scores a win. This is a clairvoyant **upper bound**, not human performance. Five percentage points is the instrument author's predeclared small-edge margin. Other candidate plans/partial parties/worlds still require coverage. The lone Balanced Auto dispatch mirrors the settlement's verbatim no-phase path; 1,024 exact runDuel comparisons and 2,048 replay comparisons match.

## Results (wins / 512; percentage-point deltas)

| Cohort | Balanced Auto | Selected-plan Auto | Best Command | Planning gap | Command edge | Target planning gap |
|---|---:|---:|---:|---:|---:|---|
| easy | 512 | 512 | 512 | 0.000000 | 0.000000 | <5 |
| normal | 240 | 258 | 258 | 3.515625 | 0.000000 | 10–20 |
| guardian | 2 | 2 | 4 | 0.000000 | 0.390625 | 25–40 |
| titan | 1 | 0 | 3 | -0.195312 | 0.585938 | 25–40 |

Wild Command column repeats Auto because §20 offers no mid-fight Command there. Guardian and Titan searches visited176/202 phase nodes and2449/2767 withdrawn terminals respectively. Per-fixture decisions, result hashes and complete-tree digests remain in the evaluation files. Every comparison includes draws in its denominator; the card's decisive-only forecast is a different measure.

## Threat hypotheses (wins / 512)

These seventeen isolated magnitude-III ability hooks use the actual combat loop and declared equal base stats. Right/wrong assignments are authored hypotheses from the stance proposal, never fitted from these outcomes. They are **not yet bound to a shipped dossier threat inventory**; the tool cannot claim all UI threats covered. Only Affliction and Mending meet the specified right > Balanced > wrong ordering in this corpus. No one stance is best across every probe.

| Hook | Proposed right / wrong | Balanced | Press | Guard | Evade |
|---|---|---:|---:|---:|---:|
| smite | guard / press | 32 | 60 | 72 | 48 |
| aegis | press / guard | 41 | 109 | 74 | 86 |
| dot | press / evade | 29 | 83 | 22 | 28 |
| fury | press / guard | 45 | 134 | 100 | 60 |
| ambush | guard / press | 63 | 114 | 240 | 85 |
| eye | guard / press | 72 | 127 | 123 | 86 |
| veil | press / guard | 75 | 103 | 102 | 136 |
| mend | press / guard | 12 | 21 | 7 | 20 |
| echo | evade / press | 106 | 117 | 165 | 132 |
| thirst | press / guard | 139 | 228 | 154 | 146 |
| thorns | guard / press | 57 | 94 | 106 | 73 |
| rend | press / guard | 30 | 100 | 64 | 64 |
| reck | guard / press | 62 | 131 | 119 | 90 |
| bulwark | evade / press | 207 | 246 | 318 | 208 |
| shock | evade / press | 106 | 108 | 184 | 152 |
| roulette | evade / press | 93 | 122 | 132 | 164 |
| enrage | press / guard | 95 | 170 | 120 | 99 |

The data largely shows that alternative stances improve on Balanced even in the purported wrong matchup. Tuning damage multipliers until this narrow corpus passes would not establish the promised readable counterplay. Next: bind the actual dossier inventory, declare progression/ownership-ready cohorts and broaden worlds/regions, then tune against training only and use a fresh held-out evaluation epoch. Preserve these results.

## Instrument controls and refused attempts

22 Node tests pass, including a complete positive report and negative controls for missing/invalid counts, missing inventories, overlapping seed authority, forged policy, wrong target gaps, excessive Command edge, missing phase/Withdraw/swap coverage, flat/global-best stances and parity/replay failures. Exact tree controls prove branches after an early win are still visited and an omitted Auto path refuses. Two actual bundled-resolver mutants are killed: flatten stances96 changed transcripts→0; disable phase2 visited phase nodes→0. A real Withdraw terminal kills a wrong win-scoring control. No measured product source was mutated.

- `measured-01`: refused before measurement because the registered ordinary-Guardian projector requires a nonempty native roster. Fixed the fixture input, retained refusal and original instrument.
- `measured-02`: retained but **invalid for difficulty conclusions**. The third `makeGenome` argument was incorrectly treated as difficulty; it is biome heat. Easy and normal produced identical results. Replaced with power-selected corpora, not a threshold change.
- `measured-03`: power-corpus preflight refused because an unrestricted high-power defender had no fauna at1.8–2.2× its power. No balance result was accepted. Explicit defender bands now define the cohort.
- `measured-04`: final unchanged Claude product source, corrected declared corpus. RED is retained without a tuning/retry loop.

Root validate passes. No production runtime changed, so no repeated full profile, S2 or native films; parked I5 remains red. The final source bundle and mutation copies are audit tooling, never shipped assets.

## C20 persistence/recovery review and concrete card defect

Static review (source hashes in `reviewed-source-hashes.json`) follows open-encounter sealing, decision count + revision CAS, exact-prefix consumption, and combat's every-member ownership/availability checks. Sealed battle/encounter/party identity is rechecked at settlement; closing uses a null carrier replacement. Friendly-duel review confirms exact durable ownership digest, assignment/open-fight refusal, committed active clock, independent win/participation windows, and mirrored XP. This bounded source review found no new carrier blocker; it is not a newly executed persistence test battery.

Actual domain constants read by the tool are600000ms defeat Recovery and zero added wound. Non-decisive fallen/swapped/capped companions receive the same Recovery; untouched members receive none. Withdraw currently enters the non-win recovery path; the earlier four-minute proposal is **not implemented**. No recovery/XP policy change is made by this art/battle instrument task. Non-decisive member XP remains none; tuning those policies requires a progression corpus, not win-rate-only guesses.

**Reproduced forecast cache defect, Claude repair requested:** `projectCombatPlanForecastV1` keys the defender by seed only, omitting its current stats/region multiplier. Two genuine registered encounters for the same Guardian at region0/1 have power650/741. With identical player stats and Press, first forecast44.375%; cached region1 incorrectly44.375%; clean-module region1 calculation10.625% (160 samples). `forecast-review.mjs`, JSON, source hashes and exact actual-source bundle retain this reproduction. Key the defender's full combat identity, including phase/derived stats, and negative-control same-seed changed-region reuse. The human card shows44% instead of11% until the cache is cleared.

## Paired next steps

Codex has delivered Nick's requested tool and red measurements, with no new painting/weekly/economy work or C8 run. Claude consumes signed C22/C23/C24/C25/S4, preserves its newer wiring on reconciliation, fixes the forecast cache and actual-stage findings, then performs master-pack removal/size and picker checks. Both lanes keep I5, failed art/phone gates and limited balance coverage explicit. Nick need not relay; review sheets remain available for art review. No PR/label/hosted/develop/main/release/deploy action follows from this packet.
