"""Freeze real current native/physical/C261 evidence; no new measurements or admission."""
from pathlib import Path
import hashlib
import json
import sys

slug, name, physical_file, plan_file, triage = sys.argv[1:]
base = Path('audits/O3_20261103/coordinator')
out = base / 'checkpoints' / slug
assert not out.exists()
physical = json.loads(Path(physical_file).read_text())
plan = json.loads(Path(plan_file).read_text())[0]
report = json.loads(Path(plan['nativeReport']).read_text())
assert physical['status'] == 'PHYSICAL_CLEAN'
assert len(physical['frames']) == 5
native_dir = Path(plan['nativeDir']).resolve(strict=True)
film_reference = physical['film']
if isinstance(film_reference, dict):
    media = Path(film_reference['path']).resolve(strict=True)
    assert media.parent == native_dir and media.name == 'battle-full.webm'
    assert hashlib.sha256(media.read_bytes()).hexdigest() == film_reference['sha256']
else:
    assert Path(film_reference).resolve(strict=True) == native_dir
assert physical['producerCommit'] == report['source'] == plan['sourceHead']
assert report['status'] == 'DIAGNOSTIC_PASS'
for frame in physical['frames']:
    assert frame['independentFullsizeViewed'] is True
    assert Path(frame['file']['path']).resolve(strict=True).parent == native_dir
    assert hashlib.sha256(Path(frame['file']['path']).read_bytes()).hexdigest() == frame['file']['sha256']
rows = json.loads((Path(triage) / 'current-rows.json').read_text())
current = [row for row in rows if row['film'] == plan['nativeDir']]
assert len(current) == 1
assert current[0]['fragmentTotal'] == 0
assert max(current[0]['pink'].values()) < 100
value = dict(schema='cf.o3-w2-checkpoint/v1', species=name, status='W2_CLEAN',
             film=plan['nativeDir'], producerCommit=report['source'],
             physicalReview=dict(path=physical_file,
                 sha256=hashlib.sha256(Path(physical_file).read_bytes()).hexdigest()),
             C261=current[0], decision=dict(C261FinishEligible=True, AIShouldProceed=True,
                 reason='Independent actual five full-size frames and retained supplemental visible joins CLEAN, root all-five full-size cross-review, unchanged C261 current film zero fragments/pink below100. FX-covered/off-frame material explicitly unassessed.'),
             classPropagationAllowed='This source-specific representative only; each other species needs its own observed source and chain.',
             allPairs='HOLD', admission=False)
out.mkdir(parents=True)
(out / 'W2.json').write_text(json.dumps(value, indent=2) + '\n')
print(out / 'W2.json')
