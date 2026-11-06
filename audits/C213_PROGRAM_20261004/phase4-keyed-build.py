from pathlib import Path
import json,subprocess
b=Path('audits/C213_PROGRAM_20261004');rows=[]
for r in json.load(open(b/'phase4-source-build.json')):
 if r.get('islands')!=1:continue
 id=r['id'];out=b/'phase4-keyed-successors'/id;out.mkdir(parents=True,exist_ok=False);row={'id':id,'class':r['class'],'predecessor':r['predecessor'],'fit':str(out/'fit')}
 for stage,args in [('islands',['node',str(b/'phase4-keyed-islands.mjs'),'c213-keyed-'+id,r['predecessor'],str(out/'islands')]),('joins',['node',str(b/'phase4-joins.mjs'),str(out/'islands/fit'),str(out/'fit')]),('static',['node','audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',str(out/'fit'),str(out/'static.json')])]:
  p=subprocess.run(args,capture_output=True,text=True);(out/(stage+'.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));row[stage]=p.returncode
  if p.returncode:break
 rows.append(row);(b/'phase4-keyed-build.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
