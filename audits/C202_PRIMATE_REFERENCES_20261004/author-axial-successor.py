from pathlib import Path
import json, shutil
B = Path('audits/C202_PRIMATE_REFERENCES_20261004')
s = B / '10-gorilla-full-contours'
d = B / '12-gorilla-axial-continuity'
d.mkdir()
j = json.loads((s / 'authoring.json').read_text())
j['id'] = 'c202-gorilla-axial-continuity'
j['parts'] = [p for p in j['parts'] if p['id'] != 'pelvis']
updates = {
    'far-thigh': [[298,676],[349,671],[393,680],[426,699],[432,735],[407,783],[354,805],[282,783],[270,742]],
    'far-shin': [[279,714],[341,700],[391,716],[426,757],[402,812],[360,872],[310,918],[251,941],[186,928],[185,872],[217,809],[256,749]],
    'near-foot': [[411,902],[489,892],[538,900],[613,910],[685,949],[696,987],[683,1007],[413,1007]],
    'head': [[793,275],[826,214],[886,203],[940,232],[969,290],[993,336],[1038,364],[1040,428],[1031,466],[987,491],[940,474],[903,438],[859,386],[816,330]],
}
for p in j['parts']:
    if p['id'] in updates:
        p['polygonPx'] = updates[p['id']]
for f in ['master.png', 'subject-source.json', 'presence.json']:
    shutil.copyfile(s/f, d/f)
(d/'authoring.json').write_text(json.dumps(j, indent=2)+'\n')
(d/'correction.json').write_text(json.dumps({
    'predecessor': str(s),
    'scope': 'The continuous axial/pelvic painted surface stays in the root remainder; pelvis skeleton landmark retained. This makes the actual body-to-thigh paint adjacency the existing nearest attachment, without adding seams or changing product topology. Extend only the last root-owned inner far-hind edge, near toe edge, and crown fringe into empty key background.',
    'landmarkChanges': [],
    'removedPaintOwners': ['pelvis'],
    'allRemovedOwnerPaintRetainedBy': 'body',
    'sourcePixelEdits': 0,
    'runtimeChanged': False,
    'limitsChanged': False,
    'acceptance': 'Pending unchanged intake/static and full-size actual-rig review'
}, indent=2)+'\n')
