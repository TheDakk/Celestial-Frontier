# Decisions queue (Nick) — every item has a recommended default that applies at the end of the batch unless Nick overrides it

Reply in one line per item ("D1 yes", "D2: other…"). Every default is reversible.

| # | opened | question | recommended default | applies |
|---|---|---|---|---|
| D1 | 2026-09-25 | Painting standing order: Codex paints down one ranked list without per-item approval; Nick reviews one sheet per ten | **DECIDED yes (Nick 2026-09-25)**. Order: jelly, four-winged flier, sturgeon, then Wall Lizard, Cougar, Impala, Marmot, Bass, Cattle, Tang, Wolf, Gull, River Otter | now |
| D2 | 2026-09-25 | Signing: a dedicated agent signing key in the macOS keychain (repo-level; still signed and Verified) | **DONE 2026-09-25**: key in the login keychain, repo signs through `git-ssh-sign-cf`, registered on GitHub as a signing key; a proof commit verified G with the new key | done |
| D3 | 2026-09-25 | Pushing over HTTPS with the already-logged-in GitHub CLI (no 1Password prompt on push) | **DONE 2026-09-25**: origin is HTTPS via gh; pushes no longer touch 1Password (both lanes) | done |
| D4 | 2026-09-25 | I5 recalibration epoch (v2 budget, v1 kept, growth guard) | yes | Codex is running it |
| D5 | 2026-09-25 | Hosted attempts: an agent may cycle the PR label once per day when the whole local gate list is green | **DECIDED yes (Nick 2026-09-25)**: at most one label cycle per day per PR, only with the whole local gate list green (incl. `overridecontrol`), reported in the mailbox | now |
| D6 | 2026-09-25 | battle2 (the painted stage + paced Chronicle) becomes the DEFAULT combat presentation, with the flag removed | **DECIDED not yet (Nick 2026-09-25)**: after the iPhone device probe and the Compendium v2 certificate, then yes | after C1 and a device probe |
