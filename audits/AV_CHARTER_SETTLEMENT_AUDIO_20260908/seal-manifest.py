from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path(__file__).resolve().parents[2];audit=Path(__file__).resolve().parent;target=audit/'manifest.json'
sha=lambda b:hashlib.sha256(b).hexdigest()
def item(p):
 b=p.read_bytes();return {'path':p.relative_to(root).as_posix(),'bytes':len(b),'sha256':sha(b)}
sources=['port/v2/apps/game/src/main.ts','port/v2/apps/game/src/audiovisual-pilot.ts','port/v2/apps/game/src/tame-greeting-audio.ts','port/v2/apps/game/src/pilot-sound-player.ts','port/v2/apps/game/src/pilot-pcm.ts','port/v2/apps/game/src/pilot-assets.ts','port/v2/apps/game/src/starter-charters.ts','port/v2/apps/game/src/release-content.ts','port/v2/packages/audio/src/runtime.ts','port/v2/packages/persistence/src/outcome-transaction.ts','port/v2/apps/game/src/f4-runtime-authority.ts','port/v2/budgets/compendium-memory-v1.json','port/v2/tests/compendium-budget.test.ts','port/v2/tests/pilot-settlement-main-wiring.test.ts','port/v2/tests/pilot-settlement-presentation.test.ts','port/v2/tests/tame-greeting-audio.test.ts','port/v2/tests/arc9-main-wiring.test.ts','port/v2/tests/starter-charter-binder-main-wiring.test.ts','port/v2/tests/guide-release.test.ts','port/v2/tests/slicesmoke-sixth-red-contract.test.ts','port/v2/tools/slicesmoke.mjs','port/v2/tools/glassmatrix.mjs','port/v2/apps/game/assets/pilot/audio/cf-pilot-ui-settlement.wav','celestial-frontier.html']
references=['AUDIO.md','ART_DIRECTION.md','celestial-frontier-codebase-reference.md','AAA_COVERAGE_LEDGER.md','AAA_GAP_AUDIT.md','port/AAA_AUDIOVISUAL_CAMPAIGN.md','port/v2/README.md','audits/AV_24H_CAMPAIGN_20260907.md']
assert json.loads((audit/'preparation-corrected.json').read_text())['status']=='PASS'
native=json.loads((audit/'native-retirement-corrected/review.json').read_text());assert native['status']=='PASS'
for name,digest in native['sources'].items():assert sha((root/name).read_bytes())==digest,name
for name,digest in native['served'].items():assert sha((Path(native['dist'])/name).read_bytes())==digest,name
assert json.loads((audit/'completion-observer-controls.json').read_text())['status']=='PASS'
evidence=[item(p) for p in sorted(audit.rglob('*')) if p.is_file() and p!=target]
manifest={'schema':'cf-charter-settlement-audio-checkpoint/v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parentCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'branch':'openai/mac','sourceState':'dirty-local-only','signedCommitPending':True,'publishable':False,'browserFreeDevelop':{'status':'PASS','files':331,'testsPassed':3727,'testsSkipped':1,'typescriptPrograms':3},'rootValidation':{'status':'PASS','renderedSpecies':1010,'unchangedFingerprints':50},'nativeDiagnostic':{'status':'PASS','path':'native-retirement-corrected/review.json','priorNativeFailures':['native-first/review.json','native-ordinal-corrected/review.json']},'visualReview':{'status':'INSPECTED_WITH_FOLLOWUP','finding':'Scrolled objective text paints behind the sticky Charters title'},'retainedPreparationFailure':'preparation.json','certification':False,'humanAcceptance':False,'sources':[item(root/p) for p in sources],'references':[item(root/p) for p in references],'evidence':evidence,'evidenceCount':len(evidence),'evidenceBytes':sum(x['bytes'] for x in evidence)}
assert not target.exists();target.write_text(json.dumps(manifest,indent=2)+'\n')
for row in manifest['sources']+manifest['references']+manifest['evidence']:
 data=(root/row['path']).read_bytes();assert len(data)==row['bytes'] and sha(data)==row['sha256']
print(json.dumps({'manifestSha256':sha(target.read_bytes()),'sources':len(sources),'references':len(references),'evidenceCount':len(evidence),'evidenceBytes':manifest['evidenceBytes']}))
