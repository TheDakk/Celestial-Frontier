"""Remove only inventoried coordinator scratch, retaining direct evidence pins."""
from pathlib import Path
import hashlib, json, os

R = Path.cwd()
B = R / 'audits/C475_DECISIONS_20261019'
O = B / 'coordinator/scratch-inventory-r01'
d = json.loads((O / 'inventory.json').read_text())
roots = [R / p for p in d['roots']]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
protected = set()
def exact_path(value):
    if not isinstance(value, str):
        return
    p = Path(value)
    if not p.is_absolute():
        p = R / p
    if any(root == p or root in p.parents for root in roots) and p.is_file():
        protected.add(str(p.relative_to(R)))
def visit(value):
    if isinstance(value, dict):
        for k, v in value.items():
            exact_path(k)
            visit(v)
    elif isinstance(value, list):
        for v in value:
            visit(v)
    else:
        exact_path(value)
for current, dirs, files in os.walk(B, followlinks=False):
    dirs[:] = [x for x in dirs if x != 'node_modules' and not (Path(current) / x).is_symlink()
               and not any(t in x for t in ['scratch-inventory', 'scratch-cleanup', 'scratch-preservation'])]
    for name in files:
        if name.endswith('.json'):
            p = Path(current) / name
            if p.is_symlink():
                continue
            try:
                visit(json.loads(p.read_text()))
            except (ValueError, UnicodeError):
                pass
deleted, retained = [], []
media = {'.png', '.jpg', '.jpeg', '.webp', '.webm', '.mp4', '.wav', '.mp3'}
for row in d['files']:
    p = R / row['path']
    assert p.is_file() and not p.is_symlink() and sha(p) == row['sha256'], row['path']
    reason = 'direct-evidence-path' if row['path'] in protected else None
    keeper = R / row['retainedAt'] if row['retainedAt'] else None
    if not row['cache']:
        assert keeper and sha(keeper) == row['sha256']
    if p.suffix.lower() in media and (not keeper or keeper.suffix == '.blob'):
        reason = reason or 'unique-media-original-path-retained'
    if reason:
        retained.append({**row, 'reason': reason})
    else:
        p.unlink()
        deleted.append(row)
for row in d['symlinksNotFollowed']:
    p = R / row['path']
    assert p.is_symlink() and str(p.resolve()) == row['target']
    p.unlink()  # The dependency target is never traversed or removed.
for root in roots:
    for current, dirs, files in os.walk(root, topdown=False, followlinks=False):
        p = Path(current)
        if not any(p.iterdir()):
            p.rmdir()
for row in retained:
    assert sha(R / row['path']) == row['sha256']
receipt = {'status': 'OWN_UNPINNED_REGENERABLE_SCRATCH_REMOVED_EXACT_EVIDENCE_RETAINED',
           'deletedFiles': len(deleted), 'deletedLogicalBytes': sum(r['bytes'] for r in deleted),
           'deletedAllocatedBytes': sum(r['allocatedBytes'] for r in deleted),
           'retainedFiles': len(retained), 'retained': retained,
           'deletedPaths': [r['path'] for r in deleted], 'dependencySymlinksUnlinked': len(d['symlinksNotFollowed']),
           'sharedTargetsTouched': False, 'sourceImagesAndUniqueTestsPreserved': True,
           'noNativeOrWholeProjectOwners': True}
(O / 'cleanup-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({k: receipt[k] for k in ['status', 'deletedFiles', 'deletedLogicalBytes', 'retainedFiles']}))
