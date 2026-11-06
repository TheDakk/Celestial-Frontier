"""Apply the existing guarded remainder-island class repair to admitted birds; retain refusals."""
import pathlib,json,subprocess
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution');out=B/'batch04/class-fixes';out.mkdir(exist_ok=True)
pilot={r['id']:r for r in json.loads((B/'batch04-baseline-pilot.json').read_text())};ids=['g2c83-16-cockatoo','g2c72-12-egret','g2c107-08-frigatebird','g2c106-18-hoatzin','g2c106-17-kakapo','c213originals-28-kookaburra','c206birdsourcerepaints-22-macaw','c213originals-29-osprey'];rows=[]
for id in ids:
 p=pilot[id];src=pathlib.Path('audits/G1_AUTO_AUTHOR_20260926/auto-c243b04before')/id;fit=next((src/x/'fit' for x in ['merge-joint','tail-labels'] if (src/x/'fit/binding.json').exists()),src/'fit');rows.append({'id':id,'name':p['name'],'fit':str(fit),'baselineScore':str(src/'score.json')})
rows += [r for r in json.loads((B/'batch03/native-plan-reviewed.json').read_text()) if r['name']=='Eagle']
results=[]
for r in rows:
 dest=out/r['id'];assert not dest.exists()
 if not (pathlib.Path(r['fit'])/'binding.json').exists():
  row={**r,'status':'REFUSE_NO_SOURCE_BINDING','reason':'Original intake refused; no binding available. Preserve unchanged refusal; no repair or fallback admission.'}
 else:
  p=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs',r['id'],r['fit'],str(dest)],capture_output=True,text=True);log=p.stdout+p.stderr;(out/(r['id']+'.log')).write_text(log.replace(str(pathlib.Path.home()),'~'));row={**r,'output':str(dest),'buildExit':p.returncode,'diagnosis':log[-1500:].replace(str(pathlib.Path.home()),'~')}
  if p.returncode==0:
   with (dest/'static.log').open('x') as f:q=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(dest/'fit'),str(dest/'static.json')],stdout=f,stderr=subprocess.STDOUT)
   row['staticExit']=q.returncode
   if (dest/'static.json').exists():row['static']=json.loads((dest/'static.json').read_text()).get('status')
 results.append(row);(out/'results.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps({k:row[k] for k in ['name','buildExit','static','status'] if k in row}),flush=True)
