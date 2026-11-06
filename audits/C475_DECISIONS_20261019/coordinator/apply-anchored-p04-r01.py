"""Apply only the independently reviewed14-file candidate after observed baseline RED."""
from pathlib import Path
import hashlib, json, subprocess

B = Path('audits/C475_DECISIONS_20261019')
C = B / 'coordinator'
manifest = B / 'w1-keyer/radial-materials-r01/proposal-manifest-r04.json'
review = B / 'w4-review/resume-checkpoint-r01/p04-review/review.json'
proposal = json.loads(manifest.read_text())
assert len(proposal['rows']) == 14
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert 'unsupported-template' in (C / 'anchored-p04-game-tests-first-red.log').read_text()
assert 'ERR_MODULE_NOT_FOUND' in (C / 'anchored-p04-source-tests-first-red.log').read_text()
assert review.is_file()
# All preimages and all proposed copies qualify before a single source write.
for row in proposal['rows']:
    dst, src = Path(row['path']), Path(row['copy'])
    assert not dst.is_symlink() and src.is_file()
    assert sha(src) == row['sha256']
    assert (sha(dst) if dst.exists() else None) == row['beforeSha256'], str(dst)
    assert not dst.with_suffix(dst.suffix + '.c475tmp').exists()
rows = []
for row in proposal['rows']:
    dst, src = Path(row['path']), Path(row['copy'])
    temporary = dst.with_suffix(dst.suffix + '.c475tmp')
    temporary.write_bytes(src.read_bytes())
    assert sha(temporary) == row['sha256']
    temporary.replace(dst)
    assert sha(dst) == row['sha256']
    rows.append({**row, 'actualAfterSha256': sha(dst)})
out = {'status': 'APPLIED_EXACT_REVIEWED14_AFTER_BASELINE_RED_NEW_CHECKS_REQUIRED',
       'baseHead': subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip(),
       'proposal': str(manifest), 'proposalSha256': sha(manifest),
       'independentReview': str(review), 'reviewSha256': sha(review), 'rows': rows,
       'nativeStartedForNewProducer': False, 'sealsOrLimitsRebound': False,
       'ColdAndDeepSourceOwnerHoldsUnchanged': True}
(C / 'anchored-p04-applied-r01.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps({'appliedPaths': len(rows), 'sourceMastersChanged': False, 'native': False}))
