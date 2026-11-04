"""Fresh default D40 for a previously unprepared raw first-of-kind source only."""
from pathlib import Path
import hashlib,json,subprocess,sys
slug=sys.argv[1]
assert slug in ('marine-worm','polychaete-worm','salp','fly-larvae')
p=Path('audits/O3_20261103/w1-wave-c-soft')/slug/'source-plan.json'
v=json.loads(p.read_text())
for k in ('source','subject','prompt'):
 q=v[k];assert hashlib.sha256(Path(q['path']).read_bytes()).hexdigest()==q['sha256']
out='audits/O3_20261103/coordinator/wave-c-source/'+slug
assert not Path(out).exists()
argv=['node','audits/O3_20261103/coordinator/prepare-keyed-source.mjs',out,v['source']['path'],v['subject']['path'],v['prompt']['path'],v['keyColor']]
subprocess.run(argv,check=True)
