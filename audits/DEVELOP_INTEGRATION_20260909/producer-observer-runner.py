from pathlib import Path
import subprocess,json,tempfile,datetime,hashlib,shutil
root=Path('/Users/nick/Projects/celestial-frontier-openai-mac')
out=root/'audits/DEVELOP_INTEGRATION_20260909'
snapshot=Path(tempfile.mkdtemp(prefix='cf-integration-producer-'))
start={'schema':'cf-integration-producer-observation/v1','sourceParent':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'indexTree':subprocess.check_output(['git','write-tree'],cwd=root,text=True).strip(),'snapshot':str(snapshot),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'steps':[]}
try:
 subprocess.run(['git','checkout-index','--all','--force','--prefix='+str(snapshot)+'/'],cwd=root,check=True)
 module=(snapshot/'port/v2/tools/print-producer-authorities.mjs').as_uri()
 js='import {collectCurrentProducerAuthorities} from '+json.dumps(module)+'; import {writeFileSync} from "node:fs"; const report=collectCurrentProducerAuthorities(); writeFileSync('+json.dumps(str(out/'producer-observed.json'))+',JSON.stringify(report,null,2)+"\\n",{flag:"wx"}); if(!report.compendium.measurementBudgetMatches) throw new Error("Measurement authority changed; no refresh allowed"); console.log("Observed current producer "+report.compendium.producer.sha256+"; prior producer match="+report.compendium.producerBudgetMatches+"; SceneMemory match="+report.sceneMemory.budgetMatches);'
 for label,cmd in [('install',['npm','ci','--prefer-offline','--no-audit','--no-fund']),('observe',['node','--input-type=module','-e',js])]:
  print('Producer snapshot: '+label,flush=True)
  logPath=out/('producer-'+label+'.log')
  with logPath.open('xb') as log:r=subprocess.run(cmd,cwd=snapshot/'port/v2',stdout=log,stderr=subprocess.STDOUT)
  raw=logPath.read_bytes();start['steps'].append({'label':label,'exitCode':r.returncode,'log':logPath.name,'logSha256':hashlib.sha256(raw).hexdigest()})
  print('\n'.join(raw.decode(errors='replace').splitlines()[-6:]),flush=True)
  if r.returncode:raise SystemExit(r.returncode)
finally:
 start['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 start['indexTreeAfter']=subprocess.check_output(['git','write-tree'],cwd=root,text=True).strip()
 assert snapshot.name.startswith('cf-integration-producer-') and snapshot.parent==Path(tempfile.gettempdir())
 shutil.rmtree(snapshot)
 start['snapshotRemoved']=not snapshot.exists()
 (out/'producer-observation-result.json').write_text(json.dumps(start,indent=2)+'\n')
