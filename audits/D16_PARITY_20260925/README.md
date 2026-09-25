# D16 parity ports — batch 2026-09-25 (Claude lane, worktree branch off `anthropic/mac` d1dbb979)

D16 (Nick's default): port every unported v1.8.9 action except death → wipe. This batch landed eight items, each its own
signed commit with a browser-free OUTCOME test (real controls pressed in JSDOM from the exact shipped Main sections, durable
read-back from a real memory backend, reboot where the state is durable, and mutation controls).

| # | Item (INVENTORY row) | Commit | Owner / files | Outcome test |
|---|---|---|---|---|
| 1 | Craft ×5 (#68) | `e1882e49` | `fabrication-batch.ts`, `engineering-panel.ts` (`repeat` on fabricate requests, `fabricationBatchOffered`) | `tests/d16-craft-batch-outcome.test.ts` |
| 2 | Pin recipe + tracking chip (#69) | `cd3ea646` | `recipe-pin.ts`, `recipePin` port on `EngineeringPanelController`, `#pinchip` | `tests/d16-recipe-pin-outcome.test.ts` |
| 3 | Salvage all + "don't ask again" (#75, #76) | `5e0e7343` | `inventory-panel.ts` (`salvageAllCandidatesV1`, armed two-tap, `disableSalvageConfirmation`) | `tests/d16-salvage-all-outcome.test.ts` |
| 4 | Prime slot travel + Titan tracking (#88, #89) | `e2a7a014` | `prime-travel.ts` (`nearestTitanWorldV1` = v1 scan), `prime-codex-panel.ts` buttons | `tests/d16-prime-travel-outcome.test.ts` |
| 5 | Reset expedition (#120) | `33432f17` | `expedition-reset.ts`; Settings armed two-step through the audited `importBlob` replacement | `tests/d16-reset-expedition-outcome.test.ts` |
| 6 | Pop-up notifications switch (#117) | `867bc314` | `showToast` gate + counterpart reveal; Settings `#setnotif` | `tests/d16-notification-popups-outcome.test.ts` |
| 7 | Tooltip system + switch (#117) | `ecdcec69` | `tooltips.ts` (`#tipbubble`); Settings `#settips` | `tests/d16-tooltips-outcome.test.ts` |

Shared harness: `port/v2/test-support/d16-engineering-harness.ts` (Shipyard sections over a real F4 runtime).

**Design calls (reversible, one line each).**
- ×5 is five ordinary receipts, not a new batch transaction: no new persistence shape; stops at the first refusal; a converging
  outcome keeps the pending latch.
- The pin is view state (`save.pinnedRecipe`, v1 `pin`) through `persistView`; the chip quotes the canonical recipe from any
  material source.
- Salvage-all junk = unequipped, unprotected, non-relic gear at rarity tier ≤ 1 (v1 `_junkItems`); one receipt per item.
- Reset never deletes rows: it is the same replacement a save import performs, with a fresh-explorer payload.
- **Pop-ups off is visual only:** the message still lands in the tray AND the toast's live region (screen readers keep it). A
  creature voice that binds the toast as its visible counterpart reveals that one toast, so the audio cue is never lost.
- Tooltips: desktop shows `[data-tip]` only (native titles stay the browser's); touch long-press also reads native `[title]`.

**Left for a later batch (not started, reasons):**
- **Card fold / "More" / vista reshow·fullscreen·zoom / postcard (#6, #8, #9, #10):** the v2 survey card renders every row
  flat; v1's default (`cardExpand` 0) is FOLDED, so porting changes the default card render and every instrument that measures
  it (uilayout, Slice/Glass). Needs the fold with a measured-scene decision (default open vs v1 folded) and the vista owner.
- **Guide browse tour (#126, v1 "Advanced Briefings"):** v1's five briefings describe v1 mechanics (hold tabs, exceptional forge,
  corona scoop…) that differ in v2; porting means rewriting copy against the Guide capability law, and the Guide/release
  inventories are pinned — best done with Codex's C17 re-measure.
- **Compendium filters / groups / origin travel / reveal queue (#36–#39):** touch Codex's I5-measured Compendium; keep the
  default render byte-identical. Not started.
- Friendly duels / CFB (#46–#48, #95–#99) belong to the §20 fork; mend-all (#50), descent Stay (#14), toast-tap (#107) and
  bell auto-read (#103, dropped by design) remain as listed in the INVENTORY.

**Release bullets (NOT added — Codex's 87-bullet release inventory SHA is sealed; for the C17 re-measure):**
- 🛠 CRAFT ×5 — parts and components forge up to five at a time from the Fabricator; each one is its own saved record.
- 📌 PIN A RECIPE — pin any unbuilt recipe; a chip tracks what's missing wherever you gather it and turns READY when you can forge it.
- ♺ SALVAGE ALL — break every unequipped, unprotected Common/Uncommon piece down in one (confirmed) press; the confirmation also offers "don't ask again".
- 🗺 PRIME CODEX TRAVEL — fly back to where you won a Signature, or track an in-reach Titan to the nearest world it waits on.
- ⚙ SETTINGS — Reset expedition (confirmed), Pop-up notifications (off keeps the tray and screen-reader announcements; creature sounds still show their card), Tooltips (press and hold on a phone).

**Notes for Codex.** No Compendium render changed. The survey card is untouched. `showToast` now reads `save.notifOn`
(`tests/ui-compact-toast.test.ts` fixture gained `save: { notifOn: true }`, default on; nothing weakened). New Settings rows
(`#setnotif`, `#settips`, `#setreset`, and the hidden `#setresetconfirm`) lengthen the Settings panel — the sealed root uilayout
count is v1-only, but any v2 Settings capacity/Glass measurement will see three more rows. `#setresetyes`, `#setnotif` and
`#settips` joined `READ_ONLY_MUTATION_SELECTOR`.

**Gate.** `node tools/check-profile.mjs --profile=develop` (port/v2): 5,286 pass, 2 expected-fail, 2 skipped, sole red I5
(`current-producer-authorities`, historical). `npx tsc -p apps/game/tsconfig.json --noEmit`: clean.
