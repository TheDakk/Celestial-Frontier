import subprocess,os,json,pathlib,time
root=pathlib.Path('/Users/nick/Projects/celestial-frontier-openai-mac');v2=root/'port/v2'
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
assert git('rev-parse','--show-toplevel')==str(root)
assert git('branch','--show-current')=='openai/mac'
head=git('rev-parse','HEAD');run_id='20260922-i5-focus-'+head[:12]
out=pathlib.Path('/private/tmp')/run_id;out.mkdir()
exclude=out/'git-excludes';exclude.write_text('/.DS_Store\n')
env=os.environ.copy();env.update({'CF_BROWSER':'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge','CF_COMPENDIUMMEM_RUN_ID':run_id,'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'core.excludesFile','GIT_CONFIG_VALUE_0':str(exclude)})
assert subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'],cwd=root,env=env)==b''
steps=[]
def run(name,args):
 start=time.monotonic();began=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
 with (out/(name+'.log')).open('wb') as log:r=subprocess.run(args,cwd=v2,env=env,stdout=log,stderr=subprocess.STDOUT)
 steps.append({'name':name,'command':args,'startedAt':began,'durationMs':(time.monotonic()-start)*1000,'exitCode':r.returncode})
 (out/'execution.json').write_text(json.dumps({'head':head,'runId':run_id,'browser':env['CF_BROWSER'],'gitExclude':'/.DS_Store','steps':steps,'automaticRetries':0},indent=2)+'\n')
 print(name+': '+str(r.returncode),flush=True);return r.returncode
if run('edge-preflight',['node','tools/compendiummem-browser-preflight.mjs'])!=0:raise SystemExit(2)
status=run('certificate',['node','tools/compendiummem.mjs'])
verify_status=run('named-verify',['node','tools/compendiummem.mjs','--verify-run='+run_id])
print(json.dumps({'head':head,'runId':run_id,'directory':str(out),'certificateExitCode':status,'verificationExitCode':verify_status}),flush=True)
raise SystemExit(status if status else verify_status)
