import pathlib,json,hashlib,subprocess,shutil
root=pathlib.Path.cwd();base=pathlib.Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest();rows=[]
canon={}
for raw in subprocess.check_output(['git','ls-files','-z','--','audits/**/master.png']).split(b'\0'):
 if raw:
  p=root/raw.decode();canon.setdefault(sha(p.read_bytes()),[]).append(str(p.relative_to(root)))
for folder in sorted(base.glob('*-side')):
 receipt=json.loads((folder/'receipt.json').read_text());src=pathlib.Path(receipt['sourceFit']);dest=base/'source-inputs'/folder.name;dest.mkdir(parents=True,exist_ok=False)
 for name in ['record.json','declaration.json','labels.png']:shutil.copyfile(src/name,dest/name)
 r=json.loads((dest/'record.json').read_text());candidates=canon[r['geometry']['cutoutAssetHash']];preferred=next((p for p in candidates if '/G2_' in p),candidates[0]);rows.append({'sourceInput':str(dest.relative_to(root)),'requiredPath':r['source'],'canonicalTrackedMaster':preferred,'sha256':r['geometry']['cutoutAssetHash']})
(base/'source-master-index.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Preserved',len(rows),'exact compiler input triplets and canonical tracked master mappings')
