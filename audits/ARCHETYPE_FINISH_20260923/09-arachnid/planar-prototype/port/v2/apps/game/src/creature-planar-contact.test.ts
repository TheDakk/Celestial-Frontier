import {expect,it} from 'vitest';
import {planarContactCandidates,type PlanarReach} from './creature-planar-contact.js';
function admissible(reach:readonly PlanarReach[],bound:number){
 const points=planarContactCandidates(reach,bound);expect(points).toEqual(planarContactCandidates(reach,bound));
 let prior=-1;for(const p of points){const norm=Math.hypot(p.x,p.y);expect(Number.isFinite(norm)).toBe(true);expect(p.y).toBeGreaterThanOrEqual(0);expect(norm).toBeLessThanOrEqual(bound);expect(norm).toBeGreaterThanOrEqual(prior);prior=norm;
  for(const a of reach){const d=Math.hypot(p.x-a.center.x,p.y-a.center.y);expect(d).toBeGreaterThanOrEqual(a.min);expect(d).toBeLessThanOrEqual(a.max);}
 }return points;
}
it('keeps the unshifted feasible root first and returns frozen deterministic candidates',()=>{
 const points=admissible([{center:{x:0,y:0},min:0,max:2}],1);expect(points[0]).toEqual({x:0,y:0});expect(Object.isFrozen(points)).toBe(true);expect(points.every(Object.isFrozen)).toBe(true);
});
it('finds a horizontal rescue within the original disk when vertical-only translation cannot reach',()=>{
 const reach=[{center:{x:2,y:1},min:0,max:1.5}],points=admissible(reach,1);
 expect(2).toBeGreaterThan(reach[0]!.max);expect(points.length).toBeGreaterThan(0);expect(points.every(p=>p.x>0)).toBe(true);
});
it('excludes inner holes and retains strict interior alternatives without increasing the cap',()=>{
 const points=admissible([{center:{x:0,y:0},min:.5,max:1}],1);
 expect(points.some(p=>Math.hypot(p.x,p.y)>.5&&Math.hypot(p.x,p.y)<1)).toBe(true);expect(points.some(p=>p.x===0&&p.y===0)).toBe(false);
});
it('handles concentric, disjoint and tangent circles without inventing feasible space',()=>{
 expect(admissible([{center:{x:0,y:0},min:2,max:3}],1)).toEqual([]);
 expect(admissible([{center:{x:3,y:0},min:0,max:1}],1)).toEqual([]);
 expect(admissible([{center:{x:2,y:0},min:0,max:1}],1)).toEqual([{x:1,y:0}]);
});
it('orders equal-norm points deterministically and never crosses the source y axis',()=>{
 const points=admissible([{center:{x:0,y:0},min:1,max:1}],1);
 expect(points).toEqual([{x:-1,y:0},{x:0,y:1},{x:1,y:0}]);
 expect(admissible([{center:{x:0,y:-2},min:0,max:.5}],1)).toEqual([]);
});
it('rejects invalid finite geometry and capacity instead of clamping it',()=>{
 const valid=[{center:{x:0,y:0},min:0,max:1}];for(const bound of [0,-1,Infinity,NaN])expect(()=>planarContactCandidates(valid,bound)).toThrow();
 for(const reach of [[],[{center:{x:NaN,y:0},min:0,max:1}],[{center:{x:0,y:0},min:-1,max:1}],[{center:{x:0,y:0},min:2,max:1}]])expect(()=>planarContactCandidates(reach,1)).toThrow();
});
