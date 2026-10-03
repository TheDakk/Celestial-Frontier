from pathlib import Path
import subprocess,json,time,sys
root=Path(__file__).resolve().parents[2];audit=Path(__file__).resolve().parent
steps=[('draft-pin',['node',str(audit/'draft-pin.mjs'),str(audit/'draft-authority.json')]),('producer-build',['node',str(audit/'producer.mjs')]),('producer-refresh',['node',str(audit/'refresh-producer.mjs')]),('develop-profile',['node','port/v2/tools/check-profile.mjs','--profile=develop']),('root-validation',['node','tools/validate.js'])]
receipt=audit/'preparation.json';assert not receipt.exists()
results=[]
for name,command in steps:
 log=audit/(name+'.log');assert not log.exists();start=time.time()
 with log.open('x') as out:r=subprocess.run(command,cwd=root,stdout=out,stderr=subprocess.STDOUT,timeout=600)
 item={'name':name,'command':command,'exitCode':r.returncode,'seconds':round(time.time()-start,3)};results.append(item);receipt.write_text(json.dumps({'status':'FAIL' if r.returncode else 'RUNNING','steps':results},indent=2)+'\n');print(json.dumps(item),flush=True)
 if r.returncode:print(log.read_text()[-4000:]);sys.exit(r.returncode)
receipt.write_text(json.dumps({'status':'PASS','steps':results},indent=2)+'\n');print('PREPARATION PASS',flush=True)
