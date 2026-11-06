"""Inventory coordinator-only copied scratch; preserve every non-cache byte first."""
from pathlib import Path
import hashlib, json, os, subprocess

R = Path.cwd()
B = R / 'audits/C475_DECISIONS_20261019/coordinator'
O = B / 'scratch-inventory-r01'
assert not O.exists()
O.mkdir()
roots = [B / 'node_modules', B / 'anchored-resolved-cpu-r01/node_modules']
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
durable = {}
for current, dirs, files in os.walk(B, followlinks=False):
    dirs[:] = [d for d in dirs if d not in ['node_modules', 'scratch-inventory-r01'] and not (Path(current) / d).is_symlink()]
    for name in files:
        p = Path(current) / name
        if not p.is_symlink():
            durable.setdefault(sha(p), str(p.relative_to(R)))
rows, links = [], []
for base in roots:
    assert base.is_dir() and not base.is_symlink()
    ignored = subprocess.run(['git', 'check-ignore', str(base.relative_to(R))], capture_output=True, text=True)
    assert ignored.returncode == 0
    for current, dirs, files in os.walk(base, followlinks=False):
        for name in list(dirs):
            p = Path(current) / name
            if p.is_symlink():
                links.append({'path': str(p.relative_to(R)), 'target': str(p.resolve()), 'preserved': True})
                dirs.remove(name)
        for name in files:
            p = Path(current) / name
            if p.is_symlink():
                links.append({'path': str(p.relative_to(R)), 'target': str(p.resolve()), 'preserved': True})
                continue
            rel = p.relative_to(base)
            cache = any(x in rel.parts for x in ['.vite', '.vite-temp'])
            digest, st = sha(p), p.stat()
            keeper = None
            # The full copied runtime keeps its project-relative layout.
            if rel.parts and rel.parts[0] == 'c475-anchored-composed-runtime':
                counterpart = R.joinpath(*rel.parts[1:])
                if counterpart.is_file() and sha(counterpart) == digest:
                    keeper = str(counterpart.relative_to(R))
            keeper = keeper or durable.get(digest)
            if not cache and not keeper:
                archive = O / 'bytes' / (digest + '.blob')
                archive.parent.mkdir(exist_ok=True)
                if not archive.exists():
                    archive.write_bytes(p.read_bytes())
                assert sha(archive) == digest
                keeper = str(archive.relative_to(R))
                durable[digest] = keeper
            rows.append({'path': str(p.relative_to(R)), 'sha256': digest, 'bytes': st.st_size,
                         'allocatedBytes': st.st_blocks * 512, 'cache': cache, 'retainedAt': keeper})
assert all(r['cache'] or r['retainedAt'] for r in rows)
for r in rows:
    if r['retainedAt']:
        assert sha(R / r['retainedAt']) == r['sha256']
out = {'status': 'INVENTORIED_EXACT_BYTES_RETAINED_NO_DELETION', 'roots': [str(p.relative_to(R)) for p in roots],
       'regularFiles': len(rows), 'logicalBytes': sum(r['bytes'] for r in rows),
       'allocatedBytes': sum(r['allocatedBytes'] for r in rows), 'symlinksNotFollowed': links,
       'files': rows, 'sourceImagesAndUniqueTestsPreserved': True, 'sharedDependenciesTouched': False}
(O / 'inventory.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps({k: out[k] for k in ['status', 'regularFiles', 'logicalBytes', 'allocatedBytes']}))
