import json,subprocess,sys,pathlib
base=pathlib.Path("audits/C266_CODEX_20261017/coordinator")
assert not subprocess.check_output(["git","status","--porcelain","--untracked-files=no"],text=True).strip()
for j in json.loads((base/"batch10-finish-plan.json").read_text())["jobs"]:
 slug=j["slug"];run=j["run"]
 stages=[("ai",["node","audits/AI_FINISH_C121_20261001/finish-batch.mjs",run+"/finished",run+"/subjects.json"]),("rebind",["node",str(base/"rebind-c261-one.mjs"),slug]),("finished-native",["python3",str(base/"run-native-one.py"),run+"/finished-plan.json"])]
 for kind,cmd in stages:
  name=slug+"-"+kind+"-01"
  call=["python3",str(base/"run-stage.py"),name,"node","tools/with-toolchain-lock.mjs","--label","C399-"+name,"--"]+cmd
  code=subprocess.run(call,stdout=subprocess.DEVNULL).returncode
  record=json.loads((base/(name+".json")).read_text()); print(json.dumps({k:record.get(k) for k in ["stage","status","exitCode","elapsedSeconds","lowestGiB"]}),flush=True)
  if code:print("Stopped chain at actual red; no retry",flush=True);break
