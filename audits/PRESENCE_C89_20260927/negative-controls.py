import hashlib, json, pathlib, subprocess

root=pathlib.Path(__file__).resolve().parents[2]
base=pathlib.Path(__file__).resolve().parent
owner=root/'port/v2/tools/painted-creature/reviewed-presence.mjs'
original=owner.read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
mutants=[('removed-master-check',"  need(review.masterSha256 === sha(masterBytes), 'exact master hash');\n"),
         ('removed-canonical-absence-check',"  need(species[0].mustRead.includes(decision.canonicalFeature) && /\\btailless\\b/i.test(decision.canonicalFeature), 'independent canonical tailless evidence');\n")]
results=[]
try:
 for name,line in mutants:
  text=original.decode();assert text.count(line)==1
  changed=text.replace(line,'');temp=owner.with_suffix('.candidate');temp.write_text(changed);temp.replace(owner)
  with (base/(name+'.log')).open('w') as stream:
   result=subprocess.run(['node','--test','port/v2/tools/painted-creature/reviewed-presence.test.mjs'],cwd=root,stdout=stream,stderr=subprocess.STDOUT)
  assert result.returncode==1
  log=(base/(name+'.log')).read_text();assert 'AssertionError' in log or 'ERR_ASSERTION' in log
  results.append({'mutation':name,'exitCode':result.returncode,'sourceSha256':sha(original),'mutantSha256':sha(changed.encode()),'actualOwnerMutated':True})
finally:
 temp=owner.with_suffix('.restore');temp.write_bytes(original);temp.replace(owner)
assert owner.read_bytes()==original
(base/'negative-controls.json').write_text(json.dumps({'sourceRestoredExactly':True,'results':results},indent=2)+'\n')
print('Both actual-owner mutants failed; exact source restored')
