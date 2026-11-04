"""Read-only source consolidation; emits final review facts, never admissions."""
from pathlib import Path
import json,hashlib,copy,collections
B=Path('audits/C266_CODEX_20261017');C=B/'coordinator'
read=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
pin=lambda p:{'path':str(p),'sha256':sha(p),'bytes':Path(p).stat().st_size}
part=read(C/'coverage-partitions-working.json');baseline=read(part['baseline']);rows=copy.deepcopy(baseline['rows']);by={r['name']:r for r in rows};assert len(by)==len(rows)==194
own={r['name'] for r in read(C/'reference-scope.json')['rows']};ownold={r['name']:r for r in read(B/'w4-delivery/remaining-species.json')['rows']}
for name in own:by[name]['c266']=copy.deepcopy(ownold[name]['c266'])
for r in read(C/'peer-other38-final.json')['rows']:by[r['name']]['c266']={**r,'accepted':False,'scope':'Peer-owned CPU hold accounting only'}
source=read(C/'prompt-coverage-final.json')
for r in source['generated']:
 assert sha(r['master'])==r['masterSha256']==sha(r['defaultOriginal']);assert sha(r['verifiedC266Prompt'])==r['promptSha256'];assert sha(r['review'])==r['reviewSha256'];by[r['name']]['c266']={**r,'scope':'GENERATED_SOURCE_ONLY','accepted':False}
for r in source['deferred']:by[r['name']]['c266']={**r,'scope':'GENERATION_CLASS_OR_DECISION_HOLD','accepted':False}
finished={};summaries=[]
for i in range(1,7):
 p=B/'w3-c266-finished'/('finished-%02d'%i)/'finished-review-summary.json';d=read(p);summaries.append(pin(p))
 for r in d['rows']:
  assert r['name'] not in finished
  report=r['report'];q=report['path'] if isinstance(report,dict) else report;expected=report['sha256'] if isinstance(report,dict)else r['reportSha256'];assert sha(q)==expected;assert r['status']=='READY_FOR_CLAUDE' and r['visualVerdict']=='CLEAN';assert r['allFiveOriginalsInspected'] and r['allFiveActual2xInspected'];finished[r['name']]={'status':r['status'],'report':pin(q),'summary':pin(p),'finishedOriginalSha256':r['finishedOriginalSha256']}
assert len(finished)==26
cp={read(p)['name']:(p,read(p))for p in C.glob('*-finish-01/checkpoint.json')};assert set(cp)==set(finished)
for name,(p,d) in cp.items():
 master=p.parent/'finished'/(d['id']+'-finished.png');assert sha(master)==finished[name]['finishedOriginalSha256'];finished[name]['master']=pin(master)
films=read(C/'film-coverage-working.json');groups=collections.defaultdict(list)
for r in films['records']:groups[r['name']].append(r)
assert len(groups)==63
holds=read(C/'visual-hold-index-working.json')['reports'];assert len(holds)==34
filmrows=[]
for name,attempts in groups.items():
 for a in attempts:assert read(a['nativeReport'])['status']==a['nativeStatus']
 a=next((x for x in attempts if x['nativeStatus']=='DIAGNOSTIC_PASS'),attempts[-1]);v={'name':name,'scope':'FIRST_NATIVE_AND_FINISHED_REVIEW','attemptHistory':[{'nativeStatus':x['nativeStatus'],'plan':pin(x['plan']),'report':pin(x['nativeReport'])}for x in attempts],'accepted':False}
 if name in cp:
  p,d=cp[name];assert sha(d['checkpointReview'])==d['checkpointReviewSha256'];assert a['nativeStatus']=='DIAGNOSTIC_PASS';actual=p.parent/'native/report.json';assert read(actual)['status']=='DIAGNOSTIC_PASS';v.update(disposition='READY_FOR_CLAUDE',firstNative='CLEAN_FIRST_NATIVE_C261',checkpoint=pin(d['checkpointReview']),finishedReview=finished[name],finishedNative=pin(actual),producerCheckpoint=pin(p))
 elif a['nativeStatus']=='DIAGNOSTIC_PASS':
  assert len(holds[name])==1;v.update(disposition='VISUAL_HOLD',firstNative='DIAGNOSTIC_PASS',visualReview=pin(holds[name][0]['path']))
 else:v.update(disposition='NATIVE_FAIL_BEFORE_FILM'if name=='Chimpanzee'else'NATIVE_FAIL_AFTER_CAPTURE',firstNative='FAIL')
 by[name]['c266']=v;filmrows.append(v)
for r in films['unfilmed']:by[r['name']]['c266']={**r,'scope':'UNFILMED_CLASS_OR_DECISION_HOLD','accepted':False};filmrows.append(by[r['name']]['c266'])
assert len(filmrows)==77
sets=[own,{r['name']for r in filmrows},{r['name']for r in source['generated']+source['deferred']},{r['name']for r in read(C/'peer-other38-final.json')['rows']}];assert list(map(len,sets))==[50,77,29,38];assert sum(map(len,sets))==len(set.union(*sets))==194 and set.union(*sets)==set(by)
def unchanged(candidate):return all(a=={k:v for k,v in b.items()if k!='c266'}for a,b in zip(baseline['rows'],candidate))
assert unchanged(rows);mutant=copy.deepcopy(rows);mutant[0]['status']='MUTANT_ADMISSION';assert not unchanged(mutant)
assert all(r['c266'].get('accepted',False)is False for r in rows)
stages=[]
for p in C.glob('*.json'):
 try:d=read(p)
 except Exception:continue
 if isinstance(d,dict)and isinstance(d.get('command'),list)and'startedUnix'in d:stages.append((p,d))
finishStages=[]
for name,(p,d) in cp.items():
 slug=p.parent.name.removesuffix('-finish-01');matches=[(q,x)for q,x in stages if any(slug+'-finish-01'in Path(str(a)).parts for a in x['command'])or('rebind-c261-one.mjs'in' '.join(x['command'])and x['command'][-1]==slug)];assert len(matches)==3,(name,len(matches))
 for q,x in matches:assert x['status']=='PASS'and x['exitCode']==0 and x['beforeGiB']>=42 and x['lowestGiB']>=30;finishStages.append({'name':name,'receipt':pin(q),'elapsedSeconds':x['elapsedSeconds'],'beforeGiB':x['beforeGiB'],'lowestGiB':x['lowestGiB']})
assert len(finishStages)==78 and len({r['receipt']['path']for r in finishStages})==78
assert 'turtle-finish-01' in Path('audits/turtle-finish-01/finished').parts
assert 'turtle-finish-01' not in Path('audits/pond-turtle-finish-01/finished').parts
leases=[]
for m in read(C/'paintings/index.json')['masters']:
 p=Path(m['lease']);d=read(p);assert d['status']=='RELEASED'and d['beforeGiB']>=42 and d['lowestGiB']>=30;leases.append(pin(p))
assert len(leases)==19
counts=collections.Counter(r['disposition']for r in filmrows);assert counts['READY_FOR_CLAUDE']==26 and counts['VISUAL_HOLD']==34 and counts['NATIVE_FAIL_BEFORE_FILM']==1 and counts['NATIVE_FAIL_AFTER_CAPTURE']==2
lastW4=[]
for n in ['batch15','batch16']:
 p=B/'w4-delivery'/n/'deliverable-files.json';manifest=read(p)
 for r in manifest['files']:assert sha(r['path'])==r['sha256']
 lastW4.append(pin(p))
out={'schema':'cf.c266-final-review-coverage/v1','status':'FINAL_REVIEW_COVERAGE_ZERO_ADMISSION','lastW4ManifestPins':lastW4,'currentNativeSourcePinUnion':pin(C/'final-protected-pins.json'),'baseline':pin(part['baseline']),'coverage':{'certified':385,'pendingCertification':52,'unaccepted':194,'total':631,'acceptedByThisProgram':0},'partitions':{'ownReference':50,'peerFilm':77,'peerPrompt':29,'otherPeerCPUHold':38},'reference':{'cpuDispositions':46,'DakkDeferred':['Barnacle','Horseshoe Crab','Tardigrade','Fly Larvae']},'film':{'uniqueRows':77,'attemptedRows':63,'attemptRecords':64,'firstNativePass':60,'firstNativeFailRows':3,'C261Clean':26,'visualHold':34,'unfilmedClassDecisionHolds':14,'finishedReady':26,'rows':filmrows},'sources':source,'finishedSummaries':summaries,'finishStageCount':78,'finishStages':finishStages,'inferenceLeasesReleased':leases,'baselineAll194FieldsPreserved':True,'baselineComparatorControls':{'currentPass':True,'mutantStatusRefused':True},'stageSelectorControls':{'exactTurtleDirectoryPasses':True,'PondTurtleSubstringRefused':True},'AllPairs':'HOLD','runtimePatchesApplied':False,'certificationRun':False,'C223Run':False,'GitHubWrite':False,'rows':rows}
p=C/'review-coverage-final.json';p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'status':'PASS','rows':194,'ready':26,'visualHolds':34,'nativeFailRows':3,'unfilmed':14,'CPUReference':50,'generated':19,'deferredPrompts':10,'finishStagesPASS':78,'releasedImageLeases':19,'accepted':0,'output':str(p),'sha256':sha(p)}))
