import type {CreaturePoseV1}from'./creature-rig-types.js';
/** Presentation-only continuity. Inputs are sampled shared motion curves;
 * interpolation never changes world seeds, combat, anatomy or clip assets. */
export function blendCreaturePoses(a:CreaturePoseV1,b:CreaturePoseV1,weight:number):CreaturePoseV1{
 if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Pose blend: weight');const out:Record<string,{rotation:number;dx:number;dy:number}>={};
 for(const j of new Set([...Object.keys(a),...Object.keys(b)])){const x=a[j]??{rotation:0,dx:0,dy:0},y=b[j]??{rotation:0,dx:0,dy:0};out[j]={rotation:(x.rotation??0)*(1-weight)+(y.rotation??0)*weight,dx:(x.dx??0)*(1-weight)+(y.dx??0)*weight,dy:(x.dy??0)*(1-weight)+(y.dy??0)*weight};}return out;
}
export function closedLoopPose(sample:(ms:number)=>CreaturePoseV1,ms:number,period:number):CreaturePoseV1{
 if(!Number.isFinite(ms)||!Number.isFinite(period)||period<=0)throw Error('Pose blend: period');const t=((ms%period)+period)%period,window=period*.18;
 // The last instant is also the first instant. Crossfade into the source curve
 // over the opening window; smoothstep removes a velocity step in the blend.
 const raw=sample(t);if(t>=window)return raw;const u=t/window,w=u*u*(3-2*u);return blendCreaturePoses(sample(period-1e-6),raw,w);
}
