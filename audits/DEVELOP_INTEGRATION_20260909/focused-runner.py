from pathlib import Path
import subprocess,json,datetime,hashlib
root=Path('/Users/nick/Projects/celestial-frontier-openai-mac')
out=root/'audits/DEVELOP_INTEGRATION_20260909'
steps=[('focused',['npm','exec','--','vitest','run','tests/app-chrome.test.ts','tests/app-chrome-main-wiring.test.ts','tests/earth-layered-chrome-layout.test.ts','apps/game/src/earth-layered-layout.test.ts','tests/build-mode.test.ts','tests/pwa-offline.test.ts','tests/slicesmoke-sixth-red-contract.test.ts'],root/'port/v2'),('root-ts',['npm','exec','--','tsc','--noEmit','--noUnusedLocals'],root/'port/v2'),('game-ts',['npm','exec','--','tsc','--noEmit','-p','apps/game/tsconfig.json'],root/'port/v2'),('worker-ts',['npm','exec','--','tsc','--noEmit','-p','apps/game/tsconfig.worker.json'],root/'port/v2'),('validate',['node','tools/validate.js'],root)]
record={'schema':'cf-integration-focused/v1','sourceParent':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'steps':[],'sourceFiles':{}}
for file in ['port/v2/apps/game/src/main.ts','port/v2/apps/game/src/app-chrome.ts','port/v2/tests/app-chrome.test.ts','port/v2/tests/app-chrome-main-wiring.test.ts','port/v2/tests/earth-layered-chrome-layout.test.ts','port/v2/tests/build-mode.test.ts','port/v2/tools/slicesmoke.mjs']:
 record['sourceFiles'][file]=hashlib.sha256((root/file).read_bytes()).hexdigest()
htmlBefore=hashlib.sha256((root/'celestial-frontier.html').read_bytes()).hexdigest()
for label,cmd,cwd in steps:
 print('Running '+label,flush=True)
 logPath=out/('repaired-'+label+'.log')
 with logPath.open('xb') as log:r=subprocess.run(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT)
 raw=logPath.read_bytes()
 record['steps'].append({'label':label,'command':cmd,'cwd':str(cwd),'exitCode':r.returncode,'log':logPath.name,'logSha256':hashlib.sha256(raw).hexdigest()})
 record['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 record['htmlUnchanged']=htmlBefore==hashlib.sha256((root/'celestial-frontier.html').read_bytes()).hexdigest()
 (out/'repaired-focused-result.json').write_text(json.dumps(record,indent=2)+'\n')
 print('\n'.join(raw.decode(errors='replace').splitlines()[-12:]),flush=True)
 if r.returncode:raise SystemExit(r.returncode)
print('Focused repair/static chain PASS; no current-producer build or full admission claimed.')
