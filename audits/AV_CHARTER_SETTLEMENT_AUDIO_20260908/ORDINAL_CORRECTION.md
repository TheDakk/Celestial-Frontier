# Native Charter audio ordinal correction — 2026-09-08

The first native chain remains **FAIL**, with its original runner and complete evidence retained
in [native-first](native-first/review.json). The failure was the runner's assertion that the new
receipt ordinal equalled the runtime's ordinal observed after commitment: `0 !== 1` at original
runner line 90. No product code, audio asset, threshold or prior result was changed.

The source owners distinguish a consumed receipt ordinal from the next available cursor:

- `port/v2/apps/game/src/starter-charters.ts:763` calls the existing `authority.commitAction`
  owner for acceptance.
- `port/v2/packages/persistence/src/outcome-transaction.ts:1239`,
  `planF4DeterministicProductReceipt`, takes the current persisted SessionRNG ordinal as
  `receiptOrdinal` at line 1250, then constructs `nextSessionRng.ordinal = receiptOrdinal + 1`
  at line 1263. This action consumes no random draw.
- `port/v2/apps/game/src/f4-runtime-authority.ts:797` exposes the current committed
  `sessionRng.ordinal` as `diagnostics().sessionOrdinal`; after acceptance it is the next cursor.

The first recording agrees with those owners:

| Observation | Value |
| --- | --- |
| Before / held-pending revision | 3 / 3 |
| Before / held-pending session ordinal | 0 / 0 |
| New stored acceptance receipt ordinal | 0 |
| Source-start / after revision | 4 / 4 |
| Source-start / after session ordinal | 1 / 1 |
| Newly accepted ID in V5 player and compatibility mirror | `st-land` |
| Actual PCM source | 33,600 frames / 48 kHz, mono, 0.7 seconds, shared context 1 |
| Source-start publication | `starter-charter-accept-committed:4`, no pending write, panel not busy |
| Source end / owner stop | Both observed; approximately 700.2 ms after start |

The corrected runner requires the receipt ordinal to equal the pre-action cursor, the held
cursor to remain unchanged, and both source-start and post-action cursors to equal consumed+1.
It also carries negative controls that reject using the next cursor as the receipt and reject
an unadvanced next cursor. Both source owners are now included in the immutable source hashes.

The first run passed the earlier native refusal/pending silence, shared-context, finite-source
and publication checks before the faulty equality stopped it. Later assertions and the final
success screenshot were not reached. At correction time the successor runner had **not** been
executed; its result must be recorded separately, without relabeling the original red.
