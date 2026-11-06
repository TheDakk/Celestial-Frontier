from pathlib import Path
import json,subprocess
b=Path('audits/C210_BACKLOG_UNLOCKS_20261004');rows=[]
for r in json.loads((b/'seam-inputs.json').read_text()):
 id=r['id'];out=b/'joins01'/id;row={'id':id}
 for stage,args in [('joins',['node',str(b/'join-candidates.mjs'),id]),('static',['node','audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',str(out/'fit'),str(out/'static.json')])]:
  p=subprocess.run(args,capture_output=True,text=True);(b/(id+'-'+stage+'.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));row[stage]=p.returncode
  if p.returncode:break
 rows.append(row);(b/'seam-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
