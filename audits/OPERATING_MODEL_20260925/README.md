# Operating model to finish the game (Claude, 2026-09-25)

Nick: *"It keeps asking me to unlock 1Password and stops there… I want to complete the whole game at this point. We spend a lot of
time just going back and forth."*

## What costs the time today (measured on 2026-09-24/25)

| Drag | Seen today | Fix | Who |
|---|---|---|---|
| 1Password locks → signing AND push stop in both lanes | 6 stops on Claude's side and 2 on Codex's in one day; each waits for Nick | §1 | Nick, once |
| Nick carries every message between the lanes | every handoff: a report, a paste, the other app | §2 mailboxes | both agents, now |
| An agent waits for the other agent's push, then for Nick | Codex waited for Claude's pin removal; Claude waited for Codex's signatures | §2: read signed commits from the shared object store | both agents, now |
| Gates that cannot pass by design | I5 is single-use, so every PR stops at it | §4 recalibration epoch (in progress) | Codex |
| Per-item decisions and art approvals | 4 battle2 decisions, the painting order, the guardian size… | §3 standing orders + decisions queue with defaults | Nick, once |

## 1. Signing and pushing without 1Password stops

Both worktrees share one git config: signing uses `~/.local/bin/git-ssh-sign`, and `~/.ssh/config` sends every SSH connection to the
1Password agent. When 1Password auto-locks, both lanes stop.

**Push: DONE 2026-09-25 (Nick: yes).** `origin` is HTTPS via the GitHub CLI (already logged in, token in the macOS keychain); both lanes. The command was:
```sh
cd /Users/nick/Projects/celestial-frontier-anthropic-mac && git remote set-url origin https://github.com/TheDakk/Celestial-Frontier.git && gh auth setup-git
```
Revert with `git remote set-url origin git@github.com:TheDakk/Celestial-Frontier.git`.

**Sign: DONE 2026-09-25: one dedicated agent signing key in the macOS keychain (Nick: yes; still SIGNED and Verified; 1Password keeps everything else).** Run once in Terminal: `bash audits/OPERATING_MODEL_20260925/setup-agent-signing.sh` (it adds a reboot-proof wrapper and proves a signed commit). The script is the canonical version. It creates the key (you set a passphrase) and stores the passphrase in the login keychain. It
installs `~/.local/bin/git-ssh-sign-cf`, which always signs through the macOS agent and reloads the key from the keychain after a
reboot. It adds the key to `~/.config/git/allowed_signers` for the committer email, sets THIS repo's `user.signingkey` and
`gpg.ssh.program`, registers the key on GitHub as a signing key (one browser prompt), and proves it with a signed throwaway commit.
The global 1Password setup is untouched. **Fallback with no new key:** in 1Password → Settings → Security, set Auto-lock to a long
interval and turn off "lock when the computer sleeps"; in Developer → SSH agent, approve "until 1Password quits". That fixes most stops.

## 2. Lanes talk directly (no relay through Nick)

- **Mailboxes.** Each lane writes only in its own worktree: `audits/MAILBOX/TO_CODEX.md` in `anthropic/mac`, `audits/MAILBOX/TO_CLAUDE.md` in
  `openai/mac`. Each agent READS the other lane's mailbox by absolute path (the worktrees are read-only to each other, and readable) at
  the start of every run and at every batch end. An entry: date, ask, evidence path, what "done" means. The receiver marks it done in
  its own reply file.
- **Signed commits without pushes.** Both worktrees share one object store: `git log HEAD..openai/mac` from Claude's lane (and
  `HEAD..anthropic/mac` from Codex's) shows the other lane's signed commits the moment they are committed. Merge them, `--no-ff` and
  hand-reconciled, per lane law. Neither agent waits for a push, and Nick does not relay.
- **Nick's role:** direction, art, decisions, and the hosted label. He no longer has to pass messages.

## 3. Standing orders (Nick grants once; agents stop asking)

- **Merge authority:** each agent merges the other lane's signed commits into its own branch whenever its local battery stays green
  (already practised; now standing).
- **Push authority:** each agent pushes its own branch after a green local battery (no Actions cost; workflows are label/dispatch only).
- **Painting standing order:** Codex paints continuously down one ranked list, and each painting joins cards, stand-ins and arena the
  day it lands (Claude). Recommended list, by reach: jelly, four-winged flier, sturgeon (generated creatures, ~18% together); then the Earth top 10
  (Wall Lizard, Cougar, Impala, Marmot, Bass, Cattle, Tang, Wolf, Gull, River Otter), then legless/biped/tripod alien bodies (13%), lobster,
  squid, flatfish, shark, mantis, the sessile forms. Nick reviews one sheet per ten paintings; he does not approve each one.
- **Decisions queue with defaults:** `audits/MAILBOX/DECISIONS.md` in Claude's lane. Every open question has a recommended default and a
  date. A default applies when the batch ends unless Nick overrides it, and everything stays reversible.
- **Hosted attempts (Nick's call):** allow an agent to cycle the PR label once per day when the whole local gate list is green,
  including `overridecontrol`.

## 4. The remaining work, by phase and lane (the port plan's Phases 4–9, mapped to today)

| Phase | State now | Lane | Next batch |
|---|---|---|---|
| 4 UI parity | playable slice; Glass/Slice instruments | Codex (instruments), Claude (UI) | close the U1–U4 parity program; ten-viewport gate |
| 5 creatures | painted library 17 + morphs + stand-ins on every card and battle; motion anatomy on 18 rigs | Codex paints and rigs; Claude cards, arena, stand-ins | the painting standing order; the Centipede skin's phone cost |
| 6 universe/biomes | painted vistas for some worlds | Codex (art), Claude (presentation) | the painted art direction for planets and biomes, same rule as creatures |
| 7 audio | placeholder voices for all 13 plans; Chronicle cues | Claude | recorded or authored masters to replace the placeholders; the music state machine |
| 8 gameplay parity | combat, Chronicle, painted battle stage behind `?battle2=1` | Claude | battle2 as the DEFAULT combat presentation (Nick's word), then outcome tests for every v1.8.9 action |
| 9 perf/release | phone-tier study; PWA arena lane; I5 epoch | both | iPhone device probe; Compendium v2 budget; release candidate |

**Critical path:** paintings (Phase 5/6 art) and the Nick-only decisions. Everything else runs in parallel in the two lanes without
waiting on each other.

## 5. What Claude does now, without waiting

1. Mailboxes created (`audits/MAILBOX/`), the operating rules added to `CLAUDE.md` and `AGENTS.md`.
2. The decisions queue opened with today's open items and their defaults.
3. Continue the Claude lane: the painted art direction for the remaining creature surfaces; battle2 readiness to become the default combat
   presentation (flag removal waits for Nick's word); Phase 8 outcome tests.
