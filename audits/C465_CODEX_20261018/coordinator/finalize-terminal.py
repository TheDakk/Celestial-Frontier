"""Select completed independent evidence and finalize only envelopes/handoff. No inference, gate or Git mutation."""
from pathlib import Path
import json,hashlib,subprocess,datetime,shutil,copy,os
B=Path('audits/C465_CODEX_20261018');C=B/'coordinator';O=B/'w4-delivery/final';D=B/'w2-checkpoint/w4-final-draft/snapshots/c473-draft-r01';I=B/'w1-motion/final-independent'
read=lambda p:json.loads(Path(p).read_text())
def pin(p):
 p=Path(p);b=p.read_bytes();return dict(path=str(p),sha256=hashlib.sha256(b).hexdigest(),bytes=len(b))
def exact(q):
 r=pin(q['path']);assert r['sha256']==q['sha256']and r['bytes']==q['bytes'];return r
def write(p,d):
 with Path(p).open('x')as f:json.dump(d,f,indent=2);f.write('\n')
def git(*a):return subprocess.check_output(['git',*a])
assert git('branch','--show-current').decode().strip()=='openai/mac'
head=git('rev-parse','HEAD').decode().strip();assert head=='52b6b92889ddea75396a16a3019574401336f5a8' and git('log','-1','--format=%G?').decode().strip()=='G'
review=read(I/'current-review-r01.json');assert pin(I/'current-review-r01.json')['sha256']=='17406a9b2081a319b1c2b8d9f80a1c136a23fdc59f407f147203c3e8fb1f3484';assert review['status']=='PASS' and review['counts']==dict(total=170,priorClaudeAccept=14,READY_FOR_CLAUDE=3,HOLD=153,actualStills=15,newAdmissions=0)
exact(review['rootCurrentManifest']);[exact(q)for q in review['proofs'].values()];assert review['appliedRuntimeImportedToolSealChanges']==0
base='f09484007256f0e733b26442dde12e91cc53515b';protected=['port','tools','main.js','celestial-frontier.html','package.json','package-lock.json'];assert not git('diff','--name-only',base,'--',*protected).strip();assert not git('ls-files','--others','--exclude-standard','--',*protected).strip()
peer=Path('~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md');peerhead=git('rev-parse','anthropic/mac').decode().strip();assert peerhead=='4e2d83613cbf22c36271af435ed21b79e263b9da'
locks=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import fs from'node:fs';import{LOCK_DIRECTORY}from'./tools/with-toolchain-lock.mjs';import{WORKSPACE_LOCK_PATH}from'./port/v2/tools/workspacelock.mjs';console.log(JSON.stringify({toolchain:{path:LOCK_DIRECTORY,exists:fs.existsSync(LOCK_DIRECTORY)},workspace:{path:WORKSPACE_LOCK_PATH,exists:fs.existsSync(WORKSPACE_LOCK_PATH)}}));"],text=True));assert not any(q['exists']for q in locks.values())
assert all(read(p)['status']=='RELEASED'for p in C.glob('paintings/*/lease.json'));assert len(list(C.glob('paintings/*/lease.json')))==32
free=shutil.disk_usage('/System/Volumes/Data').free/2**30;assert free>=42
state=dict(status='TERMINAL_RELEASED',reservation='C466',measuredUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),freeGiB=free,end60GiBTargetMet=free>=60,preInferenceFloorGiB=42,runningFloorGiB=30,minimumRecordedRunningGiB=45.727821350097656,diskReport=pin(C/'disk-end.log'),locks=locks,pendingNativeJobs=0,pendingInferenceJobs=0,pendingSourceDraws=0,all32ImageLeasesReleased=True,peerMailbox=pin(peer),peerHead=peerhead,peerLastRow='C465',signedDeliveryBeforeTerminal=head,appliedRuntimeImportedToolChanges=[],newAdmissions=0,allPairs='HOLD',scope='Free-space timestamp is a measurement, not a promise that other processes cannot change it. End60GiB target remains unmet; no new heavy job is queued. No unique or signed evidence is deleted to meet a target.')
write(O/'terminal-state.json',state)
finalized=[]
for name,status,schema in [('dispositions170.json','FINAL_VERIFIED_DISPOSITIONS','cf.c465-final170/v1'),('hold-witnesses153.json','FINAL_VERIFIED_EVIDENCED_HOLDS','cf.c465-final153-holds/v1'),('five-still-index.json','FINAL_VERIFIED_ACTUAL_SIGNED_READY_PACKETS','cf.c465-final-ready-five-index/v1')]:
 before=read(D/name);after=copy.deepcopy(before);after['status']=status;after['schema']=schema;after['reviewedSource']=pin(D/name);after['independentFinalReview']=pin(I/'current-review-r01.json');after['finalization']='Only envelope metadata changes. All reviewed species rows remain byte-equivalent JSON data.';assert after['rows']==before['rows'];write(O/name,after);assert read(O/name)['rows']==before['rows'];finalized.append(dict(final=pin(O/name),reviewedSource=pin(D/name),rowsExactlyPreserved=True))
plan=C/'PLAN-COMPLETION.md';plan.write_text('''# C465 completed plan selection

Tasks1–7 in the immutable coordinator/PLAN.md are complete at the signed C474 boundary. Task5 delivered Vole,Scallop,Chiton with independent actual five-still W2/W3 and conserved finishes. Task6 completed all32 verified fresh draws/8 source sets; no source clears current authoring eligibility. Task7 selects the exact170/153HOLD/15stills,117-row table, independent current review and execution/housekeeping proofs in final/freeze.json. Required develop6081PASS/final root validation remain current because runtime is byte-identical. Final scratch cleanup/disk report/idle locks and verbatim roadmap archive are selected. No pending job or new-template work remains. Earlier PLAN pending progress is immutable historical handoff, superseded additively here.
''')
active=(C/'roadmap-active-verbatim.md').read_bytes();rp=Path('ROADMAP.md');assert rp.read_bytes()==active
ap=Path('ROADMAP_ARCHIVE.md');old=ap.read_bytes();prefix=b'## C465 ACTIVE handoff archived at C474 TERMINAL - 2026-10-19\n\n';new=prefix+active+b'\n\n'+old;tmp=ap.with_suffix('.c465.tmp');tmp.write_bytes(new);tmp.replace(ap);assert ap.read_bytes()[len(prefix):len(prefix)+len(active)]==active and ap.read_bytes().endswith(old)
r=(C/'terminal-roadmap-draft.md').read_text()
for name in ['dispositions170.json','hold-witnesses153.json','five-still-index.json']:
 oldlink='audits/C465_CODEX_20261018/w2-checkpoint/w4-final-draft/snapshots/c473-draft-r01/'+name;newlink='audits/C465_CODEX_20261018/w4-delivery/final/'+name;assert r.count(oldlink)==1;r=r.replace(oldlink,newlink)
r=r.replace('about55.3GiB',f'{free:.6f}GiB');tmp=rp.with_suffix('.c465.tmp');tmp.write_text(r);tmp.replace(rp)
terminal=f'''# C474 — TERMINAL, C466 RELEASED

Original170: **14 prior Claude accepts +3 READY_FOR_CLAUDE +153 evidenced HOLD**,0 admissions/certifications. READY: Vole,Scallop,Chiton, all15 actual1024x576 stills selected in [final index](five-still-index.json). [All170](dispositions170.json), [153 exact HOLDs](hold-witnesses153.json), [one117-row decision/default table](../../w3-source/DECISIONS-r03.md). All32 fresh best-of-four drawings/eight groups reviewed:8 SOURCE_PASS/24HOLD, actual8%14PASS18FAIL,0 authoring winners/0 fifth draws. No new template built.

Independent final review PASS:6176 selected rows/6161 normalized distinct paths;15 aliases identify the same15 actual stills.170 membership,153 species-bound defects/witnesses,3 signed producers/W2/W3/conservation, source32/table117/C261429films858pins all agree.12 independent mutation controls reject; selected18READY and26paper controls verified. Final envelope copies preserve all reviewed rows exactly; immutable DRAFT sources remain linked in final/freeze.json. No outstanding finding. First checker transitive-selector assumption refusal retained and corrected additively; no gate was re-bound.

58 recorded serial stages +32 released generation leases, no reported interval overlap. Minimum sampled running45.727821GiB;42 pre-inference/30 running floors unchanged. Start cleanup57894bytes; end12634633bytes of own PNG-exact untracked buffers/ignored caches deleted;4 signed raw evidence buffers retained.715 own byte-identical APFS clone paths share0.138169784GiB logical duplicate data. End disk report ran; **{free:.6f}GiB free**, below60GiB end target. Unique originals, finished evidence and history retained. Queue empty; shared toolchain and checkout locks idle; reservation RELEASED.

Current game-code/game-imported-tool changes: none. No I5 recertification request for this run. Cobra cap remains an UNAPPLIED audit proposal because actual C198 seal4de0b804 would change to47620037. First RED/controls retained; no repin, rebind or exception. Exact signed runtime restored; required develop6081PASS and final root validate1010renders/50 baseline probesPASS. No release-content edit remains, GUIDE121 authority unchanged; C464 selector/nine original pins/relative link unchanged. Absolute peer mailbox read at batch end, head4e2d83613c/C465 unchanged.

Claude next: review the three signed READY packets,153 exact HOLDs and117 recommended defaults from local shared Git. Codex next: consume peer review; no pending GPU/native work. Dakk need not relay messages, open another app or wait for remote pushes. No push, PR, GitHub, certification, C223, develop/main merge, release or deploy. All-pairs HOLD.
'''
(O/'TERMINAL.md').write_text(terminal)
mail=Path('audits/MAILBOX/TO_CLAUDE.md');s=mail.read_text();assert '| C474 |'not in s
row=f'| C474 | 2026-10-19 | **TERMINAL — RELEASED (C466).** Original170:14 prior Claude accepts,3 READY,153 evidenced HOLD; Vole,Scallop,Chiton have all15 stills. Queue empty, locks idle; {free:.6f} GiB free, below60 end target,42/30 floors passed (sampled minimum45.727821). | `audits/C465_CODEX_20261018/w4-delivery/final/TERMINAL.md`; final/freeze.json selects independent PASS,6176 rows/6161 distinct paths, final170/153 exact witnesses/15stills/table117. All32 fresh draws reviewed,8SOURCE_PASS24HOLD;0authoring winners/0fifth draws.58stages32leases serial/released. | Current runtime/imported-tool changes none; no I5 request. Cobra cap UNAPPLIED sealed decision; restored develop6081PASS/root validatePASS/C464 unchanged. No new template. Claude:review3READY/holds/defaults; Codex:queue released/consume peer review. No Dakk relay/app switch/push wait. No push/PR/GitHub/certification/C223/develop/main/release/deploy;All-pairs HOLD. |\n'
tmp=mail.with_suffix('.c465.tmp');tmp.write_text(s+'\n\n'+row);tmp.replace(mail)
selected=[O/'README.md',O/'TERMINAL.md',O/'terminal-state.json',O/'current-manifest.json',I/'current-review-r01.json',C/'PLAN-COMPLETION.md',C/'roadmap-active-verbatim.md',Path('ROADMAP.md'),Path('ROADMAP_ARCHIVE.md'),mail]
selected.extend(Path(q['path'])for q in review['proofs'].values());selected.extend(Path(q['final']['path'])for q in finalized)
freeze=dict(schema='cf.c465-final-terminal-freeze/v1',status='TERMINAL_RELEASED',reservation='C466',counts=review['counts'],currentCanonicalStills=15,source32=review['source32'],decisionTableRows=117,rootCurrentManifest=exact(review['rootCurrentManifest']),independentFinalReview=pin(I/'current-review-r01.json'),finalizedEnvelopes=finalized,terminalState=pin(O/'terminal-state.json'),selectedRows=6176,normalizedDistinctPaths=6161,scope='Selected final authorities supersede historical pending envelopes additively. Final data rows exactly match independently reviewed source rows. Current manifest hashes retained; no self-reference or extra-image/admission claim.',rows=[pin(p)for p in sorted(set(selected))],newAdmissions=0,runtimeImportedToolChangesApplied=[],I5RecertificationRequested=False,allPairs='HOLD',signatureBoundary='This freeze and TERMINAL become delivery authority in the signed local C474 commit; staged exact-byte proof excludes itself.')
write(O/'freeze.json',freeze)
paths=[]
for p in B.rglob('*'):
 if not p.is_file()or p.is_symlink():continue
 if '/node_modules/'in str(p)or p.name in ['source-queue.json','status.json','task-report.md']or p.suffix=='.tmp':continue
 paths.append(str(p))
paths.extend(['ROADMAP.md','ROADMAP_ARCHIVE.md','audits/MAILBOX/TO_CLAUDE.md']);Path('/private/tmp/c465-c474-paths.txt').write_text('\n'.join(sorted(set(paths)))+'\n')
Path('/private/tmp/c465-c474-commit.txt').write_text('C474: release C466 with final170 evidence and three READY packets\n\nSelect independent final byte/provenance/semantic PASS, all15 stills,153 exact HOLDs and one117-row decision table. Close32 fresh source draws, preserve unchanged runtime and sealed Cobra proposal, record actual disk headroom and release serial queue. No remote operation or certification.\n')
print(json.dumps(dict(status='READY_FOR_SIGNED_TERMINAL',freeGiB=free,files=len(set(paths)),counts=review['counts'],freeze=pin(O/'freeze.json'))))
