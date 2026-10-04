from pathlib import Path
import subprocess,json
b=Path(__file__).resolve().parent;root=b.parents[1];rows=[]
for id in ['17-arapaima-framing02','20-angelfish','21-tuna','23-swordfish-framing02']:
 out=b/('fish-'+id);fit=b/'inputs'/id/'fit';row={'id':id}
 for stage,args in [('compile',['node',str(b/'compile-fish.mjs'),'fish-'+id,str(fit)]),('static',['node','audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',str(out/'fit'),str(out/'static.json')])]:
  p=subprocess.run(args,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(b/(id+'-'+stage+'.log')).write_text(p.stdout.replace(str(Path.home()),'~'));row[stage]=p.returncode
  if p.returncode:row['error']=p.stdout[-500:].replace(str(Path.home()),'~');break
 rows.append(row);(b/'fish-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
