"""Film each selected static pass once; refuse existing output instead of retrying."""
import json, os, pathlib, subprocess, sys
root=pathlib.Path.cwd(); plan=pathlib.Path(sys.argv[1]); results=[]
for row in json.loads(plan.read_text()):
    out=root/row['nativeDir']; assert not out.exists(), 'Existing native output: no automatic retry'
    assert pathlib.Path(row['fit'],'binding.json').is_file()
    out.parent.mkdir(parents=True,exist_ok=True)
    log=out.parent/(row['packetId']+'.log')
    print(json.dumps({'starting':row['name']}),flush=True)
    try:
        p=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(root/row['fit']),str(root/row['fit']),str(out),str(root/row['script'])],cwd=root/'port/v2',env=dict(os.environ,CF_CPU_THROTTLE='4'),capture_output=True,text=True,timeout=1800)
        output=p.stdout+p.stderr; code=p.returncode
    except subprocess.TimeoutExpired as e:
        output='TIMEOUT: native candidate stopped after 1800 seconds'; code=124
    with log.open('x') as f: f.write(output.replace(str(pathlib.Path.home()),'~'))
    report=json.loads((out/'report.json').read_text()) if (out/'report.json').exists() else {}
    result={**row,'exitCode':code,'status':report.get('status','NO_REPORT')}; results.append(result)
    (plan.parent/'native-results.json').write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps({'name':row['name'],'exitCode':code,'status':result['status']}),flush=True)
subjects=[{k:r[k] for k in ['id','fit','nativeReport']} for r in results if r['status']=='DIAGNOSTIC_PASS' and r['exitCode']==0]
with (plan.parent/'finish-subjects.json').open('x') as f: f.write(json.dumps(subjects,indent=2)+'\n')
print(json.dumps({'nativePass':len(subjects),'nativeTotal':len(results)}),flush=True)
