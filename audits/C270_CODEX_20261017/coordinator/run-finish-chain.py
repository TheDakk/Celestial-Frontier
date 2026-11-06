from pathlib import Path
import json,subprocess,sys
B=Path('audits/C270_CODEX_20261017/coordinator');slug=sys.argv[1];run=B/'finishes'/slug
commands=[('ai',['node','audits/AI_FINISH_C121_20261001/finish-batch.mjs',str(run/'finished'),str(run/'subjects.json')]),('rebind',['node',str(B/'rebind-one.mjs'),str(run)]),('native',['python3','audits/C266_CODEX_20261017/coordinator/run-native-one.py',str(run/'finished-plan.json')])]
for name,cmd in commands:
 r=subprocess.run(['python3',str(B/'run-stage.py'),'finish-'+slug+'-'+name,'node','tools/with-toolchain-lock.mjs','--label','C270-'+slug+'-'+name,'--',*cmd]);assert r.returncode==0,(name,'RED: stop chain, no retry')
 if name=='ai':assert json.loads((run/'finished/result.json').read_text())['status']=='PASS'
 if name=='rebind':assert all(x['status']=='PASS'for x in json.loads((run/'rebind-results.json').read_text()))
 if name=='native':assert json.loads((run/'native/report.json').read_text())['status']=='DIAGNOSTIC_PASS'
(run/'chain-verification.json').write_text(json.dumps({'status':'PASS','ai':'PASS','rebind':'PASS','finishedNative':'DIAGNOSTIC_PASS','W3Review':'PENDING'},indent=2)+'\n')
