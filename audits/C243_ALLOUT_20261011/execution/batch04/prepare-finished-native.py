"""Rebind only qualified group results, then form exact finished-native inputs."""
import pathlib,json,subprocess,hashlib
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution/batch04');A=B/'ai-finish';read=lambda p:json.loads(pathlib.Path(p).read_text());original={r['id']:r for r in read(B/'native-plan-reviewed.json')};plan=[]
for i in range(1,5):
 finished=A/('finish-%02d'%i);subjects=A/('subjects-%02d.json'%i);out=A/('rebound-%02d'%i);r=read(finished/'result.json');assert r['status']=='PASS';assert not out.exists()
 subprocess.run(['node','audits/AI_FINISH_C121_20261001/rebind-batch.mjs',str(finished),str(subjects),str(out)],check=True)
 rebound=read(out/'rebind-summary.json');assert all(x['status']=='PASS' and x['geometryByteIdentical'] and x['recompiledPaintSkinIdentical'] for x in rebound)
 for subject in read(subjects):
  old=original[subject['id']];proof=read(out/subject['id']/'finished-rebind.json');assert proof['status']=='PASS';n={**old,'fit':str(out/subject['id']),'nativeDir':str(A/'native-01'/subject['id']),'nativeReport':str(A/'native-01'/subject['id']/'report.json'),'originalNativeReport':old['nativeReport']};plan.append(n)
assert len(plan)==13 and len({r['id'] for r in plan})==13
with (A/'native-plan-finished.json').open('x') as f:json.dump(plan,f,indent=2);f.write('\n')
print(json.dumps({'rebindPass':len(plan),'finishedNativePlan':str(A/'native-plan-finished.json')}))
