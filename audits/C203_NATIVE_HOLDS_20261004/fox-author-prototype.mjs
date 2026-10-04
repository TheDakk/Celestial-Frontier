/** Audit-only canonical author successor; never writes product files. */
import fs from'node:fs';import assert from'node:assert/strict';
const B='audits/C203_NATIVE_HOLDS_20261004';
const files=['port/v2/apps/game/src/motion/grounded-quadruped.ts','port/v2/apps/game/src/motion/timeline.ts'];
let q=fs.readFileSync(files[0],'utf8'),t=fs.readFileSync(files[1],'utf8');const edits=[];
function change(file,from,to){let s=file===files[0]?q:t;assert.equal(s.split(from).length,2,'unique exact edit');s=s.replace(from,to);edits.push({file,from,to});if(file===files[0])q=s;else t=s;}
change(files[0],'compile:(a:MotionAction)=>MotionTimeline):','compile:(a:MotionAction)=>MotionTimeline,idle?:MotionTimeline):');
change(files[0]," const unchanged={action,note:null};"," const unchanged={action,note:null};\n const layeredTrot=action.id==='approach:trot'&&!!card.paintedContactSupports&&!!idle;");
change(files[0],"!['approach:gallop','cast'].includes(action.id)","(!['approach:gallop','cast'].includes(action.id)&&!layeredTrot)");
change(files[0],"timeline:{...base,seed:0,hash:''}})","timeline:{...base,seed:0,hash:''},...layeredTrot?{idle}:{} })");
change(files[0],'solver=createFamilyContactSolver(record);','solver=createFamilyContactSolver(record,layeredTrot?card.paintedContactSupports!.supports:{});');
change(files[0],'  }return true;',`  }
  if(layeredTrot&&idle){
   const idlePoses=Array.from({length:32},(_,i)=>sample(idle,idle.durationMs*i/32));
   for(let i=0;i<=120;i++){const ms=tl.durationMs*i/120,p=sample(tl,ms);
    for(const under of idlePoses){const pose:Record<string,CreaturePoseV1[string]>={};
     for(const part of [under,p]){
      for(const[j,rotation]of Object.entries(part.joints))if(j!=='root')pose[j]={rotation:(pose[j]?.rotation??0)+rotation};
      const old=pose.root??{rotation:0};pose.root={rotation:old.rotation+part.root.rotation,dx:(old.dx??0)+part.root.dx,dy:(old.dy??0)+part.root.dy};
     }
     try{solver.resolve(pose,{actionId:action.id,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm,travel:'stage',stageDisplacement:0});}catch{return false;}
    }
   }
  }return true;`);
change(files[0],"'grounded-quadruped:torso-gain='+gain","(layeredTrot?'grounded-quadruped:layered-trot-gain=':'grounded-quadruped:torso-gain=')+gain");
change(files[1],'?groundedQuadrupedAction(card,action,base,sampleTimeline,a=>buildActionTimeline(card,a,seed,notes))',"?groundedQuadrupedAction(card,action,base,sampleTimeline,a=>buildActionTimeline(card,a,seed,notes),action.id==='approach:trot'&&card.paintedContactSupports?buildTimeline(card,'idle',seed):undefined)");
fs.writeFileSync(B+'/fox-author-patch.json',JSON.stringify({scope:'Audit prototype only; complete constant torso-curve author, unchanged 90percent reserve and all runtime guards. Source-bound layered trot only; legacy endpoint cards retain outputs.',edits},null,2)+'\n',{flag:'wx'});
