"""Persist actual visual observations and form a pilot; never infer observations."""
import json, pathlib, sys
spec=json.load(sys.stdin)
base=pathlib.Path('audits/C243_ALLOUT_20261011/execution')
batch=base/('batch%02d'%spec.get('batch',1))
rows=[]
for entry in spec['notes']:
    suffix, observation=entry[:2]
    packet=batch/('c243b%02dr%dc%d-'%(spec.get('batch',1),spec.get('round',1),spec['candidate'])+suffix)
    generation=json.loads((packet/'generation.json').read_text())
    pilot=json.loads((packet/'pilot.json').read_text())
    note={'name':pilot[0]['name'],'masterSha256':generation['masterSha256'],'observation':observation}
    if len(entry)>2:
        note['pattern']={'name':note['name'],'masterSha256':note['masterSha256'],'status':'PRESENT','features':entry[2]}
    with (packet/'visual-note.json').open('x') as out: out.write(json.dumps(note,indent=2)+'\n')
    rows+=pilot
pilotPath=batch/('pilot-'+spec['group']+'.json')
with pilotPath.open('x') as out: out.write(json.dumps(rows,indent=2)+'\n')
print(pilotPath)
