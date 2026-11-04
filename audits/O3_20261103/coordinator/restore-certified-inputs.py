"""Restore only exact absent input files, without rewriting any record or seal."""
from pathlib import Path
import hashlib,json

root=Path.cwd().resolve();B=Path('audits/O3_20261103')
plan=json.loads((B/'w1-kin-design/exact-canonical-restore-plan-r01/restore-plan.json').read_text())
assert plan['restoreFiles']==17 and len(plan['plan'])==17
out=B/'coordinator/wave-b-validation/restoration.json';assert not out.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
for r in plan['plan']:
 d=Path(r['destinationAbsolute']);s=Path(r['stagedSourceAbsolute'])
 assert d==root/r['destinationRepoRelative'] and d.resolve().is_relative_to(root/'audits')
 assert r['proof']['originalPaths'][r['inputKind']]==r['destinationRepoRelative']
 assert Path(r['originalPeerSourceAbsolute'])==Path('~/Projects/celestial-frontier-anthropic-mac')/r['destinationRepoRelative']
 assert not d.exists() and sha(s)==r['sha256'] and s.stat().st_size==r['bytes']
 assert sha(r['originalPeerSourceAbsolute'])==r['sha256']
 assert r['proof']['checks']['nativeReportStatusDiagnosticPass'] and r['proof']['checks']['nativeReportBindsOriginalRecord']
 assert r['proof']['checks']['recordSourceIsExactOriginalMasterPath']
rows=[]
for r in plan['plan']:
 d=Path(r['destinationAbsolute']);d.parent.mkdir(parents=True,exist_ok=True)
 with d.open('xb')as f:f.write(Path(r['stagedSourceAbsolute']).read_bytes())
 assert sha(d)==r['sha256']
 rows.append(dict(path=r['destinationRepoRelative'],sha256=r['sha256'],bytes=r['bytes'],donor=r['donor'],exactCopy=True))
out.write_text(json.dumps(dict(status='PASS_EXACT_ABSENT_INPUT_RESTORATION',rows=rows,bytes=sum(r['bytes']for r in rows),recordsRewritten=0,sealsRebound=0,admission=False),indent=2)+'\n')
print(json.dumps(dict(status='PASS',restored=len(rows),bytes=sum(r['bytes']for r in rows))))
