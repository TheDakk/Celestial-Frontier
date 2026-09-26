import subprocess, os, json, pathlib, time, shutil, gzip
root=pathlib.Path('/private/tmp/cf-i5-fb82c32c')
out=pathlib.Path('/Users/nick/Projects/celestial-frontier-openai-mac/audits/I5_INTEGRATED_20260924')
head='fb82c32cac67f8d980fe1752ae92d9a1f0eb729c'
run_id='20260924-i5-integrated-fb82c32cac67'
def git(*args): return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
assert git('rev-parse','HEAD')==head
assert git('status','--porcelain=v1','--untracked-files=all')==''
(out/'attempt-started.txt').open('x').write(run_id+'\n')
env=os.environ.copy()
env.update(CF_BROWSER='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',CF_COMPENDIUMMEM_RUN_ID=run_id)
steps=[]
def run(name,args):
 start=time.monotonic(); began=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
 with (out/(name+'.log')).open('wb') as log:
  r=subprocess.run(args,cwd=root/'port/v2',env=env,stdout=log,stderr=subprocess.STDOUT)
 steps.append(dict(name=name,command=args,startedAt=began,durationMs=round((time.monotonic()-start)*1000,3),exitCode=r.returncode))
 (out/'execution.json').write_text(json.dumps(dict(head=head,runId=run_id,browser=env['CF_BROWSER'],checkout=str(root),automaticRetries=0,steps=steps),indent=2)+'\n')
 print(name+': '+str(r.returncode),flush=True)
 return r.returncode
if run('edge-preflight',['node','tools/compendiummem-browser-preflight.mjs'])!=0: raise SystemExit(2)
status=run('certificate',['node','tools/compendiummem.mjs'])
report=root/'port/v2/apps/game/smoke/compendiummem-report.json'
if report.exists():
 with gzip.GzipFile(str(out/'report.json.gz'),'wb',mtime=0) as f: f.write(report.read_bytes())
 for p in report.parent.glob('compendiummem-'+run_id+'-*.png'): shutil.copyfile(p,out/p.name)
verify=run('named-verify',['node','tools/compendiummem.mjs','--verify-run='+run_id])
(out/'source-after.json').write_text(json.dumps(dict(head=git('rev-parse','HEAD'),status=git('status','--porcelain=v1','--untracked-files=all')),indent=2)+'\n')
raise SystemExit(status if status else verify)
