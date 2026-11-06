"""Compose reviewed CPU proposal beside signed C491 without applying to runtime."""
from pathlib import Path
import json,hashlib,subprocess
B=Path('audits/C475_DECISIONS_20261019');W=B/'w1-keyer/radial-materials-r01';O=B/'coordinator/anchored-composed-cpu-r02'
assert not O.exists();O.mkdir()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
freeze=json.loads((W/'sea-anemone-handoff-r02/freeze.json').read_text());pins={r['path']:r['sha256']for r in freeze['files']}
manifest=W/'proposal-manifest-r03.json';assert pins[str(manifest)]==sha(manifest)
rows=[]
for row in json.loads(manifest.read_text())['rows']:
 current=Path(row['path']);proposed=Path(row['copy']);base=W/'baseline-current-r01'/current
 assert sha(proposed)==row['sha256']==pins[str(proposed)],str(proposed)
 out=O/'proposal'/current;out.parent.mkdir(parents=True,exist_ok=True)
 if row['beforeSha256'] is None:
  assert not current.exists(),str(current);out.write_bytes(proposed.read_bytes());conflict=False
 else:
  assert sha(base)==row['beforeSha256'],str(base)
  if sha(current)==row['beforeSha256']:
   out.write_bytes(proposed.read_bytes());conflict=False
  else:
   merged=subprocess.run(['git','merge-file','-p',str(current),str(base),str(proposed)],capture_output=True)
   assert merged.returncode in [0,1],merged.stderr.decode();out.write_bytes(merged.stdout);conflict=merged.returncode!=0
 rows.append({'path':str(current),'baselineSha256':row['beforeSha256'],'currentSha256':sha(current)if current.exists()else None,'proposedSha256':sha(proposed),'copy':str(out),'sha256':sha(out),'conflict':conflict})
report={'status':'AUDIT_ONLY_THREE_WAY_COMPOSITION_REQUIRES_CONFLICT_REVIEW','signedCurrentProducer':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'sourceProposal':{'path':str(manifest),'sha256':sha(manifest)},'sourceFreeze':{'path':str(W/'sea-anemone-handoff-r02/freeze.json'),'sha256':sha(W/'sea-anemone-handoff-r02/freeze.json')},'rows':rows,'productionEdits':False,'native':False,'AI':False,'postRedOwnersExecuted':False}
(O/'composition.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'files':len(rows),'conflicts':[r['path']for r in rows if r['conflict']],'applied':False}))
