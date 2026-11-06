"""Guard all immutable inputs, then compose ONLY audit copies beside signed C491."""
from pathlib import Path
import json,hashlib,subprocess
B=Path('audits/C475_DECISIONS_20261019');W=B/'w1-keyer/radial-materials-r01';O=B/'coordinator/anchored-composed-cpu-r05'
assert not O.exists()
sha=lambda b:hashlib.sha256(b).hexdigest()
freeze=W/'sea-anemone-handoff-r02/freeze.json';F=json.loads(freeze.read_text());pins={r['path']:r['sha256']for r in F['files']}
assert sha(freeze.read_bytes())=='6980d95c1259bfb78195ebf2920b80d2d9fe5f50a96c50ed16c7c60cbdfad86d'
manifest=W/'proposal-manifest-r03.json';assert pins[str(manifest)]==sha(manifest.read_bytes())
baseProducer='633cd4627f52b89efaea1267d364ea33032ade47'
assert subprocess.check_output(['git','log','-1','--format=%G?',baseProducer]).decode().strip()=='G'
prepared=[]
for row in json.loads(manifest.read_text())['rows']:
 current=Path(row['path']);proposed=Path(row['copy']);new=proposed.read_bytes()
 assert sha(new)==row['sha256']==pins[str(proposed)],str(proposed)
 old=None
 if row['beforeSha256']is not None:
  for producer in [subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),baseProducer]:
   candidate=subprocess.run(['git','show',producer+':'+str(current)],capture_output=True)
   if candidate.returncode==0 and sha(candidate.stdout)==row['beforeSha256']:
    old=candidate.stdout;break
  assert old is not None,str(current)
 if old is None:assert not current.exists(),str(current)
 prepared.append((row,current,proposed,new,old))
assert len(prepared)==13
O.mkdir();rows=[]
for row,current,proposed,new,old in prepared:
 out=O/'proposal'/current;out.parent.mkdir(parents=True,exist_ok=True)
 if old is None or sha(current.read_bytes())==row['beforeSha256']:
  out.write_bytes(new);conflict=False
 else:
  base=O/'baseline'/current;base.parent.mkdir(parents=True,exist_ok=True);base.write_bytes(old)
  merged=subprocess.run(['git','merge-file','-p',str(current),str(base),str(proposed)],capture_output=True)
  assert 0<=merged.returncode<128,merged.stderr.decode();out.write_bytes(merged.stdout);conflict=merged.returncode!=0
 rows.append({'path':str(current),'baselineSha256':row['beforeSha256'],'currentSha256':sha(current.read_bytes())if current.exists()else None,'proposedSha256':sha(new),'copy':str(out),'sha256':sha(out.read_bytes()),'conflict':conflict})
report={'status':'AUDIT_ONLY_THREE_WAY_COMPOSITION_REQUIRES_CONFLICT_REVIEW','signedCurrentProducer':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'baselineProducer':baseProducer,'sourceProposal':{'path':str(manifest),'sha256':sha(manifest.read_bytes())},'sourceFreeze':{'path':str(freeze),'sha256':sha(freeze.read_bytes())},'rows':rows,'productionEdits':False,'native':False,'AI':False,'postRedOwnersExecuted':False}
(O/'composition.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'files':len(rows),'conflicts':[r['path']for r in rows if r['conflict']],'applied':False}))
