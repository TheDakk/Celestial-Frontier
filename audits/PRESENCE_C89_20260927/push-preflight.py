import base64, datetime, hashlib, json, pathlib, subprocess

root = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(__file__).resolve().parent
api = lambda route: json.loads(subprocess.check_output(['gh', 'api', route], text=True))
repo = 'repos/TheDakk/Celestial-Frontier'
meta = api(repo)
assert meta['visibility'] == 'public' and not meta['private']
assert '**Current mode: `UNFROZEN`**' in (root/'GITHUB_ACTIONS_BUDGET.md').read_text()
prior = json.loads((root/'audits/INSECT_REFERENCES_C86_20260927/push-preflight.json').read_text())
expected = {r['path']: r['sha256'] for r in prior['workflows']}
remote = api(repo+'/contents/.github/workflows?ref=openai/mac')
assert {r['path'] for r in remote} == set(expected)
rows = []
for item in remote:
    data = api(repo+'/contents/'+item['path']+'?ref=openai/mac')
    content = base64.b64decode(data['content'])
    digest = hashlib.sha256(content).hexdigest()
    assert digest == expected[item['path']]
    assert content == (root/item['path']).read_bytes()
    rows.append({'path': item['path'], 'sha256': digest, 'sameAsLocal': True})
receipt = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'visibility': 'public', 'budget': 'UNFROZEN', 'workflows': rows,
           'triggerReview': 'Unchanged reviewed labeled/manual triggers only; no push trigger',
           'authorizedWrite': 'normal openai/mac branch push only'}
(out/'push-preflight.json').write_text(json.dumps(receipt, indent=2)+'\n')
print('PUBLIC / UNFROZEN / five exact reviewed workflows / own branch only')
