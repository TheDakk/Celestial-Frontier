import subprocess,pathlib,os
root=pathlib.Path.cwd();out=root/'audits/C59_REPAIR_20260926';env={**os.environ,'CF_CPU_THROTTLE':'4'}
for name,left,right,script in [('fish-gill-two','cod-gill-two','perch-gill-two',root/'audits/TAIL_LABELS_C56_20260926/fish-script.json'),('arctic-islands','arctic-islands','arctic-islands',root/'audits/G1_AUTO_AUTHOR_20260926/native-g2-quad/03-arctic-fox-script.json')]:
 if name=='arctic-islands':
  import json
  old=json.loads((root/'audits/TAIL_LABELS_C56_20260926/native-arctic-fox/report.json').read_text());script=out/'arctic-islands-script.json';script.write_text(json.dumps(old['script'],indent=2)+'\n')
 with (out/(name+'-native.log')).open('w')as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(out/left/'fit'),str(out/right/'fit'),str(out/(name+'-native')),str(script)],cwd=root/'port/v2',env=env,stdout=f,stderr=subprocess.STDOUT)
 print(name,r.returncode,flush=True)
