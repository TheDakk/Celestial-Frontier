"""Freeze only completed CPU evidence; active authoring leaves are excluded."""
from pathlib import Path
import hashlib,json,subprocess
B=Path('audits/C475_DECISIONS_20261019');C=B/'coordinator';sha=lambda b:hashlib.sha256(b).hexdigest();paths=set();verified=0;historical=[]
freezes=['w1-keyer/named28-current-r03/freeze-r01.json','w1-keyer/positive-fringe-r01/freeze-r01.json','w1-keyer/thin-support-r01/freeze-r01.json','w1-keyer/radial-materials-r01/sea-anemone-handoff-r02/freeze.json','w2-worm-radial/remaining-materials-cpu-r01/reviews/sea-anemone-source-r03/freeze-r01.json','w2-worm-radial/remaining-materials-cpu-r01/reviews/sea-anemone-source-r04/freeze-r01.json','w2-worm-radial/next-materials-cpu-r01/sea-cucumber-c221-r01/freeze-r01.json','w2-worm-radial/next-materials-cpu-r01/scale-worm-c221-r01/freeze-r01.json','w3-crustacean-cephalopod/propagation-cpu-r01/amphipod-krill-r01/freeze-r01.json','w3-crustacean-cephalopod/propagation-cpu-r01/amphipod-krill-r01/integration-test-r02/freeze.json','w3-crustacean-cephalopod/review-anteater-material-hold-r01/freeze.json','w3-crustacean-cephalopod/review-water-flea-thin-source-r01/freeze.json','w3-crustacean-cephalopod/review-water-flea-thin-mask-r02/freeze.json','w4-review/water-flea-thin-mask-r02/freeze.json','coordinator/anchored-resolved-cpu-r01/freeze.json']
def walk(v):
 if isinstance(v,dict):
  if isinstance(v.get('path'),str)and isinstance(v.get('sha256'),str):yield v
  for e in v.values():yield from walk(e)
 elif isinstance(v,list):
  for e in v:yield from walk(e)
for rel in freezes:
 f=B/rel
 if not f.exists():raise AssertionError('Exact freeze file required: '+str(f))
 paths.add(str(f))
 for r in walk(json.loads(f.read_text())):
  p=Path(r.get('copy',r['path']));expected=r['sha256'];assert p.is_file(),str(p)
  if sha(p.read_bytes())!=expected:
   assert str(p).startswith('port/v2/'),str(p)
   match=None
   for producer in ['acff88a884f1f9da6f018ef77b7af4432e079a6f','633cd4627f52b89efaea1267d364ea33032ade47']:
    q=subprocess.run(['git','show',producer+':'+str(p)],capture_output=True)
    if q.returncode==0 and sha(q.stdout)==expected:match=producer;break
   assert match is not None,str(p);historical.append({'path':str(p),'producer':match,'sha256':expected})
  elif str(p).startswith(str(B)+'/'):paths.add(str(p))
  verified+=1
extra=[str(B/'w1-keyer/radial-materials-r01/jellyfish-alternate-screen-r01.json'),str(B/'delivery/wave15-cpu-candidates-and-material-holds')]
excludedScratch=sorted(p for p in paths if 'node_modules' in Path(p).parts or Path(p).is_symlink())
paths.difference_update(excludedScratch)
report=C/'c492-frozen-selection.json';report.write_text(json.dumps({'status':'PASS_COMPLETED_IMMUTABLE_CPU_EVIDENCE_ONLY','verifiedPins':verified,'historicalCodePins':historical,'freezes':freezes,'excludedRegenerableOrDependencyScratch':excludedScratch,'noForceAdd':True,'productionEdits':False,'postRedOwnersExecuted':False},indent=2)+'\n')
subprocess.run(['python3',str(C/'collect-producer-wave.py'),str(C/'c492-paths.txt'),*sorted(paths),*extra],check=True)
