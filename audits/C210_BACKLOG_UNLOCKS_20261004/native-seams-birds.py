from pathlib import Path
import json,subprocess
b=Path('audits/C210_BACKLOG_UNLOCKS_20261004');cases=[];rows=[]
for r in json.loads((b/'seam-results.json').read_text()):
 if r.get('static')==0:cases.append((r['id'],b/'joins01'/r['id']/'fit',b/'seam-inputs'/r['id']/'script.json'))
for r in json.loads((b/'bird-static-results.json').read_text()):
 if r['static']==0:cases.append(('bird-'+r['id'],Path('audits/C208_REPAIRS_20261004/inputs')/r['id']/'fit',Path('audits/C208_REPAIRS_20261004/inputs')/r['id']/'script.json'))
for id,fit,script in cases:
 p=subprocess.run(['node','tools/with-toolchain-lock.mjs','--label','C210-'+id,'--','node','port/v2/tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(b/('native-'+id)),str(script)],capture_output=True,text=True);(b/(id+'-native.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));rows.append({'id':id,'exit':p.returncode});(b/'native-seams-birds-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(rows[-1],flush=True)
