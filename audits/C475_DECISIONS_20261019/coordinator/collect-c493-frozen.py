"""Collect only specified completed freezes and durable recovery sources."""
from pathlib import Path
import hashlib, json, subprocess, sys

R = Path.cwd()
B = Path('audits/C475_DECISIONS_20261019')
C = B / 'coordinator'
selections = json.loads(Path(sys.argv[1]).read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
paths, excluded, historical = set(), set(), []
verified = 0
def walk(v):
    if isinstance(v, dict):
        if isinstance(v.get('path'), str) and isinstance(v.get('sha256'), str):
            yield v
        for child in v.values():
            yield from walk(child)
    elif isinstance(v, list):
        for child in v:
            yield from walk(child)
for name in selections['freezes']:
    f = Path(name)
    assert f.is_file(), name
    paths.add(str(f))
    for row in walk(json.loads(f.read_text())):
        p = Path(row.get('copy', row['path']))
        if p.is_absolute():
            p = p.relative_to(R)
        assert p.is_file(), str(p)
        if sha(p) != row['sha256']:
            assert str(p).startswith(('port/v2/', 'tools/')), str(p)
            match = None
            for commit in ['acff88a884f1f9da6f018ef77b7af4432e079a6f', '633cd4627f52b89efaea1267d364ea33032ade47', '48b3018fc510c331551f63c8a49640960c6e73f9']:
                q = subprocess.run(['git', 'show', commit + ':' + str(p)], capture_output=True)
                if q.returncode == 0 and hashlib.sha256(q.stdout).hexdigest() == row['sha256']:
                    match = commit
                    break
            assert match, str(p)
            historical.append({'path': str(p), 'producer': match, 'sha256': row['sha256']})
        elif str(p).startswith(str(B) + '/'):
            if 'node_modules' in p.parts or p.is_symlink():
                excluded.add(str(p))
            else:
                paths.add(str(p))
        verified += 1
for extra in selections.get('durableDirectories', []):
    p = Path(extra)
    assert p.is_dir(), extra
    for f in p.rglob('*'):
        if f.is_file() and not f.is_symlink() and 'node_modules' not in f.parts:
            paths.add(str(f))
for extra in selections.get('extraFiles', []):
    p = Path(extra)
    assert p.is_file() and not p.is_symlink() and 'node_modules' not in p.parts
    paths.add(str(p))
(C / 'c493-frozen-selection.json').write_text(json.dumps({
    'status': 'PASS_COMPLETED_IMMUTABLE_CPU_EVIDENCE_AND_DURABLE_RECOVERY_ONLY',
    'verifiedPins': verified, 'freezes': selections['freezes'], 'historicalCodePins': historical,
    'excludedIgnoredDependencyPathsRetainedOnDisk': sorted(excluded),
    'noForceAdd': True, 'productionEdits': False, 'postRedOwnersExecuted': False,
    'nativeOrAI': False}, indent=2) + '\n')
subprocess.run(['python3', str(C / 'collect-producer-wave.py'), str(C / 'c493-paths.txt'),
                *sorted(paths), str(B / 'delivery/wave16-final-cpu-dispositions')], check=True)
