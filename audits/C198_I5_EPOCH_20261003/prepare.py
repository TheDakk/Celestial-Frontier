from pathlib import Path
import hashlib,json,shutil,subprocess,sys
root=Path(__file__).resolve().parents[2]
base=Path(__file__).resolve().parent
source=Path(sys.argv[1]).expanduser().resolve()
head="869ce0e44a9aac23d614571a90c33fa23a3880b6"
git=lambda *args:subprocess.check_output(["git","-C",str(source),*args],text=True).strip()
assert git("rev-parse","HEAD")==head
assert git("log","-1","--format=%G?")=="G"
assert not git("status","--porcelain=v1","--untracked-files=all")
for rel in ["node_modules","port/v2/node_modules"]:
 src=root/rel;dst=source/rel
 assert src.is_dir() and not dst.exists(),rel
 p=subprocess.run(["cp","-cR",str(src),str(dst)],text=True,capture_output=True)
 assert p.returncode==0,p.stderr.replace(str(Path.home()),"~")
assert not (source/"tools/local-image-generation/node_modules").exists()
assert not git("status","--porcelain=v1","--untracked-files=all")
locks=[]
for rel in ["package-lock.json","port/v2/package-lock.json"]:
 digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 assert digest(root/rel)==digest(source/rel)
 locks.append({"path":rel,"sha256":digest(source/rel)})
value={"schema":"cf.c198-i5-prepare/v1","productHead":head,"source":str(source).replace(str(Path.home()),"~"),"signature":"G","clean":True,"dependencies":"APFS clones of existing locked root/v2 installations; no install or update","optionalRuntimeAbsent":True,"lockFiles":locks,"freeGiB":round(shutil.disk_usage(root).free/2**30,2)}
assert value["freeGiB"]>=40
(base/"prepare.json").write_text(json.dumps(value,indent=2)+"\n")
print(json.dumps(value))
