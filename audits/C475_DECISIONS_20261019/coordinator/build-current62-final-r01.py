"""Current scoped62 and original170 dispositions, using actual finished packets only."""
from pathlib import Path
import collections, hashlib, json, struct, subprocess, sys

R = Path.cwd()
B = Path('audits/C475_DECISIONS_20261019')
table33, destination = map(Path, sys.argv[1:])
assert not destination.exists()
destination.mkdir(parents=True)
def pin(p):
    p = Path(p)
    b = p.read_bytes()
    return {'path': str(p), 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b)}
def canonical_sha(v):
    return hashlib.sha256(json.dumps(v, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
keyer = B / 'delivery/wave15-cpu-candidates-and-material-holds/d40-current28.json'
prior = B / 'delivery/wave13-three-more-ready/progress170.json'
ready = {}
for p in sorted((B / 'ready').glob('*/packet.json')):
    a = json.loads(p.read_text())
    v = json.loads((p.parent / 'verification.json').read_text())
    assert a['status'] == 'READY_FOR_CLAUDE' and v['status'] == 'PASS' and a['newAdmissions'] == 0
    assert len(a['canonicalFive']) == 5
    for still in a['canonicalFive']:
        assert pin(still['file']['path']) == still['file']
        data = Path(still['file']['path']).read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', data[16:24]) == (1024, 576)
    ready[a['name']] = {'name': a['name'], 'status': 'READY_FOR_CLAUDE', 'category': 'C475_ACTUAL_FINISHED_PACKET',
                        'newAdmission': False, 'defect': None, 'packet': pin(p),
                        'verification': pin(p.parent / 'verification.json'), 'producer': a['producer'],
                        'allFiveActual': a['canonicalFive'], 'I5RecertificationRequired': True}
assert len(ready) == 10
rows = {}
for src in [keyer, table33]:
    data = json.loads(src.read_text())
    for row in data['rows']:
        name = row.get('name', row.get('species'))
        assert name and name not in rows
        if name in ready:
            current = dict(ready[name])
        else:
            defect = row.get('defect', row.get('observation'))
            if isinstance(defect, dict):
                defect = defect.get('observed') or json.dumps(defect, sort_keys=True)
            assert defect, name
            current = {'name': name, 'status': 'HOLD', 'category': 'C475_CURRENT_EVIDENCED_HOLD',
                       'newAdmission': False, 'defect': str(defect), 'stageDisposition': row['status'],
                       'evidenceTable': pin(src), 'evidenceRowSha256': canonical_sha(row),
                       'currentEvidenceRow': row, 'I5RecertificationRequired': True}
        rows[name] = current
assert 'Cobra' not in rows
rows['Cobra'] = ready['Cobra']
assert len(rows) == 62 and collections.Counter(r['status'] for r in rows.values()) == {'READY_FOR_CLAUDE': 10, 'HOLD': 52}
out = {'schema': 'cf.c475-current62/v1', 'status': 'CURRENT_EVIDENCE_NATIVE_CONTINUATION_APPROVAL_BLOCKED',
       'scope': 'D39 Cobra + D40 named28 + D41/D42 named33; no certification activated.',
       'counts': {'scopedSpecies': 62, 'READY_FOR_CLAUDE': 10, 'HOLD': 52, 'newAdmissions': 0},
       'allPairs': 'HOLD', 'sources': [pin(keyer), pin(table33)], 'rows': sorted(rows.values(), key=lambda r: r['name']),
       'executionIncomplete': True, 'blockingEvidence': pin(B / 'coordinator/soft-materials-other-owners-auto-review-rejection-r02.json')}
(destination / 'current62.json').write_text(json.dumps(out, indent=2) + '\n')
original = json.loads(prior.read_text())
all170 = {r['name']: r for r in original['rows']}
assert len(all170) == 170 and set(rows) <= set(all170)
for name, row in rows.items():
    if row['status'] == 'READY_FOR_CLAUDE':
        assert all170[name]['status'] == 'READY_FOR_CLAUDE' and all170[name]['packet'] == row['packet']
    else:
        assert all170[name]['status'] == 'HOLD'
        row = {**row, 'previousDisposition': all170[name]}
    all170[name] = row
counts = collections.Counter(r['status'] for r in all170.values())
assert counts['READY_FOR_CLAUDE'] == 10 and counts['HOLD'] == 143 and sum(counts.values()) == 170
original.update(status='ALL170_DISPOSITIONS_CURRENT_SCOPED62_NATIVE_CONTINUATION_APPROVAL_BLOCKED',
                rows=list(all170.values()), counts={'original170': 170, 'priorClaudeAccept': 17, 'READY': 10, 'HOLD': 143},
                current62=pin(destination / 'current62.json'), executionIncomplete=True,
                closure='Every row has READY or evidenced disposition; approval-blocked native work remains. No new admission or certification.')
(destination / 'progress170.json').write_text(json.dumps(original, indent=2) + '\n')
lines = ['# C475 current62 dispositions', '', 'Ten actual finished packets;52 scoped holds. Native continuation is approval-blocked; no new admission.', '',
         '| Species | Disposition | Exact defect or packet |', '| --- | --- | --- |']
for row in out['rows']:
    if row['status'] == 'READY_FOR_CLAUDE':
        detail = f"[all five finished stills]({R / row['packet']['path']})"
    else:
        detail = row['defect'].replace('|', '/').replace('\n', ' ')
    lines.append(f"| {row['name']} | {row['status']} | {detail} |")
(destination / 'current62.md').write_text('\n'.join(lines) + '\n')
print(json.dumps({'scoped62': out['counts'], 'original170': original['counts'], 'actualFinishedStills': 50}))
