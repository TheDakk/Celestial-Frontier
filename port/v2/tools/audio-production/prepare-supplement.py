#!/usr/bin/env python3
"""Bound reviewed source identities to measured reference excerpts, never behavior cues."""
import concurrent.futures, json, math, re, subprocess
from acquire import BASE, sha_file, write_json
from produce import INVENTORY, slug, validate_jobs
from report import recording_credit

def build(acquisition, coverage, bindings, decoded):
    media = {m['sha256']: m for m in acquisition['media']}
    eligible = {r['sha256'] for r in decoded['files'] if not r['exit'] and not r['error']}
    fauna = {r['name']: r for r in coverage['fauna']}
    selected = {}
    for binding in bindings:
        if binding['gameName'] not in fauna:
            raise ValueError('Binding names an animal outside game inventory')
        for h in binding['sourceHashes']:
            if h not in eligible or h not in media or media[h].get('intakeStatus') == 'quarantined_decode_failure':
                raise ValueError('Binding needs an eligible decoded original: ' + h)
            if media[h]['sourceId'] != binding['sourceId']:
                raise ValueError('Binding source owner mismatch')
            selected.setdefault(h, []).append(binding)
    # A ZIP may contain FLAC and Ogg copies of one take. Prefer its lossless member.
    lossless = {(m['sourceId'], m.get('originalMember', '').rsplit('/', 1)[-1].rsplit('.', 1)[0])
        for h, m in media.items() if h in selected and m.get('originalMember', '').lower().endswith(('.flac', '.wav', '.aiff'))}
    selected = {h: matches for h, matches in selected.items() if not
        (media[h].get('originalMember', '').lower().endswith(('.ogg', '.mp3', '.opus')) and
         (media[h]['sourceId'], media[h]['originalMember'].rsplit('/', 1)[-1].rsplit('.', 1)[0]) in lossless)}
    jobs = []
    for h, matches in sorted(selected.items()):
        m = media[h]; credit = recording_credit(m)
        if not math.isfinite(m['duration']) or m['duration'] <= .02:
            raise ValueError('Empty reference')
        names = sorted({b['gameName'] for b in matches})
        jobs.append({'id': 'v5.reference.' + slug(m.get('title', 'wildlife'))[:70] + '.' + h[:12],
            'group': 'fauna-supplement-' + str(len(jobs)//60+1).zfill(2), 'kind': 'recording',
            'duration': round(min(m['duration'], 12), 4), 'channels': min(m['channels'], 2),
            'layers': [{'path': m['path'], 'sha256': h, 'sourceId': m['sourceId'],
                'rate': 1, 'gain': .65, 'delay': 0, 'duration': m['duration']}],
            'synthNote': None, 'requirements': ['earth.fauna.'+slug(n)+'.recording' for n in names],
            'notes': 'Reference only: ' + ', '.join(names) + '. ' + '; '.join(b['context'] for b in matches)
                + ' Source: ' + m.get('scientificName', m.get('recordingTitle', m.get('title', '')))
                + '. Credit: ' + credit['creator'] + '; ' + credit['license'] + '; ' + credit['url']
                + '. Modifications: opening excerpt, measured attenuation, 48 kHz float input copy, '
                'stock REAPER track/render, edge fades, 24-bit WAV and Opus encoding. No pitch/time change; '
                'no verified call/attack/hurt/faint coverage or listening acceptance.',
            'recipeVersion': 4, 'approved': False, 'listeningStatus': 'not_reviewed'})
    return jobs

def measure(job):
    layer = job['layers'][0]; p = BASE/layer['path']
    if sha_file(p) != layer['sha256']: raise ValueError('Changed original')
    r = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-i', str(p), '-t', str(job['duration']),
        '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True, timeout=60)
    matches = re.findall(r'Peak:\s*([-\w.]+) dBFS', r.stderr)
    if r.returncode or not matches: raise ValueError('Input measurement failed: ' + job['id'])
    peak = float(matches[-1])
    if not math.isfinite(peak): raise ValueError('Silent reference needs separate selection: ' + job['id'])
    gain = min(.65, 10**((-9-peak)/20))
    job['inputHeadroom'] = {'sourceSha256': layer['sha256'], 'sourceDbTP': peak,
        'priorGain': .65, 'gain': gain, 'duration': job['duration']}
    layer['gain'] = gain
    return job

def main():
    recipe = BASE/'recipes/production-v5.json'
    if recipe.exists(): raise ValueError('Preserve existing supplemental production')
    read = lambda path: json.loads((BASE/path).read_text())
    acquisition = read('manifests/acquisition.json'); coverage = read('manifests/ecology-coverage.json')
    bindings = read('manifests/recording-supplement-bindings.json')['bindings'] + read('manifests/recording-ccby-bindings.json')['bindings']
    jobs = build(acquisition, coverage, bindings, read('reports/source-decode.json'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: jobs = list(pool.map(measure, jobs))
    validate_jobs(jobs, acquisition)
    write_json(recipe, {'schema': 'cf.audio-production-jobs/v1', 'version': 5,
        'inventorySha256': sha_file(INVENTORY), 'acquisitionSha256': sha_file(BASE/'manifests/acquisition.json'),
        'jobs': jobs, 'requiresListening': True})
    # Inventory references are not render or listening approvals. Failed renders remain source_only.
    write_json(BASE/'reports/ecology-coverage-before-supplement.json', coverage)
    for row in coverage['fauna']:
        additions = [b for b in bindings if b['gameName'] == row['name'] and b['sourceHashes']]
        if not additions: continue
        row['supplementalBindings'] = additions
        row['sourceHashes'] = sorted(set(row['sourceHashes']) | {h for b in additions for h in b['sourceHashes']})
        row['referenceStatus'] = 'identified_source_candidates'
        row['referenceIds'] += [j['id'] for j in jobs if 'earth.fauna.'+slug(row['name'])+'.recording' in j['requirements']]
    coverage['sourceReferences'] = sum(bool(r['sourceHashes']) for r in coverage['fauna'])
    coverage['missingSourceReferences'] = len(coverage['fauna']) - coverage['sourceReferences']
    write_json(BASE/'manifests/ecology-coverage.json', coverage)
    print(json.dumps({'jobs': len(jobs), 'sourceReferences': coverage['sourceReferences'],
        'missing': coverage['missingSourceReferences'], 'groups': sorted({j['group'] for j in jobs})}))

if __name__ == '__main__': main()
