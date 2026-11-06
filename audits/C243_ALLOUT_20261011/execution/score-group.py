"""Observe, score and collect one already inspected candidate group under the shared lock."""
import json, subprocess, sys
from pathlib import Path
base=Path('audits/C243_ALLOUT_20261011/execution')
pilot,tag=sys.argv[1:]
rows=json.loads(Path(pilot).read_text())
for r in rows:
    if not Path(r['packet']+'/visible-anatomy.json').exists():
        subprocess.run(['node',str(base/'observe-candidate.mjs'),r['packet'],r['packet']+'/visual-note.json'],check=True)
subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs',str(Path(rows[0]['packet']).parent),tag,'--no-native','--extra-refs=audits/C234_PROGRAM_20261011/phase6/reference-pool.json','--pilot='+pilot],check=True)
subprocess.run(['node',str(base/'collect-attempts.mjs'),pilot,tag],check=True)
