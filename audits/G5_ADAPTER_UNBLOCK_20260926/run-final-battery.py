"""Run the develop owner once, then its unexecuted owners and overridecontrol after I5."""
import hashlib, json, pathlib, subprocess

repo = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(__file__).resolve().parent / 'final-battery'
out.mkdir(exist_ok=True)
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()
steps = [('develop-profile', ['node', 'tools/check-profile.mjs', '--profile=develop']),
         ('typecheck-root', ['npx', 'tsc', '--noEmit', '--noUnusedLocals']),
         ('typecheck-app', ['npx', 'tsc', '--noEmit', '-p', 'apps/game/tsconfig.json']),
         ('typecheck-worker', ['npx', 'tsc', '--noEmit', '-p', 'apps/game/tsconfig.worker.json']),
         ('artaudit', ['npm', 'run', 'artaudit']),
         ('overridecheck', ['npm', 'run', 'overridecheck']),
         ('speccheck', ['node', 'tools/speccheck.mjs']),
         ('overridecontrol', ['npm', 'run', 'overridecontrol'])]
results = []
for name, command in steps:
    # Only run the manual remainder after the profile stops at the known test failure.
    if name != 'develop-profile' and results[0]['exitCode'] == 0 and name != 'overridecontrol':
        continue
    log = out / (name + '.log')
    with log.open('w') as stream:
        result = subprocess.run(command, cwd=repo/'port/v2', stdout=stream, stderr=subprocess.STDOUT)
    results.append({'name': name, 'command': command, 'exitCode': result.returncode,
                    'logSha256': hashlib.sha256(log.read_bytes()).hexdigest()})
    (out/'results.json').write_text(json.dumps({'head': head, 'dirtySource': True, 'results': results}, indent=2)+'\n')
    print(name, result.returncode, flush=True)
    if name == 'develop-profile' and result.returncode != 0:
        text = log.read_text()
        if 'current-producer-authorities' not in text or 'binds every live memory budget' not in text:
            raise SystemExit('Unexpected profile failure: inspect before manual remainder.')
print('Battery captured; inspect the complete test summary and every owner exit code.')
