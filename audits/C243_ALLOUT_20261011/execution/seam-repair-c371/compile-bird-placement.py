import pathlib,json,subprocess
b=pathlib.Path('audits/C243_ALLOUT_20261011/execution/seam-repair-c371');result=[]
for r in json.loads((b/'held-plan.json').read_text()):
 if r['name']not in ['Hoatzin','Kakapo','Tern']:continue
 out=b/'bird-placement02'/r['name'];out.parent.mkdir(exist_ok=True)
 p=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs',r['id'],r['originalFit'],str(out)],capture_output=True,text=True)
 result.append({'name':r['name'],'fit':str(out/'fit'),'exitCode':p.returncode,'output':p.stdout+p.stderr});print(r['name'],p.returncode,(p.stdout+p.stderr)[:500],flush=True)
(b/'bird-placement-results.json').write_text(json.dumps(result,indent=2)+'\n')
