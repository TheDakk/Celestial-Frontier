import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{createArapScratch,solveArapSkin}from'./arap-skin.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./test-fixtures/fish-cast-orientation.json',import.meta.url)));
// Verbatim pre-repair projection loop retained solely as the failing control.
function oldForwardProjection(s){const{position:p,rhs,triangleDofs,triangleSigns,triangleFloors,triangleMovable}=s;
 rhs.set(p);let orientationPasses=0;
 for(let pass=0;pass<s.orientationIterations;pass++){
  let changed=0,progressed=false;for(let k=0;k<triangleDofs.length;k+=3){
   const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],triangle=k/3,sign=triangleSigns[triangle],movable=triangleMovable[triangle];
   const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]),constraint=area*sign-triangleFloors[triangle];
   if(constraint>=0)continue;changed++;
   const ax=p[b+1]-p[c+1],ay=p[c]-p[b],bx=p[c+1]-p[a+1],by=p[a]-p[c],cx=p[a+1]-p[b+1],cy=p[b]-p[a];
   const norm=(movable&1?ax*ax+ay*ay:0)+(movable&2?bx*bx+by*by:0)+(movable&4?cx*cx+cy*cy:0);if(norm<1e-20)continue;
   const scale=-constraint*sign/norm;
   if(movable&1){const x=p[a],y=p[a+1];p[a]+=scale*ax;p[a+1]+=scale*ay;if(!Object.is(x,p[a])||!Object.is(y,p[a+1]))progressed=true;}
   if(movable&2){const x=p[b],y=p[b+1];p[b]+=scale*bx;p[b+1]+=scale*by;if(!Object.is(x,p[b])||!Object.is(y,p[b+1]))progressed=true;}
   if(movable&4){const x=p[c],y=p[c+1];p[c]+=scale*cx;p[c+1]+=scale*cy;if(!Object.is(x,p[c])||!Object.is(y,p[c+1]))progressed=true;}
  }
  // Repeating a sweep that changed no Float64 coordinate is an exact no-op,
  // including signed zero. Keep the final orientation refusal: a stalled
  // contradictory contact pose still fails and never publishes its pixels.
  orientationPasses=pass+1;if(!changed||!progressed)break;
 }
 let flipped=0,minRatio=Infinity;for(let k=0;k<triangleDofs.length;k+=3){const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],ratio=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))/s.areas[k/3];if(!Number.isFinite(ratio)||ratio<=0)flipped++;minRatio=Math.min(minRatio,ratio);}

 return flipped;
}
test('active-set projection closes the real cast fold that 64 forward sweeps leave inverted, without changing targets or pins',()=>{
 const f=fixture,s=createArapScratch(f.vertices,f.triangles,f.width,f.height,f.solver),target=Float32Array.from(f.target),saved=target.slice(),out=target.slice();
 const stats=solveArapSkin(s,target,out);assert.equal(stats.flippedTriangles,0);assert.ok(stats.minimumAreaRatio>0);assert.ok(s.orientationQueue.visits<=s.orientationIterations*s.areas.length);assert.deepEqual(target,saved);
 const accepted=out.slice(),beforeProjection=s.rhs.slice();s.position.set(beforeProjection);assert.ok(oldForwardProjection(s)>0,'the historical algorithm must still reproduce the fold');
 solveArapSkin(s,target,out);assert.deepEqual(out,accepted,'prior failed/control seeks cannot affect output');
 for(let i=0;i<s.n;i++)if(s.pins[i])assert.deepEqual(out.slice(i*2,i*2+2),target.slice(i*2,i*2+2));
 const impossible=createArapScratch([{x:0,y:0},{x:40,y:0},{x:0,y:40}],[0,1,2],40,40,{pins:[0,1,2]}),sentinel=new Float32Array(6).fill(9);assert.throws(()=>solveArapSkin(impossible,new Float32Array([0,0,1,0,0,-1]),sentinel),/unresolved folded/);assert.ok(sentinel.every(v=>v===9));
});
