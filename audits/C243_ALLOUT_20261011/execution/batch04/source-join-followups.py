"""Apply the same measured source-join recipe to five remaining observed seam holds."""
import pathlib,json,subprocess
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution/batch04');out=B/'source-joins';plan=json.loads((B/'native-plan-reviewed.json').read_text());rows=[]
for r in plan:
 if r['name'] not in ['Kookaburra','Eagle','Owl','Swift','Egret']:continue
 src=pathlib.Path(r['fit']) if r['name']!='Egret' else B/'class-fixes'/r['id']/'fit';dest=out/r['id'];dest.mkdir();fit=dest/'fit'
 q=subprocess.run(['node','audits/C221_PROGRAM_20261010/phase5/source-joins.draft.mjs',str(src),str(fit)],capture_output=True,text=True);row={**r,'sourceFit':str(src),'fit':str(fit),'output':str(dest),'buildExit':q.returncode};(dest/'build.log').write_text((q.stdout+q.stderr).replace(str(pathlib.Path.home()),'~'))
 if q.returncode==0:
  with (dest/'static.log').open('x') as f:q=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(fit),str(dest/'static.json')],stdout=f,stderr=subprocess.STDOUT)
  row['staticExit']=q.returncode;row['static']=json.loads((dest/'static.json').read_text())['status']
 else:row['status']='REFUSE_SOURCE_JOIN'
 rows.append(row);(out/'followups.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps({k:row[k] for k in ['name','buildExit','static','status'] if k in row}),flush=True)
