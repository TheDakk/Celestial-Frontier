"""Copy the untouched built-in original and release its cooperative serial lease."""
from pathlib import Path
import sys,json,hashlib,struct,shutil
ident,source=sys.argv[1:];p=Path(__file__).resolve().parent/'paintings'/ident
sha=lambda d:hashlib.sha256(d).hexdigest()
r=json.loads((p/'request.json').read_text());f=json.loads((p/'request-freeze.json').read_text())
assert r['id']==ident and sha((p/'request.json').read_bytes())==f['requestSha256'] and sha((p/'prompt.txt').read_bytes())==f['promptSha256']
assert not(p/'master.png').exists() and not(p/'generation.json').exists()
lease=json.loads((p/'lease.json').read_text());assert lease['status']=='ACTIVE' and lease['beforeGiB']>=42 and lease['lowestGiB']>=30
d=Path(source).read_bytes();assert d[:8]==b'\x89PNG\r\n\x1a\n';dims=list(struct.unpack('>II',d[16:24]));shutil.copyfile(source,p/'master.png');assert(p/'master.png').read_bytes()==d
rel=lambda q:str(Path(q)).replace(str(Path.home()),'~')
x=dict(schema='cf.c465-generated-original/v1',status='GENERATED_UNMODIFIED_SOURCE_REVIEW_PENDING',id=ident,species=r['species'],family=r['family'],master=rel(p/'master.png'),masterSha256=sha(d),generatedPath=rel(source),promptSha256=f['promptSha256'],effectiveRequestSha256=f['requestSha256'],actualDimensions=dims,requestedDimensions=r['requestedDimensions'],requestedDimensionMatchQA=dims==r['requestedDimensions'],keyColor=r['keyColor'],actualGeneratorSeed=None,seedBindingStatus='NO_NUMERIC_SEED_EXPOSED_FRESH_INDEPENDENT_CALL',outputModified=False,tool='image_gen.imagegen',referenceUsage=r['referenceUsage'],toolReferenceImageInputs=[],initialCurrentLease=dict(beforeGiB=lease['beforeGiB'],lowestGiB=lease['lowestGiB']))
(p/'generation.json').write_text(json.dumps(x,indent=2)+'\n');(p/'lease-release.json').write_text('{}\n')
print(json.dumps(dict(id=ident,masterSha256=x['masterSha256'],actualDimensions=dims,actualGeneratorSeed=None)))
