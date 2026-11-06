"""Existing bounded island repair plus measured source-adjacency joins; retain every refusal."""
import pathlib,json,subprocess
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution/batch04');out=B/'source-joins';out.mkdir();plan=json.loads((B/'native-plan-reviewed.json').read_text());rows=[]
for r in plan:
 if r['name'] not in ['Ostrich','Pheasant','Tern','Cockatoo','Frigatebird','Kakapo']:continue
 src=pathlib.Path(r['fit']);dest=out/r['id'];dest.mkdir();logs=[]
 if r['name'] in ['Ostrich','Pheasant','Tern']:
  island=dest/'islands';q=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs',r['id'],str(src),str(island)],capture_output=True,text=True);logs.append(q.stdout+q.stderr)
  if q.returncode!=0:rows.append({**r,'status':'REFUSE_ISLAND_REPAIR','exitCode':q.returncode});continue
  src=island/'fit'
 fit=dest/'fit';q=subprocess.run(['node','audits/C221_PROGRAM_20261010/phase5/source-joins.draft.mjs',str(src),str(fit)],capture_output=True,text=True);logs.append(q.stdout+q.stderr);row={**r,'sourceFit':r['fit'],'fit':str(fit),'output':str(dest),'buildExit':q.returncode}
 if q.returncode==0:
  with (dest/'static.log').open('x') as f:q=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(fit),str(dest/'static.json')],stdout=f,stderr=subprocess.STDOUT)
  row['staticExit']=q.returncode;row['static']=json.loads((dest/'static.json').read_text())['status']
 else:row['status']='REFUSE_SOURCE_JOIN'
 (dest/'build.log').write_text('\n'.join(logs).replace(str(pathlib.Path.home()),'~'));rows.append(row);(out/'results.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps({k:row[k] for k in ['name','buildExit','static','status'] if k in row}),flush=True)
