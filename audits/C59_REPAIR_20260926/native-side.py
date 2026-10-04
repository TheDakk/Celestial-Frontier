import subprocess,pathlib,json,os
root=pathlib.Path.cwd();out=root/'audits/C59_REPAIR_20260926';env={**os.environ,'CF_CPU_THROTTLE':'4'}
for tag,id in [('g2c56','06-mink'),('g2c56','08-fisher'),('g2c57','05-snow-leopard'),('g2c57','06-clouded-leopard'),('g2c54','05-tiger'),('g2c54','06-leopard'),('g2c54','09-ocelot')]:
 name=tag+'-'+id+'-side';fit=out/name/'fit';record=json.loads((fit/'record.json').read_text());s=json.loads((root/'audits/G1_AUTO_AUTHOR_20260926/native-g2c56/c56-06-mink-script.json').read_text())
 for r in s['rows']:r['an']=r['dn']=record['identity']['earthName']
 script=out/(name+'-script.json');script.write_text(json.dumps(s,indent=2)+'\n')
 with (out/(name+'-native.log')).open('w')as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(out/(name+'-native')),str(script)],cwd=root/'port/v2',env=env,stdout=f,stderr=subprocess.STDOUT)
 print(name,r.returncode,flush=True)
