"""Freeze current170 and exact selected review bytes; historical artifacts retain their historical scope."""
from pathlib import Path
import json,hashlib,subprocess
B=Path('audits/C465_CODEX_20261018');C=B/'coordinator';O=B/'w4-delivery/final';D=B/'w2-checkpoint/w4-final-draft/snapshots/c473-draft-r01'
read=lambda p:json.loads(Path(p).read_text())
rows={}
def add(p,role,expected=None):
 p=Path(p);assert p.is_file() and not p.is_symlink(),str(p);d=p.read_bytes();q=dict(path=str(p),sha256=hashlib.sha256(d).hexdigest(),bytes=len(d))
 if expected:assert q['sha256']==expected['sha256']and ('bytes'not in expected or q['bytes']==expected['bytes']),str(p)
 if str(p)in rows:assert rows[str(p)]['sha256']==q['sha256']
 else:rows[str(p)]=dict(**q,roles=[])
 if role not in rows[str(p)]['roles']:rows[str(p)]['roles'].append(role)
 return q
O.mkdir(parents=True,exist_ok=True);assert not(O/'current-manifest.json').exists()
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert head=='52b6b92889ddea75396a16a3019574401336f5a8'
# Signed prior waves are byte-history only; do not reinterpret their earlier status/counts as current.
for name in subprocess.check_output(['git','ls-files','-z','--',str(B)],text=True).split('\0'):
 if name:add(name,'signed C473 or earlier historical byte selection')
for q in read(D/'selected-files.json')['rows']:add(q['path'],'current170 selected witness/READY/source',q)
for p in D.iterdir():
 if p.is_file():add(p,'verified current170 paper selection')
for p in [C/'current-closure-r01.json',C/'close-current-state.py',C/'disk-end.log',C/'build-current-manifest.py',B/'w2-checkpoint/w4-final-draft/inputs-c473-draft-r01.json',B/'w2-checkpoint/w4-final-draft/build-snapshot-r02.py',B/'w2-checkpoint/w4-final-draft/verify-snapshot-r02.py',B/'w2-checkpoint/w4-final-draft/README-c473-r01.md']:add(p,'current closure and paper review')
for slug in ['vole-r02','scallop-c2-r01','chiton-c2-r02']:
 p=read(B/'ready'/slug/'packet.json');r=read(Path(p['film'])/'report.json')
 for q in r['sources']:add(q['path'],'current READY native producer input',q)
cohort=read(C/'triage-chiton-finished/freeze.json')
for q in cohort['pins']:add(q['file'],'current cumulative C261 actual film witness',q)
for q in read(C/'preflight.json')['selectedPins']:add(q['path'],'unchanged selected C464 certificate witness',q)
closure=read(C/'current-closure-r01.json');assert closure['status']=='PASS_CURRENT_SOURCE_RUNTIME_QUEUE_CLOSED'
assert read(D/'verification.json')['status']=='PASS_DRAFT_170_SIGNED_READY_EVIDENCED_HOLD'
manifest=dict(schema='cf.c465-root-current-review-manifest/v1',status='FROZEN_CURRENT_BYTES_AWAITING_INDEPENDENT_REVIEW',signedWaveHead=head,counts=dict(original170=170,priorClaudeAccept=14,READY_FOR_CLAUDE=3,HOLD=153,currentStills=15),authoritative=dict(membership=add(D/'dispositions170.json','authoritative current170'),exactHolds=add(D/'hold-witnesses153.json','authoritative exact153HOLD'),readyFiveIndex=add(D/'five-still-index.json','authoritative current15stills'),currentDecisionTable=add(B/'w3-source/DECISIONS-r03.md','authoritative117rowdecisiontable'),source32=add(B/'w3-source/source32-summary.json','authoritative32reviewsummary'),rootClosure=add(C/'current-closure-r01.json','authoritativequeue/runtime/diskclosure'),paperVerification=add(D/'verification.json','current170verification'),sourceClosureVerification=add(D/'source-closure-verification.json','current32closureverification')),files=len(rows),rows=sorted(rows.values(),key=lambda r:r['path']),allPairs='HOLD',runtimeImportedToolChangesApplied=[],newAdmissions=0,historicalScope='C467 first self-proof/table selection defects and old C3 Grebe plan retained as history, with signed C468/C472/C473 additive supersessions. Earlier wave counts and pending review states are not current authorities. Immutable draft filenames retain their pre-root-review status; final selection is made additively after independent review.',independentCurrentReview='PENDING_OTHER_AGENT',terminalClaim=False)
with(O/'current-manifest.json').open('x')as f:json.dump(manifest,f,indent=2);f.write('\n')
print(json.dumps(dict(files=len(rows),bytes=sum(r['bytes']for r in rows.values()),counts=manifest['counts'])))
