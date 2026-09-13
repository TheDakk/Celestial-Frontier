# Current integration status — signed repair and complete local admission

The signed repair checkpoint is `e4e8c331e77a53c3b71476d918811e1af7c458ee`, parent
`a84f4ea959ae51c6423ed6c88e5274bfa88d8786`. Nick explicitly requested another configured-signer
attempt after reporting 1Password was unlocked. It succeeded; command-scoped signature verification
passed. No signing configuration, security setting or private key changed. The earlier helper
failure does not prove the vault was locked, and its cause remains unresolved. Its original receipt
and every earlier red remain unchanged.

The clean tracked-only develop profile then passed on **e4e8c331**: 349 files, 4,121 tests passed,
1 skipped; all three TypeScript programs, art audit (36 sources/0 findings), override coverage
(1,014 routes/1,010 Earth species), and spec checks (454 fields/5 controls) passed. The run used one
isolated tracked snapshot with its own locked npm install under the shared foreground lock.
Start: 2026-09-09T04:11:07.848857Z. End: 2026-09-09T04:12:04.700613Z. Exit 0; HEAD and tracked
cleanliness unchanged. Raw log: 8,298 bytes, SHA256
`6c7278660a0769ec410339e48f6221ab03636d871b0ec30703e2729edbbd3c58`.
The exact start/result/raw log and separately transcribed signer result are in
[admission-e4e8c331](admission-e4e8c331/result.json). This is browser-free local admission;
it is not a hosted battery, new native visual review, full browser chain or human acceptance.

The original README, PR_DESCRIPTION and precommit inventory describe the earlier repair stage.
They remain immutable historical evidence; this status and ROADMAP supersede their pending-signer/
pending-local-admission wording. Cumulative e4e8c331 scope: 110 ancestry commits beyond fetched
`develop` `c1791e210158de864fdd475323c3091d9ecbae58`, 3,722 files, +1,139,717/−1,286 text lines.
Most added text is retained audit evidence. E4 is 47 ahead/0 behind fetched agent upstream
`0a6ee0fdb6656361106ab6540169225669c64e0e`. No incoming develop merge is needed at that fetch.

The following documentation/evidence checkpoint contains this record and the refreshed handoff;
resolve its exact hash through Git. Before publication it must pass its own single final clean
tracked-input develop rehearsal. Record that descendant's exact result, head/base and raw-log hash
in the PR body and ignored local receipt, without another commit just to self-embed its SHA.
No runtime, tool, test, package or workflow bytes change in this checkpoint.

Publication route: normal openai/mac push and an unlabeled **draft** PR to develop, title
“Refine responsive UI and add bounded audiovisual and painted-world prototypes”. The PR body
must cover the accumulated candidate and replace the historical pending-admission wording.
Unchanged workflow triggers mean those two operations start no Actions. Current mode UNFROZEN,
visibility freshly confirmed PUBLIC, private fallback cap 3,000. No owner-label run is authorized;
Nick alone applies actions-budget-approved for one exact head/base agent-lane attempt, maximum
122 runner-minutes (2+120), no retry. The required battery and normal merge remain ahead.

Claude/macOS anthropic/mac does not have this batch yet. Nick does not need to open Claude now.
After an authorized exact green develop merge, Claude fetches and merges origin/develop into its
clean owned branch at the next batch, preserving local work and the September 10 review evidence.
No main merge, release, deployment, version bump, timer, model download or broader art loop.
The on-demand generation/cache requirements and all older native/instrument/physical/human
blockers in ROADMAP remain binding. Current static art does not implement a local image model.

The first documentation-successor signature attempt also returned the same helper buffer error
(exec35321/exit128); `signing-doc-first-failure.json` preserves the transcribed result. E4 remains
successfully signed. A separate read-only query proved the existing effective 1Password SSH agent
is reachable and offers the configured signing public key (`signing-doc-agent-check.json`);
this does not establish authorization for a signature or identify the helper error's cause.
One command-scoped alternate route uses `/usr/bin/ssh-keygen` with that same 1Password agent,
following [1Password's documented workaround](https://www.1password.community/developers-69/git-commit-signing-fails-with-error-failed-to-fill-whole-buffer-20072).
It retains the configured key and signed-commit requirement; no persistent Git/security setting,
key export, agent replacement or unsigned fallback is authorized. Verify the successor's actual
signature through Git and retain its command result separately; do not infer success from this
planned alternate route. Vault unlock and key-use authorization are distinct in
[1Password's authorization model](https://www.1password.dev/ssh/agent/security).
