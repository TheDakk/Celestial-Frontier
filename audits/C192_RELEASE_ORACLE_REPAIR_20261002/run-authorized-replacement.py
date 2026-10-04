from pathlib import Path
import subprocess,json,time,datetime
root=Path(__file__).resolve().parents[2]
base=Path(__file__).resolve().parent
runtime=root/'tools/local-image-generation/node_modules'
aside=root/'tools/local-image-generation/node_modules.c192-replacement-aside'
assert not aside.exists(), 'Aside already exists; inspect before proceeding'
assert not (base/'develop-profile.json').exists(), 'New result path required'
assert __import__('os').environ.get('CF_C192_REPLACEMENT_AUTHORIZED') == 'Dakk', 'Requires explicit replacement authorization; first-red stop is active'
assert not subprocess.check_output(['git','diff','HEAD','--','port/v2'],cwd=root,text=True).strip(), 'Commit candidate first'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
renamed=runtime.exists()
if renamed: runtime.rename(aside)
t=time.monotonic();started=datetime.datetime.now(datetime.timezone.utc).isoformat();code=None
try:
 p=subprocess.run(['node','tools/with-toolchain-lock.mjs','--label','C192 authorized replacement develop profile','--','node','port/v2/tools/check-profile.mjs','--profile=develop'],cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 code=p.returncode
 (base/'develop-profile.log').write_text(p.stdout.replace(str(Path.home()),'~'))
finally:
 if renamed:
  assert not runtime.exists(), 'Optional runtime target unexpectedly recreated; aside retained'
  aside.rename(runtime)
 receipt={'head':head,'startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'durationSeconds':round(time.monotonic()-t,3),'exitCode':code,'optionalRuntimeRenamedAside':renamed,'optionalRuntimeRestored':not renamed or runtime.exists(),'asideAbsent':not aside.exists(),'command':'node port/v2/tools/check-profile.mjs --profile=develop'}
 (base/'develop-profile.json').write_text(json.dumps(receipt,indent=2)+'\n')
 print(json.dumps(receipt),flush=True)
if code is not None:
 print(p.stdout.replace(str(Path.home()),'~')[-3500:],flush=True)
 raise SystemExit(code)
