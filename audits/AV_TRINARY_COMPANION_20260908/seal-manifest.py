from pathlib import Path
import hashlib,json,subprocess,datetime,shutil
root=Path(__file__).resolve().parents[2];audit=Path(__file__).resolve().parent;target=audit/'manifest.json'
sha=lambda b:hashlib.sha256(b).hexdigest()
def item(p):
 b=p.read_bytes();return {'path':p.relative_to(root).as_posix(),'bytes':len(b),'sha256':sha(b)}
assert not target.exists()
preparation=json.loads((audit/'preparation.json').read_text());assert preparation['status']=='PASS'
assert len(preparation['steps'])==5 and all(s['exitCode']==0 for s in preparation['steps'])
native=json.loads((audit/'native-exact-address/review.json').read_text());assert native['status']=='PASS' and native['certification'] is False and not native['errors'] and native['pendingEvaluation'] is None
assert json.loads((audit/'native-first/review.json').read_text())['status']=='FAIL'
for name,digest in native['sources'].items():assert sha((root/name).read_bytes())==digest,name
for name,digest in native['fixtureEvidence']['sources'].items():assert sha((root/name).read_bytes())==digest,name
for name,digest in native['served'].items():assert sha((Path(native['dist'])/name).read_bytes())==digest,name
visual=json.loads((audit/'visual-inspection.json').read_text());assert visual['status']=='PASS' and len(visual['captures'])==3
for c in visual['captures']:assert sha((audit/'native-exact-address'/c['path']).read_bytes())==c['sha256']
assert native['nativeEntry']['method']=='native exact-address Search → Follow'
assert native['nativeEntry']['state']['star']==2166531614
controls=[s['control'] for s in native['steps'] if 'pixel controls' in s['name']];assert len(controls)==2
for c in controls:assert c['hidden']>0 and c['removed']>0 and c['hiddenRestored']==c['removedRestored']==0 and c['sameParent'] and c['sameIndex']
assert native['retired']['spriteDestroyed'] and native['retired']['oldScopeAbsent']
assert native['retired']['registry']['balanced'] and native['retired']['registry']['coherent'] and native['retired']['registry']['externalDestroyFaults']==0
# Preserve the exact native build without rebuilding or rebinding either old preview.
copy=root/'port/v2/apps/game/smoke/trinary-evidence-dist-20260908';assert not copy.exists()
shutil.copytree(Path(native['dist']),copy)
files=[]
for src in sorted(Path(native['dist']).rglob('*')):
 if not src.is_file():continue
 rel=src.relative_to(Path(native['dist']));b=src.read_bytes();assert (copy/rel).read_bytes()==b
 files.append({'path':rel.as_posix(),'bytes':len(b),'sha256':sha(b)})
for name,digest in native['served'].items():assert sha((copy/name).read_bytes())==digest,name
evidence_dist={'schema':'cf-trinary-evidence-dist/v1','originalRoot':native['dist'],'preservedRoot':str(copy),'rebuilt':False,'files':files,'servedFileCount':len(native['served'])}
(audit/'evidence-dist.json').write_text(json.dumps(evidence_dist,indent=2)+'\n')
changes=['port/v2/apps/game/src/main.ts','port/v2/apps/game/src/release-content.ts','port/v2/budgets/compendium-memory-v1.json','port/v2/tests/compendium-budget.test.ts','port/v2/tools/slicesmoke.mjs']
(audit/'increment.diff').write_bytes(subprocess.check_output(['git','diff','--binary','--full-index','--',*changes],cwd=root))
sources=[p for p in native['sources'] if not p.startswith('audits/')]+[p for p in changes if p not in native['sources']]+['celestial-frontier.html','port/v2/packages/domain/worldgen/src/index.ts']
references=['ART_DIRECTION.md','celestial-frontier-codebase-reference.md','AAA_COVERAGE_LEDGER.md','WORLD_GENERATION.md','audits/AV_24H_CAMPAIGN_20260907.md']
evidence=[item(p) for p in sorted(audit.rglob('*')) if p.is_file() and p!=target]
manifest={'schema':'cf-trinary-companion-checkpoint/v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parentCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'branch':'openai/mac','sourceState':'dirty-local-only','signedCommitPending':True,'publishable':False,'browserFreeDevelop':{'status':'PASS','files':331,'testsPassed':3727,'testsSkipped':1,'typescriptPrograms':3},'rootValidation':{'status':'PASS','renderedSpecies':1010,'unchangedFingerprints':50},'nativeDiagnostic':{'status':'PASS','path':'native-exact-address/review.json','entry':'native exact-address Search → Follow','priorFailures':['native-first/review.json'],'viewportConditions':['390x844@2 normal and reduced/effects-off','1440x1000@1 reduced/effects-off'],'openFinding':'Crowded-map pointer entry selected nearby star; retained separately from exact-address success'},'visualReview':{'status':'PASS','captures':3,'humanAcceptance':False,'remainingGraphicsGap':'Granulated close-up surfaces for binary and third companions'},'ordinaryPreviews':{'changed':False,'ports':[53304,50689],'containsThisIncrement':False},'evidenceDist':str(copy.relative_to(root)),'certification':False,'humanAcceptance':False,'sources':[item(root/p) for p in sources],'references':[item(root/p) for p in references],'evidence':evidence,'evidenceCount':len(evidence),'evidenceBytes':sum(x['bytes'] for x in evidence)}
target.write_text(json.dumps(manifest,indent=2)+'\n')
for row in manifest['sources']+manifest['references']+manifest['evidence']:
 b=(root/row['path']).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'],row['path']
print(json.dumps({'manifestSha256':sha(target.read_bytes()),'sources':len(sources),'references':len(references),'evidenceCount':len(evidence),'evidenceBytes':manifest['evidenceBytes'],'preservedBuildFiles':len(files)}))
