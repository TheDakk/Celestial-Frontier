"""Apply only the reviewed one-ID tail repair, typed test and paired121 copy pin.

All exact/unique matches and new files are validated before replacing any source.
The old failed source/static evidence and gate/certificate seals are untouched.
"""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path.cwd()
assert subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip() == str(root)
assert subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip() == 'openai/mac'
assert subprocess.check_output(['git', 'log', '-1', '--format=%G?'], text=True).strip() == 'G'
b = Path('audits/O3_20261103')
proposal = b / 'w1-guardian-runtime-adoption-r01'
patches = [proposal / ('UNAPPLIED-' + n + '.patch') for n in ['runtime', 'reference-docs', 'guide-121']]
changes = {}
for patch in patches:
    lines = patch.read_text().splitlines(keepends=True)
    target = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('+++ b/'):
            target = Path(line[6:].strip())
        if not line.startswith('@@'):
            i += 1
            continue
        assert target is not None
        old, new = [], []
        i += 1
        while i < len(lines) and not lines[i].startswith(('@@', '--- a/')):
            row = lines[i]
            assert row[:1] in [' ', '-', '+'], row
            if row[0] in [' ', '-']:
                old.append(row[1:])
            if row[0] in [' ', '+']:
                new.append(row[1:])
            i += 1
        before = changes.get(target, target.read_text())
        needle, replacement = ''.join(old), ''.join(new)
        assert needle and before.count(needle) == 1, str(target)
        changes[target] = before.replace(needle, replacement, 1)
expected = {'port/v2/apps/game/src/motion/grounded-quadruped.ts', 'CREATURE_ANIMATION.md',
            'celestial-frontier-codebase-reference.md', 'port/v2/apps/game/src/release-content.ts',
            'port/v2/tools/slicesmoke.mjs'}
assert set(map(str, changes)) == expected
test = Path('port/v2/apps/game/src/motion/grounded-quadruped-tail.test.ts')
assert not test.exists()
old_test = (proposal / 'grounded-quadruped-tail.PROPOSED.test.ts').read_text()
corrected = (b / 'w1-guardian-runtime-adoption-r02/grounded-quadruped-tail.PROPOSED.test.ts').read_text()
needle = 'type SourceRecord=CreatureRigRecordV1&{'
assert old_test.count(needle) == 1
assert old_test.replace(needle, 'type SourceRecord=CreatureRigRecordV1&Parameters<typeof compileBodyCard>[0]&{') == corrected
header = '/** PROPOSED, not installed. Destination: beside grounded-quadruped.test.ts.'
assert corrected.count(header) == 1
changes[test] = corrected.replace(header, '/** Guardian tail excursion: real delivered outcomes and unchanged controls.', 1)
sha = lambda data: hashlib.sha256(data).hexdigest()
rows = [dict(path=str(p), beforeSha256=sha(p.read_bytes()) if p.exists() else None,
             afterSha256=sha(content.encode())) for p, content in changes.items()]
out = b / 'coordinator/guardian-tail-adoption.json'
assert not out.exists()
for p, content in changes.items():
    tmp = p.with_name(p.name + '.o3-write-copy')
    assert not tmp.exists()
    tmp.write_text(content)
    tmp.replace(p)
out.write_text(json.dumps(dict(status='APPLIED_REVIEWED_ORDINARY_RUNTIME_REPAIR',
    paths=rows, changesGateSeal=False, changesLimit=False, jointBudgetUnchanged=True,
    guideBulletCount=121, I5RecertificationRequired=True, testsRun=0,
    ordinaryFullStaticPending=True, nativePending=True), indent=2) + '\n')
print(json.dumps(dict(status='APPLIED_REVIEWED_ORDINARY_RUNTIME_REPAIR', paths=len(rows), testsRun=0)))
