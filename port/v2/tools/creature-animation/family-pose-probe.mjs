/** Read-only producer interoperability. Real motion templates/actions plus
 * labelled synthetic family landmarks; NOT painted-family coverage. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {createSkeletonPoseProgram} from './skeleton-pose.mjs';
const [motionArg, outputArg] = process.argv.slice(2);
if (!motionArg || !outputArg) throw Error('Usage: family-pose-probe.mjs PRODUCER_MOTION_DIR NEW_OUTPUT_DIR');
const motion = path.resolve(motionArg), output = path.resolve(outputArg), root = path.resolve(import.meta.dirname, '../../../..');
if (fs.existsSync(output)) throw Error('New evidence directory required');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-family-pose-')), sources = new Map();
const sha = b => createHash('sha256').update(b).digest('hex');
const readJSON = file => { const bytes = fs.readFileSync(file); sources.set(file, sha(bytes)); return JSON.parse(bytes); };
const report = {schema:'cf.family-pose-interop/v1',status:'RUNNING',scope:'Shared pose evaluation and actual GSAP producer contract only. Thirteen family records are synthetic; no new painted assets, masks, contact solvers, runtime admission or visual qualification.',rows:[],controls:[]};
fs.mkdirSync(output, {recursive:true});
function expectedPositions(graph, landmarks, pose, length) {
  const positions = Object.create(null), angles = Object.create(null), rootKey = pose.root ?? {rotation:0};
  positions.root = [landmarks.root[0] + (rootKey.dx ?? 0) * length, landmarks.root[1] + (rootKey.dy ?? 0) * length];
  angles.root = rootKey.rotation;
  for (const [child,parent] of graph) {
    const k = pose[child] ?? {rotation:0}, angle = angles[parent] + k.rotation;
    const x = landmarks[child][0] - landmarks[parent][0], y = landmarks[child][1] - landmarks[parent][1];
    const dx = (k.dx ?? 0) * length, dy = (k.dy ?? 0) * length;
    positions[child] = [positions[parent][0] + x*Math.cos(angle)-y*Math.sin(angle) + dx*Math.cos(angles[parent])-dy*Math.sin(angles[parent]),
      positions[parent][1] + x*Math.sin(angle)+y*Math.cos(angle) + dx*Math.sin(angles[parent])+dy*Math.cos(angles[parent])];
    angles[child] = angle;
  }
  return positions;
}
try {
  const entry = path.join(scratch,'entry.mjs');
  fs.writeFileSync(entry, `export * from ${JSON.stringify(path.join(motion,'index.ts'))};\nexport {createCreatureRigFrameTarget} from ${JSON.stringify(path.join(root,'port/v2/apps/game/src/creature-rig-frame.ts'))};\n`);
  const bundle = await rolldown({input:entry,platform:'node',plugins:[{name:'sources',transform(_,id){if(path.isAbsolute(id)&&!id.startsWith(scratch)&&fs.existsSync(id)&&fs.statSync(id).isFile()) sources.set(id,sha(fs.readFileSync(id)));}}]});
  try { await bundle.write({dir:scratch,entryFileNames:'producer.mjs',chunkFileNames:'chunk-[hash].mjs',format:'es'}); } finally { await bundle.close(); }
  const producer = await import(pathToFileURL(path.join(scratch,'producer.mjs')));
  const {KNOWN_TEMPLATE_IDS,resolveTemplate,compileBodyCard,actionsFor,buildTimeline,createGsapPlayer,createCreatureRigFrameTarget} = producer;
  const expectedIds = ['quadruped','hopper','biped-bird','fish','insect','serpent','arachnid','radial','plant-woody','plant-herb','myriapod','cephalopod','flyer-membrane','primate'];
  assert.deepEqual([...KNOWN_TEMPLATE_IDS].sort(),expectedIds.sort(),'producer inventory changed; review scope explicitly');
  const adapter = path.join(motion,'gsap-adapter.ts');
  assert.equal(sha(fs.readFileSync(adapter)),'6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74','unexpected producer');
  for (const name of ['skeleton-pose.mjs','kinematics.ts','family-pose-probe.mjs']) {const file=path.join(import.meta.dirname,name);sources.set(file,sha(fs.readFileSync(file)));}
  for (const id of KNOWN_TEMPLATE_IDS) {
    const template=resolveTemplate(id), fixtureDir=path.resolve(motion,'../../../../tools/motion-proof/fixtures');
    const record=id==='quadruped'?readJSON(path.join(root,'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json')):readJSON(path.join(fixtureDir,id+'.synthetic.landmarks.json'));
    const genome=id==='quadruped'?undefined:readJSON(path.join(fixtureDir,id+'.synthetic.genome.json'));
    const card=compileBodyCard(record,genome), def={graph:template.graph,bodyAxis:template.bodyAxis??['pelvis','chest']};
    const program=createSkeletonPoseProgram(def,record.landmarks);
    assert.equal(program.bodyLength,card.bodyLength,'body-length units disagree');
    let count=0,pose,matrices,maximumPositionError=0;
    const target=createCreatureRigFrameTarget({applyPose(next){const evaluated=program.evaluate(next);pose=structuredClone(next);matrices=evaluated;count++;}});
    const row={id,landmarkOwner:record.identity.ownerId,synthetic:id!=='quadruped',jointCount:program.jointNames.length,actions:[],samples:0,maximumPositionError:0};
    for (const action of Object.keys(actionsFor(id))) {
      const timeline=buildTimeline(card,action,record.identity.seed), player=createGsapPlayer(timeline,target,{now:()=>0});
      const samples=Math.max(2,Math.ceil(timeline.durationMs/1000*30));
      try {
        for(let i=0;i<=samples;i++) {
          const before=count;target.sample(()=>player.seek(i*timeline.durationMs/samples));assert.equal(count,before+1,'more than one pose publication per frame');
          const expected=expectedPositions(template.graph,record.landmarks,pose,program.bodyLength);
          for(const name of program.jointNames) {const m=matrices[name],p=record.landmarks[name],x=m[0]*p[0]+m[2]*p[1]+m[4],y=m[1]*p[0]+m[3]*p[1]+m[5];
            const error=Math.hypot(x-expected[name][0],y-expected[name][1]);assert.ok(error<1e-12,id+':'+action+':'+name);maximumPositionError=Math.max(maximumPositionError,error);}
          row.samples++;
        }
        const middle=timeline.durationMs*.437;target.sample(()=>player.seek(middle));const first=JSON.stringify(matrices);
        target.sample(()=>player.seek(0));target.sample(()=>player.seek(timeline.durationMs));target.sample(()=>player.seek(middle));
        assert.equal(JSON.stringify(matrices),first,'seek history changed pose');
        row.actions.push({id:action,timelineHash:timeline.hash,samples:samples+1});
      } finally { player.stop(); }
    }
    const before=count;assert.throws(()=>target.sample(()=>target.setJoint('foreignJoint',0)),/unknown pose joint/);assert.equal(count,before);
    target.sample(()=>target.setJoint('root',0,.2,-.1));const good=matrices;
    const bad=program.evaluate(Object.fromEntries(program.jointNames.map(name=>[name,{rotation:0,dx:.2,dy:-.1}])));
    assert.ok(program.jointNames.some(name=>Math.abs(bad[name][4]-good[name][4])>1e-6),'old broadcast mutant undetected');
    target.reset();for(const m of Object.values(matrices))assert.deepEqual(m,[1,0,0,1,0,0]);target.dispose();
    row.maximumPositionError=maximumPositionError;report.rows.push(row);report.controls.push(id+': foreign joint refused, broadcast displacement rejected, exact rest, history-independent seek, one publication per frame');
  }
  for(const [file,hash]of sources)assert.equal(sha(fs.readFileSync(file)),hash,'source changed during proof');
  report.status='PASS';
} catch(error) {report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally {report.sources=[...sources].map(([path,sha256])=>({path,sha256}));fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:report.status,families:report.rows.length,samples:report.rows.reduce((n,r)=>n+r.samples,0),error:report.error}));
