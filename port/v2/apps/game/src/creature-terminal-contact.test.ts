import {expect,it} from 'vitest';
import {createTerminalContactSolver,type TerminalContactRest,type TerminalContactCandidate} from './creature-terminal-contact.js';
const rest:TerminalContactRest={root:{x:0,y:0},joint:{x:.3,y:.4},end:{x:.6,y:0},support:{x:.8,y:0},bend:1,limits:{knee:{min:-1.5,max:1.5},end:{min:-2,max:2},terminal:{min:-.2,max:.2}}};
const rotate=(x:number,y:number,a:number)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
function forward(r:TerminalContactRest,h:{x:number;y:number},parent:number,q:{knee:number;end:number;terminal:number}){
 let x=h.x,y=h.y,a=parent;const points=[h];
 for(const [from,to,delta] of [[r.root,r.joint,q.knee],[r.joint,r.end,q.end],[r.end,r.support,q.terminal]] as const){a+=delta;const p=rotate(to.x-from.x,to.y-from.y,a);x+=p.x;y+=p.y;points.push({x,y});}return points;
}
function outcome(r:TerminalContactRest,h:{x:number;y:number},target:{x:number;y:number},parent:number,c:TerminalContactCandidate){
 const p=forward(r,h,parent,c.rotations),source=[r.root,r.joint,r.end,r.support];
 for(let i=1;i<4;i++)expect(Math.hypot(p[i]!.x-p[i-1]!.x,p[i]!.y-p[i-1]!.y)).toBeCloseTo(Math.hypot(source[i]!.x-source[i-1]!.x,source[i]!.y-source[i-1]!.y),13);
 expect(p[3]!.x).toBeCloseTo(target.x,13);expect(p[3]!.y).toBeCloseTo(target.y,13);
 const a=p[2]!,k=p[1]!,side=(a.x-h.x)*(k.y-h.y)-(a.y-h.y)*(k.x-h.x);expect(side*r.bend).toBeGreaterThanOrEqual(0);
 for(const j of ['knee','end','terminal'] as const){expect(c.rotations[j]).toBeGreaterThanOrEqual(r.limits[j].min);expect(c.rotations[j]).toBeLessThanOrEqual(r.limits[j].max);}
}
const zeroFootTarget=(end:number)=>forward(rest,rest.root,0,{knee:0,end,terminal:-end})[3]!;
it('returns exact authored rest with zero rotations and fixed painted support',()=>{
 const result=createTerminalContactSolver(rest).solve({root:rest.root,target:rest.support,parentRotation:0});
 expect(result.status).toBe('solved');if(result.status!=='solved')throw Error('rest refused');
 expect(result.mode).toBe('preferred');expect(result.rotations).toEqual({knee:0,end:0,terminal:0});expect(result.points).toEqual({root:rest.root,joint:rest.joint,end:rest.end,support:rest.support});
 for(const c of result.candidates)outcome(rest,rest.root,rest.support,0,c);
});
it('uses the active terminal bound without clamping the solved knee or ankle',()=>{
 const target=zeroFootTarget(.3),result=createTerminalContactSolver(rest).solve({root:rest.root,target,parentRotation:0});
 expect(result.status).toBe('solved');if(result.status!=='solved')throw Error(JSON.stringify(result));
 expect(result.mode).toBe('terminal-min');expect(result.rotations.terminal).toBe(-.2);expect(result.footRotation).not.toBe(0);
 expect(result.attempts.some(a=>a.mode==='preferred'&&a.reason==='joint limit terminal')).toBe(true);
 for(const c of result.candidates)outcome(rest,rest.root,target,0,c);
 const ordered=result.candidates.map(c=>Math.abs(c.footRotation));expect(ordered).toEqual([...ordered].sort((a,b)=>a-b));
});
it('joins the preferred branch continuously when its terminal angle reaches the bound',()=>{
 const solver=createTerminalContactSolver(rest),solved=[.2-1e-7,.2+1e-7].map(a=>solver.solve({root:rest.root,target:zeroFootTarget(a),parentRotation:0}));
 expect(solved.every(s=>s.status==='solved')).toBe(true);const a=solved[0]!,b=solved[1]!;if(a.status!=='solved'||b.status!=='solved')throw Error('boundary refused');
 expect(a.mode).toBe('preferred');expect(b.mode).toBe('terminal-min');
 for(const j of ['knee','end','terminal'] as const)expect(Math.abs(a.rotations[j]-b.rotations[j])).toBeLessThan(1e-5);
 expect(Math.abs(a.footRotation-b.footRotation)).toBeLessThan(1e-5);
 outcome(rest,rest.root,zeroFootTarget(.2-1e-7),0,a);outcome(rest,rest.root,zeroFootTarget(.2+1e-7),0,b);
});
it('preserves the opposite anatomical bend and reflected support under mirroring',()=>{
 const mirror=(p:{x:number;y:number})=>({x:-p.x,y:p.y}),r:TerminalContactRest={...rest,root:mirror(rest.root),joint:mirror(rest.joint),end:mirror(rest.end),support:mirror(rest.support),bend:-1},target=zeroFootTarget(.3);
 const a=createTerminalContactSolver(rest).solve({root:rest.root,target,parentRotation:0}),b=createTerminalContactSolver(r).solve({root:r.root,target:mirror(target),parentRotation:0});
 if(a.status!=='solved'||b.status!=='solved')throw Error('mirrored refusal');
 expect(b.mode).toBe('terminal-max');for(const j of ['knee','end','terminal'] as const)expect(b.rotations[j]).toBeCloseTo(-a.rotations[j],13);
 for(const c of b.candidates)outcome(r,r.root,mirror(target),0,c);
});
it('reconstructs a moved hip under its actual inherited parent rotation',()=>{
 const h={x:.2,y:-.1},parent=.15,target=forward(rest,h,parent,{knee:.1,end:.1,terminal:-.1})[3]!;
 const result=createTerminalContactSolver(rest).solve({root:h,target,parentRotation:parent});if(result.status!=='solved')throw Error(JSON.stringify(result));
 for(const c of result.candidates)outcome(rest,h,target,parent,c);
});
it('refuses reach or all-limit conflicts and never substitutes the opposite elbow branch',()=>{
 const solver=createTerminalContactSolver(rest);expect(solver.solve({root:rest.root,target:{x:3,y:0},parentRotation:0}).status).toBe('refused');
 const fixed={min:0,max:0},locked=createTerminalContactSolver({...rest,limits:{knee:fixed,end:fixed,terminal:fixed}}).solve({root:rest.root,target:zeroFootTarget(.1),parentRotation:0});
 expect(locked.status).toBe('refused');expect(locked.candidates).toHaveLength(0);expect(locked.attempts.some(a=>a.reason.startsWith('joint limit'))).toBe(true);
 const branch=createTerminalContactSolver({...rest,limits:{...rest.limits,knee:{min:-3,max:-1.6}}}).solve({root:rest.root,target:rest.support,parentRotation:0});expect(branch.status).toBe('refused');
});
it('snapshots source geometry/limits and rejects invalid or degenerate inputs',()=>{
 const mutable={...rest,support:{...rest.support},limits:{...rest.limits,terminal:{...rest.limits.terminal}}},solver=createTerminalContactSolver(mutable);mutable.support.x=99;mutable.limits.terminal.min=-99;
 const result=solver.solve({root:rest.root,target:rest.support,parentRotation:0});expect(result.status).toBe('solved');
 expect(()=>createTerminalContactSolver({...rest,support:rest.end})).toThrow('degenerate terminal');
 expect(()=>createTerminalContactSolver({...rest,bend:-1})).toThrow('bend sign');
 expect(()=>createTerminalContactSolver({...rest,limits:{...rest.limits,end:{min:1,max:-1}}})).toThrow('invalid joint limit');
 expect(()=>solver.solve({root:rest.root,target:{x:NaN,y:0},parentRotation:0})).toThrow('invalid point');
 expect(()=>solver.solve({root:rest.root,target:rest.support,parentRotation:Infinity})).toThrow('invalid parent rotation');
});
