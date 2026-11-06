"""Close the reservation truthfully at the unresolved automatic-review boundary."""
from pathlib import Path
import hashlib, json, shutil, subprocess

R = Path.cwd()
B = Path('audits/C475_DECISIONS_20261019')
C = B / 'coordinator'
D = B / 'delivery/terminal-final'
assert not D.exists()
D.mkdir()
def pin(p):
    p = Path(p)
    data = p.read_bytes()
    return {'path': str(p), 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
head = subprocess.check_output(['git', 'log', '-1', '--format=%H %G?']).decode().strip()
assert head == 'af0d78b9896f93f125c963b8ff6282cfdcbce440 G'
runtime = json.loads((C / 'c493-production-unchanged.json').read_text())
for row in runtime['rows']:
    assert pin(row['path'])['sha256'] == row['sha256']
locks = json.loads((C / 'end-locks-idle.json').read_text())
for key in ['toolchain', 'workspace']:
    assert not Path(locks[key]['path']).exists()
peer = json.loads((C / 'terminal-peer-end-read.json').read_text())
assert pin(peer['path'])['sha256'] == peer['sha256'] and peer['alreadyMerged']
review = B / 'w3-crustacean-cephalopod/review-final62-metadata-r03/review.json'
assert json.loads(review.read_text())['status'] == 'PASS_METADATA_SCOPE_ONLY'
current62 = B / 'delivery/wave16-final-cpu-dispositions/current62.json'
prior170 = B / 'delivery/wave16-final-cpu-dispositions/progress170.json'
progress = json.loads(prior170.read_text())
assert progress['counts'] == {'original170': 170, 'priorClaudeAccept': 17, 'READY': 10, 'HOLD': 143}
progress.update(status='TERMINAL_BLOCKED_AUTO_REVIEW_DISPOSITIONS_RETAINED', executionIncomplete=True,
                remainingStatus='Native/AI continuation approval-blocked. Six project owners were rejected by automatic review after the sole stale-I5 profile failure. Current52 scoped holds and91 inherited holds remain evidenced; no new admission.',
                predecessorSnapshot=pin(prior170), reservation='C477_RELEASED', allPairs='HOLD')
assert progress['rows'] == json.loads(prior170.read_text())['rows']
(D / 'progress170.json').write_text(json.dumps(progress, indent=2) + '\n')
free_bytes = shutil.disk_usage(R).free
free_gib = free_bytes / (1024 ** 3)
floor = json.loads((C / 'final-serial-floor-proof.json').read_text())
out = {
    'status': 'TERMINAL_BLOCKED_AUTO_REVIEW', 'date': '2026-10-20', 'reservation': 'C477_RELEASED',
    'nativeAndAiQueue': 'IDLE_NO_ACTIVE_JOB', 'allWorkers': 'COMPLETED', 'executionIncomplete': True,
    'counts': {'scoped62': {'READY_FOR_CLAUDE': 10, 'HOLD': 52}, 'original170': progress['counts'], 'newAdmissions': 0},
    'signedPredecessor': head, 'allPrior17RunCommitsSignatureG': pin(C / 'terminal-predecessor-signatures.json'),
    'delivery': pin(B / 'delivery/wave16-final-cpu-dispositions/README.md'), 'current62': pin(current62),
    'final170': pin(D / 'progress170.json'), 'independentMetadataReview': pin(review),
    'actualFinishedStills': 50, 'currentC261': {'completeFilms': 450, 'pins': 900, 'scope': 'All10 READY entries pass; historical HOLD films remain in the global triage.'},
    'runtimeAppliedPaths': 18, 'runtimeByteProof': pin(C / 'c493-production-unchanged.json'),
    'I5ChangeList': pin(B / 'delivery/wave16-final-cpu-dispositions/I5_CHANGES.md'),
    'anchored14Proposal': 'UNAPPLIED; actual-card8CPUtests PASS, source/native boundaries retained',
    'develop': {'status': 'RED', 'nodePass': 787, 'runnerControlPass': 56, 'vitestPass': 6089,
                'vitestFail': 1, 'soleFailure': 'STALE_I5_PRODUCER_BINDINGS', 'remainingSixOwners': 'NOT_RUN_AUTO_REVIEW_REJECTED',
                'humanApproval': 'PENDING_NO_REPLY', 'evidence': pin(C / 'develop-soft-materials-r03.json'),
                'rejection': pin(C / 'soft-materials-other-owners-auto-review-rejection-r02.json')},
    'disk': {'freeBytes': free_bytes, 'freeGiB': free_gib, 'endReport': pin(C / 'disk-terminal.log'),
             'cleanup': pin(C / 'final-cleanup-summary.json'), 'logicalDeletedMiB': 602.7588472366333,
             'minimumObservedStageGiB': floor['lowestObservedGiB'], 'floorEvidence': pin(C / 'final-serial-floor-proof.json'),
             'physicalSpaceRecoveredNotInferredFromLogicalFileSizes': True},
    'idleLocks': pin(C / 'end-locks-idle.json'), 'peerEndRead': pin(C / 'terminal-peer-end-read.json'),
    'D43': 'NOT_ACTIVATED_NO_C223_OR_CERTIFICATION', 'selectedCertificate': 'C464_UNCHANGED',
    'allPairs': 'HOLD', 'remoteOrProtectedBranchActions': False,
    'nextCodex': 'Await explicit approval for the six rejected project owners. Read absolute peer mailbox and reserve afresh before native continuation; preserve first-red/seals and all existing source/representative/C261/W2/signed-checkpoint rules.',
    'nextClaude': 'Review signed ten READY packets and current holds/proposals. Use actual18-path change list for a separately authorized I5 epoch. No Dakk relay, app switch or remote push is needed.'
}
(D / 'terminal.json').write_text(json.dumps(out, indent=2) + '\n')
readme = f'''# C494 TERMINAL — blocked; C477 reservation released

Ten READY_FOR_CLAUDE packets have all50 finished1024×576 stills and signed pre-AI checkpoints. The scoped62 have52 evidenced HOLDs; original170 has17 prior Claude ACCEPT,10 READY,143 HOLD. No new admission or certification.

[Packets and all five stills per species]({R / B / 'delivery/wave16-final-cpu-dispositions/README.md'}) · [current62 holds]({R / B / 'delivery/wave16-final-cpu-dispositions/current62.md'}) · [terminal170 snapshot]({R / D / 'progress170.json'}) · [I5 applied18 / unapplied14 change list]({R / B / 'delivery/wave16-final-cpu-dispositions/I5_CHANGES.md'}) · [terminal evidence]({R / D / 'terminal.json'}).

Independent metadata review passed557 assertions, all50 PNG hashes/dimensions, signed producers and current source rows. All18 applied C491 paths and GUIDE121 are unchanged; the14-file anchored candidate remains unapplied. Native/AI and all CPU workers are idle; shared toolchain and own workspace locks are absent. C477 is RELEASED.

Develop remains RED: Node787 PASS, runner controls56 PASS, Vitest6089 PASS and one stale I5 producer-binding failure. Automatic approval review twice rejected the six remaining project owners under AGENTS.md:92 stop-after-red; none ran and no alternate route was used. Explicit human approval is pending. Execution remains incomplete at that boundary; the evidence and holds are delivered.

End free space: **{free_gib:.1f} GiB** ({free_bytes:,} bytes). Start/end disk reports are retained. Own cleanup removed602.76MiB logical regenerable copies/caches; originals, all frozen paths, unique authored tests and media were preserved and rehashed. Physical recovery is not inferred from APFS logical sizes. All93 recorded root stages began above42GiB and stayed above30GiB; minimum observed44.21GiB.

Codex: wait for the six-check approval, read the absolute peer mailbox and reserve before continuing. Claude: review the signed packets/holds and actual18-path I5 scope under its own authorization. No Dakk relay, app switch or push wait is needed. D43/C223 was not activated. No push, PR, GitHub, hosted attempt, protected-branch action, release or deploy. All-pairs HOLD.
'''
(D / 'README.md').write_text(readme)
p = Path('ROADMAP.md')
text = p.read_text()
old = '## C475 approved decisions — C477 ACTIVE,2026-10-19'
assert text.count(old) == 1
text = text.replace(old, '## C475 approved decisions — C494 TERMINAL_BLOCKED,2026-10-20')
text += f'''
## Fresh-session handoff — C494 TERMINAL_BLOCKED_AUTO_REVIEW

The authorized D39–D42 run ended at the explicit automatic-review boundary; C477 is RELEASED, allworkers/native/AI idle and bothlocks absent. Signed C493 af0d78b989 G delivers10 READY/all50actualfinishedstills plus52scoped evidencedHOLDs; original17017priorClaudeACCEPT10READY143HOLD,0newadmissions. Final current rows/packets/sourceholds and18applied-vs14UNAPPLIEDI5paths: audits/C475_DECISIONS_20261019/delivery/terminal-final/README.md. Current18appliedC491sourcebytes/GUIDE121 unchanged, C464selector unchanged/stale, profileNode787+runner56+Vitest6089PASS/soleI5RED. Sixremainingprojectowners were TWICE rejected byautomaticreview underAGENTS92stop-after-red; explicituserapproval pending, no alternate/nativecontinuation. D43/C223/certificationNOTactivated.

NextCodex: obtain the pending six-check approval, read ~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md and reserve afresh beforeheavywork. Run only authorized checks; keepRED/unchangedseals honest. Anemone14pathP04candidate remainsUNAPPLIED/actualcard8tests+freshindependentCPUclean(sourceQA dab); Cold/Deep literalownerHOLD and Coral firstmixedrepresentativeproofboundary remain. Do notreuse oldP03genericcast proof as actualattack acceptance. Remainingcurrent33/D40holds have exactsource/owner/static/alpha/contact evidence; no unbuilt-viablesource deferral. Classfixrepresentative→native→C261→independentW2_CLEAN→signedpreAIcheckpoint→finish→all5/W2W3 stillrequired,42pre/30runningfloor.

NextClaude: review signed10READY/currentholds and actual18I5path disclosure under own authority. No Dakkrelay/appswitch/remotepushwait. Ownscratch cleaned withfrozen/source/media/uniquetests preserved; endfree{free_gib:.1f}GiB, minimumobserved44.21GiB. No newbranches/worktrees or remote/protectedbranch/release/deploy actions; All-pairsHOLD.
'''
p.write_text(text)
p = Path('audits/MAILBOX/TO_CLAUDE.md')
text = p.read_text()
assert '| C494 |' not in text
text += f'\n| C494 | 2026-10-20 | **TERMINAL_BLOCKED_AUTO_REVIEW — C477 RELEASED.** Allworkers/native/AIidle/shared+ownlocksabsent. SignedC493 af0d78b989G finalscoped62=10READY52evidencedHOLD; original17017priorClaudeACCEPT10READY143HOLD/0newadmissions. All50actualfinished1024x576stills/Gproducers/557metadataassertionsPASS. | audits/C475_DECISIONS_20261019/delivery/terminal-final/README.md; terminal.json; progress170.json; wave16-final-cpu-dispositions/I5_CHANGES.md | Endfree **{free_gib:.1f}GiB**; start/enddiskreports retained;602.76MiBlogicalownregenerablescratchremoved, frozen/source/media/uniquetestspreserved.93rootstages42start/30floorheld,min44.21GiB. Applied18C491paths/GUIDE121unchanged;14anchoredproposalUNAPPLIED. DevelopsoleI5RED/sixprojectownersautomatic-review-rejected/userapprovalpending; noneexecuted/noalternateroute. Codexawaitsapproval/reservesbeforecontinuation; Claudemayreview signedpackets/holds and18pathI5scope underownauthority. No Dakkrelay/appswitch/pushwait. NoD43/C223/certification/remote/protectedbranch/release/deploy;All-pairsHOLD. |\n'
p.write_text(text)
(C / 'c494-message.txt').write_text('C475: close reservation with evidenced holds and blocked terminal\n\nPost TERMINAL_BLOCKED_AUTO_REVIEW and release C477. Retain ten actual READY packets, current62/170 dispositions, final disk/cleanup/idle-lock receipts and the pending six-check approval boundary.\n\nNo runtime, native, certification or remote action.\n')
print(json.dumps({'terminal': out['status'], 'reservation': out['reservation'], 'freeGiB': free_gib,
                  'runtimePathsExact': 18, 'scopedReady': 10, 'scopedHolds': 52}))
