from pathlib import Path
import subprocess,json
b=Path(__file__).resolve().parent;root=b.parents[1];rows=[]
cases=[('16-hyrax','joins01/16-hyrax/fit'),('18-sparrow','joins01/18-sparrow/fit'),('13-falcon','joins01/13-falcon/fit')]+[(i,'fish-'+i+'/fit') for i in ['17-arapaima-framing02','20-angelfish','21-tuna','23-swordfish-framing02']]
for id,relative in cases:
 fit=b/relative;out=b/('native-'+id);script=b/'inputs'/id/'script.json'
 args=['node','tools/with-toolchain-lock.mjs','--label','C208-'+id,'--','node','port/v2/tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(out),str(script)]
 p=subprocess.run(args,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (b/('native-'+id+'.log')).write_text(p.stdout.replace(str(Path.home()),'~'));rows.append({'id':id,'exit':p.returncode});(b/'native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(rows[-1],flush=True)
 # Each independently repaired source is tried once. No retries or certificate stages.
