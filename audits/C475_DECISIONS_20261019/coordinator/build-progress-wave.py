"""Overlay only actual reviewed READY packets on an immutable170-species handoff."""
from pathlib import Path
import json,hashlib,sys,collections
prior,out=sys.argv[1:];out=Path(out);assert not out.exists()
B=Path('audits/C475_DECISIONS_20261019')
def pin(p):
 p=Path(p);d=p.read_bytes();return dict(path=str(p),sha256=hashlib.sha256(d).hexdigest(),bytes=len(d))
j=json.loads(Path(prior).read_text());rows={r['name']:r for r in j['rows']};assert len(rows)==170
for p in sorted((B/'ready').glob('*/packet.json')):
 a=json.loads(p.read_text());v=json.loads((p.parent/'verification.json').read_text());assert a['status']=='READY_FOR_CLAUDE'and v['status']=='PASS'and a['newAdmissions']==0 and len(a['canonicalFive'])==5
 for f in a['canonicalFive']:assert pin(f['file']['path'])==f['file']
 assert a['name']in rows;prev=rows[a['name']]
 if prev['status']=='READY_FOR_CLAUDE':assert prev['packet']==pin(p);continue
 assert prev['status']=='HOLD'
 rows[a['name']]=dict(name=a['name'],status='READY_FOR_CLAUDE',category='C475_ACTUAL_FINISHED_PACKET',newAdmission=False,defect=None,packet=pin(p),verification=pin(p.parent/'verification.json'),producer=a['producer'],allFiveActual=a['canonicalFive'],previousDisposition=prev,I5RecertificationRequired=True)
j['rows']=list(rows.values());c=collections.Counter(r['status']for r in j['rows']);assert 170-c['READY_FOR_CLAUDE']-c['HOLD']==17
j['counts']=dict(original170=170,priorClaudeAccept=17,READY=c['READY_FOR_CLAUDE'],HOLD=c['HOLD']);j['status']='ACTIVE_PARTIAL_DELIVERY_NOT_TERMINAL';out.write_text(json.dumps(j,indent=2)+'\n');print(json.dumps(j['counts']))
