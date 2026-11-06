from pathlib import Path
import json,subprocess,sys
B=Path('audits/C465_CODEX_20261018/coordinator');slug=sys.argv[1];run=B/'finishes'/slug
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no']).strip(),'Clean signed producer required before finish chain'
import hashlib
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
cp=json.loads((run/'checkpoint.json').read_text())
assert sha(cp['checkpointReview'])==cp['checkpointReviewSha256']
review=json.loads(Path(cp['checkpointReview']).read_text())
assert review['status']=='W2_CLEAN' and review['decision']['C261FinishEligible'] is True
assert sha(cp['nativeReview'])==cp['nativeReviewSha256'] and sha(cp['nativePlan'])==cp['nativePlanSha256'] and sha(cp['nativeReport'])==cp['nativeReportSha256']
physical=json.loads(Path(cp['nativeReview']).read_text());assert physical['status']=='PHYSICAL_CLEAN' and len(physical['frames'])==5
for frame in physical['frames']:assert sha(frame['file']['path'])==frame['file']['sha256'] and frame['independentFullsizeViewed'] is True
assert json.loads(Path(cp['nativeReport']).read_text())['status']=='DIAGNOSTIC_PASS'
film=str(Path(cp['nativeReport']).parent)
current=[x for x in json.loads(Path(cp['triage']+'/current-rows.json').read_text()) if x['film']==film]
assert len(current)==1 and current[0]['fragmentTotal']==0 and max(current[0]['pink'].values())<100
commands=[('ai',['node','audits/AI_FINISH_C121_20261001/finish-batch.mjs',str(run/'finished'),str(run/'subjects.json')]),('rebind',['node',str(B/'rebind-one.mjs'),str(run)]),('native',['python3','audits/C266_CODEX_20261017/coordinator/run-native-one.py',str(run/'finished-plan.json')])]
for name,cmd in commands:
 r=subprocess.run(['python3',str(B/'run-stage.py'),'finish-'+slug+'-'+name,'node','tools/with-toolchain-lock.mjs','--label','C465-'+slug+'-'+name,'--',*cmd]);assert r.returncode==0,(name,'RED: stop chain, no retry')
 if name=='ai':assert json.loads((run/'finished/result.json').read_text())['status']=='PASS'
 if name=='rebind':assert all(x['status']=='PASS'for x in json.loads((run/'rebind-results.json').read_text()))
 if name=='native':assert json.loads((run/'native/report.json').read_text())['status']=='DIAGNOSTIC_PASS'
(run/'chain-verification.json').write_text(json.dumps({'status':'PASS','ai':'PASS','rebind':'PASS','finishedNative':'DIAGNOSTIC_PASS','W3Review':'PENDING'},indent=2)+'\n')
