import subprocess,pathlib
root=pathlib.Path.cwd();out=root/'audits/C59_REPAIR_20260926'
for tag,id in [('g2c56','08-fisher'),('g2c57','05-snow-leopard'),('g2c57','06-clouded-leopard'),('g2c54','05-tiger'),('g2c54','06-leopard'),('g2c54','09-ocelot')]:
 name=tag+'-'+id;src='/Users/dakk/Projects/celestial-frontier-anthropic-mac/audits/G1_AUTO_AUTHOR_20260926/auto-'+tag+'-v10/'+id+'/fit'
 for stage,args in [('compile',['node','audits/C59_REPAIR_20260926/compile-chain.mjs',name,src]),('static',['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(out/name/'fit'),str(out/(name+'-static.json'))])]:
  with (out/(name+'-'+stage+'.log')).open('w') as f:r=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
  print(name,stage,r.returncode,flush=True)
  if r.returncode:break
