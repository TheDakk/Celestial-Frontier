from pathlib import Path
import subprocess,hashlib,json,difflib
r=Path('/Users/nick/Projects/celestial-frontier-openai-mac'); out=r/'audits/STATIC_LANDING_PORTRAIT_20260908'
tracked=['port/v2/apps/game/src/main.ts','port/v2/apps/game/src/painted-vista-load.ts','port/v2/apps/game/src/painted-vista-load.test.ts','port/v2/tests/earth-layered-shake-settlement.test.ts']
new=['port/v2/apps/game/src/painted-earth-landing-recipe.ts','port/v2/tests/painted-earth-landing-binding.test.ts']
patch=subprocess.check_output(['git','diff','--binary','--full-index','HEAD','--',*tracked],cwd=r)
records=[]; before={}
for name in tracked+new:
 p=r/name; b=p.read_bytes(); target=out/'prepared-source'/name; target.parent.mkdir(parents=True,exist_ok=True)
 with target.open('xb') as f:f.write(b)
 assert target.read_bytes()==b
 old=subprocess.check_output(['git','show','HEAD:'+name],cwd=r) if name in tracked else None
 before[name]=(b,old)
 records.append({'path':name,'candidateSha256':hashlib.sha256(b).hexdigest(),'baseSha256':hashlib.sha256(old).hexdigest() if old is not None else None,'retainedCopy':str(target.relative_to(r))})
 if name in new:
  text=b.decode(); difference=''.join(difflib.unified_diff([],text.splitlines(keepends=True),fromfile='/dev/null',tofile='b/'+name))
  patch+=('diff --git a/'+name+' b/'+name+'\nnew file mode 100644\n'+difference).encode()
p=out/'prepared-runtime.patch'
with p.open('xb') as f:f.write(patch)
assert p.read_bytes()==patch
for name,(candidate,old) in before.items():
 p=r/name; assert p.read_bytes()==candidate
 if old is None:p.unlink()
 else:
  tmp=p.with_suffix(p.suffix+'.restore');tmp.write_bytes(old);tmp.replace(p)
check=subprocess.run(['git','apply','--check',str(p)],cwd=r,capture_output=True,text=True)
receipt={'status':'PREPARED_NOT_APPLIED','reason':'Required ImageMagick resize/encode permission remains pending. No unresolved asset URL or placeholder digest is installed in game code.','baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip(),'patch':str(p.relative_to(r)),'patchSha256':hashlib.sha256(patch).hexdigest(),'records':records,'applyCheck':{'exitCode':check.returncode,'stdout':check.stdout,'stderr':check.stderr},'checks':'Candidate runtime tests/typechecks/native are NOT RUN. Generic kinematics remains live tooling and receives its own checks.'}
(out/'prepared-runtime.json').write_text(json.dumps(receipt,indent=2)+'\n')
assert check.returncode==0
print(json.dumps({'status':receipt['status'],'files':len(records),'patchBytes':len(patch),'patchSha256':receipt['patchSha256'],'applyCheck':check.returncode}))
