import sys,json,hashlib,shutil,struct
from pathlib import Path
ident,source=sys.argv[1:]
p=Path(__file__).resolve().parent/'paintings'/ident
request_file=p/('effective-request.json' if (p/'effective-request.json').exists() else 'request.json')
prompt_file=p/('effective-prompt.txt' if (p/'effective-prompt.txt').exists() else 'prompt.txt')
request=json.loads(request_file.read_text())
assert request['id']==ident
master=p/'master.png'
assert not master.exists(), 'Retain original; never overwrite generated output'
data=Path(source).read_bytes()
assert data[:8]==b'\x89PNG\r\n\x1a\n'
dimensions=struct.unpack('>II',data[16:24])
assert hashlib.sha256(prompt_file.read_bytes()).hexdigest()==request['promptSha256']
shutil.copyfile(source,master)
row={'schema':'cf.c279-generated-original/v1','status':'GENERATED_UNMODIFIED_SOURCE_REVIEW_PENDING','id':ident,'species':request['species'],'familyGroup':request['familyGroup'],'master':str(master),'masterSha256':hashlib.sha256(data).hexdigest(),'generatedPath':source,'promptSha256':request['promptSha256'],'referenceSha256':request['referenceSha256'],'actualDimensions':list(dimensions),'requestedDimensions':request['requestedDimensions'],'requestedDimensionMatchQA':list(dimensions)==request['requestedDimensions'],'keyColor':request['keyColor'],'actualGeneratorSeed':None,'seedBindingStatus':'NO_NUMERIC_SEED_EXPOSED_FRESH_INDEPENDENT_CALL','outputModified':False,'tool':'image_gen.imagegen'}
row['effectiveRequestPath']=str(request_file)
row['effectivePromptPath']=str(prompt_file)
(p/'generation.json').write_text(json.dumps(row,indent=2)+'\n')
(p/'lease-release.json').write_text('{}\n')
print(json.dumps({'id':ident,'masterSha256':row['masterSha256'],'actualDimensions':row['actualDimensions'],'actualGeneratorSeed':None}))
