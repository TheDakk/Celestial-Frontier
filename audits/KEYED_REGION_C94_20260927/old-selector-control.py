import pathlib,subprocess,json,hashlib
root=pathlib.Path(__file__).resolve().parents[2];base=pathlib.Path(__file__).resolve().parent;p=root/'port/v2/tools/creature-animation/intake-authored.mjs';original=p.read_bytes();old=b'if(hasTransparent||owners.merged){';assert original.count(old)==1
try:
 temp=p.with_suffix('.control-tmp');temp.write_bytes(original.replace(old,b'if(hasTransparent){'));temp.replace(p)
 result=subprocess.run(['node','--test','--test-name-pattern=opaque same-joint','port/v2/tools/creature-animation/intake-authored-regions.test.mjs'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 (base/'old-selector-control.log').write_text(result.stdout)
 assert result.returncode!=0 and 'same-joint region merge requires a true-alpha master' in result.stdout
finally:
 temp=p.with_suffix('.control-tmp');temp.write_bytes(original);temp.replace(p)
assert p.read_bytes()==original
(base/'old-selector-control.json').write_text(json.dumps(dict(disabledActualSelectorFails=True,sourceRestoredExactly=True,sourceSha256=hashlib.sha256(original).hexdigest()),indent=2)+'\n')
print('Actual old selector fails new opaque outcome; source restored exactly')
