from pathlib import Path
import json,os,subprocess
b=Path('audits/OVERNIGHT_20261101/codex/coordinator')
env={**os.environ,'HOMEBREW_NO_INSTALL_CLEANUP':'1','HOMEBREW_NO_ANALYTICS':'1','HOMEBREW_NO_AUTO_UPDATE':'1'}
subprocess.run(['brew','update'],env=env,check=True)
names=['imagemagick','ffmpeg','python@3.12','node','gh','blender','inkscape','reaper','surge-xt','pngquant','oxipng']
r=subprocess.run(['brew','outdated','--json=v2','--greedy',*names],env=env,capture_output=True,text=True)
(b/'scoped-outdated.json').write_text(r.stdout)
(b/'scoped-outdated.stderr').write_text(r.stderr)
assert r.returncode in (0,1),r.returncode
j=json.loads(r.stdout)
print(json.dumps({'eligible':[x.get('name') for k in ['formulae','casks'] for x in j.get(k,[])],'outdatedExit':r.returncode}))
