"""C266 coordinator: one diagnostic; wrapper success cannot hide native FAIL."""
import hashlib, json, pathlib, runpy, sys

def passed(row):
    return row.get('exitCode') == 0 and row.get('status') == 'DIAGNOSTIC_PASS'

if sys.argv[1:] == ['--selftest']:
    cases = [({'exitCode': 0, 'status': 'DIAGNOSTIC_PASS'}, True),
             ({'exitCode': 1, 'status': 'DIAGNOSTIC_PASS'}, False),
             ({'exitCode': 0, 'status': 'FAIL'}, False),
             ({'exitCode': 0, 'status': 'RUNNING'}, False),
             ({'exitCode': 0}, False)]
    actual = json.loads(pathlib.Path('audits/C266_CODEX_20261017/coordinator/chiton-01/native-results.json').read_text())[0]
    cases.append((actual, False))
    assert all(passed(row) == expected for row, expected in cases)
    print(json.dumps({'status': 'PASS', 'controls': len(cases), 'actualHabitatFAILRejected': not passed(actual)}))
    sys.exit(0)

assert len(sys.argv) == 2
plan = pathlib.Path(sys.argv[1])
rows = json.loads(plan.read_text())
assert len(rows) == 1, 'C266 ACTIVE permits one serial heavy diagnostic per dispatch'
row = rows[0]
assert not pathlib.Path(row['nativeDir']).exists(), 'Retain prior output; no automatic retry'
fit = pathlib.Path(row['fit'])
record = json.loads((fit/'record.json').read_text())
manifest = json.loads((fit/'parts/manifest.json').read_text())
assert (fit/'parts/atlas'/(manifest['creatureId']+'.png')).is_file()
script = json.loads(pathlib.Path(row['script']).read_text())
if record.get('habitat', {}).get('realm') == 'aquatic':
    assert script.get('world', {}).get('surfaceWater') is True, 'Aquatic diagnostic needs its explicit water world'
master = pathlib.Path(record['source'])
assert hashlib.sha256(master.read_bytes()).hexdigest() == row['masterSha256']
runpy.run_path('audits/C243_ALLOUT_20261011/execution/run-native.py', run_name='__main__')
results = json.loads((plan.parent/'native-results.json').read_text())
assessment = {'status': 'PASS' if len(results) == 1 and all(passed(r) for r in results) else 'FAIL',
              'nativeResults': [{'status': r.get('status'), 'exitCode': r.get('exitCode')} for r in results]}
(plan.parent/'native-assessment.json').write_text(json.dumps(assessment, indent=2)+'\n')
print(json.dumps(assessment))
sys.exit(0 if assessment['status'] == 'PASS' else 1)
