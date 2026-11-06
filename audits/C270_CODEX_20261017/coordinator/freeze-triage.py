import pathlib,json,hashlib,subprocess,sys
P=pathlib.Path;B=P(__file__).resolve().parent;out=B/sys.argv[1];out.mkdir();old=json.loads(P('audits/C266_CODEX_20261017/w3-c266-finished/finished-06/all-roots.json').read_text())
films=[]
for root in old:
 for d in P(root).iterdir():
  if d.is_dir() and (d/'report.json').exists() and (d/'turn3-hit-idle-50.png').exists() and (d/'turn3-hit-idle-90.png').exists():films.append(str(d))
assert len(films)==353 and len(set(films))==353
# Freeze only completed actual PASS reports, never waiting/planned/failed film paths.
new=[]
for x in sys.argv[2:]:
 p=P(x);r=json.loads((p/'report.json').read_text());assert r['status']=='DIAGNOSTIC_PASS';assert all((p/(f+'.png')).exists() for f in ['turn1-hit-reaction-50','turn2-dodge-reaction-50','turn3-hit-reaction-50','turn3-hit-idle-50','turn3-hit-idle-90']);new.append(x)
assert new and len(set(films+new))==len(films+new)
roots=old+sorted(set(str(P(x).parent) for x in new));expanded=[]
for root in roots:
 for d in P(root).iterdir():
  if d.is_dir() and (d/'report.json').exists() and (d/'turn3-hit-idle-50.png').exists() and (d/'turn3-hit-idle-90.png').exists():expanded.append(str(d))
assert len(expanded)==len(set(expanded)) and set(expanded)==set(films+new), 'No accidental nested/failed/stale cohort membership'
# Positive cohort plus missing, duplicate and added-path mutation controls.
expected=set(films+new)
accept=lambda xs:len(xs)==len(set(xs)) and set(xs)==expected
assert accept(expanded) and not accept(expanded[:-1]) and not accept(expanded+[expanded[0]]) and not accept(expanded+['MUTANT'])
(out/'membership-controls.json').write_text(json.dumps({'status':'PASS','positive':1,'rejectedMutants':3})+'\n')
sha=lambda p:hashlib.sha256(P(p).read_bytes()).hexdigest();pins=[{'file':str(P(x)/(f+'.png')),'sha256':sha(P(x)/(f+'.png'))} for x in sorted(expanded) for f in ['turn3-hit-idle-50','turn3-hit-idle-90']]
(out/'roots.json').write_text(json.dumps(roots,indent=2)+'\n');(out/'freeze.json').write_text(json.dumps({'status':'FROZEN_BEFORE_MEASUREMENT','baseFilms':353,'newFilms':new,'filmCount':len(expanded),'films':sorted(expanded),'pins':pins},indent=2)+'\n')
r=subprocess.run(['node','audits/C243_ALLOUT_20261011/review/fragment-check.mjs',str(out/'fragment-triage.json'),*roots],capture_output=True,text=True);(out/'checker.log').write_text(r.stdout+r.stderr);assert r.returncode==0
q=json.loads((out/'fragment-triage.json').read_text());assert set(x['film'] for x in q['rows'])==set(expanded);assert all(sha(x['file'])==x['sha256'] for x in pins);current=[x for x in q['rows'] if x['film']in new];(out/'current-rows.json').write_text(json.dumps(current,indent=2)+'\n');(out/'verification.json').write_text(json.dumps({'status':'PASS','frozenFilmCount':len(expanded),'currentFilms':len(new),'freezeSha256':sha(out/'freeze.json'),'triageSha256':sha(out/'fragment-triage.json'),'pinsUnchanged':len(pins)},indent=2)+'\n');print(json.dumps({'status':'PASS','films':len(expanded),'new':len(new)}))
