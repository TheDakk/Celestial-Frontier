"""Root-only serial CPU author queue; no intake/static/native/AI or automatic retries."""
from pathlib import Path
import json,os,subprocess,time
B=Path('audits/O3_20261103/coordinator');out=B/'wave-b-author-results/batch.json';assert not out.exists()
rows=[r for r in json.loads(Path('audits/O3_20261103/w1-kin-design/recipes-r02/requests.json').read_text())['rows'] if r['preparationEligible'] and r['order']!=16]
assert len(rows)==18
done=[]
for r in rows:
 assert time.time()<1793790000,'O3 cutoff: do not begin another item'
 s=os.statvfs('.');free=s.f_bavail*s.f_frsize/1024**3;assert free>=42,'Unchanged per-item start floor'
 result=subprocess.run(['python3','-B',str(B/'run-kin-row.py'),str(r['order'])])
 assert result.returncode==0,'First unexpected process failure stops; no retry'
 done.append(dict(order=r['order'],name=r['name'],beforeGiB=free))
out.write_text(json.dumps(dict(status='PASS_SERIAL_AUTHOR_ATTEMPTS',items=done,intakeStaticNativeAIRuns=0),indent=2)+'\n')
