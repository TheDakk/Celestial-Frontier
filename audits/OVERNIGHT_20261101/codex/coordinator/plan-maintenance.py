from pathlib import Path
import json,os,subprocess
b=Path('audits/OVERNIGHT_20261101/codex/coordinator');j=json.loads((b/'scoped-outdated.json').read_text())
env={**os.environ,'HOMEBREW_NO_INSTALL_CLEANUP':'1','HOMEBREW_NO_ANALYTICS':'1','HOMEBREW_NO_AUTO_UPDATE':'1'}
for kind,key in [('formula','formulae'),('cask','casks')]:
 names=[x['name'] for x in j.get(key,[])]
 if not names:continue
 cmd=['brew','upgrade','--'+kind,'--dry-run']+(['--no-quit']if kind=='cask'else[])+names
 print(' '.join(cmd),flush=True)
 subprocess.run(cmd,env=env,check=True)
info=subprocess.check_output(['brew','info','--json=v2','gh','imagemagick','node','python@3.12'],env=env,text=True)
(b/'maintenance-dependency-info.json').write_text(info)
