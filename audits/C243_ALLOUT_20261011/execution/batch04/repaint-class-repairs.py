"""Apply existing bounded island ownership repair to newly admitted static-red birds."""
import pathlib,json,subprocess
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution/batch04');results=[]
for id,tag,name in [('c243b04r1c3-04-owl','c243b04r1c3a','Owl'),('c243b04r1c3-11-swift','c243b04r1c3b','Swift')]:
 src=pathlib.Path('audits/G1_AUTO_AUTHOR_20260926')/('auto-'+tag)/id/'fit';out=B/'class-fixes'/id;assert not out.exists()
 q=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs',id,str(src),str(out)],capture_output=True,text=True)
 log=(q.stdout+q.stderr).replace(str(pathlib.Path.home()),'~');(B/'class-fixes'/(id+'.log')).write_text(log)
 r={'id':id,'name':name,'fit':str(src),'output':str(out),'buildExit':q.returncode,'diagnosis':log[-1500:]}
 if q.returncode==0:
  with (out/'static.log').open('x') as f: v=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(out/'fit'),str(out/'static.json')],stdout=f,stderr=subprocess.STDOUT)
  r['staticExit']=v.returncode;r['static']=json.loads((out/'static.json').read_text())['status']
 results.append(r);(B/'class-fixes/repaint-results.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(r),flush=True)
