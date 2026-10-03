"""Verify frozen C196 deliveries independently; never modify delivered files."""
from pathlib import Path
import hashlib,json,os,sys
root=Path.cwd()
names=['C196_CREATURE_SUPPLY_20261003','C196_SPECIALIZED_REFERENCES_20261003','C196_TURTLES_HOLDS_20261003']
rows=[]
for name in names:
    directory=Path('audits')/name
    manifest=directory/'delivery.json'
    if not manifest.exists():
        raise SystemExit('Delivery not frozen: '+name)
    obj=json.loads(manifest.read_text());entries=obj['files'];seen=set();total=0
    for entry in entries:
        rel=entry['path'];p=Path(rel)
        assert not p.is_absolute(), 'absolute manifest path'
        assert p.resolve().is_relative_to(root), 'manifest escapes repository'
        assert not p.is_symlink(), 'delivery contains symlink'
        assert rel not in seen, 'duplicate file entry'
        seen.add(rel);data=p.read_bytes();total+=len(data)
        assert hashlib.sha256(data).hexdigest()==entry['sha256'], 'hash mismatch: '+rel
        if 'bytes' in entry: assert len(data)==entry['bytes'], 'byte count mismatch: '+rel
    actual={str(p) for p in directory.rglob('*') if p.is_file() and p!=manifest}
    assert actual==seen, 'delivery inventory differs: '+name
    rows.append({'directory':str(directory),'manifestSha256':hashlib.sha256(manifest.read_bytes()).hexdigest(),'verifiedFiles':len(entries),'verifiedBytes':total,'status':'PASS'})
for row in json.loads(Path('audits/C196_PROGRAM_20261003/parent-visual-review.json').read_text())['rows']:
    assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'], 'parent reviewed image changed'
report={'status':'PASS','deliveries':rows,'verifiedFiles':sum(x['verifiedFiles'] for x in rows),'verifiedBytes':sum(x['verifiedBytes'] for x in rows),'independentParentVisualHashesVerified':True}
Path('audits/C196_PROGRAM_20261003/delivery-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
