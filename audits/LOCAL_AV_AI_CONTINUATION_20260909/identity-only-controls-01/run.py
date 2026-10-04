from pathlib import Path
import subprocess,hashlib,json,datetime
root=Path.cwd();out=root/'audits/LOCAL_AV_AI_CONTINUATION_20260909/identity-only-controls-01'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
files=['tools/local-image-generation/'+x for x in ['gpu-profile.mjs','gpu-profile.test.mjs','proof-server.mjs','run-browser-proof.mjs','identity-conditioning.test.mjs','browser-proof.mjs','browser-lifecycle.test.mjs']]
files+=['audits/LOCAL_AV_AI_CONTINUATION_20260909/reference-cleanup-native-01/run.mjs','audits/LOCAL_AV_AI_CONTINUATION_20260909/identity-only-controls-01/token-check.mjs']
r={'status':'FAIL','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':{p:sha(root/p) for p in files},'steps':[]}
steps=[('conditioning',['node','--test','tools/local-image-generation/gpu-profile.test.mjs','tools/local-image-generation/identity-conditioning.test.mjs']),('token-check',['node',str(out/'token-check.mjs')]),('native-runner-syntax',['node','--check','audits/LOCAL_AV_AI_CONTINUATION_20260909/reference-cleanup-native-01/run.mjs']),('root-validate',['node','tools/validate.js'])]
try:
 for name,cmd in steps:
  with (out/(name+'.log')).open('xb') as log:run=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,cwd=root)
  r['steps'].append({'name':name,'command':cmd,'exitCode':run.returncode,'logSha256':sha(out/(name+'.log'))})
  print(name,run.returncode,flush=True)
  if run.returncode:break
 else:r['status']='PASS'
except Exception as error:r['error']=str(error)
finally:
 r['sourceRecheck']={}
 for name,digest in r['sources'].items():
  try:r['sourceRecheck'][name]={'sha256':sha(root/name),'unchanged':sha(root/name)==digest}
  except Exception as error:r['sourceRecheck'][name]={'unchanged':False,'error':str(error)}
 if not all(row['unchanged'] for row in r['sourceRecheck'].values()):r['status']='FAIL'
 r['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'RESULT.json').write_text(json.dumps(r,indent=2)+'\n')
 print(r['status'],flush=True)
raise SystemExit(0 if r['status']=='PASS' else 1)
