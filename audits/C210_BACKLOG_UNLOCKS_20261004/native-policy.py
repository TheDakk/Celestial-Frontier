from pathlib import Path
import json,subprocess
b=Path('audits/C210_BACKLOG_UNLOCKS_20261004');rows=[]
for r in json.loads((b/'policy-fits.json').read_text()):
 if r.get('static')!=0:continue
 d=Path('audits/G1_AUTO_AUTHOR_20260926/auto-c210-policy01')/r['id'];id=r['id'];script=json.loads(Path('audits/C208_REPAIRS_20261004/inputs/16-hyrax/script.json').read_text());name=json.loads((d/'packet/subject-source.json').read_text())['name']
 for row in script['rows']:
  for key in ['an','dn']:
   if key in row:row[key]=name
 sp=b/(id+'-script.json');sp.write_text(json.dumps(script,indent=2)+'\n');out=b/('native-'+id)
 p=subprocess.run(['node','tools/with-toolchain-lock.mjs','--label','C210-'+id,'--','node','port/v2/tools/battle2-proof/native-runner.mjs',str(d/'fit'),str(d/'fit'),str(out),str(sp)],capture_output=True,text=True);(b/(id+'-native.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));rows.append({'id':id,'exit':p.returncode});(b/'native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(rows[-1],flush=True)
