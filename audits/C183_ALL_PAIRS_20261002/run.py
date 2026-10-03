from pathlib import Path
import subprocess,json,datetime,time,hashlib
root=Path(__file__).resolve().parents[2]
base=Path(__file__).resolve().parent
prior=root/'audits/C183_I5_EPOCH_20261002'
assert json.loads((prior/'invocation.json').read_text())['exitCode']==0
assert json.loads((prior/'activation-replay.json').read_text())['ok'] is True
assert json.loads((prior/'develop-profile.json').read_text())['exitCode']==0
assert not (base/'invocation.json').exists(), 'No sweep retry'
manifest=root/'audits/C173_ALL_PAIRS_20261002/prepared-0727fe9c/manifest.json'
out=base/'native-01'
assert not out.exists()
command=['node','tools/with-toolchain-lock.mjs','--label','C213 full1444 ordered-pair native sweep','--','node','audits/C173_ALL_PAIRS_20261002/run-sweep-v2.mjs',str(manifest),str(out)]
private=lambda s:s.replace(str(Path.home()),'~')
receipt={'schema':'cf.c183-sweep-invocation/v1','head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'command':[private(x) for x in command],'manifestSha256':hashlib.sha256(manifest.read_bytes()).hexdigest(),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':None,'automaticRetries':0}
(base/'invocation.json').write_text(json.dumps(receipt,indent=2)+'\n')
t=time.monotonic()
with (base/'native-terminal.log').open('w') as log:
 p=subprocess.Popen(command,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 for line in p.stdout:
  clean=private(line);log.write(clean);log.flush();print(clean,end='',flush=True)
 code=p.wait()
receipt.update(exitCode=code,durationSeconds=round(time.monotonic()-t,3),finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
(base/'invocation.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt),flush=True)
raise SystemExit(code)
