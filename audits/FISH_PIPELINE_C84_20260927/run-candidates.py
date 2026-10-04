import pathlib,json,subprocess
base=pathlib.Path(__file__).resolve().parent;repo=base.parents[1];rows=[]
for source in json.loads((base/'inputs.json').read_text()):
 ident=source['id'];candidate=ident+'-fixed-01';row={'id':ident,'sourceFit':source['localFit'],'candidate':str((base/candidate/'fit').relative_to(repo))}
 with (base/(ident+'-build.log')).open('w') as log:
  result=subprocess.run(['node',str(base/'compile.mjs'),candidate,source['localFit']],cwd=repo,stdout=log,stderr=subprocess.STDOUT)
 row['buildExitCode']=result.returncode
 if result.returncode==0:
  report=base/(ident+'-static.json')
  with (base/(ident+'-static.log')).open('w') as log:result=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',row['candidate'],str(report)],cwd=repo,stdout=log,stderr=subprocess.STDOUT)
  row['staticExitCode']=result.returncode
  if report.exists():
   data=json.loads(report.read_text());row['static']=data['status'];row['refusedActions']=[x['id'] for x in data['rows'] if x['status']!='PASS'];row['presentation']=data.get('presentation',{}).get('status')
 rows.append(row);(base/'candidate-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(ident,row.get('static','BUILD_REFUSED'),flush=True)
