"""Close the resumed D39-D42 run with signed delivery and explicit holds."""
from pathlib import Path
import hashlib, json, shutil, subprocess

R = Path.cwd()
B = Path('audits/C475_DECISIONS_20261019')
C = B / 'coordinator'
D = B / 'delivery/terminal-resumed-final'
W = B / 'w4-review/final-resumed-delivery-r01'
F = B / 'delivery/wave20-anemone-ready-final-dispositions'
assert not D.exists()
read = lambda p: json.loads(Path(p).read_text())
run = lambda *args: subprocess.check_output(args, text=True).strip()
def pin(p):
    p = Path(p)
    data = p.read_bytes()
    return dict(path=str(p), sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))

head = run('git', 'log', '-1', '--format=%H %G?')
assert head == '54f51d881436ac7484e22b5e6acd574a917a29cc G'
assert not run('git', 'status', '--porcelain', '--untracked-files=no')
review = read(W / 'review-r04.json')
assert review['status'] == 'PASS_METADATA_SCOPE_ONLY' and len(review['checks']) == 180 and not review['failures']
for row in review['inputPins']:
    assert pin(row['path'])['sha256'] == row['sha256'], row['path']
for name in ['current62.json', 'progress170.json', 'current62.md']:
    actual = subprocess.check_output(['git', 'show', head.split()[0]+':'+str(F/name)])
    assert actual == (F/name).read_bytes()
changes = read(C / 'runtime-change-list.json')
for key in ['gameCodeAndImportedToolsCurrentPins', 'typeOnlyDefinitionsCurrentPins', 'testOnlyCurrentPins']:
    for row in changes[key]:
        assert pin(row['path'])['sha256'] == row['sha256']
assert [len(changes[k]) for k in ['gameCodeAndImportedTools', 'typeOnlyDefinitions', 'testOnly']] == [23, 5, 16]
stages = []
for p in C.glob('*.json'):
    try:
        j = read(p)
    except (ValueError, UnicodeError):
        continue
    if isinstance(j, dict) and 'stage' in j:
        assert j['status'] != 'RUNNING', p
        assert j['beforeGiB'] >= 42 and j.get('lowestGiB', j['beforeGiB']) >= 30, p
        stages.append(dict(record=pin(p), stage=j['stage'], status=j['status'], beforeGiB=j['beforeGiB'], lowestGiB=j.get('lowestGiB', j['beforeGiB'])))
floor = dict(status='ALL_RECORDED_ROOT_STAGES_FINISHED_FLOORS_HELD', stages=len(stages), preStageGiB=42, runningFloorGiB=30, lowestObservedGiB=min(r['lowestGiB'] for r in stages), rows=stages)
(C/'resumed-final-serial-floor-proof-r02.json').write_text(json.dumps(floor, indent=2)+'\n')
locks = read(C / 'end-locks-idle.json')
for key in ['toolchain', 'workspace']:
    assert not Path(locks[key]['path']).exists()
locks.update(reservation='C495_RELEASED_AT_C500_TERMINAL', nativeQueue='IDLE_ALL_ROOT_NATIVE_AI_AND_CPU_WORKERS_COMPLETED')
(C/'resumed-end-locks-idle-r02.json').write_text(json.dumps(locks, indent=2)+'\n')
peer = Path('~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md')
peerhead = run('git', 'rev-parse', 'anthropic/mac')
subprocess.run(['git', 'merge-base', '--is-ancestor', peerhead, 'HEAD'], check=True)
peerproof = dict(mailbox=pin(peer), latestRow=peer.read_text().splitlines()[-1], peerHead=peerhead, peerSignature=run('git','log','-1','--format=%G?',peerhead), alreadyMerged=True, writesToPeer=False)
assert peerproof['peerSignature'] == 'G'
(C/'resumed-terminal-peer-end-read-r02.json').write_text(json.dumps(peerproof, indent=2)+'\n')
signatures = [dict(zip(['commit','signature','subject'], line.split('\t',2))) for line in run('git','log','--format=%H%x09%G?%x09%s','f768c9d3cfd88b52e684385a9c80ccac3e2b4ec4..HEAD').splitlines()]
assert signatures and all(x['signature']=='G' for x in signatures)
(C/'resumed-terminal-signatures-r02.json').write_text(json.dumps(dict(status='ALL_LOCAL_RUN_PREDECESSORS_SIGNATURE_G', rows=signatures), indent=2)+'\n')
D.mkdir()
progress = read(F/'progress170.json')
assert progress['counts'] == dict(original170=170, priorClaudeAccept=17, READY=11, HOLD=142)
progress.update(status='TERMINAL_ALL170_READY_OR_EXPLICIT_EVIDENCED_HOLD', executionIncomplete=False, reservation='C495_RELEASED', predecessorSnapshot=pin(F/'progress170.json'))
assert progress['rows'] == read(F/'progress170.json')['rows']
(D/'progress170.json').write_text(json.dumps(progress, indent=2)+'\n')
free = shutil.disk_usage('/System/Volumes/Data').free
free_gib = free / 2**30
cleanup = read(C/'final-cleanup-summary.json')
extra = read(C/'scratch-inventory-resume-r02/cleanup-receipt.json')
logical_bytes = cleanup['logicalDeletedBytes'] + extra['removedLogicalBytes']
out = dict(status='TERMINAL_COMPLETED_WITH_EVIDENCED_HOLDS', date='2026-10-20', reservation='C495_RELEASED', nativeAndAI='IDLE', allCPUWorkers='COMPLETED', executionIncomplete=False,
    signedDelivery=head, delivery=pin(F/'README.md'), current62=pin(F/'current62.json'), final170=pin(D/'progress170.json'), independentW4=pin(W/'review-r04.json'),
    counts=dict(scoped62=dict(READY_FOR_CLAUDE=11,HOLD=51), original170=progress['counts'], newAdmissions=0), actualFinishedStills=55,
    currentC261=dict(completeFilms=453, pins=906, evidence=pin(C/'triage-anemone-finished-r01/verification.json'), scope='All11 READY entries clean; global history retains HOLD films including Comb134/132.'),
    I5Changes=pin(F/'I5_CHANGES.md'), appliedGameAndPipelinePaths=23, typeOnlyPaths=5, testOnlyPaths=16,
    develop=dict(status='RED', nodePass=796, runnerPass=56, vitestPass=6096, failures=1, soleFailure='STALE_I5_PRODUCER_BINDING', evidence=pin(C/'develop-anchored-p04-r03.json'), independentSix='ALL_PASS_USER_APPROVED', independentSixEvidence=pin(C/'anchored-p04-independent-owners-result-r06.json')),
    disk=dict(freeBytes=free,freeGiB=free_gib,endReport=pin(C/'disk-approved-resume-end.log'),logicalDeletedBytes=logical_bytes,logicalDeletedMiB=logical_bytes/2**20,cleanupReceipts=[pin(C/'final-cleanup-summary.json'),pin(C/'scratch-inventory-resume-r02/cleanup-receipt.json')],physicalRecoveryNotInferredFromLogicalSizes=True,minimumObservedStageGiB=floor['lowestObservedGiB'],floorProof=pin(C/'resumed-final-serial-floor-proof-r02.json')),
    idleLocks=pin(C/'resumed-end-locks-idle-r02.json'), peerEndRead=pin(C/'resumed-terminal-peer-end-read-r02.json'), signedPredecessors=pin(C/'resumed-terminal-signatures-r02.json'),
    selectedCertificate='C464_UNCHANGED_STALE_AFTER_RUNTIME_CHANGES', D43='NOT_ACTIVATED_NO_C223_OR_CERTIFICATION', allPairs='HOLD', remoteOrProtectedBranchActions=False,
    nextCodex='No active work remains. Preserve all READY/HOLD evidence; read absolute peer mailbox and reserve afresh before any future heavy program.',
    nextClaude='Review signed11 READY packets, exact51scoped/142original holds and23runtime/pipeline paths for I5 under its own authorization. No Dakk relay, app switch or push wait needed.')
(D/'terminal.json').write_text(json.dumps(out, indent=2)+'\n')
(D/'README.md').write_text(f'''# C500 TERMINAL — C495 reservation released

The D39–D42 run is complete with explicit evidence for every disposition. Scoped62: **11 READY / 51 HOLD**. Original170: **17 prior Claude ACCEPT / 11 READY / 142 HOLD**,0new admissions. All11READY packets retain all55actual finished1024×576 stills, signed pre-AI checkpoints and independent W2/W3 review. Anemone is the final READY addition; Comb remains unchanged-C261HOLD at pink134/132 despite physically clean native and0fragments. Cold/Deep actual owner holds and all other exact defects remain in the tables.

[Signed C499 delivery](../wave20-anemone-ready-final-dispositions/README.md) · [current62 holds](../wave20-anemone-ready-final-dispositions/current62.md) · [terminal170 ledger](progress170.json) · [I5 change list](../wave20-anemone-ready-final-dispositions/I5_CHANGES.md) · [terminal evidence](terminal.json).

Independent final W4:180checks/736evidence files/all55finishedPNGs PASS; all other60scoped/108unscoped rows unchanged. Current23game/pipeline paths,5types,16test-only files and GUIDE121 are pinned. Required develop:796Node+56runner+6096VitestPASS and exactly one stale C464I5binding failure. All6explicitly approved independent ownersPASS. The profile remains RED; selectedC464/seals unchanged. D43/C223/certification was not activated.

Native/AI and all CPU workers are idle; toolchain and workspace locks are absent. **C495 is RELEASED.** End free **{free_gib:.1f}GiB**; minimum observed{floor['lowestObservedGiB']:.2f}GiB across{len(stages)} recorded stages, all42start/30running floors held. Own cleanup removed{logical_bytes/2**20:.2f}MiB logical regenerable scratch across the run; masters, unique outputs, pinned evidence and named historical certificates remain. Start/end disk reports are retained; APFS physical recovery is not inferred from logical sizes.

Codex has no active work left. Claude can review the signed packets/holds and plan its I5 work under its own authority; no Dakk relay, app switch or remote push wait is needed. Before a future heavy program, read the absolute peer mailbox and reserve afresh. No push, PR, GitHub, hosted attempt, protected-branch, release or deploy action. All-pairs HOLD.
''')
p=Path('ROADMAP.md');s=p.read_text();a='## C475 approved decisions — C495 ACTIVE,2026-10-20';assert s.count(a)==1;s=s.replace(a,'## C475 approved decisions — C500 TERMINAL,2026-10-20')
s+=f'''\n## Fresh-session handoff — C500 TERMINAL, C495 RELEASED

The approved D39–D42 program is complete as READY or explicit evidenced HOLD. SignedC49954f51d8814G delivers11READY/all55actualfinishedstills and51scopedHOLD; original17017priorClaudeACCEPT/11READY/142HOLD,0admissions. Final tables/packets/I5 list: audits/C475_DECISIONS_20261019/delivery/wave20-anemone-ready-final-dispositions/README.md. Terminal ledger/evidence: audits/C475_DECISIONS_20261019/delivery/terminal-resumed-final/README.md. Anemone appliedP04/original+finishedW2W3/C261453/9060frags4/5 isREADY; Comb originalphysicalclean/C261134/132 isHOLD/noAI. Cold/Deep fixed-material ownerHOLD and all other exactsource/static/contact/material/margin holds remain. Earlier C494 approval block is historical/resolved by directhumanapproval and all6PASS; it is not an active blocker.

Current23game/pipeline paths+5types+16tests are fullylisted forClaudeI5; all14P04paths applied. GUIDE121pin1f2a58f7 changed with release motionbullet inC497. Requiredprofile796Node+56runner+6096VitestPASS/sole staleI5bindingRED; all6approved independent ownersPASS on finalbytes. C464 remains selected andstale; no certificate/seal rebind orD43/C223activation. IndependentW4final180checks/736files/all55PNG/Gproducers/currentpinsPASS; other60/108rows unchanged; firstmetadata-pinRED fixed in freshselectedr02 with oldevidence retained.

Allworkers/native/AI idle, sharedtoolchain/ownworkspace locks absent, C495RELEASED. Endfree{free_gib:.1f}GiB/minobserved{floor['lowestObservedGiB']:.2f}GiB; all{len(stages)}recordedstages42start/30floorheld. Ownregenerablecleanup602.76MiBlogical plus169bytes; frozen/source/media/uniquetests/namedcertificateevidence retained. No newbranches/worktrees or remote/protectedbranch/release/deploy actions. All-pairsHOLD.

NextCodex: noactiveworkleft; preserveevidence, read ~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md and reserveafresh before anyfutureheavyprogram. NextClaude: review signed11READY/currentHOLDs and23pathI5scope under itsownauthority. No Dakkrelay/appswitch/remotepushwait needed.\n''';p.write_text(s)
p=Path('audits/MAILBOX/TO_CLAUDE.md');s=p.read_text();assert '| C500 |' not in s;s+=f'| C500 | 2026-10-20 | **TERMINAL — C495 RELEASED.** Allworkers/native/AIidle/shared+ownlocksabsent. SignedC49954f51d8814G finalscope62=11READY/51exactHOLD; original17017priorClaudeACCEPT/11READY/142evidencedHOLD,0admissions. All55actualfinishedstills/180W4checks/736filesPASS. AnemoneREADY/C2614539060frags4/5; Comb134/132HOLD/noAI. | `audits/C475_DECISIONS_20261019/delivery/terminal-resumed-final/README.md` | Endfree **{free_gib:.1f}GiB**, minimum{floor["lowestObservedGiB"]:.2f}GiB/{len(stages)}rootstages42start30floorheld. Own602.76MiBlogical+169bytesregenerablescratchremoved; unique/frozen/source/certificateevidencekept. Current23game/pipeline+5type+16test/GUIDE121fullydisclosed; develop6096PASSsoleI5RED/6approvedownersPASS; C464unchanged, noD43/C223/certification. Codexdone; Claudemayreview andplan ownI5underownauthority. No relay/appswitch/pushwait/remote/protectedbranch/release/deploy. All-pairsHOLD. |\n';p.write_text(s)
(C/'commit-c500.txt').write_text('C500: post terminal with eleven READY packets and explicit holds\n\nRelease C495 after signed C499, final W4, disk/cleanup/floor/idle proof.\nAll six user-approved checks pass; sole stale I5 RED remains honest.\nNo certification, seal, runtime or remote/protected-branch action.\n')
print(json.dumps(dict(status=out['status'], reservation=out['reservation'], freeGiB=free_gib, stages=len(stages), minimumGiB=floor['lowestObservedGiB'], ready=11, scopedHolds=51)))
