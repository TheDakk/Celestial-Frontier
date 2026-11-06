"""Resolve the exact selected static fit; create native scripts without re-authoring."""
import json, pathlib, sys
batch=pathlib.Path(sys.argv[1]); root=pathlib.Path.cwd()
read=lambda p:json.loads(pathlib.Path(p).read_text())
write=lambda p,v:pathlib.Path(p).open('x').write(json.dumps(v,indent=2)+'\n')
pilot={p['id']:p for p in read(batch/'pilot-selected.json')}; rows=[]
scripts=batch/'native-scripts'; scripts.mkdir()
for a in read(batch/'attempts.json'):
    if a['id'] not in pilot: continue
    assert a['sourceEligibility']=='ELIGIBLE_FOR_INTAKE' and a['static']=='PASS_STATIC'
    p=pilot[a['id']]; score=pathlib.Path(a['score']); r=read(score); A=score.parent
    assert r['verdict']=='ADMIT' and r['static']=='PASS_STATIC'
    winner=next((c for c in r.get('candidates',[]) if c.get('static')=='PASS_STATIC'),None) if r.get('fallbackFrom') else None
    if winner and winner['rank']>0: A=A/('fallback-'+str(winner['rank']))
    fit=next((A/d/'fit' for d in ['merge-joint','tail-labels'] if (A/d/'fit'/'binding.json').exists()),A/'fit')
    if r['family']=='fish':
        tag=score.parent.parent.name.removeprefix('auto-')
        summary=score.parent.parent.parent/('native-'+tag+'-fishseams')/'summary.json'
        routes=[x for x in read(summary)['rows'] if x['id']==a['id']]
        assert len(routes)==1, 'Missing or ambiguous guarded fish route'
        route=routes[0]
        assert route['status']=='STATIC_PASS_NOT_NATIVE' and route['static']=='PASS_STATIC' and route['staticExitCode']==0, 'Guarded fish route refused; never fall back to the plain fit'
        assert route['sourceMasterSha256']==a['masterSha256'], 'Fish route master changed'
        fit=pathlib.Path(route['candidate'])
        assert (fit/'binding.json').is_file(), 'Missing guarded fish fit'
    manifest=read(fit/'parts/manifest.json'); subject=read(pathlib.Path(p['packet'])/'subject-source.json')
    media=subject.get('profile',{}).get('media',[]); aquatic='water' in media and 'ground' not in media
    base=read('audits/G1_AUTO_AUTHOR_20260926/native-g2fam-fish/07-perch-script.json' if aquatic else 'audits/ART_BATTLE_FOCUS_20260925/'+('15-goose' if r['family']=='biped-bird' else '05-cougar')+'/battle-script.json')
    for row in base['rows']:
        for key in ['an','dn']:
            if key in row: row[key]=a['name']
    base['supports']='observed'
    script=scripts/(manifest['creatureId']+'-script.json'); write(script,base)
    rows.append({'id':manifest['creatureId'],'packetId':a['id'],'name':a['name'],'fit':str(fit),'script':str(script),'nativeDir':str(batch/'native'/a['id']),'nativeReport':str(batch/'native'/a['id']/'report.json'),'score':str(score),'packet':p['packet']})
assert len(rows)==len(pilot) and len({r['id'] for r in rows})==len(rows)
write(batch/'native-plan.json',rows)
print(json.dumps({'selected':len(rows),'plan':str(batch/'native-plan.json')}))
