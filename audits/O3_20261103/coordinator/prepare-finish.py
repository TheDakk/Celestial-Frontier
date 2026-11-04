"""Freeze actual current W2/C261 evidence before signing and any AI finish."""
from pathlib import Path
import hashlib,json,subprocess,sys
slug,w2path,physicalpath,planpath,triage=sys.argv[1:]
B=Path('audits/O3_20261103/coordinator');out=B/'finishes'/slug
assert not out.exists()
read=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
w2=read(w2path);physical=read(physicalpath);plan=read(planpath)[0];report=read(plan['nativeReport'])
assert w2['status']=='W2_CLEAN' and w2['decision']['C261FinishEligible'] is True
assert w2['film']==plan['nativeDir'] and w2['producerCommit']==report['source']==plan['sourceHead']
assert report['status']=='DIAGNOSTIC_PASS'
assert subprocess.check_output(['git','log','-1','--format=%G?',report['source']],text=True).strip()=='G'
assert physical['status']=='PHYSICAL_CLEAN' and len(physical['frames'])==5
for frame in physical['frames']:
 assert frame['independentFullsizeViewed'] is True and sha(frame['file']['path'])==frame['file']['sha256']
rows=[r for r in read(Path(triage)/'current-rows.json') if r['film']==plan['nativeDir']]
assert len(rows)==1 and rows[0]['fragmentTotal']==0 and max(rows[0]['pink'].values())<100
cp=dict(status='FROZEN_W2_CLEAN_BEFORE_AI',id=plan['id'],checkpointReview=w2path,nativeReview=physicalpath,nativePlan=planpath,nativeReport=plan['nativeReport'],triage=triage,newAdmissions=0,I5RecertificationRequired=bool(read(B/'runtime-change-list.json')['gameCodeAndImportedTools']))
for k in ['checkpointReview','nativeReview','nativePlan','nativeReport']:cp[k+'Sha256']=sha(cp[k])
out.mkdir(parents=True);(out/'checkpoint.json').write_text(json.dumps(cp,indent=2)+'\n')
(out/'subjects.json').write_text(json.dumps([dict(id=plan['id'],fit=plan['fit'],nativeReport=plan['nativeReport'])],indent=2)+'\n')
print(json.dumps(dict(status=cp['status'],id=plan['id'],AIStarted=False)))
