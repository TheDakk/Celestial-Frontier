#!/bin/bash
# One-time setup (Nick, in Terminal): a dedicated SSH SIGNING key for the Celestial Frontier agents, its passphrase kept in the
# macOS login keychain, so Claude and Codex sign without waiting on 1Password. Repo-level only — 1Password keeps signing everything
# else. Commits stay signed and show Verified on GitHub. Safe to re-run. Undo: see the bottom.
set -euo pipefail
REPO=/Users/nick/Projects/celestial-frontier-anthropic-mac          # both worktrees share this repo's config
KEY="$HOME/.ssh/cf_agents_signing"
EMAIL="$(git -C "$REPO" config user.email)"                          # 79046704+TheDakk@users.noreply.github.com

# 1. the key (you choose a passphrase; it goes into the login keychain in step 2)
[ -f "$KEY" ] || ssh-keygen -t ed25519 -C "celestial-frontier agents (signing)" -f "$KEY"
# 2. load it into the macOS agent, passphrase stored in the keychain (no prompt ever again on this Mac)
SSH_AUTH_SOCK="$(launchctl getenv SSH_AUTH_SOCK)" ssh-add --apple-use-keychain "$KEY"
# 3. a signing wrapper that always uses the macOS agent (not 1Password) and reloads the key from the keychain after a reboot
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/git-ssh-sign-cf" <<'WRAP'
#!/bin/sh
export SSH_AUTH_SOCK="$(launchctl getenv SSH_AUTH_SOCK)"
KEY="$HOME/.ssh/cf_agents_signing"
FP="$(/usr/bin/ssh-keygen -lf "$KEY.pub" | awk '{print $2}')"
/usr/bin/ssh-add -l 2>/dev/null | grep -q "$FP" || /usr/bin/ssh-add --apple-use-keychain -q "$KEY" </dev/null >/dev/null 2>&1
exec /usr/bin/ssh-keygen "$@"
WRAP
chmod +x "$HOME/.local/bin/git-ssh-sign-cf"
# 4. local verification (%G? = G): allow the new key for the committer email
grep -qF "$(cut -d' ' -f2 "$KEY.pub")" "$HOME/.config/git/allowed_signers" || printf '%s namespaces="git" %s\n' "$EMAIL" "$(cut -d' ' -f1,2 "$KEY.pub")" >> "$HOME/.config/git/allowed_signers"
# 5. THIS repo (both lanes) signs with the new key through the wrapper; the global 1Password setup is untouched
git -C "$REPO" config user.signingkey "$KEY.pub"
git -C "$REPO" config gpg.ssh.program "$HOME/.local/bin/git-ssh-sign-cf"
# 6. GitHub shows the commits as Verified: register the key as a SIGNING key (opens a browser once for the extra scope)
gh auth refresh -h github.com -s admin:ssh_signing_key
gh ssh-key add "$KEY.pub" --type signing --title "Celestial Frontier agents (signing)" || true
# 7. prove it: a signed empty commit on a throwaway ref, verified, then discarded
T="$(git -C "$REPO" commit-tree -S -m 'signing check' "$(git -C "$REPO" rev-parse 'HEAD^{tree}')")"
git -C "$REPO" log -1 --format='signing check: %G? (%GS)' "$T"
echo "Done. Claude and Codex now sign in this repo without 1Password."
# Undo (repo only): git -C "$REPO" config --unset user.signingkey; git -C "$REPO" config --unset gpg.ssh.program
