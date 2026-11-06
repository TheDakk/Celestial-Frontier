"""Apply established placement/packing paths to fresh candidates; preserve every refusal."""
import json, pathlib, subprocess
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution')
out=B/'batch03/class-fixes';out.mkdir(exist_ok=True)
rows=[]
for r in json.loads((B/'batch02/native-plan.json').read_text()):
    if r['name'] in ['Flying Fish','Humpback Whale','Beaked Whale','Lamprey']:
        rows.append({**r,'method':'axial-packing'})
for r in json.loads((B/'batch03/native-plan.json').read_text()):
    if r['name'] in ['Carrion Beetle','Springtail']:
        rows.append({**r,'method':'remainder-islands'})
pilot={p['id']:p for p in json.loads((B/'batch03-baseline-pilot.json').read_text())}
for id in ['c196creaturesupply-18-water-beetle','g2c136targetededits-21-bee','c198creaturesupplyb-22-locust']:
    p=pilot[id];src=pathlib.Path('audits/G1_AUTO_AUTHOR_20260926/auto-c243b03before')/id
    fit=next((src/x/'fit' for x in ['merge-joint','tail-labels'] if (src/x/'fit/binding.json').exists()),src/'fit')
    rows.append({'id':id,'name':p['name'],'fit':str(fit),'method':'remainder-islands'})
rows.append({'id':'c243b03r1c3-09-fly','name':'Fly','fit':'audits/G1_AUTO_AUTHOR_20260926/auto-c243b03r1c3c/c243b03r1c3-09-fly/fit','method':'remainder-islands'})
results=[]
for r in rows:
    d=out/r['id'];assert not d.exists()
    tool=B/'batch02/class-fixes/pack-axial.mjs' if r['method']=='axial-packing' else pathlib.Path('audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs')
    p=subprocess.run(['node',str(tool),r['id'],r['fit'],str(d)],capture_output=True,text=True)
    log=p.stdout+p.stderr
    (out/(r['id']+'.log')).write_text(log.replace(str(pathlib.Path.home()),'~'))
    row={**r,'output':str(d),'buildExit':p.returncode,'diagnosis':log[-1500:].replace(str(pathlib.Path.home()),'~')}
    if p.returncode==0:
        with (d/'static.log').open('x') as f:
            p=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(d/'fit'),str(d/'static.json')],stdout=f,stderr=subprocess.STDOUT)
        row['staticExit']=p.returncode
        if (d/'static.json').exists():row['static']=json.loads((d/'static.json').read_text()).get('status')
    results.append(row)
    (out/'results.json').write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps({k:row[k] for k in ['name','method','buildExit','static'] if k in row}),flush=True)
