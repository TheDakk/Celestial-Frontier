"""Freeze an actual reviewed conserved-finish packet; no acceptance or certification."""
from pathlib import Path
import json,hashlib,subprocess,struct,sys,copy
name,slug,w2path,w3path,triage=sys.argv[1:];B=Path('audits/C465_CODEX_20261018');out=B/'ready'/slug;assert not out.exists()
read=lambda p:json.loads(Path(p).read_text())
def pin(p):
 p=Path(p);d=p.read_bytes();return dict(path=str(p),sha256=hashlib.sha256(d).hexdigest(),bytes=len(d))
def exact(p):assert pin(p['path'])['sha256']==p['sha256'];return p
w2=read(w2path);w3=read(w3path);assert w2['status']=='W2_CLEAN' and w3['status']=='W3_CLEAN' and w3['physicalStatus']=='PHYSICAL_CLEAN'
film=w3['film'];fit=w3['fit'];assert w2['film']==film;report=read(Path(film)/'report.json');assert report['status']=='DIAGNOSTIC_PASS' and report['source']==w3['producerCommit']==w2['producerCommit']
producer=report['source'];assert subprocess.check_output(['git','log','-1','--format=%G?',producer],text=True).strip()=='G'
frames=['turn1-hit-reaction-50','turn2-dodge-reaction-50','turn3-hit-reaction-50','turn3-hit-idle-50','turn3-hit-idle-90'];five=[]
assert [x['id']for x in w3['frames']]==frames
for f in w3['frames']:
 assert f['actualFullFrameViewed'] is True and f['dimensions']==[1024,576]
 p=exact(f['actual']);assert p['path']==str(Path(film)/(f['id']+'.png'));assert list(struct.unpack('>II',Path(p['path']).read_bytes()[16:24]))==[1024,576];five.append(dict(id=f['id'],file=p,dimensions=[1024,576]))
rows=read(Path(triage)/'current-rows.json');current=[r for r in rows if r['film']==film];assert len(current)==1 and current[0]['fragmentTotal']==0 and max(current[0]['pink'].values())<100
for p in read(Path(triage)/'freeze.json')['pins']:assert hashlib.sha256(Path(p['file']).read_bytes()).hexdigest()==p['sha256']
run=Path(film).parent;cp=read(run/'checkpoint.json');assert cp['status']=='FROZEN_W2_CLEAN_BEFORE_AI';assert pin(cp['checkpointReview'])['sha256']==cp['checkpointReviewSha256'];assert read(run/'finished/result.json')['status']=='PASS';assert all(r['status']=='PASS'and r['geometryByteIdentical'] for r in read(run/'rebind-results.json'))
manifest=read(Path(fit)/'parts/manifest.json');parts=[exact(dict(path=str(Path(fit)/'parts'/r['path']),sha256=r['sha256'])) for r in manifest['parts']]
record=read(Path(fit)/'record.json');assets=[pin(p)for p in sorted(Path(fit).rglob('*')) if p.is_file()];assets.extend([pin(record['source']),pin(Path(film)/'report.json'),pin(Path(film)/'battle-full.webm'),pin(run/'checkpoint.json'),pin(run/'subjects.json'),pin(run/'finished-plan.json'),pin(run/'finished/result.json'),pin(run/'rebind-results.json'),pin(w2path),pin(w3path),pin(Path(triage)/'freeze.json'),pin(Path(triage)/'verification.json'),pin(Path(triage)/'current-rows.json')]);assets.extend(x['file']for x in five)
p=dict(schema='cf.c465-ready-for-claude/v1',id=w3['id'],name=name,status='READY_FOR_CLAUDE',newAdmissions=0,producer=dict(commit=producer,signature='G'),fit=fit,film=film,master=pin(record['source']),sourceOriginal=exact(w3['masterReview']['original']),preAI=pin(run/'checkpoint.json'),postW2=pin(w2path),W3=pin(w3path),canonicalFive=five,partCount=len(parts),parts=parts,C261=dict(triage=triage,currentFilm=current[0],freeze=pin(Path(triage)/'freeze.json')),runtimeAppliedChanges=[],I5RecertificationRequired=False,allPairs='HOLD',limitations=['Only reviewed canonical stills/retained defect contexts; dodgeFX partially covers right actor.','READY requests Claude review; no admission or certification.'])
out.mkdir(parents=True);(out/'packet.json').write_text(json.dumps(p,indent=2)+'\n');assets.append(pin(out/'packet.json'));(out/'manifest.json').write_text(json.dumps(dict(status='PASS_ACTUAL_REVIEWED_PACKET',rows=assets),indent=2)+'\n')
# Actual positive packet plus missing/stale still, wrong state/film and changed current numeric controls.
def valid(q):
 return q['status']=='READY_FOR_CLAUDE'and q['producer']['signature']=='G'and len(q['canonicalFive'])==5 and [x['id']for x in q['canonicalFive']]==frames and all(x['file']['path']==str(Path(q['film'])/(x['id']+'.png'))and pin(x['file']['path'])['sha256']==x['file']['sha256'] for x in q['canonicalFive'])and q['C261']['currentFilm']['film']==q['film']and q['C261']['currentFilm']['fragmentTotal']==0 and max(q['C261']['currentFilm']['pink'].values())<100
assert valid(p);controls=[]
for tag in ['missing-still','stale-still','wrong-status','wrong-film','fragment','pink']:
 q=copy.deepcopy(p)
 if tag=='missing-still':q['canonicalFive'].pop()
 if tag=='stale-still':q['canonicalFive'][0]['file']['sha256']='0'*64
 if tag=='wrong-status':q['status']='HOLD'
 if tag=='wrong-film':q['film']='MUTANT'
 if tag=='fragment':q['C261']['currentFilm']['fragmentTotal']=1
 if tag=='pink':q['C261']['currentFilm']['pink']['turn3-hit-idle-50']=100
 assert not valid(q),tag;controls.append(tag)
(out/'verification.json').write_text(json.dumps(dict(status='PASS',positiveActualPacket=True,negativeControls=controls,pins=len(assets),fiveActual=[1024,576],admissions=0),indent=2)+'\n');print(json.dumps(dict(status='READY_FOR_CLAUDE',name=name,packet=str(out/'packet.json'),pins=len(assets),parts=len(parts),controls=len(controls))))
