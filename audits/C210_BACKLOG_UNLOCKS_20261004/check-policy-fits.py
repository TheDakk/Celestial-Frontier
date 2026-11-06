from pathlib import Path
import json,subprocess
b=Path('audits/C210_BACKLOG_UNLOCKS_20261004');rows=[]
for r in json.loads((b/'review-index.json').read_text()):
 d=Path('audits/G1_AUTO_AUTHOR_20260926/auto-c210-policy01')/r['id'];score=json.loads((d/'score.json').read_text())
 if score['verdict']!='ADMIT':continue
 row={'id':r['id']}
 for stage,args in [('intake',['node','port/v2/tools/creature-animation/intake-authored.mjs',str(d/'packet'),str(d/'fit')]),('static',['node','audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',str(d/'fit'),str(d/'static.json')])]:
  p=subprocess.run(args,text=True,capture_output=True);(b/(r['id']+'-'+stage+'.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));row[stage]=p.returncode
  if p.returncode:break
 rows.append(row);(b/'policy-fits.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
