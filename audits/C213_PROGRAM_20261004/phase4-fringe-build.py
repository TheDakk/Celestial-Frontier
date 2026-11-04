from pathlib import Path
import json,subprocess
b=Path('audits/C213_PROGRAM_20261004');rows=[]
for r in json.load(open(b/'phase4-fringe-measurements.json')):
 p=Path(r['packet']);out=p.parent;row={'id':r['id'],'fit':str(out/'fit')}
 for stage,args in [('intake',['node','port/v2/tools/creature-animation/intake-authored.mjs',str(p),str(out/'fit')]),('static',['node','audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',str(out/'fit'),str(out/'static.json')])]:
  proc=subprocess.run(args,capture_output=True,text=True);(out/(stage+'.log')).write_text((proc.stdout+proc.stderr).replace(str(Path.home()),'~'));row[stage]=proc.returncode
  if proc.returncode:break
 rows.append(row);(b/'phase4-fringe-build.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
