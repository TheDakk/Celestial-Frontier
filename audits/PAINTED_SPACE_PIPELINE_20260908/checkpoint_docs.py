from pathlib import Path
import json, datetime

root = Path(__file__).resolve().parents[2]
def edit(path, old, new):
    data = path.read_text()
    assert data.count(old) == 1, (str(path), data.count(old))
    tmp = path.with_suffix(path.suffix + '.checkpoint.tmp')
    tmp.write_text(data.replace(old, new, 1))
    tmp.replace(path)

road = root / 'ROADMAP.md'
old = road.read_text()
heading = '## SESSION HANDOFF — 2026-09-08 · GENERATED THIRD STAR'
assert old.count(heading) == 1
past = old[old.index(heading):]
archive = root / 'ROADMAP_ARCHIVE.md'
temp = archive.with_suffix('.checkpoint.tmp')
temp.write_text('## Archived third-star handoff — 2026-09-08\n\n' + past + '\n' + archive.read_text())
temp.replace(archive)
start = old.index('### Current completed batch')
end = old.index('### Available local previews and prior audiovisual work')
current = '''### Current completed batch

Nick supplied the painted-space pipeline ZIP and adopted its prompt, then requested additional
biomes and a planet/universe sheet **before confirming**. Three original built-in image-tool
concepts are preserved: Wolf/explorer/ship vista, four-biome comparison, eight-object space sheet.
All are opaque1536×1024, one attempt each, exact sent prompts/reference/capture hashes retained.
**PROPOSED, human approval pending; no bulk catalogue or runtime installation.** The supplied
prompt explicitly requires reference approval before bulk generation. Review the concrete sheets
with Nick; do not interpret elapsed time or the earlier approval question as assent.
[Current packet and visual findings](audits/PAINTED_SPACE_PIPELINE_20260908/README.md).

The four biomes are jungle, cryogeyser ice, coral coastline and volcanic basalt. The eight objects
are terran/ringed-gas/ice/lava worlds, star, protostar, black hole and galaxy. The ocean treatment
drifted toward sunset; some ring/disk/outer shapes are cropped; planetary lights and terrain/life
details must obey actual world data before runtime use. These are concepts, not exact seeded
worlds, usable cutout atlases or proof of procedural animation. No correction retry was launched.

Supplied ZIP SHA61ad0c820e248e141776b60e7dc8976ef0b45bd5ea73ab6004c752813c609b14;
30 safe files,29 manifest entries verified. Source review identifies reusable offline queue,
prompt/hash, capture, ledger and export mechanisms; missing original dependencies, provider and
animation remain explicit. Fix profile handling before adapting its opaque-RGB alpha assumption
and destructive pink/purple key suppression. Isolated metadata demo PASS:3 identical runs,
720 catalogue permutations,4 duplicate controls,20 seeds/8 combinations. No game integration.
This source supersedes the earlier missing-generator-path question; Dakk's original is untouched.

The preceding offline charm recipe adds two procedural coats and a finite brace/neck-head
strike/recoil to the same Wolf. Ten640px stills plus33 video frames are preserved. Saved-model
all65-frame/identity/weight/paw/settlement checks PASS, but art remains **below the requested bar**.
No opening jaw, walking, browser rig or complete anatomy/attack coverage. First ImageMagick font
failure and the corrected fresh-output packaging are retained; no Blender rerender for that fix.
[Study, animation and limitations](audits/CREATURE_CHARM_STUDY_20260908/README.md).

Private raw masters/renders/phenotype/recipes and supplied pipeline/captures are hash-verified in
new creature-charm-20260908 and painted-space-pipeline-20260908 directories under
/Users/nick/Projects/Celestial-Frontier-asset-sources. Original inputs remain unchanged. This is
local preservation, not an independent/cloud backup. Root validation PASS:1,010 rendered species,
zero boot errors,50 unchanged fingerprints. No unchanged full product battery rerun for concepts.

Retain V2's generation/combat/persistence; use concrete designs and compatible procedural anatomy
with reviewed paint and motion resources. Qualify one complete native encounter before choosing
frame/deformation delivery or expanding the catalogue. Existing cameras and outcome ownership
remain; any durable asset-ID change needs a save migration. Production cleanup belongs on the
exact develop candidate before separately authorized main promotion. No restart was performed.

Completed third-star code/evidence remains in
[AV_TRINARY_COMPANION_20260908](audits/AV_TRINARY_COMPANION_20260908/README.md): browser-free
331files/3,727tests/1skip and scoped phone/desktop Search→Follow/glow/motion/teardown PASS.
Current producer16c4a7b9f07089dae7e8dc9aae1b6b6fb5378891e54a2ba29aadf15ea4746f60;
draft83 digest8379d041dda1466c843b242e0ab29cf6b38e28f56035df5801d428579bd99ebd.
First crowded-map click selected a neighboring seed and remains red; no Survey-entry claim.
Its manifest0a3534b6c70f84c93878ce366b955a4432409714d0cf886ff824298b459fc687 and
82-file ignored trinary-evidence-dist-20260908 remain unchanged. Full former handoff is archived.

New staged recovery: port/v2/apps/game/smoke/charm-study-staged-20260908.json and adjacent gzip
binary patch, covering both the offline Wolf study and painted-pipeline intake/reference batch.
Preserve every earlier snapshot. Required1Password signing awaits restoration evidence; no retry,
unsigned fallback, new commit, hosted action or preview rebuild. No foreground authoring job remains.

'''
updated = old[:start] + current + old[end:]
updated = updated.replace(heading, '## SESSION HANDOFF — 2026-09-08 · PAINTED SPACE REFERENCES', 1)
old_next = updated[updated.index('### Fresh-session next action'):]
new_next = '''### Fresh-session next action

Review Nick's feedback on the three retained painted-space concepts. Reference approval remains
pending because he requested the additional biome/object sheets before confirming. Record exact
accepted hashes and corrections, then scope one profile calibration and complete native creature
encounter. Do not multiply assets, import the Dakk source wholesale or claim automatic paintings
to rigs. Continue authorized independent local work only within the24-hour deadline; do not rerun
old failed runners or full unchanged checks. Current53304/50689 previews do not include third-star,
Wolf or painted-reference work. A later local preview refresh can include verified runtime changes.
Signing and old private-cloud backup remain pending their external conditions. All historical
verification blockers above remain open; no current full-chain certificate or human acceptance.

Codex/macOS/openai/mac owns the staged local work,38ahead/0behind; GitHub step none,PR not needed.
Budget UNFROZEN/PUBLIC, private fallback3,000, exact hosted authority0/attempts0/cost0.
Claude/macOS/anthropic/mac need not open or sync now and does not have these unmerged changes.
After a later authorized openai/mac→develop merge, Claude fetches/merges origin/develop into its
own clean branch, preserving unmerged173c806. No manual copies, hosted attempt, develop/main
promotion, dev publication or production release. Claude's Thursday review uses the retained
pipeline, anatomy and actual evidence packets; no message was sent to Claude.
'''
assert updated.count(old_next) == 1
updated = updated.replace(old_next, new_next, 1)
temp = road.with_suffix('.checkpoint.tmp'); temp.write_text(updated); temp.replace(road)

campaign = root / 'audits/AV_24H_CAMPAIGN_20260907.md'
entry = '''
## Supplied painted pipeline and reference comparison — September 8, 2026

Nick supplied the actual exported Dakk pipeline/review and adopted the CF prompt. Its safe
intake/source assessment supersedes the earlier missing-generator question and incoming-review
wording. The complete original project is not included. See
[PAINTED_SPACE_PIPELINE_20260908](PAINTED_SPACE_PIPELINE_20260908/README.md) for source defects,
720-order metadata verification, browser architecture and the separate art approval boundary.
Three exact built-in generations now show the proposed painted vista, four contrasting existing
biome families and eight space-object types. Nick requested the latter two before confirming;
all remain PROPOSED. Ocean-color drift and cropped space-object silhouettes are retained findings.
No bulk catalogue, runtime art replacement, generation changes or animation completion is claimed.

The earlier two-treatment Wolf study and all65-frame deformation checks passed technically but
remain below the art target. Its private masters/renders/phenotype/recipes and all supplied source
and generated reference captures are now preserved locally with hashes, leaving original bytes
untouched. Root validation passed1,010 renders/zero errors/50 fingerprints. No unchanged full
battery rerun, signing retry, cloud copy, hosted action or preview rebuild. The24-hour deadline
and Thursday review remain. Fresh current handoff and exact staged recovery are in ROADMAP.md.
'''
assert '## Supplied painted pipeline and reference comparison' not in campaign.read_text()
tmp = campaign.with_suffix('.checkpoint.tmp'); tmp.write_text(campaign.read_text()+entry); tmp.replace(campaign)

atlas = root/'BIOME_ATLAS.md'
first = '# Celestial Frontier — Biome Atlas & Color Plan (Phase 4)\n'
edit(atlas, first, first + '''
## Painted biome comparison — 2026-09-08, proposal only

Nick requested additional visual samples before approving the painted direction. The
[four-biome sheet](audits/PAINTED_SPACE_PIPELINE_20260908/biome-comparison.png) compares jungle,
cryogeyser ice, coral/archipelago shoreline and volcanic basalt, drawn from existing families.
It changes no biome IDs, probabilities, climate, life or generated-world facts. The warm ocean
sunset and exact geyser count need review; none is an accepted runtime vista or exact seed render.
[Current review and profile plan](audits/PAINTED_SPACE_PIPELINE_20260908/README.md). Existing
canonical biome composition remains authoritative. Matches code as of2026-09-08 local.

''')
index = root/'audits/README.md'
first = '# audits/ — external review bundles, preserved\n'
edit(index, first, first + '''
September8 painted-space intake and proposed vista/biome/universe reference sheets:
[PAINTED_SPACE_PIPELINE_20260908](PAINTED_SPACE_PIPELINE_20260908/README.md).
Preceding offline Wolf coat/articulation study, technically checked and below art target:
[CREATURE_CHARM_STUDY_20260908](CREATURE_CHARM_STUDY_20260908/README.md).
Nick's reference approval remains pending; ROADMAP.md owns live resumption and preserved blockers.

''')
(root/'audits/PAINTED_SPACE_PIPELINE_20260908/pixel-intake.json').write_text(json.dumps({'status':'PASS','command':"magick identify -format '%f %wx%h opaque=%[opaque]\\n' space-reference-candidate.png biome-comparison.png universe-reference.png",'results':[{'path':n,'width':1536,'height':1024,'opaque':True} for n in ['space-reference-candidate.png','biome-comparison.png','universe-reference.png']],'visualAcceptance':False},indent=2)+'\n')
print('Roadmap archived verbatim; live handoff, campaign, biome reference and audit index updated.')
