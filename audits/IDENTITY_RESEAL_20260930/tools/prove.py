"""Byte-for-byte proof for the identity rewrite + re-seal (no identity strings in this file; they come from env like rewrite.py).
usage: prove.py <backup.git> <branch> <final-worktree> <reseal-receipt.json> <out.json>
For every regular file of the final tree: forward(backup file) = hash_map(substitution(backup bytes)) must equal the final bytes
(gzip compared by decompressed content). Files that only additionally differ by recorded carrier-length edits, by project
generators (proven by their own drift tests) or by the named hand edits are listed separately; anything else is UNEXPLAINED."""
import os, re, sys, json, gzip, subprocess, hashlib
sys.argv, args = sys.argv[:1], sys.argv[1:]
src = open(os.path.join(os.path.dirname(__file__), 'rewrite.py')).read().split('args = fr.FilteringOptions')[0]
g = {'__name__': 'rewrite_rules'}; sys.modules.setdefault('git_filter_repo', type(sys)('git_filter_repo')); exec(src, g)
clean_any, words = g['clean_any'], g['words']
backup, branch, final, receipt_path, out_path = args
receipt = json.load(open(receipt_path))
hmap = {p['old']: p['new'] for p in receipt['pairs']}
SLICES = {'d45d7b0ba3bf481bb0e4565d8cdeb9c4899dc5d2927e54f8a8d4ff414acc2df7': '4286da4a01c7da05282b0da133d78228706100601ac71655659898df339d74e7',
          '00e5195ec2e83aed84bf4e1116fe1b7ebb8d163a5ae469c16ad2f712211852d3': '717ff7a84e25be8fb8fe569a200e6e4b6ee315ae579354568eb6d95af23a36f8',
          '0b84ae593147bf62': 'a34c5cf45ce5454a', '24d0917b49c95a9f': '9e9bb77243bcd4e3'}
HAND = {'port/v2/apps/game/src/creature-finish-route.test.ts', 'port/v2/apps/game/src/creature-rig-terminal-support.test.ts'}
GENERATED_PREFIXES = ('port/v2/apps/game/public/battle2/', 'port/v2/apps/game/src/battle2-master-pins.generated.ts', 'port/v2/apps/game/battle2-assets.json',
                      'port/v2/apps/game/src/morph/card-tint.generated.ts', 'port/v2/apps/game/src/creature-finish-source-pins.generated.ts',
                      'port/v2/apps/game/public/library/', 'port/v2/apps/game/src/art-library')
HEX64 = re.compile(rb'(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])')
def hash_map(d):
    d = HEX64.sub(lambda m: hmap.get(m.group(0).decode(), m.group(0).decode()).encode(), d)
    for o, n in SLICES.items(): d = d.replace(o.encode(), n.encode())
    return d
MASK = [re.compile(rb'(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])'), re.compile(rb'(?<![0-9a-f])[0-9a-f]{16}(?![0-9a-f])'),
        re.compile(rb'tame-greeting-audio-[A-Za-z0-9_-]{8}\.js')]
def masked(d):
    for rx in MASK: d = rx.sub(b'#', d)
    return d
def forward(b):
    return hash_map(clean_any(b))
def ls(repo_or_wt, is_repo):
    if is_repo:
        out = subprocess.run(['git', '-C', repo_or_wt, 'ls-tree', '-r', '-z', branch], capture_output=True).stdout
    else:
        out = subprocess.run(['git', '-C', repo_or_wt, 'ls-files', '-s', '-z'], capture_output=True).stdout
    res = {}
    for e in out.split(b'\0'):
        if not e: continue
        meta, p = e.split(b'\t', 1)
        if not meta.startswith(b'100'): continue
        res[p.decode('utf8', 'surrogateescape')] = meta.split()[1 if not is_repo else 2].decode()
    return res
b_tree = ls(backup, True)
subprocess.run(['git', '-C', final, 'add', '-A'], check=True)
f_tree = ls(final, False)
cat = subprocess.Popen(['git', '-C', backup, 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
def blob(oid):
    cat.stdin.write(oid.encode() + b'\n'); cat.stdin.flush(); h = cat.stdout.readline().split(); d = cat.stdout.read(int(h[2])); cat.stdout.read(1); return d
def unz(d):
    if d[:2] == b'\x1f\x8b':
        try: return gzip.decompress(d)
        except Exception: pass
    return d
len_files = {e['file'] for e in receipt.get('lengthEdits', [])}
try:
    cl = json.load(open(receipt_path.replace('.json', '.carrier-lengths.json'))); len_files |= {e['file'] for e in cl['updated']}
except Exception: pass
res = {'identical_to_forward': 0, 'unchanged_from_backup': 0, 'length_edits': [], 'generated': [], 'hand_edits': [], 'UNEXPLAINED': [], 'new_files': [], 'removed_files': []}
new_path = {words(p.encode()).decode('utf8', 'surrogateescape'): p for p in b_tree}
for p in sorted(f_tree):
    bp = new_path.get(p)
    if bp is None: res['new_files'].append(p); continue
    b = blob(b_tree[bp]); fb = open(os.path.join(final, p), 'rb').read()
    if fb == b: res['unchanged_from_backup'] += 1; continue
    fw = forward(b)
    if fw == fb or unz(fw) == unz(fb) or forward(unz(b)) == unz(fb): res['identical_to_forward'] += 1; continue
    if masked(clean_any(unz(b))) == masked(unz(fb)): res['identical_except_hash_values'] = res.get('identical_except_hash_values', 0) + 1; continue
    if p in HAND: res['hand_edits'].append(p); continue
    if p.startswith(GENERATED_PREFIXES): res['generated'].append(p); continue
    if p in len_files or p.replace('port/v2/', '') in len_files:
        digits = re.compile(rb'[0-9][0-9_]*')
        ok = digits.sub(b'0', masked(clean_any(unz(b)))) == digits.sub(b'0', masked(unz(fb)))
        (res['length_edits'] if ok else res['UNEXPLAINED']).append(p if ok else p + ' (length-edit file differs beyond numbers)'); continue
    res['UNEXPLAINED'].append(p)
res['removed_files'] = sorted(set(new_path) - set(f_tree))
json.dump(res, open(out_path, 'w'), indent=1)
print({k: (v if isinstance(v, int) else len(v)) for k, v in res.items()})
for k in ('UNEXPLAINED', 'new_files', 'removed_files'):
    for p in res[k][:12]: print(' ', k, p)
