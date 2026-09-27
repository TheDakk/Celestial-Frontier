from pathlib import Path
import json,hashlib,shutil
root=Path(__file__).resolve().parent
rows=json.loads((root/'tool-outputs.json').read_text())
for row in rows:
 src=Path(row['sourcePath']);dst=root/row['id']/'master.png'
 assert src.is_file() and not dst.exists()
 shutil.copyfile(src,dst)
 sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 assert sha(src)==sha(dst)
 receipt={**row,'masterSha256':sha(dst),'bytes':dst.stat().st_size,'promptSha256':sha(dst.parent/'prompt.txt'),'outputModified':False,'handAuthoring':False,'sourceOriginalRetained':True}
 (dst.parent/'generation.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(len(rows),'originals retained byte-exact')
