"""Assemble retained evidence only. Does not execute or certify the game."""
from pathlib import Path
import collections, hashlib, html, json, os

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
rel = lambda p: os.path.relpath(p, HERE)
esc = html.escape
rigs = read(HERE / 'rigs.json')
baseline = read(HERE / 'baseline/report.json')
latest = read(HERE / 'context-audit/report.json')
projection = read(HERE / 'after-gait-01/report.json')
wave = read(HERE / 'after-wave-02/report.json')
index = lambda report, rig: [r for r in report['rows'] if r['rig'] == rig]
limits = {
 'python': 'The bend travels tailward. Following the head through world space, S-neck recruitment and constrict contact are still blocked by missing stage history and the current head/body topology. Root-relative strike excursion is only 0.0174 body axes; root surge is not neck extension.',
 'salmon': 'The tailward wave and growing amplitude pass. Wavelength is an index-based chain estimate, not an arc-length or swimming-speed measurement. World-path following has no stage history.',
 'eagle': 'The ground-only walking projection reaches 65% stance. The compiled aerial realm bypasses foot contacts, so the actual-context walk remains unqualified. The native film exercises flight and attacks, not grounded walking.',
 'beetle': 'Tripod timing and lift pass. Film review still owns whether every attack reads naturally.',
 'tree-frog': 'Existing observed toe-pad support admits the film. Hop head translation exceeds the prospective universal stabilization target; airborne body rise is not automatically a biological defect. No frog motion change was made.',
 'chimpanzee': 'Hindfeet reach 65% stance. Knuckle contacts and climb anchors are absent; a hindfoot result is not a complete knuckle-walk or climbing result.',
 'starfish': 'No tube-foot joints or contact observations exist. Arm pulse and sting labels cannot establish tube-foot propulsion. No locomotion fix claimed.',
 'tarantula': 'Alternating tetrapod timing and lift pass. The offered sting verb has no stinger on this accepted animal; it remains an explicit anatomy refusal.',
 'octopus': 'The rig lacks sucker contact observations. Arm animation does not certify a coordinated sucker crawl or jet propulsion. No locomotion fix claimed.',
 'fruit-bat': 'The ground-only hindfoot projection reaches 65% stance. Wing-wrist supports are absent, and the compiled aerial realm bypasses walking contacts. Full crawling remains unqualified.',
 'centipede': 'All fourteen leg pairs use a 0.20-cycle adjacent-pair offset and approximately 65% stance. The accepted trunk is rigid: no axial body-wave claim is possible without a new represented chain.',
 'civet': 'Protected S2 gait remains byte-identical. The existing 50% stance and small lift miss the prospective anatomy targets. Improving it would change protected measurements; no re-seal was attempted.',
 'bear': 'Guardian sizing is outside this archetype-only native harness. No 5 ms CPU claim or admitted film. Two action-local contact rows still refuse (gallop and tail); stage-owner diagnosis is required before tuning against guardian evidence.',
}
for r in rigs:
 if 'crab' in r['id']:
  limits[r['id']] = 'Protected S2 gait remains byte-identical. Its 50% duty misses the prospective 60% target; the sealed reach and existing gait were preserved. Both displayed films are the same retained control, not an invented after run.'

evidence, sections = [], []
native_failures = []
for batch in ['before-films','after-wave-films','after-compact-films','observed-compact-films']:
 for p in sorted((HERE / batch).glob('*/report.json')):
  v = read(p)
  if v['status'] != 'DIAGNOSTIC_PASS':
   native_failures.append({'report':rel(p),'runId':v.get('runId'),'error':v.get('error'),'sha256':sha(p)})

for r in rigs:
 ident = r['id']; rows = index(latest, ident)
 after = HERE / ('observed-compact-films' if ident=='tree-frog' else 'after-wave-films' if ident=='salmon' else 'before-films' if 'crab' in ident or ident=='bear' else 'after-compact-films') / ident / 'report.json'
 a = read(after); before = HERE / 'before-films' / ident / 'report.json'; b = read(before)
 before_label = 'Fresh baseline'
 if b['status'] != 'DIAGNOSTIC_PASS' and r.get('priorFilm'):
  before = ROOT / r['priorFilm']; before = before.parent / 'report.json'; b = read(before)
  before_label = 'Historical baseline — fresh baseline refusal retained'
 elif b['status'] != 'DIAGNOSTIC_PASS' and ident == 'civet':
  before_label = 'Fresh baseline refused — no substitute baseline film'
 same_rows = a.get('script',{}).get('rows') == b.get('script',{}).get('rows')
 fit = ROOT / r['fit']; record = read(fit / 'record.json')
 # Verify both source inventories contain this exact accepted record, not just a matching display name.
 def bound_record(report):
  return any(Path(x['path']) == fit/'record.json' and x['sha256']==sha(fit/'record.json') for x in report.get('sources',[]))
 entry = {'id':ident,'name':r['name'],'seed':record['identity']['seed'],'opponent':r['name'],
  'before':rel(before),'after':rel(after),'beforeRunId':b.get('runId'),'afterRunId':a.get('runId'),
  'sameActionRows':same_rows,'beforeExactRecord':bound_record(b),'afterExactRecord':bound_record(a),
  'beforeLabel':before_label,'beforeStatus':b['status'],'afterStatus':a['status'],
  'sameFilmReused':before==after,'counts':dict(collections.Counter(x['status'] for x in rows)),
  'findings':limits[ident],'recordSha256':sha(fit/'record.json'),'cpuP95Ms':a.get('paintedTier',{}).get('perRig'),
  'refusalsAtEnd':a.get('capture',{}).get('refusalsAtEnd'),'reportsSha256':{'before':sha(before),'after':sha(after)}}
 if a['status']=='DIAGNOSTIC_PASS':
  assert all(x==0 for x in a['gates']['refusals'].values())
  assert all(x==0 for x in entry['refusalsAtEnd'].values())
  assert max(entry['cpuP95Ms'].values())<=r['tierMs']
  assert entry['afterExactRecord'] and same_rows
 evidence.append(entry)
 messages=[]
 for row in index(wave,ident):
  if row['criterion']=='travelling-wave' and row['status']=='PASS':
   v=row['measurement']; old=next(x for x in index(baseline,ident) if x['criterion']=='travelling-wave' and x['action']==row['action'])['measurement']
   messages.append(f"Median adjacent bend delay: {old['medianLagCycles']:.4f} → {v['medianLagCycles']:.4f} cycles. Travel index: {old['travelIndex']:.3f} → {v['travelIndex']:.3f}. Estimated wavelength: {v['wavelengthBodyLengths']:.3f} chain lengths.")
 for row in index(projection,ident):
  if row['criterion']=='footfall-duty-lift' and row['status']=='PASS':
   vals=row['measurement']['rows'];lo=min(x['duty'] for x in vals);hi=max(x['duty'] for x in vals)
   messages.append(f"Ground-only projection, {row['action']}: feet spend {lo*100:.1f}–{hi*100:.1f}% of the cycle in stance; maximum phase error {max(x['phaseError'] for x in vals):.3f} cycles. Consult actual-context verdicts below.")
 cpu='Not measured' if not entry['cpuP95Ms'] else ' / '.join(f'{v:.2f}' for v in entry['cpuP95Ms'].values())+' ms (left / right)'
 players=[]
 for label,p,v in [(before_label,before,b),('After' if before!=after else 'Unchanged control (same film)',after,a)]:
  film=p.parent/'battle-10s.webm';poster=p.parent/'turn0-hit-approach-50.png'
  if v['status']=='DIAGNOSTIC_PASS' and film.exists():
   media=f'<video controls preload="none" playsinline poster="{esc(rel(poster))}" src="{esc(rel(film))}"></video>'
  else:media=f'<div class="blocked">No admitted film.<br>{esc(str(v.get("error","Unavailable")).splitlines()[0])}</div>'
  players.append(f'<div><h3>{esc(label)}</h3>{media}<p class="small"><a href="{esc(rel(p))}">{esc(v.get("runId","Refusal report"))}</a></p></div>')
 measurements=''.join(f'<p>{esc(s)}</p>' for s in messages)
 failrows=''.join(f'<tr><td>{esc(x["action"])}</td><td>{esc(x["criterion"])}</td><td>{esc(str(x["measurement"] if x["measurement"] is not None else x["reason"]))}</td></tr>' for x in rows if x['status']=='FAIL')
 sections.append(f'<section id="{ident}"><h2>{esc(r["name"])}</h2><p class="small">Seed {entry["seed"]} · opponent {esc(r["name"])} · accepted record {entry["recordSha256"][:12]}</p><div class="pair">{"".join(players)}</div>{measurements}<p><strong>Measured per-rig CPU p95:</strong> {cpu}. <strong>Actual-context rows:</strong> {esc(str(entry["counts"]))}.</p><p class="finding">{esc(limits[ident])}</p><details><summary>Remaining measured FAIL rows</summary><table><thead><tr><th>Action</th><th>Criterion</th><th>Measurement / reason</th></tr></thead><tbody>{failrows}</tbody></table></details></section>')

(HERE/'review-data.json').write_text(json.dumps({'scope':'Assembled retained evidence, not one new certificate','rigs':evidence,'nativeRefusals':native_failures},indent=2)+'\n')
nav=' '.join(f'<a href="#{r["id"]}">{esc(r["name"])}</a>' for r in rigs)
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion anatomy · Celestial Frontier</title><style>
:root{color-scheme:dark;font:16px/1.55 system-ui;background:#10171d;color:#e6edf1}body{max-width:1260px;margin:auto;padding:32px 22px 90px}h1{font-size:clamp(2rem,5vw,3.8rem);line-height:1.1;margin-bottom:15px}h2{font-size:2rem;margin-bottom:4px}h3{font-size:1rem}a{color:#8fe1d3}nav{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}section{border-top:1px solid #40515d;padding:24px 0 40px;scroll-margin-top:15px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}video{width:100%;aspect-ratio:16/9;background:#030506;border-radius:8px}.small{font-size:.82rem;color:#b4c5d0;overflow-wrap:anywhere}.finding,.notice{border-left:3px solid #e8bc77;padding:12px 18px;background:#1e2932}.blocked{padding:22px;background:#342927;min-height:180px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:.8rem}td,th{padding:10px;border-bottom:1px solid #40515d;text-align:left;vertical-align:top;overflow-wrap:anywhere}td:last-child{max-width:650px}summary{cursor:pointer;margin:16px 0}@media(max-width:760px){.pair{grid-template-columns:1fr}body{padding:20px 14px}table{display:block;overflow:auto}}
</style><header><p>CELESTIAL FRONTIER / LOCAL MOTION STUDY / 24 SEPTEMBER 2026</p><h1>The bend now travels.<br>The anatomy audit stays honest.</h1><p>Python first. Eighteen rigs, 234 offered actions. Accepted artwork is unchanged. This page distinguishes motion improvements, unchanged controls and work blocked by stage or represented anatomy.</p><p class="notice">17 selected native films pass with zero rig refusals and per-rig CPU p95 at or below 3.5 ms. Bear has no admitted guardian film. This is not full biomechanical qualification. Before/after use the same recorded creature seed, self-opponent and hit/dodge/kill rows; compact runs shorten only ready/command pauses. Compare action phases, not wall-clock timestamps. Historical baselines and reused controls are labelled.</p><p><a href="SPEC.md">Prospective specification</a> · <a href="README.md">Packet</a> · <a href="baseline/TABLE.md">Immutable baseline</a> · <a href="context-audit/TABLE.md">Corrected-context audit</a> · <a href="CLAUDE_REQUESTS.md">Stage and anatomy handoff</a> · <a href="review-data.json">Run IDs, hashes and all native refusals</a></p></header>'''
page+=f'<nav>{nav}</nav>'+''.join(sections)+'''<footer><h2>Review together</h2><p>Watch Python’s travelling bend, then Centipede’s leg ripple. Accepting these changes does not accept the unresolved neck strike, constrict contact or missing support anatomy. The remaining stage/representation requests are batched in CLAUDE_REQUESTS.md. No publishing or hosted activity occurred.</p></footer></html>'''
(HERE/'review.html').write_text(page)
print(json.dumps({'rigs':len(evidence),'selectedNativePasses':sum(r['afterStatus']=='DIAGNOSTIC_PASS' for r in evidence),'maxPerRigCpuP95Ms':max(max(r['cpuP95Ms'].values()) for r in evidence if r['cpuP95Ms']),'retainedNativeRefusals':len(native_failures),'missingBeforeRecordProof':[r['id'] for r in evidence if not r['beforeExactRecord']]}))
