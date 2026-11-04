"""Select immutable CPU review evidence; do not glob live worker output."""
from pathlib import Path
import hashlib,json,subprocess
B=Path('audits/C475_DECISIONS_20261019');C=B/'coordinator'
freeze_names=['w2-worm-radial/remaining-materials-cpu-r01/materials-proposal-freeze-r03.json','w1-keyer/review-comb-eightpaths-r01/freeze-r01.json','w2-worm-radial/remaining-materials-cpu-r01/marine-c221-r01/freeze-r01.json','w2-worm-radial/remaining-materials-cpu-r01/marine-c221-r01/field-diagnostic-correction-freeze-r02.json','w2-worm-radial/remaining-materials-cpu-r01/marine-c221-r01/field-diagnostic-resolution-freeze-r03.json']
sha=lambda b:hashlib.sha256(b).hexdigest();paths=set();checked=0;historical=[]
def walk(v):
 if isinstance(v,dict):
  if isinstance(v.get('path'),str) and isinstance(v.get('sha256'),str):yield v
  for e in v.values():yield from walk(e)
 elif isinstance(v,list):
  for e in v:yield from walk(e)
for rel in freeze_names:
 f=B/rel;paths.add(str(f))
 for r in walk(json.loads(f.read_text())):
  p=Path(r['path']);expected=r['sha256']
  if not p.is_file():raise AssertionError(str(p))
  if sha(p.read_bytes())!=expected:
   assert str(p).startswith('port/v2/'),str(p)
   before=subprocess.check_output(['git','show','633cd4627f52b89efaea1267d364ea33032ade47:'+str(p)])
   assert sha(before)==expected,str(p)
   historical.append({'path':str(p),'producer':'633cd4627f52b89efaea1267d364ea33032ade47','sha256':expected})
  elif str(p).startswith(str(B)+'/'):paths.add(str(p))
  checked+=1
extra=['port/v2/tools/painted-creature/soft-material-source-request.test.mjs',str(B/'w4-review/comb-c221-root-source-r02.json'),str(B/'delivery/wave14-soft-materials-producer-checks-blocked/README.md')]
report=C/'c491-frozen-selection.json';report.write_text(json.dumps({'status':'PASS_FROZEN_PINS_CURRENT_OR_NAMED_HISTORICAL_PRODUCER','verifiedPins':checked,'historicalCodePins':historical,'frozenInputs':freeze_names,'native':False,'postRedCheckOwnersExecuted':False},indent=2)+'\n')
subprocess.run(['python3',str(C/'collect-producer-wave.py'),str(C/'c491-paths.txt'),*sorted(paths),*extra],check=True)
