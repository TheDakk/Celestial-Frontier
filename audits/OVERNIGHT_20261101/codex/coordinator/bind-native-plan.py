"""Bind an already signed, static-clean producer to a fresh native output."""
from pathlib import Path
import json,subprocess,hashlib,sys
p=Path(sys.argv[1]);out=p.parent/'native-plan-bound.json';assert not out.exists()
run=lambda *a:subprocess.check_output(a,text=True).strip()
assert run('git','branch','--show-current')=='openai/mac'
assert not run('git','status','--porcelain','--untracked-files=no')
assert run('git','log','-1','--format=%G?')=='G'
rows=json.loads(p.read_text());assert len(rows)==1
row=rows[0];assert row['status']=='PREPARED_CPU_NOT_NATIVE','Explicit source HOLD or already bound producer cannot enter native';static=json.loads(Path(row['staticReport']).read_text())
assert static['status']=='PASS_STATIC',static.get('status')
if static.get('realm')=='aquatic':
 world=json.loads(Path(row['script']).read_text()).get('world',{});assert world.get('surfaceWater') is True and world.get('liquid')=='water','Actual aquatic BodyCard requires liquid water as well as its surface before signing/native'
for source in json.loads(Path(row['staticReport']+'.sources.json').read_text()):assert hashlib.sha256(Path(source['path']).read_bytes()).hexdigest()==source['sha256'],'Static source changed since qualification: '+source['path']
assert not Path(row['nativeDir']).exists()
record=json.loads((Path(row['fit'])/'record.json').read_text())
assert hashlib.sha256(Path(record['source']).read_bytes()).hexdigest()==row['masterSha256']
row.update(sourceHead=run('git','rev-parse','HEAD'),status='SIGNED_PRODUCER_BOUND_FOR_NATIVE')
out.write_text(json.dumps(rows,indent=2)+'\n');print(out)
