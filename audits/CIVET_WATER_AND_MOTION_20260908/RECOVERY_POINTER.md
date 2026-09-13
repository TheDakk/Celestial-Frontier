# Local staged recovery pointer — Civet water and motion

The completed batch remains in the Git index after the new 1Password signing failure. A separate
binary staging snapshot and adjacent verification receipt are local, ignored files:

- `port/v2/apps/game/smoke/civet-water-motion-staged-20260908.patch.gz`
- `port/v2/apps/game/smoke/civet-water-motion-staged-20260908.json`

The receipt records the exact base HEAD, staged file inventory, uncompressed/compressed bytes and
SHA-256, gzip readback and `git apply --reverse --check` outcome. The check does not apply the patch
or alter files. The snapshot includes this pointer and its packet manifest; the ignored archive
and receipt are not recursively included in themselves. Ambient `.DS_Store` is excluded.

Read the adjacent receipt before any recovery. Never apply the snapshot blindly over existing
work, use reset/clean, or copy files to Claude’s worktree. A later signed commit supersedes only
the need for this recovery, not the recorded signer failure or original verification evidence.
No hosted or cloud action was performed. This is a local recovery, not a remote backup.
