from pathlib import Path
import hashlib,json,shutil,struct,sys
meta=json.loads(sys.argv[1]);r=Path.cwd();b=Path('audits/OVERNIGHT_20261101/codex');q=json.loads((b/'w1-source/queue.json').read_text());row=next(x for x in q['rows']if x['ordinal']==meta['ordinal'])
src=Path(meta['generatedPath']);assert src.is_relative_to(Path.home()/'.codex/generated_images')and src.is_file()
assert hashlib.sha256(Path(row['prompt']).read_bytes()).hexdigest()==row['promptSha256']
out=b/'sources'/meta['wave']/(str(row['ordinal']).zfill(3)+'-'+Path(row['prompt']).parent.name);out.mkdir(parents=True,exist_ok=False)
shutil.copy2(src,out/'original.png');d=(out/'original.png').read_bytes();assert d[:8]==b'\x89PNG\r\n\x1a\n'
actual=Path(meta.get('actualPrompt',row['prompt']));assert actual.is_relative_to(b);shutil.copy2(actual,out/'prompt.txt');shutil.copy2(Path(row['prompt']).parent/'request.json',out/'request.json')
j={'name':row['name'],'ordinal':row['ordinal'],'coverageFamily':row['coverageFamily'],'sourceRequestFamily':row['sourceRequestFamily'],'profileId':row['profileId'],'key':row['key'],'original':str(out/'original.png'),'originalSha256':hashlib.sha256(d).hexdigest(),'actualSize':struct.unpack('>II',d[16:24]),'requestedSize':row['requestedSize'],'promptSha256':hashlib.sha256(actual.read_bytes()).hexdigest(),'basePromptSha256':row['promptSha256'],'actualPromptSource':str(actual),'referenceSha256':row['referenceSha256'],'tool':'built-in image_gen','generatedPath':str(src).replace(str(Path.home()),'~'),'numericSeedControl':False,'freshDraw':True,'sourceReview':'PENDING','fitStaticNativeAdmission':False,'resizeOrPadding':False}
(out/'generation.json').write_text(json.dumps(j,indent=2)+'\n');print(json.dumps(j))
