# Optional worker module imports — independent static review

Reviewed on 2026-09-09 by the OpenAI/Codex reference-review subagent. Scope: the optional worker-creation/import policy in `pwa-build.ts` and its two new controls in `mobile-pack.test.mjs`. No product edits, tests, browser runs, model access, locks or hosted actions occurred in this review.

| Inspected source | Bytes | SHA-256 |
| --- | ---: | --- |
| `port/v2/apps/game/pwa-build.ts` | 35,012 | `f44f82cb0b5f029217e8f6d2bc4fb8f1850fb56a1bb71be7b5fdbdcb6232177c` |
| `tools/local-image-generation/mobile-pack.test.mjs` | 11,136 | `29eb5a5aaafc6ddd9cbb8c9725c673322b99c299556cd1616ebeb70c385d9b4b` |

**Static-review result: no material admission or regression flaw found.** The retained [native diagnostic](../worker-ownership-diagnostic-01/result.json) records worker creation with a nonempty resulting client ID, followed by module imports with `destination: worker`, `mode: cors`, the created worker's client ID and an explicitly empty resulting client ID. The fix distinguishes those observed cases.

The optional `worker: true` role is written only after the creating request passes retained parent ownership, current/prior build selection, complete cache marker, listed asset and cached response checks. An import with an empty resulting ID must prove this role and then pass the same retained build/cache/asset checks. Document pins are insufficient. Null or undefined resulting IDs follow creation handling and are refused as invalid identities. Existing pins retain their role during live-client preservation; ordinary generated worker code remains outside this optional template branch.

The two new controls exercise the actual request shape, offline cached module success and role persistence. They reject window/missing owners, false/string roles, stale or substituted pins, invalid resulting IDs and unlisted assets, and restore the original pin to demonstrate recovery. No additional required pure control was identified by this bounded review. The normal worker's byte-identity assertion is a separate existing control; this review did not execute it.

**Native proof was pending at review time.** A successful run against the unchanged assembled package must still show the actual worker imports and reaches its existing guard while offline. Static review and synthetic request controls do not prove that outcome, execute the image model, qualify a physical phone, or grant art/distribution acceptance. Earlier failed native evidence remains unchanged.
