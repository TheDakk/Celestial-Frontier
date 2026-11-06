"""Retain an untouched fresh draw and release its single heavy-job lease."""
from pathlib import Path
import json,shutil,hashlib,struct,sys
slug,source=sys.argv[1:];p=Path('audits/C475_DECISIONS_20261019/coordinator/paintings')/slug
assert slug in ['c475-centipede-'+d for d in 'abcd']
src=Path(source);assert src.is_file() and str(src).startswith('~/.codex/generated_images/')
lease=json.loads((p/'lease.json').read_text());assert lease['status']=='ACTIVE'
sha=lambda q:hashlib.sha256(Path(q).read_bytes()).hexdigest()
freeze=json.loads((p/'request-freeze-r02.json').read_text())
assert freeze['requestSha256']==sha(p/'request-r02.json') and freeze['promptSha256']==sha(p/'prompt.txt')
assert not (p/'master.png').exists();shutil.copyfile(src,p/'master.png')
dims=struct.unpack('>II',(p/'master.png').read_bytes()[16:24])
r=dict(schema='cf.c475-generated-original/v1',status='GENERATED_UNMODIFIED_SOURCE_REVIEW_PENDING',id=slug,species='Centipede',family='myriapod',master=str(p/'master.png'),masterSha256=sha(p/'master.png'),generatedPath=str(src),promptSha256=sha(p/'prompt.txt'),effectiveRequestSha256=sha(p/'request-r02.json'),requestFreezeSha256=sha(p/'request-freeze-r02.json'),actualDimensions=dims,requestedDimensions=[1254,1254],actualGeneratorSeed=None,seedBindingStatus='NO_NUMERIC_SEED_EXPOSED_FRESH_INDEPENDENT_CALL',outputModified=False,tool='image_gen.imagegen',referenceImageInputs=[],initialCurrentLease=lease)
(p/'generation.json').write_text(json.dumps(r,indent=2)+'\n');(p/'lease-release.json').write_text(json.dumps(dict(status='RELEASE_REQUESTED',afterOutputHash=sha(p/'master.png')))+'\n')
print(json.dumps(dict(master=r['master'],sha256=r['masterSha256'],dimensions=dims)))
