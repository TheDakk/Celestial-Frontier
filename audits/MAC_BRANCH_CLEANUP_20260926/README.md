# Mac cleanup verification — 2026-09-26

Only openai/mac remains as a local OpenAI branch. Remote heads are exactly openai/mac,
anthropic/mac, develop and main; remote tracking refs have no retired agent branches.
Branch configuration contains only those four active branches. No stashes. Worktrees are
the three permanent checkouts plus one active Claude limb-counter checkout; leave it alone.
`git fsck --connectivity-only --no-dangling` exits0, no findings. This is object connectivity,
not a full byte-hash scan. Verified recovery bundle retains original parked commits and was
pushed in signed f01f911e. No history rewrite, reflog expiry or aggressive garbage collection.

Pushed checkpoint validation:504 tool tests pass;5,562 unit tests pass, I5 alone red;
all7 manual gate owners pass,81 focused copy tests pass, root validate passes with50 baseline
fingerprints unchanged, native Guide briefings pass phone/desktop. Ongoing G2 edits are a
separate batch and are not claimed covered by that checkpoint.

Current instructions refreshed: Mac-only ownership, historical review-branch guidance marked
superseded, D21 development-default battle2 override made explicit, pushed roadmap status fixed.
Historical MD logs and recorded branch names remain intact; deleting them would erase context.
Pre-existing .DS_Store is not part of branch cleanup. No own temporary worktree remains.
Free space219GiB. Windows cleanliness is Nick's reported result, not rechecked from this Mac.

Original clone read-only check: develop0 ahead/472 behind origin/develop; modified
package-lock.json and untracked.claude/. No pull or cleanup there. C39 read and answered in
our own mailbox; new Claude documentation retirement commit will be retained on merge.
