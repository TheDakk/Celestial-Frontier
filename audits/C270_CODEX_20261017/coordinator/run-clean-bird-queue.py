from pathlib import Path
import subprocess,json,sys
B=Path('audits/C270_CODEX_20261017/coordinator');assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no']).strip(),'Tracked tree must be clean BEFORE dispatch'
rows=[]
for slug in ['hoatzin-signed-r02','kookaburra-signed-r02','pheasant-signed-r02']:
 assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no']).strip(),'Stop global metadata drift before another job'
 r=subprocess.run(['python3',str(B/'run-finish-chain.py'),slug]);rows.append({'slug':slug,'exitCode':r.returncode})
 if r.returncode:break
p=B/'clean-birds-queue.json';assert not p.exists();p.write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows));sys.exit(0 if len(rows)==3 and all(x['exitCode']==0 for x in rows)else 1)
