from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path(__file__).resolve().parents[2]; audit=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
def item(p):
 b=p.read_bytes();return {'path':p.relative_to(root).as_posix(),'bytes':len(b),'sha256':sha(b)}
sources=['port/v2/apps/game/src/system-star-field.ts','port/v2/apps/game/src/system-star-field.test.ts','port/v2/apps/game/src/main.ts','port/v2/apps/game/src/release-content.ts','port/v2/budgets/compendium-memory-v1.json','port/v2/tests/compendium-budget.test.ts','port/v2/tools/slicesmoke.mjs','port/v2/tsconfig.json','port/v2/apps/game/tsconfig.json','port/v2/package.json']
references=['ART_DIRECTION.md','celestial-frontier-codebase-reference.md','AAA_COVERAGE_LEDGER.md','AAA_GAP_AUDIT.md','port/AAA_AUDIOVISUAL_CAMPAIGN.md','port/v2/README.md','audits/AV_24H_CAMPAIGN_20260907.md']
assert json.loads((audit/'develop-profile-app-owner.json').read_text())['status']=='PASS'
assert json.loads((audit/'root-validation.json').read_text())['status']=='PASS'
reports=[{'path':p.relative_to(root).as_posix(),'status':json.loads(p.read_text())['status']} for p in sorted(audit.glob('native-*/review.json'))]
assert reports,'Native diagnostic status must be retained before sealing'
evidence=[item(p) for p in sorted(audit.rglob('*')) if p.is_file() and p.name!='manifest.json' and not p.name.endswith('.mag-work')]
manifest={'schema':'cf-magnetar-field-checkpoint/v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parentCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'branch':'openai/mac','sourceState':'dirty-local-only','signedCommitPending':True,'publishable':False,'browserFreeDevelop':{'status':'PASS','files':329,'testsPassed':3646,'testsSkipped':1,'typescriptPrograms':3},'rootValidation':{'status':'PASS','renderedSpecies':1010,'unchangedFingerprints':50},'nativeDiagnostics':reports,'certification':False,'humanAcceptance':False,'sources':[item(root/p) for p in sources],'references':[item(root/p) for p in references],'evidence':evidence,'evidenceCount':len(evidence),'evidenceBytes':sum(x['bytes'] for x in evidence)}
target=audit/'manifest.json';assert not target.exists();target.write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'manifestSha256':sha(target.read_bytes()),'evidenceCount':len(evidence),'evidenceBytes':manifest['evidenceBytes'],'nativeDiagnostics':reports}))
