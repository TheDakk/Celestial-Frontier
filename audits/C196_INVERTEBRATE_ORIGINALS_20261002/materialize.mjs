import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,source='port/v2/tools/painted-creature/compile-library-master.mjs',original=fs.readFileSync(source,'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
const transforms=[];let s=original;const once=(before,after)=>{if(s.split(before).length!==2)throw Error('Unique transform required');transforms.push({before,after});s=s.replace(before,after);};
once("from 'rolldown'","from '../../port/v2/node_modules/rolldown/dist/index.mjs'");
once("from '../creature-animation/family-contracts.mjs'","from '../../port/v2/tools/creature-animation/family-contracts.mjs'");
once("from './pattern-observation.mjs'","from '../../port/v2/tools/painted-creature/pattern-observation.mjs'");
once("path.resolve(import.meta.dirname,'../../../..')","path.resolve(import.meta.dirname,'../..')");
once(" const candidates=profile?.candidateTemplates??[];"," const candidates=profile?.candidateTemplates??[];\n if(SIMPLE[species.name]){const family=SIMPLE[species.name].family;if(candidates.length!==1||candidates[0]!==family)throw Error('Simple source canonical family mismatch');return family;}");
once("export function controlledLibraryLayout(family,name){","export function controlledLibraryLayout(family,name){\n if(Object.values(SIMPLE).some(r=>r.family===family)){const row=SIMPLE[name];if(!row||row.family!==family)throw Error('Exact simple source species required');return {legs:row.legs,accuracy:row.accuracy,layout:row.layout};}");
const common='One whole anatomically accurate adult in the approved painted hand on flat pure magenta. The entire natural specimen, every appendage and complete body edge fit in the middle HALF of a native 1254 by 1254 canvas with about 300 pixels of empty magenta on all sides. No scenery, floor, shadow, labels, artificial ground, arrows, detached body parts or props. Biological identity takes priority over generic procedural body vocabulary. ';
const simple={
  "Shrimp": {
    "family": "crustacean-small",
    "legs": 10,
    "accuracy": "one actual shrimp with five pairs of thoracic walking legs, natural abdominal swimmerets, real short antennules and long antennae; no lobster claws or invented appendages",
    "layout": "One whole anatomically accurate adult in the approved painted hand, isolated on pure magenta. Entire natural body and every appendage fit in the middle HALF of a native 1254 by 1254 canvas with about 300 pixels of empty magenta on every side. No floor, scenery, cast shadow, guides, labels or props. Preserve biological anatomy rather than matching a coarse rig inventory. Right-facing shallow three-quarter side view, slightly elevated so both sides of the real thoracic walking legs can be traced through natural joints to their tips. Show all five actual walking-leg pairs, the complete six-section curved abdomen and terminal fanned tail, serrated rostrum and stalked eyes. Both long antennae remain continuously visible from bases to full unshortened tips. Preserve actual shorter antennules and abdominal swimmerets clearly attached in their real regions; do not delete real structures to simplify a template. No giant lobster claws. Keep every tail/antenna/leg tip well inside the margin."
  },
  "Brittle Star": {
    "family": "radial",
    "legs": 0,
    "accuracy": "one headless radial animal with a tiny actual central disc and exactly five naturally long flexible arms; no jellyfish bell, eyes or invented mouth on its dorsal surface",
    "layout": "One whole anatomically accurate adult in the approved painted hand, isolated on pure magenta. Entire natural body and every appendage fit in the middle HALF of a native 1254 by 1254 canvas with about 300 pixels of empty magenta on every side. No floor, scenery, cast shadow, guides, labels or props. Preserve biological anatomy rather than matching a coarse rig inventory. Dorsal, slightly oblique view of a natural five-armed brittle star. Show its distinct tiny central disc and five fully extended gently curving noncrossing whip arms, all five biological arm bases and complete natural tips visible. Arms are thin, segmented and many times longer than the disc is wide, with real small marginal spines. Preserve natural proportions; never enlarge the disc to satisfy a geometry guard or substitute thick starfish arms. No fake jellyfish bell, face, eyes, dorsal mouth or sixth arm."
  },
  "Fiddler Crab": {
    "family": "brachyuran",
    "legs": 8,
    "accuracy": "one male fiddler crab with four actual walking-leg pairs, two grossly unequal real claws and two stalked eyes; no visible vertebrate tail or extra legs",
    "layout": "One whole anatomically accurate adult in the approved painted hand, isolated on pure magenta. Entire natural body and every appendage fit in the middle HALF of a native 1254 by 1254 canvas with about 300 pixels of empty magenta on every side. No floor, scenery, cast shadow, guides, labels or props. Preserve biological anatomy rather than matching a coarse rig inventory. Slightly elevated front three-quarter view exposing the natural broad carapace, both long eye stalks, all FOUR actual walking-leg pairs as eight distinct connected root/bend/tip paths, and both real claws. The male has one enormously oversized major claw and one tiny minor claw; preserve this essential asymmetry. Both claws are slightly open so each real palm, fixed finger, movable dactyl and hinge are visible; tips must not overlap walking feet or hide the small claw. Keep the last actual walking pair visible by natural viewpoint and spacing, never infer or invent hidden feet. Do not substitute matched symmetric claws, spider jaws or extra appendages."
  },
  "Spider": {
    "family": "arachnid",
    "legs": 8,
    "accuracy": "one true spider with two-part body, eight actual walking legs and two front chelicerae; natural small pedipalps are not extra walking legs; no antennae or sting",
    "layout": "One whole anatomically accurate adult in the approved painted hand, isolated on pure magenta. Entire natural body and every appendage fit in the middle HALF of a native 1254 by 1254 canvas with about 300 pixels of empty magenta on every side. No floor, scenery, cast shadow, guides, labels or props. Preserve biological anatomy rather than matching a coarse rig inventory. Elevated front three-quarter view of a representative orb-weaver or house spider. Clearly show large abdomen, narrow connecting pedicel and smaller cephalothorax; all four genuine walking-leg pairs attach only to the cephalothorax. Eight complete natural root/knee/foot paths remain independently readable with gently offset poses and no crossings. Both actual chelicerae are visible at the front. Retain small mouth-adjacent pedipalps as real anatomy, never count them as ninth/tenth walking legs or delete them to fit a coarse template. No antennae, scorpion tail or stinger. Every long leg tip stays inside generous margins."
  }
};
s+='\n/** Audit-only four-source vocabulary. Not production compiler support or measured anatomy. */\nconst SIMPLE=Object.freeze('+JSON.stringify(simple)+');\n';
fs.writeFileSync(base+'/compiler.audit.mjs',s,{flag:'wx'});
fs.writeFileSync(base+'/transform-receipt.json',JSON.stringify({schema:'cf.audit-compiler-transform/v1',source,sourceSha256:sha(original),output:'audits/C196_INVERTEBRATE_ORIGINALS_20261002/compiler.audit.mjs',outputSha256:sha(s),transforms,appended:s.slice(original.length+transforms.reduce((n,t)=>n+t.after.length-t.before.length,0)),scope:'Only local import resolution plus four exact named canonical family routes and painting layouts. All canonical identity, kit export, material/style paragraph, dimensions and provenance owners retained. Production file untouched.'},null,2)+'\n',{flag:'wx'});
