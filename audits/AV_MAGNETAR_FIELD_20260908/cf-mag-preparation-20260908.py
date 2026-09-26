from pathlib import Path
import subprocess,json,time,sys
root=Path('/Users/nick/Projects/celestial-frontier-openai-mac');out=root/'audits/AV_MAGNETAR_FIELD_20260908';rows=[]
commands=[('draft-pin',['node','/private/tmp/cf-mag-draft-pin-20260908.mjs','/private/tmp/cf-mag-draft-authority-20260908.json']),('producer-build',['node','/private/tmp/cf-mag-producer-20260908.mjs']),('producer-refresh',['node','/private/tmp/cf-mag-refresh-producer-20260908.mjs']),('develop-profile',['node','tools/check-profile.mjs','--profile=develop'])]
code=0
for name,args in commands:
 start=time.monotonic();print('Starting '+name,flush=True)
 with (out/(name+'.log')).open('x') as f:
  try:p=subprocess.run(args,cwd=root,stdout=f,stderr=subprocess.STDOUT,timeout=600);code=p.returncode
  except subprocess.TimeoutExpired:code=124
 rows.append({'name':name,'command':args,'exitCode':code,'seconds':round(time.monotonic()-start,3)})
 print(json.dumps(rows[-1]),flush=True)
 if code:break
(out/'preparation.json').write_text(json.dumps({'status':'PASS' if code==0 else 'FAIL','steps':rows},indent=2)+'\n');sys.exit(code)
