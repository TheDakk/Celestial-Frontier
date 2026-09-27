"""Remove the actual one-profile mapping, run the producer, require outcome failure, restore exact bytes."""
import hashlib, json, pathlib, subprocess

root=pathlib.Path(__file__).resolve().parents[2]
b=pathlib.Path(__file__).resolve().parent
producer=root/'audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs'
original=producer.read_bytes()
before=(b/'run-auto-before.mjs.txt').read_bytes()
assert original.count(b"'millipede', 'springtail'")==1
assert original.replace(b"'millipede', 'springtail'",b"'millipede'")==before
def replace(data):
    tmp=producer.with_suffix('.tmp')
    tmp.write_bytes(data)
    tmp.replace(producer)
try:
    replace(before)
    command=['node',str(producer),'--tag=codex-c97-material-disabled','--topk=1','--chains','--counter','--fallback=2','--serpent-strips','--merge-joint-labels','--no-static','--extra-refs=audits/G1_AUTO_AUTHOR_20260926/pilots/reference-pool-extras.json','--targets=audits/SPRINGTAIL_MATERIAL_C97_20260927/pilot.json']
    with (b/'negative-producer.log').open('w') as f:
        result=subprocess.run(command,cwd=root,stdout=f,stderr=subprocess.STDOUT)
    assert result.returncode==0
    out='audits/G1_AUTO_AUTHOR_20260926/auto-codex-c97-material-disabled/23-springtail'
    with (b/'negative-outcome.log').open('w') as f:
        checked=subprocess.run(['node',str(b/'check-material.mjs'),out],cwd=root,stdout=f,stderr=subprocess.STDOUT)
    assert checked.returncode!=0
    score=json.loads((root/out/'score.json').read_text())
    assert score['verdict']=='REFUSE'
    assert any(r.startswith('materials-unknown:') for r in score['reasons'])
finally:
    replace(original)
assert producer.read_bytes()==original
(b/'negative-control.json').write_text(json.dumps({'producerSha256':hashlib.sha256(original).hexdigest(),'removedMappingReproducesRefusal':True,'actualOutcomeCheckRejectsMutant':True,'sourceRestoredExactly':True},indent=2)+'\n')
print('Actual mapping removal reproduces refusal; outcome check rejects; producer restored exactly')
