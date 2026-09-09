from pathlib import Path
import subprocess, hashlib, json, datetime
root=Path.cwd()
out=root/'audits/LOCAL_AV_AI_CONTINUATION_20260909/cache-plan-controls-01'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
files=['port/v2/apps/game/src/scene-image-cache-plan.ts','port/v2/tests/scene-image-cache-plan.test.ts','port/v2/package.json','port/v2/package-lock.json','tools/validate.js','tools/build.js','celestial-frontier.html']
result={'status':'FAIL','startedAt':now(),'sources':{x:sha(root/x) for x in files},'steps':[]}
steps=[('focused',['node','node_modules/vitest/vitest.mjs','run','tests/scene-image-cache-plan.test.ts'],root/'port/v2'),('typecheck',['npm','run','typecheck'],root/'port/v2'),('root-validate',['node','tools/validate.js'],root)]
try:
 for name,command,cwd in steps:
  with (out/(name+'.log')).open('xb') as log:
   run=subprocess.run(command,cwd=cwd,stdout=log,stderr=subprocess.STDOUT)
  result['steps'].append({'name':name,'command':command,'cwd':str(cwd),'exitCode':run.returncode,'logSha256':sha(out/(name+'.log'))})
  print(name,run.returncode,flush=True)
  if run.returncode: break
 else: result['status']='PASS'
except Exception as e:
 result['error']=str(e)
finally:
 result['sourceRecheck']={}
 for name,digest in result['sources'].items():
  try: result['sourceRecheck'][name]={'sha256':sha(root/name),'unchanged':sha(root/name)==digest}
  except Exception as e: result['sourceRecheck'][name]={'unchanged':False,'error':str(e)}
 if not all(x['unchanged'] for x in result['sourceRecheck'].values()): result['status']='FAIL'
 result['finishedAt']=now()
 (out/'RESULT.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({'status':result['status'],'steps':len(result['steps'])}),flush=True)
raise SystemExit(0 if result['status']=='PASS' else 1)
