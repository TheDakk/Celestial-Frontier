"""Freeze a verified request into a fresh coordinator-owned generation packet."""
from pathlib import Path
import json,hashlib,re,sys
B=Path(__file__).resolve().parent
read=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
p=Path(sys.argv[1]);r=read(p)
assert r['status']=='VERIFIED_REQUEST_READY_FOR_ROOT_SERIAL_GENERATION'
assert r['Verifier']['status']=='PASS' and all(r['Verifier']['checks'].values())
assert re.fullmatch(r'c465-[a-z0-9-]+',r['id']) and r['actualGeneratorSeed'] is None
for key in ['prompt','sourceSubject','reference','verifiedBasis']:
 q=r[key];assert sha(q['path'])==q['sha256'],q['path']
baseline=read('audits/C444_CODEX_20261018/w4-delivery/final/dispositions.json')
assert next(x for x in baseline['rows']if x['name']==r['species'])['status']=='HOLD'
packet=B/'paintings'/r['id'];assert not packet.exists();packet.mkdir(parents=True)
for name,data in [('request.json',p.read_bytes()),('prompt.txt',Path(r['prompt']['path']).read_bytes()),('subject-source.json',Path(r['sourceSubject']['path']).read_bytes())]:
 (packet/name).write_bytes(data)
f=dict(status='FROZEN_VERIFIED_BEFORE_GENERATION',sourceRequest=dict(path=str(p),sha256=sha(p)),requestSha256=sha(packet/'request.json'),promptSha256=sha(packet/'prompt.txt'),numericSeed=None,freshIndependentCall=True,referenceImageInputs=[])
(packet/'request-freeze.json').write_text(json.dumps(f,indent=2)+'\n')
print(json.dumps(dict(id=r['id'],species=r['species'],packet=str(packet.relative_to(Path.cwd())),prompt=(packet/'prompt.txt').read_text(),transparentBackground=r['transparentBackground'])))
