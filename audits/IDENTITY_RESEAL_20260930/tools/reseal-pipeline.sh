#!/bin/bash
# Reproducible re-seal of the rewritten anthropic/mac tree (no identity strings in this file).
# Order matters: every hand edit happens BEFORE the hash fixed point, so the map covers final bytes;
# project generators run after it and are proven by their own drift tests.
set -euo pipefail
BK="${BACKUP_ROOT:?set BACKUP_ROOT to the folder holding the backup, rewrite and checkout}"
V=$BK/cf-verify-checkout
cd "$V"
git checkout -q -f reseal && git reset -q --hard && git clean -q -fd
echo "0. clean v4 tree: $(git log --oneline -1 | cut -c1-12)"
cd port/v2
echo "1. hand edit: two tests resolve record.source through the project's own repoRelativeSource (no home-folder dependency)"
python3 - <<'EOF'
def patch(p, a, b):
    s = open(p).read(); assert s.count(a) == 1, (p, a[:40])
    s = s.replace(a, b); lines = s.split('\n')
    i = max(k for k, l in enumerate(lines) if l.startswith('import '))
    lines.insert(i + 1, "import { repoRelativeSource } from '../../../tools/creature-animation/record-source.mjs';")
    open(p, 'w').write('\n'.join(lines))
patch('apps/game/src/creature-finish-route.test.ts',
      "const read = (p: string) => new Uint8Array(readFileSync(new URL(p, REP",
      "const read = (p: string) => new Uint8Array(readFileSync(new URL(repoRelativeSource(p), REP")
patch('apps/game/src/creature-rig-terminal-support.test.ts',
      "fs.readFileSync(path.resolve(root,record.source))",
      "fs.readFileSync(path.join(root,repoRelativeSource(record.source)))")
EOF
echo "2. hand edit: lifted-source slice seals (value = the test's own sha256 of the current slice)"
SLICE_MAP=(
  "d45d7b0ba3bf481bb0e4565d8cdeb9c4899dc5d2927e54f8a8d4ff414acc2df7:4286da4a01c7da05282b0da133d78228706100601ac71655659898df339d74e7:packages/art/src/biomevista.worker.verbatim.js"
  "00e5195ec2e83aed84bf4e1116fe1b7ebb8d163a5ae469c16ad2f712211852d3:717ff7a84e25be8fb8fe569a200e6e4b6ee315ae579354568eb6d95af23a36f8:packages/art/src/biomevista-full.worker.verbatim.js"
  "0b84ae593147bf62:a34c5cf45ce5454a:tests/combatcore-innate-adapter-lift.test.ts packages/domain/combatcore/src/combatcore.verbatim.js"
  "24d0917b49c95a9f:9e9bb77243bcd4e3:packages/art/src/hdportrait.worker.verbatim.js"
)
for e in "${SLICE_MAP[@]}"; do o=${e%%:*}; r=${e#*:}; n=${r%%:*}; fl=${r#*:}; for f in ${fl}; do c=$(grep -c "$o" "$f" || true); sed -i '' "s/$o/$n/g" "$f"; echo "   $f: $c x $o -> $n"; done; done
echo "3. hash fixed point (file sha256, gzip raw sha256, nested self-hashes, JSON carrier lengths)"
cd "$V"
node --max-old-space-size=8192 "$BK/reseal.mjs" "$BK/cf-identity-backup-20260929/TheDakk_Celestial-Frontier.git" anthropic/mac "$V" \
  "$BK/cf-identity-rewrite-v4/TheDakk_Celestial-Frontier.git" "$BK/reseal-receipt-anthropic-mac.json" 2>&1 | tail -2
cd port/v2
echo "4. project generators: shipped battle2 assets / gzip mirrors / pins / art library"
node tools/morph/build-shipped-battle2.mjs | tail -1
echo "5. card tint table (its own regeneration flag)"
CF_REGENERATE_CARD_TINT=1 npx vitest run apps/game/src/morph/card-tint.test.ts 2>&1 | grep -E "Tests " || true
echo "6. creature-finish source pins (its own generator)"
node --experimental-strip-types tools/morph/creature-finish-source-pins.mjs | tail -1
echo "7. gzip carrier byte-length literals in code (each checked against the backup file's size)"
node "$BK/carrier-lengths.mjs" "$V" "$BK/reseal-receipt-anthropic-mac.json" "$BK/cf-identity-backup-20260929/TheDakk_Celestial-Frontier.git" anthropic/mac | head -3
echo "worktree changes: $(git -C "$V" status --short | wc -l | tr -d ' ')"
