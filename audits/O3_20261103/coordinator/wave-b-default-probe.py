"""Compare the complete real runner's default bytes before/after optional pin adoption."""
from pathlib import Path
import hashlib,json,subprocess,sys

mode=sys.argv[1]
assert mode in ('before','after')
B=Path('audits/O3_20261103/coordinator/wave-b-validation')
B.mkdir(exist_ok=True)
row=next(x for x in json.loads(Path('audits/O3_20261103/w1-kin-design/recipes-r01/requests.json').read_text())['rows'] if x['name']=='Whale')
argv=[x for x in row['futureArgv'] if not x.startswith('--kin-pin=')]
argv=[('--tag=o3-b-default-whale-r01' if x.startswith('--tag=') else x) for x in argv]
out=Path('audits/G1_AUTO_AUTHOR_20260926/auto-o3-b-default-whale-r01')
assert not out.exists(), 'Fresh probe output required; previous evidence must not be overwritten'
r=subprocess.run(argv,capture_output=True,text=True)
(B/(mode+'.log')).write_text(r.stdout+r.stderr)
assert r.returncode==0, r.stderr
def inventory(root):
 return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file()}
pins=inventory(out)
assert pins
if mode=='before':
 dest=B/'default-before'
 assert not dest.exists()
 out.rename(dest)
 (B/'default-before-pins.json').write_text(json.dumps(pins,indent=2)+'\n')
else:
 before=json.loads((B/'default-before-pins.json').read_text())
 assert inventory(B/'default-before')==before
 assert pins==before, [k for k in set(pins)|set(before) if pins.get(k)!=before.get(k)]
 (B/'default-byte-compatibility.json').write_text(json.dumps(dict(status='PASS',scope='Complete real CLI default output file inventory and bytes, same input/flags/output path before and after optional-pin adoption',files=len(pins),pins=pins,argv=argv),indent=2)+'\n')
print(json.dumps(dict(status='PASS',mode=mode,files=len(pins))))
