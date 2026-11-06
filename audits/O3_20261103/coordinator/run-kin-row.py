"""One fresh real Wave B pin attempt; REFUSE stays an evidenced species hold."""
from pathlib import Path
import hashlib,json,subprocess,sys

B=Path('audits/O3_20261103/coordinator');order=int(sys.argv[1])
assert json.loads((B/'wave-b-validation/default-byte-compatibility.json').read_text())['status']=='PASS'
assert json.loads((B/'queue/attempts/wave-b-pin-targeted-tests/result.json').read_text())['status']=='PASS'
adopt=json.loads((B/'wave-b-validation/adoption.json').read_text())
for x in adopt['files']:assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['appliedSha256']
row=next(x for x in json.loads(Path('audits/O3_20261103/w1-kin-design/recipes-r02/requests.json').read_text())['rows'] if x['order']==order)
assert row['preparationEligible'] is True and not row['blockers']
argv=row['futureArgv'];tag=next(x[6:]for x in argv if x.startswith('--tag='))
out=Path('audits/G1_AUTO_AUTHOR_20260926/auto-'+tag);assert not out.exists(),'Never repeat an attempted product output'
resultdir=B/'wave-b-author-results';resultdir.mkdir(exist_ok=True);receipt=resultdir/(row['slug']+'.json');assert not receipt.exists()
r=subprocess.run(argv,capture_output=True,text=True);(resultdir/(row['slug']+'.log')).write_text(r.stdout+r.stderr)
assert r.returncode==0,r.stderr
score=json.loads((out/row['targetId']/'score.json').read_text());evidence=json.loads((out/row['targetId']/'evidence.json').read_text())
reference=row['selectedReference']['id'];assert evidence['donorPin']['referenceId']==reference and evidence['donorPin']['geometryReferences']==[reference]
assert len(evidence['donorPin']['witnessReferences'])>1 and evidence['bestReference']==reference
assert score['verdict'] in ('ADMIT','REFUSE')
receipt.write_text(json.dumps(dict(status='PIN_INTEGRATION_PASS',name=row['name'],order=order,sourceRequest=row['requestPath'],argv=argv,output=str(out/row['targetId']),score=score,geometryDonor=reference,originalWitnesses=len(evidence['donorPin']['witnessReferences']),sourceReviewStillRequired=True,intakeStaticNativeAIRuns=0,admission=False),indent=2)+'\n')
print(json.dumps(dict(status='PIN_INTEGRATION_PASS',name=row['name'],verdict=score['verdict'],output=str(out/row['targetId']))))
