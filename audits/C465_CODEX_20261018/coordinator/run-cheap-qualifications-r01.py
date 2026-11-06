"""Independent changed CPU candidate qualifications, serial; a red stops that item only."""
from pathlib import Path
import subprocess,json
B=Path('audits/C465_CODEX_20261018/coordinator');R='audits/C465_CODEX_20261018/w1-motion/other-holds';specs=[('tropicbird-retained-r01',[R+'/run-retained-context.mjs','tropicbird','r01']),('monkey-r01',[R+'/run-one-r01.mjs','monkey']),('monkey-retained-r01',[R+'/run-retained-context.mjs','monkey','r01']),('snowshoe-hare-c2-r01',[R+'/run-c2-r01.mjs','snowshoe-hare']),('chiton-c2-r01',[R+'/run-c2-r01.mjs','chiton']),('cockatoo-c2-r01',[R+'/run-c2-r01.mjs','cockatoo']),('blue-whale-c2-r01',[R+'/run-c2-r01.mjs','blue-whale']),('olm-c2-r01',[R+'/run-c2-r01.mjs','olm']),('deer-tick-r01',[R+'/deer-tick/run-r01.mjs'])];rows=[]
for slug,args in specs:
 if slug=='monkey-retained-r01'and rows[-1]['exitCode']!=0:rows.append(dict(stage=slug,status='NOT_RUN_PREREQUISITE_RED'));continue
 cmd=['python3',str(B/'run-stage.py'),'qualify-'+slug,'node','tools/with-toolchain-lock.mjs','--label','C465-'+slug,'--','node','audits/DISK_RECOVERY_20261017/exclusive.mjs','node',*args];p=subprocess.run(cmd);rows.append(dict(stage=slug,exitCode=p.returncode));(B/'cheap-qualifications-progress-r01.json').write_text(json.dumps(dict(status='RUNNING_SERIAL',rows=rows),indent=2)+'\n')
(B/'cheap-qualifications-result-r01.json').write_text(json.dumps(dict(status='COMPLETE_ITEMS_RETAIN_THEIR_ACTUAL_PASS_OR_RED',rows=rows),indent=2)+'\n');print(json.dumps(rows))
