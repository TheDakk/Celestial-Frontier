import sys,json,hashlib,re
from pathlib import Path
ident=sys.argv[1]
assert re.fullmatch(r'c279-[a-z0-9-]+',ident)
p=Path(__file__).resolve().parent/'paintings'/ident
request_file=p/('effective-request.json' if (p/'effective-request.json').exists() else 'request.json')
prompt_file=p/('effective-prompt.txt' if (p/'effective-prompt.txt').exists() else 'prompt.txt')
request=json.loads(request_file.read_text())
prompt=prompt_file.read_text()
assert hashlib.sha256(prompt.encode()).hexdigest()==request['promptSha256']
reference=Path(request['referencePath'])
assert hashlib.sha256(reference.read_bytes()).hexdigest()==request['referenceSha256']
assert not (p/'generation.json').exists()
print(json.dumps({'id':ident,'species':request['species'],'packet':str(p),'prompt':prompt,'referencePath':str(reference.resolve()),'transparentBackground':False,'keyColor':request['keyColor']}))
