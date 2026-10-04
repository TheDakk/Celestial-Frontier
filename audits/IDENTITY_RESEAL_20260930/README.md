# Owner-identity rewrite and mechanical re-seal — 2026-09-30

The project owner's personal name, e-mail address and home-folder paths were removed from every public version of this
repository and its two GitHub Pages repositories. The public identity is the handle **TheDakk**
(`79046704+TheDakk@users.noreply.github.com`); the name word became **Dakk**. History was rewritten with `git-filter-repo`
(owner-approved force push). No identifying string appears in this folder: every tool takes them from environment variables.

## What the rewrite changed
- Author, committer and tagger identities (866 commits here, 87 in the live-site repo, 7 annotated tags) → TheDakk.
- The name as a capitalised or all-caps word in commit messages, file text, file and folder names (55 paths renamed, with
  every reference updated), inside gzip/zip carriers, and in readable text inside binaries (same-length swap only).
- Lowercase forms only where they identify the owner: home paths (`/Users/…`, `file:///Users/…`, `C:\Users\…`,
  `-Users-…-`), the JSON `"owner"` field and the named file prefixes. Ordinary words and game art are untouched
  ("three nick marks", "nick-cut toes", "a nick out of it", "white nick for an eye", nickname, nicked, nickel), as is the
  required CC BY credit for recordist Nicholas Moray Williams.
- Compressed media (PNG, JPEG, WebM, …) is never modified; four-letter byte matches there are chance, not identity.

## Why a re-seal was needed (owner decision: Option 1, mechanical re-bind)
Many files are pinned by hash. Changing the text inside them changed their bytes, so every pin over those bytes was
re-bound mechanically. **No measured number changed**: the calibration and certification reports differ from their
backups only in hash values and the content-hashed owner bundle name.

| Step | Tool | Receipt |
|---|---|---|
| File sha256, gzip raw sha256, nested self-hashes (record `recipeHash`, binding `bindingHash`, declaration hash, `sha256(JSON.stringify(field))`), JSON carrier lengths — to a fixed point | `tools/reseal.mjs` | `reseal-receipt-anthropic-mac.json` (14,623 old → new pairs) |
| Lifted v1 source-slice seals (biome vista ×2, hd portrait, CombatCore) | hand edit, value = each test's own sha256 of the current slice | listed in `tools/reseal-pipeline.sh` |
| Two tests read `record.source` through the project's `repoRelativeSource` instead of a machine-specific home path | hand edit | `tools/reseal-pipeline.sh` |
| Shipped battle2 assets, gzip mirrors, pins, art library, card tint table, finish source pins | the project's own generators | their drift tests |
| Gzip carrier byte-length literals in code (each checked against the backup file's size) | `tools/carrier-lengths.mjs` | `reseal-receipt-anthropic-mac.carrier-lengths.json` |
| Active Compendium certificate: producer authority of the current build, each retained report's observed producer, sample `inputDigest`, selector pins | targeted re-bind, `tools/fixpoint.mjs`, `tools/repin.mjs` | `reseal-followup-*.json`, `reseal-repin.json` |

## Proof (`proof-anthropic-mac.json`, `tools/prove.py`)
Every regular file of the re-sealed `anthropic/mac` tree, compared with its backup version:

| Bucket | Files |
|---|---|
| Unchanged | 51,361 |
| Equal to substitution + hash map, byte for byte (gzip by content) | 15,848 |
| Equal to substitution with hash values masked (values verified by the gate) | 66 |
| Equal with hashes and digits masked (carrier byte lengths) | 37 |
| Project generator outputs (their drift tests pass) | 5 |
| Named hand edits | 2 |
| **Unexplained / added / removed** | **0 / 0 / 0** |

`tools/verify_forms.py` scans everything reachable from all branches and tags (identities, tags, messages, paths, every
blob including gzip/zip contents and readable binary text): **zero** for every form in all three repositories, with the
leave-alone phrases present at exactly their backup counts.

## Gates on the re-sealed heads
- `anthropic/mac`: develop profile PASS (5,726 tests, 560 tool tests), typecheck, `--noUnusedLocals`, artaudit,
  overridecheck, speccheck, overridecontrol, Actions budget policy selftest and the legacy gates all green.
- `openai/mac`: develop profile PASS (5,725 tests) and the same static checks green.

## Not rewritable by a push
GitHub keeps `refs/pull/1…43/head` (and `43/merge`) read-only; they still reach the old commits until GitHub Support purges
them. Their old commit ids are in `pr-refs-old-shas.txt` for that request.

## Also preserved
The two Windows-built TypeSafe commits (2026-09-19) were rebuilt with the same rules on the rewritten base and merged as
history; their unique handoff note is archived in `ROADMAP_ARCHIVE.md`.
