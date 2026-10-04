/** Painted plant cutouts with rooted wind deformation, specific to this illustration. */
import {cutout,warp,shadow} from './puppet.mjs';
const TAU=Math.PI*2;
export function createPlants(image){
 const rosette=cutout(image,[[870,480],[893,487],[908,515],[908,472],[910,438],[927,463],[936,493],[938,456],[949,437],[955,473],[964,493],[977,453],[989,439],[986,476],[980,510],[1002,477],[1023,461],[1023,512],[1002,535],[1023,542],[1023,563],[987,559],[970,576],[935,576],[934,556],[907,566],[887,560],[911,541],[882,533],[873,518],[896,521]]);
 const grass=cutout(image,[[1,396],[17,435],[40,491],[33,423],[42,419],[54,488],[59,449],[66,414],[72,415],[71,489],[87,460],[108,430],[111,437],[95,484],[130,451],[137,452],[122,485],[96,523],[152,489],[157,494],[120,528],[158,522],[160,531],[116,540],[148,546],[145,553],[104,549],[81,563],[55,550],[3,527],[3,521],[48,530],[3,495],[3,488],[48,511],[11,449],[1,411]]);
 // Reconstruct only slender supporting lines as a mask; sampled color/texture remains from the painting.
 const stalkCanvas=document.createElement('canvas');stalkCanvas.width=1024;stalkCanvas.height=576;const c=stalkCanvas.getContext('2d');
 const branches=[[[988,411],[987,364],[983,299],[982,236]],[[988,411],[972,367],[955,307],[944,261]],[[988,411],[966,365],[940,318],[926,277]],[[988,411],[984,368],[977,333],[974,304]],[[988,411],[999,364],[1005,317],[1010,279]],[[988,411],[1000,372],[1020,340]],[[988,411],[963,382],[941,351]]];
 c.strokeStyle='#fff';c.lineWidth=3.4;c.lineCap='round';for(const line of branches){c.beginPath();line.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 for(const [x,y,rx,ry]of [[982,232,7,13],[944,256,7,12],[926,273,8,12],[974,300,6,12],[1010,275,7,12],[1020,336,7,11],[941,347,6,10]]){c.beginPath();c.ellipse(x,y,rx,ry,-.32,0,TAU);c.fill();}
 c.globalCompositeOperation='source-in';c.drawImage(image,0,0);const stalk={canvas:stalkCanvas,x:0,y:0,width:1024,height:576};
 // Tight cropped carrier keeps the mesh bounded while preserving its source coordinates.
 const cropped=document.createElement('canvas');cropped.width=114;cropped.height=196;cropped.getContext('2d').drawImage(stalkCanvas,910,218,114,196,0,0,114,196);Object.assign(stalk,{canvas:cropped,x:910,y:218,width:114,height:196});
 const rows=[
 {kind:'rosette',x:37,y:283,s:.19,a:2,phase:.3}, {kind:'rosette',x:769,y:378,s:.16,a:2,phase:1.6},
 {kind:'grass',x:827,y:411,s:.19,a:3,phase:2.1}, {kind:'grass',x:884,y:350,s:.10,a:1.5,phase:.5},
 {kind:'grass',x:640,y:349,s:.085,a:1.2,phase:1.2}, {kind:'grass',x:552,y:369,s:.10,a:1.5,phase:2.2},
 {kind:'grass',x:734,y:390,s:.10,a:1.8,phase:3.2}, {kind:'grass',x:151,y:373,s:.12,a:2,phase:2.4},
 {kind:'grass',x:874,y:423,s:.14,a:2.6,phase:.7}, {kind:'stalk',x:51,y:353,s:.60,a:8,phase:1.0},
 {kind:'stalk',x:989,y:410,s:1,a:11,phase:2.0},
 {kind:'grass',x:78,y:547,s:1,a:9,phase:1.8}, {kind:'rosette',x:960,y:549,s:1,a:5,phase:.4},
 ];
 function drawRow(ctx,row,t){const part=row.kind==='rosette'?rosette:row.kind==='grass'?grass:stalk,root=row.kind==='rosette'?[956,548]:row.kind==='grass'?[79,548]:[988,411];
 const height=row.kind==='rosette'?110:row.kind==='grass'?155:188,wind=Math.sin(TAU*t/4+row.phase)*.70+Math.sin(TAU*t/3+row.phase*1.6)*.30;
 shadow(ctx,row.x,row.y+2,18*row.s,3*row.s,.14);
 warp(ctx,part,([x,y])=>{const h=Math.max(0,Math.min(1,(root[1]-y)/height)),flex=h*h;return [row.x+(x-root[0])*row.s+row.a*wind*flex,row.y+(y-root[1])*row.s+Math.abs(row.a*wind)*.07*flex];},row.kind==='stalk'?16:12);
 }
 return {drawBack(ctx,t){for(const row of rows.slice(0,-2))drawRow(ctx,row,t);},drawFront(ctx,t){for(const row of rows.slice(-2))drawRow(ctx,row,t);},diagnostics(t){return {plantCount:rows.length,rooted:true,roots:rows.map(r=>[r.x,r.y]),windPhase:TAU*t/4};}};
}
