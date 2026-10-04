from pathlib import Path
import json,subprocess,sys
b=Path(__file__).resolve().parent;root=b.parents[1];phase=sys.argv[1];cases=[('07-wild-pig','faint'),('10-cow','faint'),('17-cardinal','victory'),('19-pigeon','victory'),('11-toucan','victory'),('14-duck','victory'),('16-hyrax','faint,melee:bite'),('18-sparrow','faint,victory'),('13-falcon','approach:walk'),('16-stork','faint,victory')]
for id,actions in cases:
 fit=b/'joins01'/id/'fit';r=json.loads((fit/'record.json').read_text());master=Path(r['source']).expanduser()
 if not master.is_absolute():master=root/master
 # Records historically normalized another home; current repo owns the exact relative source.
 if not master.exists():master=root/'audits'/str(master).split('/audits/',1)[1]
 out=b/phase/id;out.parent.mkdir(exist_ok=True)
 args=['node',str(b/'review-rig02.bundle.mjs'),str(fit.relative_to(root)),str(master.relative_to(root)),str(out.relative_to(root)),actions]
 p=subprocess.run(args,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(b/phase/(id+'.log')).write_text(p.stdout.replace(str(Path.home()),'~'));print(id,p.returncode,p.stdout[-120:],flush=True)
 if p.returncode:raise SystemExit(p.returncode)
