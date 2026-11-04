"""Adopt the independently reviewed optional offline donor pin, with exact preconditions."""
from pathlib import Path
import hashlib,json,os

B=Path('audits/O3_20261103')
receipt=json.loads((B/'w1-kin-design/root-binding-fix-receipt.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert json.loads((B/'coordinator/queue/attempts/wave-a-b-develop-once/result.json').read_text())['status']=='PASS'
assert json.loads((B/'coordinator/queue/attempts/wave-b-default-before/result.json').read_text())['status']=='PASS'
out=B/'coordinator/wave-b-validation/adoption.json';assert not out.exists()
for r in receipt['files']:
 p=Path(r['productionPath']);assert sha(r['candidatePath'])==r['afterSha256']
 assert (sha(p)==r['beforeSha256']) if r['beforeSha256'] else not p.exists()
rows=[]
for r in receipt['files']:
 p=Path(r['productionPath']);data=Path(r['candidatePath']).read_bytes()
 if p.name=='auto-author.mjs':
  old=b"top.length === 1 ? 'the single best registered reference'"
  assert data.count(old)==1
  data=data.replace(old,b"pinned ? 'the explicitly pinned registered reference' : top.length === 1 ? 'the single best registered reference'")
 tmp=p.with_name(p.name+'.o3tmp');assert not tmp.exists();tmp.write_bytes(data);os.replace(tmp,p)
 rows.append(dict(path=str(p),beforeSha256=r['beforeSha256'],reviewedCandidateSha256=r['afterSha256'],appliedSha256=sha(p),offlineOnly=True))
out.write_text(json.dumps(dict(status='APPLIED_REVIEWED_OPTIONAL_OFFLINE_PIN',files=rows,additionalReviewFinding='P3 pinned-only coverage wording corrected; default branch text unchanged',thresholdChanges=0,sealedRowRebinds=0,gameCodeAndImportedTools=[]),indent=2)+'\n')
ledger=B/'coordinator/runtime-change-list.json';v=json.loads(ledger.read_text());assert v['gameCodeAndImportedTools']==[];v['offlineTools']=[r['path']for r in rows];ledger.write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps(dict(status='APPLIED',files=len(rows),runtimeChanges=0)))
