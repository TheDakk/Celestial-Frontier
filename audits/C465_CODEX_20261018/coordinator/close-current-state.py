"""Read-only final source/runtime/queue selection; no gate, inference or Git mutation."""
from pathlib import Path
import json,hashlib,subprocess,datetime,shutil,os
B=Path('audits/C465_CODEX_20261018');C=B/'coordinator'
read=lambda p:json.loads(Path(p).read_text())
def pin(p):
 p=Path(p);d=p.read_bytes();return dict(path=str(p),sha256=hashlib.sha256(d).hexdigest(),bytes=len(d))
def git(*a):return subprocess.check_output(['git',*a])
assert git('branch','--show-current').decode().strip()=='openai/mac'
head=git('rev-parse','HEAD').decode().strip();assert git('log','-1','--format=%G?').decode().strip()=='G'
pre=read(C/'preflight.json');base='f09484007256f0e733b26442dde12e91cc53515b'
protected=['port','tools','main.js','celestial-frontier.html','package.json','package-lock.json']
changes=git('diff','--name-only',base,'--',*protected).decode().splitlines();extra=git('ls-files','--others','--exclude-standard','--',*protected).decode().splitlines();assert not changes and not extra
for q in pre['selectedPins']:
 assert pin(q['path'])==q
selector=pin(pre['selector']['path']);assert selector['sha256']==pre['selector']['sha256']
link=Path('audits/C464_I5_EPOCH_20261018/epoch/instrument/shared');assert link.is_symlink() and os.readlink(link)==pre['relativeSharedLink']
peer=Path('~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md');peerpin=pin(peer);peerhead=git('rev-parse','anthropic/mac').decode().strip();assert peerhead==pre['exactPeerHead']
rows=[s for s in peer.read_text().splitlines() if any(s.startswith('| C'+str(n)+' |') for n in [463,464,465])];assert len(rows)==3
stages=[]
for p in C.glob('*.json'):
 d=read(p)
 if isinstance(d,dict) and 'stage' in d:
  assert d['status']in ['PASS','RED'] and 'elapsedSeconds'in d and d['beforeGiB']>=42 and d['lowestGiB']>=30
  stages.append(dict(stage=d['stage'],status=d['status'],file=pin(p),log=pin(p.with_suffix('.log'))))
leases=[]
for p in sorted(C.glob('paintings/*/lease.json')):
 d=read(p);assert d['status']=='RELEASED' and d['beforeGiB']>=42 and d['lowestGiB']>=30;leases.append(pin(p))
assert len(leases)==32
locks=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import fs from'node:fs';import{LOCK_DIRECTORY}from'./tools/with-toolchain-lock.mjs';import{WORKSPACE_LOCK_PATH}from'./port/v2/tools/workspacelock.mjs';console.log(JSON.stringify({toolchain:{path:LOCK_DIRECTORY,exists:fs.existsSync(LOCK_DIRECTORY)},workspace:{path:WORKSPACE_LOCK_PATH,exists:fs.existsSync(WORKSPACE_LOCK_PATH)}}));"],text=True));assert not any(r['exists']for r in locks.values())
for slug in ['vole-r02','scallop-c2-r01','chiton-c2-r02']:
 p=read(B/'ready'/slug/'packet.json');assert p['status']=='READY_FOR_CLAUDE' and len(p['canonicalFive'])==5 and not p['runtimeAppliedChanges']
 assert all(pin(q['file']['path'])==q['file']for q in p['canonicalFive'])
source=read(B/'w3-source/source32-summary.json');assert source['counts']==dict(groups=8,originals=32,SOURCE_PASS=8,SOURCE_HOLD=24,canonical8PercentPASS=14,canonical8PercentHOLD=18,currentAPIAuthoringWinners=0,newAdmissions=0,fifthDraws=0)
assert read(C/'final-root-validate.json')['status']=='PASS' and read(C/'develop-restored-runtime.json')['status']=='PASS'
scratch=read(C/'scratch-end.json');assert scratch['status']=='PASS' and scratch['uniqueOriginalsOrFinishedAssetsDeleted']==0
sharing=read(C/'disk-sharing/clone-result.json');assert sharing['status']=='PASS'
result=dict(schema='cf.c465-root-current-closure/v1',status='PASS_CURRENT_SOURCE_RUNTIME_QUEUE_CLOSED',observedSignedHead=head,checkedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),counts=dict(original170=170,priorClaudeAccept=14,READY_FOR_CLAUDE=3,HOLD=153,currentStills=15,newAdmissions=0),queue=dict(pendingHeavyJobs=0,pendingInference=0,pendingNative=0,all32ImageLeasesReleased=True,reservation='C466 remains active only until final paper audit and signed TERMINAL'),sourceCounts=source['counts'],currentRuntimeBaseline=base,protectedChanges=changes,protectedUntracked=extra,runtimeImportedToolAppliedChanges=[],I5RecertificationRequested=False,unappliedCobra=pin(C/'runtime-proposal-unapplied/disposition.json'),runtimeRestoredProof=pin(C/'runtime-restored-proof.json'),develop=pin(C/'develop-restored-runtime.json'),finalRootValidate=pin(C/'final-root-validate.json'),certificateSelector=selector,selectedC464Pins=pre['selectedPins'],sharedInstrumentLink=dict(path=str(link),target=os.readlink(link)),peerMailbox=peerpin,peerRows=rows,peerHead=peerhead,locks=locks,stageCount=len(stages),stages=stages,generatorLeases=leases,scratch=pin(C/'scratch-end.json'),sharing=pin(C/'disk-sharing/clone-result.json'),freeGiB=shutil.disk_usage('/System/Volumes/Data').free/2**30,endDiskReport=pin(C/'disk-end.log'),endTarget60GiBMet=shutil.disk_usage('/System/Volumes/Data').free>=60*2**30,diskNote='42 GiB pre-inference and30 GiB running floors passed. Actual end free below60 GiB advisory target; unique originals/signed evidence are retained. No claim that source outputs or Git objects are disposable.',forbiddenOperationsPerformed=[],allPairs='HOLD',finalIndependentReview='PENDING_CURRENT_MANIFEST_AND170')
with (C/'current-closure-r01.json').open('x')as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({k:result[k]for k in ['status','counts','stageCount','freeGiB','endTarget60GiBMet']}))
