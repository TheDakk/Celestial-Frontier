from pathlib import Path
import json,os,subprocess
b=Path('audits/OVERNIGHT_20261101/codex/coordinator');lock=Path('/private/tmp/celestial-frontier-toolchain-'+str(os.getuid())+'.lock/owner.json');owner=json.loads(lock.read_text())['pid']
rows=[]
for line in subprocess.check_output(['/bin/ps','-axo','pid=,comm='],text=True).splitlines():
 fields=line.strip().split(None,1)
 if len(fields)!=2:continue
 pid,comm=int(fields[0]),fields[1]
 if pid==owner:continue
 if comm.startswith('/opt/homebrew/')and any(x in Path(comm).name.lower()for x in ['node','python3.12','magick','ffmpeg']):rows.append({'pid':pid,'tool':Path(comm).name})
 for tool,app in [('blender','Blender.app'),('reaper','REAPER.app')]:
  if app+'/'in comm:rows.append({'pid':pid,'tool':tool})
(b/'maintenance-busy-check.json').write_text(json.dumps({'busy':rows,'ignoredKnownMaintenanceWrapperPid':owner},indent=2)+'\n')
assert not rows,'Approved tool busy; maintenance deferred until safe'
env={**os.environ,'HOMEBREW_NO_INSTALL_CLEANUP':'1','HOMEBREW_NO_ANALYTICS':'1','HOMEBREW_NO_AUTO_UPDATE':'1'}
subprocess.run(['brew','upgrade','--formula','gh','imagemagick','node','python@3.12'],env=env,check=True)
subprocess.run(['brew','upgrade','--cask','--no-quit','blender','reaper'],env=env,check=True)
with(b/'startup-verify.json').open('x')as f:subprocess.run(['node','tools/development-toolchain.mjs','--verify'],env=env,stdout=f,check=True)
