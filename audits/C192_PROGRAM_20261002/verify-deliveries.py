from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[2]
rows=[]
for name in sys.argv[1:]:
 manifest=root/name
 obj=json.loads(manifest.read_text())
 files=obj["files"]
 count=0;size=0
 for item in files:
  target=root/item["path"]
  data=target.read_bytes()
  assert hashlib.sha256(data).hexdigest()==item["sha256"],item["path"]
  if "bytes" in item:assert len(data)==item["bytes"],item["path"]
  count+=1;size+=len(data)
 rows.append({"manifest":name,"manifestSha256":hashlib.sha256(manifest.read_bytes()).hexdigest(),"verifiedFileEntries":count,"bytes":size})
out={"status":"PASS","verifiedFileEntries":sum(x["verifiedFileEntries"] for x in rows),"deliveries":rows}
Path(__file__).with_name("delivery-verification.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps({"status":out["status"],"deliveries":len(rows),"verifiedFileEntries":out["verifiedFileEntries"]}))
