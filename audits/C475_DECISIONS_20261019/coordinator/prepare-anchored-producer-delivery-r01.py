"""Freeze current P04 producer truth only after its required checks finish."""
from pathlib import Path
import hashlib, json, re, subprocess

C = Path(__file__).resolve().parent
B = C.parent
read = lambda p: json.loads(Path(p).read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
profile = C / 'develop-anchored-p04-r03.json'
assert read(profile)['status'] == 'RED'
log = profile.with_suffix('.log').read_text()
assert 'ℹ tests 796' in log and 'ℹ pass 796' in log
assert 'ℹ tests 56' in log and 'ℹ pass 56' in log
assert re.search(r'Tests\s+1 failed \| 6096 passed', log)
assert len(re.findall(r'^ FAIL ', log, re.M)) == 1
assert 'FAIL  tests/current-producer-authorities.test.ts' in log
owners = C / 'anchored-p04-independent-owners-result-r06.json'
o = read(owners)
assert len(o['rows']) == 6 and all(r['exitCode'] == 0 for r in o['rows'])
assert read(C / 'anchored-p04-independent-owners-r06.json')['status'] == 'PASS'
j = read(C / 'runtime-change-list.json')
for key in ['gameCodeAndImportedToolsCurrentPins', 'typeOnlyDefinitionsCurrentPins', 'testOnlyCurrentPins', 'offlineAuthoringToolsCurrentPins', 'auditMeasurementCodeCurrentPins']:
    for r in j[key]:
        assert sha(r['path']) == r['sha256'], r['path']
for r in [j['guideAuthorityCurrentPin'], j['selectedCertificateCurrentPin']]:
    assert sha(r['path']) == r['sha256'], r['path']
assert [len(j[k]) for k in ['gameCodeAndImportedTools', 'typeOnlyDefinitions', 'testOnly']] == [23, 5, 16]
j['status'] = 'P04_APPLIED_6096_PASS_SOLE_STALE_I5_RED_ALL_SIX_INDEPENDENT_OWNERS_PASS'
j['developEvidence'].update(currentP04ProfileAfterRepair=str(profile), currentP04ProfileResult='Node tools796PASS; prepared-runner56PASS; Vitest6096PASS/sole stale-I5 bindingRED; unchanged C464, no certification', currentP04IndependentOwners=str(owners), currentP04IndependentOwnersResult='ALL6_PASS; final exact current runtime and fixture bytes; not a green profile')
j['profileStatusMustBeRefreshedByRootBeforeDelivery'] = False
(C / 'runtime-change-list.json').write_text(json.dumps(j, indent=2) + '\n')
d = B / 'delivery/wave18-anchored-producer'
d.mkdir(exist_ok=False)
(d / 'README.md').write_text('''# C497 — Anchored soft-polyp and mixed-colony producer

Applied the independently reviewed fourteen-path P04 proposal. Sea Anemone has a fixed pedal base with soft column/oral/crown paint; mixed coral has fixed calcified skeleton and explicitly observed soft polyp fields. The mixed inventory requires a v2 source declaration, not an inferred count. All families keep their existing limits: mixed2+2N controls fit64 joints,32 render parts,64 semantic regions. Prior21 templates and13 cast registrations remain exact. The real battle path now casts these families at their stand; mixed casting expands only its own observed fields. Source hashes, literal control owners and fixed paint are checked before intake. Cold/Deep whole-part source-owner HOLDs remain.

Root verified274 frozen inputs before applying exact bytes. New actual-source tests9PASS and actual compiled battle tests7PASS include source hash/owner/count refusals, real transcript damage/no run-up, fixed surfaces and moving soft fields. The first full profile exposed three synthetic fixture admission failures; exact test-only fixtures now declare their synthetic polyp count and retain all previous assertions plus generated fixed-base checks. The first TypeScript owner then rejected anatomy:undefined; two conditional property spreads repair that typing issue without changing assertions. All original RED attempts are retained. Repaired existing/new game tests19PASS. The final required profile has796Node tools,56runner controls and6096Vitest passes; its sole failure is the stale selected C464 I5 producer binding. All six independently approved non-test owners pass on the current files. The profile remains RED; no seal or certificate was rebound.

Anemone's actual source/all7parts and CPU poses passed independent review. Root static passes10actions×121samples, exact rest0; the full aquatic lake signature is pinned. Its pre-existing isolated source dab at671,731 is disclosed and retained. Native, C261, all-five W2, signed pre-AI checkpoint, conserved finish and W3 remain pending. No READY or admission is claimed by this producer. Comb Jelly remains physically clean but C261HOLD at pink134/132,0fragments; no AI/ctenophore propagation.

The CREATURE MOTION STUDIES bullet and GUIDE authority change in this same commit, still121bullets, ordered-content SHA1f2a58f7641452c4626dbe7d6c810b5857ffd550a950446dd747e5f1c3e8550e. The pure authority verifier rejects old/replaced/swapped/missing content. Current references match the applied source. I5_CHANGES.md and coordinator/runtime-change-list.json list all23 game/pipeline paths,5 type definitions,16 test-only files, GUIDE,2 offline tools and2 audit instruments separately for Claude's I5 review.

Ten existing READY packets remain unchanged; original170:17priorClaudeACCEPT,10READY,143HOLD. C495 reservation ACTIVE; root alone continues serial native/AI at42GiB before/30GiB running. Latest producer profile minimum53.9GiB. Claude may review signed deliveries now without a Dakk relay, app switch or remote push. No competing heavy window until TERMINAL. D43/C223/certification not activated; no push, PR, GitHub, hosted, protected-branch, release or deploy action. All-pairs HOLD.
''')
parts = ['# Current C475 changes requiring Claude I5 review\n', 'Current source is applied. C464 remains selected and stale; the required develop profile is RED solely at its producer binding. No certification is authorized in this run.\n']
for key, title in [('gameCodeAndImportedTools', 'Game code and pipeline tools (23)'), ('typeOnlyDefinitions', 'Type definitions (5)'), ('testOnly', 'Test-only changes (16)'), ('offlineAuthoringTools', 'Offline authoring (2)'), ('auditMeasurementCode', 'Audit instruments (2)')]:
    parts += ['\n## ' + title + '\n\n', '\n'.join('- `' + p + '`' for p in j[key]) + '\n']
parts += ['\nGUIDE authority: `' + j['guideAuthority'] + '`,121 bullets, ordered-content SHA `' + j['guideBulletAuthoritySha256'] + '`. Current exact byte pins are in `../../coordinator/runtime-change-list.json`. Only the D39 named head/jaw row rebind was applied; no other source/measurement seal or limit changed.\n']
(d / 'I5_CHANGES.md').write_text(''.join(parts))
proof = dict(status='CHECKED_PRODUCER_NOT_NATIVE_OR_READY', profile=str(profile), profileSha256=sha(profile), independentOwners=str(owners), ownersSha256=sha(owners), runtimeList=str(C/'runtime-change-list.json'), runtimeListSha256=sha(C/'runtime-change-list.json'), profileRemainsRED=True, certificationActivated=False)
(d / 'delivery.json').write_text(json.dumps(proof, indent=2) + '\n')
row = '| C497 | 2026-10-20 | **Anchored P04 producer signed; C495 ACTIVE.** Exact14applied/274pins; actualsource9+game7/repaired19PASS; finaldevelop796Node/56runner/6096VitestPASS, sole staleI5RED; all6approvedindependentownersPASS. GUIDE121samecommit1f2a58f7. SeaAnemone source/all7parts/rootstaticclean, native/C261/W2/finishpending; Cold/Deep literalownerHOLD, Comb pink134/132HOLD/noAI. Current23game/pipeline+5type+16test paths disclosed forClaudeI5. | `audits/C475_DECISIONS_20261019/delivery/wave18-anchored-producer/README.md` | Rootcontinues serialnative42start30floor; noD43/C223/certification/remote/protectedbranch/release/deploy. All-pairsHOLD. |\n'
p = Path('audits/MAILBOX/TO_CLAUDE.md'); s = p.read_text(); assert '| C497 |' not in s; p.write_text(s + row)
p = Path('ROADMAP.md'); s = p.read_text(); assert '\nC497 ' not in s; p.write_text(s + '\nC497 applies reviewed14-path anchored P04producer: actualsource9+game7/repaired19PASS; finalrequiredprofile796Node/56runner/6096VitestPASS+sole staleI5RED, all6approvedownersPASS. Firstfunctional/typeREDs retained with2test-only fixture repairs; no assertion/gate weakening. GUIDE121samecommit1f2a58f7/currentrefs match;23game/pipeline+5types+16tests disclosedforClaudeI5. Anemone source/all7parts/staticclean/nativepending; Cold/Deep actualownerHOLDs andCombC261134/132HOLD persist. TenREADY unchanged,C495ACTIVE serial42/30; noD43activation. Delivery wave18-anchored-producer; signednative binding is next.\n')
peer = Path('~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md')
(C / 'peer-batch-end-c497.json').write_text(json.dumps(dict(path=str(peer), sha256=sha(peer), latestRows=peer.read_text().splitlines()[-2:], peerHead=subprocess.check_output(['git','rev-parse','anthropic/mac'],text=True).strip()), indent=2)+'\n')
print(json.dumps(proof))
