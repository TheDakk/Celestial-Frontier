"""Read-only source/proof inventory; writes only this new audit's manifest."""
from pathlib import Path
import json,hashlib,subprocess
root=Path.cwd(); out=root/'audits/C49_FISH_REVIEW_20260926'; sibling=Path('/Users/nick/Projects/celestial-frontier-anthropic-mac'); base=Path('audits/G1_AUTO_AUTHOR_20260926'); sha=lambda b:hashlib.sha256(b).hexdigest()
tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0'))
def entry(p):
 rel=str(p.relative_to(sibling));return {'path':rel,'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size,'tracked':rel in tracked}
def compare_sources(items):
 mismatches=[];missing=[];unchanged_flags=[]
 for r in items:
  rel=str(Path(r['path']).relative_to(sibling));p=root/rel
  if not p.exists():missing.append(rel)
  elif sha(p.read_bytes())!=r['sha256']:mismatches.append(rel)
  if r.get('unchanged') is False:unchanged_flags.append(rel)
 return {'count':len(items),'currentOwnMissing':missing,'currentOwnMismatches':mismatches,'retainedChangedFlags':unchanged_flags}
rows=[]
for id in ['06-trout','07-perch','08-cod','09-carp','10-herring']:
 p=sibling/base/'weld-g2fam-fish/pairs'/f'{id}-final';fit=p/'fit';native=json.loads((p/'native/report.json').read_text());static=json.loads((p/'static.json').read_text());weld=json.loads((p/'weld-receipt.json').read_text());provenance=json.loads((sibling/base/'auto-g2fam-v10'/id/'provenance.json').read_text());record=json.loads((fit/'record.json').read_text())
 master=Path(record['source']);master=master if master.is_absolute() else sibling/master
 input_results=[]
 for r in static['inputs']:
  f=Path(r['path']); input_results.append({'path':str(f.relative_to(sibling)),'sha256':r['sha256'],'matchesRetained':sha(f.read_bytes())==r['sha256'],'originalUnchanged':r['unchanged']})
 nativefit=[r for r in native['sources'] if '/'+id+'-final/fit/' in r['path']]
 c=native['capture']; films=[entry(p/'native/battle-full.webm')]+[entry(p/'native'/s['file']) for s in native['stills']]
 rows.append({'id':id,'reference':provenance['reference'],'identity':record['identity'],'recordRecipeHash':record['recipeHash'],'bindingHash':weld['bindingHash'],'pairs':weld['pairs'],'helperMatches':weld['helperSha256']==sha((root/base/'weld-g2fam-fish/weld-pairs.mjs').read_bytes()),'master':entry(master),'masterMatchesAutomaticProvenance':sha(master.read_bytes())==provenance['targetMasterSha256'],'fitFiles':[entry(f) for f in sorted(fit.rglob('*')) if f.is_file()], 'static':{'source':static['sourceHead'],'status':static['status'],'inputs':input_results,'producerComparison':compare_sources(json.loads((p/'static.json.sources.json').read_text()))},'native':{'source':native['source'],'status':native['status'],'refusals':c['refusalsAtEnd'],'frames':c['frames'],'cpuP95Ms':c['cpuP95Ms'],'cpuThrottle':native['cpuThrottle'],'fitSourcesMatch':all(sha(Path(r['path']).read_bytes())==r['sha256'] for r in nativefit),'fitSourceCount':len(nativefit),'producerComparison':compare_sources(native['sources']),'encodedMedia':c['encodedMedia'],'files':films},'retainedReports':[entry(p/n) for n in ['weld-receipt.json','static.json','static.json.sources.json','native/report.json']]})
packet={'schema':'cf.c49-source-pinned-review-manifest/v1','scope':'Review inventory only; no registry/library admission. Retained reports describe their recorded source; current hashes do not create a new native run.','currentHead':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'originalStatic':entry(sibling/base/'harness/static.ts'),'originalStaticMatchesOwn':(root/base/'harness/static.ts').read_bytes()==(sibling/base/'harness/static.ts').read_bytes(),'rows':rows}
(out/'source-pinned-manifest.json').write_text(json.dumps(packet,indent=2)+'\n')
for r in rows:
 print(r['id'],r['reference']['subject'],'master',r['masterMatchesAutomaticProvenance'],'fit inputs',all(x['matchesRetained'] for x in r['static']['inputs']),'static producers',r['static']['producerComparison'],'native mismatches',r['native']['producerComparison']['currentOwnMismatches'],'native missing count',len(r['native']['producerComparison']['currentOwnMissing']))
