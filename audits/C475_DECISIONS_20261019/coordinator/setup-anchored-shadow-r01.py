from pathlib import Path
import shutil,json,hashlib
R=Path.cwd();B=R/'audits/C475_DECISIONS_20261019/coordinator/anchored-resolved-cpu-r01';S=B/'node_modules/c475-anchored-composed-runtime';assert not S.exists();S.mkdir(parents=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();rows=json.loads((B/'manifest.json').read_text())['rows']
for p in ['port/v2/tools','port/v2/apps/game/src','port/v2/packages']:shutil.copytree(R/p,S/p,ignore=shutil.ignore_patterns('node_modules'))
for p in ['port/v2/node_modules','port/v2/package.json','port/v2/reference']:
 (S/p).parent.mkdir(parents=True,exist_ok=True);(S/p).symlink_to(R/p,target_is_directory=(R/p).is_dir())
for p in ['tools/local-image-generation/kit-contact-math.mjs','tools/local-image-generation/connected-fringe-donor.mjs','audits/G1_AUTO_AUTHOR_20260926/harness/static.ts','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs','audits/C274_ALL170_20261017/w3-wave4/worstpose-r01/exact-retained-context.ts']:
 (S/p).parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(R/p,S/p)
for r in rows:
 assert sha(R/r['copy'])==r['sha256'];p=S/r['path'];p.parent.mkdir(parents=True,exist_ok=True);assert not p.is_symlink();shutil.copyfile(R/r['copy'],p)
(B/'shadow.json').write_text(json.dumps({'status':'AUDIT_ONLY_C491_PLUS_RECONCILED13','root':str(S),'copiedPackagesInsteadOfSymlinks':True,'rows':rows,'productionEdits':False,'native':False,'AI':False},indent=2)+'\n')
print(S)
