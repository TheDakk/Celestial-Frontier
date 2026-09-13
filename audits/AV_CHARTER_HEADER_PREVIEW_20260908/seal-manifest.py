from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path(__file__).resolve().parents[2];audit=Path(__file__).resolve().parent;target=audit/'manifest.json'
sha=lambda b:hashlib.sha256(b).hexdigest()
def item(p):
 b=p.read_bytes();return {'path':p.relative_to(root).as_posix(),'bytes':len(b),'sha256':sha(b)}
sources=['port/v2/apps/game/src/ui-sheet-style.ts','port/v2/apps/game/src/ui-presentation-tokens.ts','port/v2/apps/game/src/panels.ts','port/v2/apps/game/src/pilot-runtime-style.ts','port/v2/apps/game/src/main.ts','port/v2/apps/game/index.html','port/v2/apps/game/src/release-content.ts','port/v2/budgets/compendium-memory-v1.json','port/v2/tests/compendium-budget.test.ts','port/v2/tools/slicesmoke.mjs','port/v2/tools/devpreview.mjs','port/v2/tools/devpreviewcheck.mjs','port/v2/tools/devpreview-readiness.mjs','celestial-frontier.html']
references=['UI_PRESENTATION.md','celestial-frontier-codebase-reference.md','AAA_COVERAGE_LEDGER.md','AAA_GAP_AUDIT.md','ART_DIRECTION.md','AUDIO.md','port/AAA_AUDIOVISUAL_CAMPAIGN.md','port/DEVELOPMENT_PREVIEW.md','port/v2/README.md','port/playtests/20260908_AV_REFRESHED_LOCAL_PREVIEW.md','audits/AV_24H_CAMPAIGN_20260907.md']
for name in ['preparation','preview-package','preview-verify','preview-browser-check']:assert json.loads((audit/(name+'.json')).read_text())['status']=='PASS'
native=json.loads((audit/'native-desktop-corrected/review.json').read_text());assert native['status']=='PASS' and len(native['cases'])==6
for name,digest in native['sources'].items():assert sha((root/name).read_bytes())==digest,name
for name,digest in native['served'].items():assert sha((Path(native['dist'])/name).read_bytes())==digest,name
preview=json.loads((audit/'preview-manifest.json').read_text());server=json.loads((audit/'preview-server.json').read_text());assert preview['publishable'] is False and preview['source']['state']=='dirty-local-only'
assert sha((audit/'preview-manifest.json').read_bytes())==server['manifestSha256']
for f in preview['files']:
 b=(Path(server['root'])/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
evidence=[item(p) for p in sorted(audit.rglob('*')) if p.is_file() and p!=target]
manifest={'schema':'cf-charter-header-preview-checkpoint/v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parentCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'branch':'openai/mac','sourceState':'dirty-local-only','signedCommitPending':True,'publishable':False,'browserFreeDevelop':{'status':'PASS','files':331,'testsPassed':3727,'testsSkipped':1,'typescriptPrograms':3},'rootValidation':{'status':'PASS','renderedSpecies':1010,'unchangedFingerprints':50},'nativeDiagnostic':{'status':'PASS','conditions':6,'path':'native-desktop-corrected/review.json','priorFailures':['native-first/review.json','native-scrollbar-corrected/review.json']},'visualReview':{'titlePaint':'PASS','separateOpenFinding':'Forced-colors bottom-guidance stroke appears excessively heavy'},'preview':{'status':'PASS','contentSha256':preview['contentSha256'],'manifestSha256':server['manifestSha256'],'url':server['url'],'pid':server['pid'],'execSession':60130},'certification':False,'humanAcceptance':False,'sources':[item(root/p) for p in sources],'references':[item(root/p) for p in references],'evidence':evidence,'evidenceCount':len(evidence),'evidenceBytes':sum(x['bytes'] for x in evidence)}
assert not target.exists();target.write_text(json.dumps(manifest,indent=2)+'\n')
for row in manifest['sources']+manifest['references']+manifest['evidence']:
 b=(root/row['path']).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256']
print(json.dumps({'manifestSha256':sha(target.read_bytes()),'sources':len(sources),'references':len(references),'evidenceCount':len(evidence),'evidenceBytes':manifest['evidenceBytes']}))
