#!/bin/zsh
# Disk hygiene report for both lanes. READ-ONLY: it measures and lists, it never deletes.
# Run at the start and end of every batch:  zsh tools/disk-report.sh
# Policy (CLAUDE.md "Disk hygiene"): keep >= 60 GiB free at batch end so a 42 GiB inference start never stalls;
# each lane deletes only its OWN regenerable scratch; never an authentic master, unique generation output or pinned evidence.
set -u
P=~/Projects
free=$(df -g ~ | awk 'NR==2{print $4}')
echo "free: ${free} GiB (target >= 60 at batch end; inference needs 42, floor 30)"
[ "$free" -lt 60 ] && echo "WARN: below the 60 GiB batch-end target"
echo
echo "== shared git store"; du -sh "$(git -C $P/celestial-frontier-anthropic-mac rev-parse --git-common-dir)" 2>/dev/null
for lane in celestial-frontier-anthropic-mac celestial-frontier-openai-mac; do
  d=$P/$lane; [ -d "$d" ] || continue
  echo; echo "== $lane: largest untracked + ignored (top 12)"
  git -C "$d" status --short --ignored --untracked-files=normal 2>/dev/null | grep -E '^(\?\?|!!)' | cut -c4- |
    while read -r p; do du -sk "$d/$p" 2>/dev/null; done | sort -n | tail -12 |
    awk -v d="$d/" '{sub(d,"",$2); printf "%7.2f GiB  %s\n",$1/1048576,$2}'
done
echo; echo "== agent scratch and temp clones"
for s in /private/tmp/claude-*(N) ${TMPDIR:-/tmp}; do du -sh "$s" 2>/dev/null; done
find ${TMPDIR:-/tmp} -maxdepth 2 -name .git -type d 2>/dev/null | sed 's#/.git$##' | while read -r c; do echo "temp clone: $(du -sh "$c" | cut -f1)  $c"; done
echo; echo "== extra worktrees (remove merged agent worktrees with --force --force)"
git -C $P/celestial-frontier-anthropic-mac worktree list | grep -vE 'celestial-frontier-(anthropic|openai)-mac |Celestial-Frontier ' || echo "none"
