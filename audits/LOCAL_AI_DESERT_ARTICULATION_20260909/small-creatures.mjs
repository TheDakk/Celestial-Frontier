/** Isolated twelve-second painted-puppet study, using the original desert PNG.
 * Real wing/leg joints drive locomotion; body/neck/tail deformation is secondary.
 * This is a locally authored approximate 2D rig, not procedural rig coverage or
 * anatomy approval. Occluded limb roots and the last tail pixels are inferred;
 * a brief planar turn cannot reveal an unpainted reverse/three-quarter view. */
import {cutout,paint,warp,shadow} from './puppet.mjs';

const TAU=Math.PI*2,DURATION=12;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const ease=value=>{const x=clamp(value);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
function clock(seconds){
  if(typeof seconds!=='number'||!Number.isFinite(seconds))throw Error('Finite creature time required');
  return ((seconds%DURATION)+DURATION)%DURATION;
}
function rotated(point,pivot,angle){
  const x=point[0]-pivot[0],y=point[1]-pivot[1],c=Math.cos(angle),s=Math.sin(angle);
  return [pivot[0]+c*x-s*y,pivot[1]+s*x+c*y];
}
function worldPoint(point,anchor,pose){
  const [x,y]=rotated(point,anchor,pose.bank);
  return [pose.x+pose.facing*(x-anchor[0]),pose.y+y-anchor[1]];
}
function inPose(ctx,anchor,pose,draw){
  ctx.save();
  try{ctx.translate(pose.x,pose.y);ctx.scale(pose.facing,1);ctx.rotate(pose.bank);
    ctx.translate(-anchor[0],-anchor[1]);draw();}
  finally{ctx.restore();}
}

const BAT_ANCHOR=[663,144],LIZARD_ANCHOR=[772,470];
const BAT_POLYGONS={
  farWing:[[535,133],[548,139],[567,133],[585,131],[589,127],[592,131],[616,131],
    [639,135],[653,140],[655,146],[644,150],[621,147],[601,146],[585,144],[581,151],
    [577,145],[562,143],[549,142]],
  nearWing:[[659,130],[675,111],[699,83],[711,65],[715,74],[735,61],[807,29],
    [792,48],[777,65],[778,73],[791,81],[775,83],[757,89],[741,103],[735,102],
    [731,90],[718,89],[706,98],[698,113],[688,126],[680,145],[665,147]],
  body:[[638,130],[646,125],[656,124],[665,128],[671,136],[681,140],[692,144],
    [701,149],[713,153],[724,153],[727,158],[720,161],[714,158],[705,157],
    [701,158],[705,164],[701,167],[696,162],[690,159],[687,160],[690,167],
    [693,173],[688,171],[687,177],[682,172],[677,171],[675,164],[673,159],
    [663,158],[659,163],[658,167],[654,165],[652,160],[650,152],[643,146],[639,140]],
};
const LIZARD_POLYGONS={
  body:[[732,448],[746,451],[756,454],[772,451],[790,447],[802,449],[812,454],
    [821,461],[822,468],[816,477],[801,483],[782,489],[762,488],[749,483],[741,476],[731,469]],
  head:[[694,445],[701,440],[711,436],[723,437],[731,442],[737,447],[745,452],
    [748,460],[741,469],[732,469],[725,464],[715,463],[704,460],[696,455]],
  tail:[[807,458],[822,460],[842,462],[861,465],[877,467],[887,470],
    [887,476],[878,478],[861,476],[843,473],[823,475],[813,476],[804,472]],
};
const LEG_DEFINITIONS=[
  {name:'far-front',layer:'far',phase:.5,hip:[740,468],knee:[728,484],foot:[708,497],
    polygon:[[737,464],[746,469],[741,479],[728,487],[716,495],[707,498],
      [701,502],[701,498],[696,498],[699,495],[711,490],[722,484],[729,475],[732,468]]},
  {name:'far-hind',layer:'far',phase:0,hip:[817,467],knee:[835,484],foot:[839,499],
    polygon:[[812,462],[822,461],[829,470],[834,480],[837,489],[844,498],
      [847,501],[841,501],[837,497],[839,504],[834,503],[830,497],[826,491],[820,485],[816,477],[811,472]]},
  {name:'near-hind',layer:'near',phase:.5,hip:[805,465],knee:[797,483],foot:[778,500],
    polygon:[[801,459],[811,465],[811,474],[804,481],[800,488],[790,495],
      [784,501],[773,506],[772,502],[765,504],[767,499],[778,494],[788,486],[793,480],[794,470]]},
  {name:'near-front',layer:'near',phase:0,hip:[747,470],knee:[760,485],foot:[732,505],
    polygon:[[744,468],[752,473],[762,479],[765,487],[753,495],[742,502],
      [736,508],[724,513],[724,507],[714,511],[714,506],[727,501],[739,495],[749,487],[745,481],[739,476]]},
];

function batPose(seconds){
  const t=clock(seconds),pathPhase=TAU*t/DURATION,flap=TAU*2*t;
  const velocity=-140*TAU/DURATION*Math.cos(pathPhase);
  return {t,x:655-140*Math.sin(pathPhase),y:192+13*Math.sin(pathPhase*2)+2.6*Math.sin(flap-.6),
    facing:-Math.tanh(velocity/15),bank:.045*Math.sin(pathPhase)+.018*Math.sin(flap),
    nearShoulder:.60+.60*Math.sin(flap+.15*Math.sin(flap)),
    farShoulder:-.55*Math.sin(flap+.15*Math.sin(flap)),
    nearWrist:-.17*Math.cos(flap-.4),farWrist:.13*Math.cos(flap-.4)};
}
function wingMap(root,wrist,shoulder,wristAngle){
  const axis=[wrist[0]-root[0],wrist[1]-root[1]],lengthSquared=axis[0]**2+axis[1]**2;
  const movedWrist=rotated(wrist,root,shoulder);
  return point=>{
    const reach=((point[0]-root[0])*axis[0]+(point[1]-root[1])*axis[1])/lengthSquared;
    const shoulderPoint=rotated(point,root,shoulder);
    return rotated(shoulderPoint,movedWrist,wristAngle*ease((reach-.72)/.7));
  };
}
function lizardPose(seconds){
  const t=clock(seconds),pathPhase=TAU*t/DURATION,velocity=-150*TAU/DURATION*Math.cos(pathPhase);
  const speed=Math.abs(velocity),activity=ease(speed/24),gait=TAU*3*t;
  return {t,x:680-150*Math.sin(pathPhase),y:489+2*Math.sin(pathPhase*2),
    facing:-Math.tanh(velocity/16),bank:.008*Math.sin(gait)*activity,velocity,speed,activity,gait,
    bob:-1.8*activity*(.5+.5*Math.cos(gait*2)),stride:speed*.62/(2*3),
    headAngle:.026*Math.sin(gait-.45)*activity};
}
function solveLeg(definition,pose){
  const {hip,knee,foot}=definition;
  const root=[hip[0],hip[1]+pose.bob];
  const cycle=(pose.t*3+definition.phase)%1,stance=.62;
  const sweep=cycle<stance?-1+2*cycle/stance:1-2*(cycle-stance)/(1-stance);
  const lift=cycle<stance?0:Math.sin(Math.PI*(cycle-stance)/(1-stance))*(5+5*clamp(pose.speed/80))*pose.activity;
  const target=[foot[0]+sweep*pose.stride,foot[1]-lift];
  const upper=distance(hip,knee),lower=distance(knee,foot);
  const dx=target[0]-root[0],dy=target[1]-root[1],wanted=Math.hypot(dx,dy);
  const span=clamp(wanted,Math.abs(upper-lower)+.25,upper+lower-.25);
  const ux=dx/wanted,uy=dy/wanted;
  const along=(upper*upper-lower*lower+span*span)/(2*span),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  const cross=(foot[0]-hip[0])*(knee[1]-hip[1])-(foot[1]-hip[1])*(knee[0]-hip[0]);
  const bend=cross<0?-1:1;
  const joint=[root[0]+ux*along-uy*height*bend,root[1]+uy*along+ux*height*bend];
  // If the image's inferred skeleton reaches its limit, preserve bone lengths.
  const end=[root[0]+ux*span,root[1]+uy*span];
  return {root,joint,foot:end,stance:cycle<stance,cycle};
}
function segmentMap(point,a,b,nextA,nextB){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const vx=point[0]-a[0],vy=point[1]-a[1];
  const along=(vx*dx+vy*dy)/(length*length),across=(-vx*dy+vy*dx)/length;
  const nx=nextB[0]-nextA[0],ny=nextB[1]-nextA[1],nextLength=Math.hypot(nx,ny);
  return [nextA[0]+along*nx-across*ny/nextLength,nextA[1]+along*ny+across*nx/nextLength];
}
function legMap(definition,solved){
  return point=>{
    const upper=segmentMap(point,definition.hip,definition.knee,solved.root,solved.joint);
    const lower=segmentMap(point,definition.knee,definition.foot,solved.joint,solved.foot);
    const blend=ease((point[1]-definition.knee[1]+4)/8);
    const leg=[mix(upper[0],lower[0],blend),mix(upper[1],lower[1],blend)];
    // Keep the toes near the ground plane during stance, without rotating the
    // entire foot as a rigid continuation of the lower leg.
    const toe=ease((point[1]-definition.foot[1]+3)/6);
    const translatedFoot=add(point,[solved.foot[0]-definition.foot[0],solved.foot[1]-definition.foot[1]]);
    return [mix(leg[0],translatedFoot[0],toe),mix(leg[1],translatedFoot[1],toe)];
  };
}

export function createSmallCreatures(image){
  if((image.naturalWidth??image.width)!==1024||(image.naturalHeight??image.height)!==576)
    throw Error('Small-creature rig requires the original1024x576 desert painting');
  const bat=Object.fromEntries(Object.entries(BAT_POLYGONS).map(([name,polygon])=>[name,cutout(image,polygon)]));
  const lizard=Object.fromEntries(Object.entries(LIZARD_POLYGONS).map(([name,polygon])=>[name,cutout(image,polygon)]));
  const legs=LEG_DEFINITIONS.map(definition=>({...definition,part:cutout(image,definition.polygon)}));

  function drawBat(ctx,seconds){
    const pose=batPose(seconds);
    inPose(ctx,BAT_ANCHOR,pose,()=>{
      warp(ctx,bat.farWing,wingMap([649,141],[588,133],pose.farShoulder,pose.farWrist),10);
      warp(ctx,bat.nearWing,wingMap([668,139],[716,78],pose.nearShoulder,pose.nearWrist),10);
      paint(ctx,bat.body); // Torso covers shoulder overlaps; painted facial identity stays intact.
    });
  }
  function drawLizard(ctx,seconds){
    const pose=lizardPose(seconds),solved=legs.map(definition=>solveLeg(definition,pose));
    shadow(ctx,pose.x,pose.y+34,57*Math.max(.22,Math.abs(pose.facing)),7,.19);
    inPose(ctx,LIZARD_ANCHOR,pose,()=>{
      for(let i=0;i<legs.length;i++)if(legs[i].layer==='far')warp(ctx,legs[i].part,legMap(legs[i],solved[i]),7);
      warp(ctx,lizard.tail,point=>{
        const u=clamp((point[0]-810)/77),center=465+(point[0]-810)*.12;
        const taper=1-.85*ease((u-.78)/.22);
        return [point[0],center+(point[1]-center)*taper+pose.bob
          +(4+2*clamp(pose.speed/80))*u*u*Math.sin(pose.gait*.5-u*5.4)];
      },7);
      warp(ctx,lizard.body,point=>[point[0],point[1]+pose.bob+.65*Math.sin(pose.gait+(point[0]-734)*.04)*pose.activity],10);
      for(let i=0;i<legs.length;i++)if(legs[i].layer==='near')warp(ctx,legs[i].part,legMap(legs[i],solved[i]),7);
      warp(ctx,lizard.head,point=>add(rotated(point,[739,455],pose.headAngle),[0,pose.bob]),9);
    });
  }
  function diagnostics(seconds){
    const b=batPose(seconds),l=lizardPose(seconds);
    return {schema:'cf.desert-small-creature-rig.v1',seconds:clock(seconds),duration:DURATION,
      bat:{root:[b.x,b.y],facing:b.facing,turning:Math.abs(b.facing)<.75,
        shoulderRadians:[b.farShoulder,b.nearShoulder],wristRadians:[b.farWrist,b.nearWrist],flapsPerSecond:2},
      lizard:{root:[l.x,l.y],velocity:l.velocity,facing:l.facing,turning:Math.abs(l.facing)<.75,cyclesPerSecond:3,
        legs:legs.map(definition=>{const solved=solveLeg(definition,l);return {name:definition.name,stance:solved.stance,
          hip:worldPoint(solved.root,LIZARD_ANCHOR,l),knee:worldPoint(solved.joint,LIZARD_ANCHOR,l),
          foot:worldPoint(solved.foot,LIZARD_ANCHOR,l)};})},
      limits:['Locally authored 2D rig; no universal procedural rig or species approval.',
        'Occluded limb roots are approximate; original visible tail ends under a plant, so its last textured pixels are tapered.',
        'Turns briefly compress the original side view; hidden surfaces are not reconstructed.']};
  }
  return Object.freeze({drawBat,drawLizard,diagnostics});
}
