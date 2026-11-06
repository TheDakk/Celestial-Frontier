"""Fail if a delivered fit's exact record.source bytes are absent from Git's index."""
import hashlib, json, pathlib, subprocess, sys

def verify_source(record, indexed):
    source=record['source']
    assert source in indexed, 'Referenced master not tracked: '+source
    digest=hashlib.sha256(indexed[source]).hexdigest()
    assert digest==record['geometry']['cutoutAssetHash'], 'Tracked master hash mismatch: '+source
    return digest

probe={'source':'audits/control/master.png','geometry':{'cutoutAssetHash':hashlib.sha256(b'exact').hexdigest()}}
assert verify_source(probe,{probe['source']:b'exact'})==probe['geometry']['cutoutAssetHash']
for mutant in [{},{probe['source']:b'changed'}]:
    try: verify_source(probe,mutant)
    except AssertionError: pass
    else: raise AssertionError('Retention negative control failed')

paths=set(subprocess.check_output(['git','ls-files','-z']).decode().split('\0'));rows=[]
for plan in sys.argv[1:]:
    for row in json.loads(pathlib.Path(plan).read_text()):
        record=json.loads(pathlib.Path(row['fit'],'record.json').read_text());source=record['source']
        assert source in paths, 'Referenced master not tracked: '+source
        indexed=subprocess.check_output(['git','show',':'+source]);digest=verify_source(record,{source:indexed})
        assert pathlib.Path(source).read_bytes()==indexed, 'Local/index master differs: '+source
        rows.append({'id':row['id'],'source':source,'sha256':digest})
assert rows, 'At least one native/finish plan is required'
print(json.dumps({'status':'PASS','records':len(rows),'uniqueMasters':len({r['source'] for r in rows}),'negativeControls':['missing indexed master refused','changed indexed bytes refused'],'rows':rows},indent=2))
