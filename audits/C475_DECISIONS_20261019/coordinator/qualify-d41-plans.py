"""Serial unchanged static qualifications; each independent fit retains its result."""
from pathlib import Path
import json, subprocess, sys
B=Path('audits/C475_DECISIONS_20261019/coordinator')
rows=[]
for slug in sys.argv[1:]:
    p=B/'plans'/slug/'plan.json'
    r=json.loads(p.read_text())[0]
    command=['python3',str(B/'run-stage.py'),slug+'-root-static','node','tools/with-toolchain-lock.mjs','--label','C475-'+slug+'-static','--','node','audits/DISK_RECOVERY_20261017/exclusive.mjs','node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',r['fit'],r['staticReport']]
    code=subprocess.run(command).returncode
    if code==0:
        subprocess.run(['python3',str(B/'bind-plan-realm.py'),str(p)],check=True)
    rows.append(dict(slug=slug,exitCode=code))
print(json.dumps(rows))
sys.exit(1 if any(r['exitCode'] for r in rows) else 0)
