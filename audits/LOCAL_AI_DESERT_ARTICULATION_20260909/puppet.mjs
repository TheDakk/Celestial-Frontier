/** Scene-specific Canvas skinning helpers; no genome or production rig authority. */
export const IDENTITY=[1,0,0,1,0,0];
export const translate=(x,y)=>[1,0,0,1,x,y];
export const rotateAt=([x,y],a)=>{const c=Math.cos(a),s=Math.sin(a);return [c,s,-s,c,x-c*x+s*y,y-s*x-c*y];};
export const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export function cutout(image,polygon){
 const x=Math.max(0,Math.floor(Math.min(...polygon.map(p=>p[0])))-2),y=Math.max(0,Math.floor(Math.min(...polygon.map(p=>p[1])))-2);
 const width=Math.min(image.naturalWidth??image.width,Math.ceil(Math.max(...polygon.map(p=>p[0])))+2)-x,height=Math.min(image.naturalHeight??image.height,Math.ceil(Math.max(...polygon.map(p=>p[1])))+2)-y;
 if(!(width>0&&height>0))throw Error('Empty cutout');const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d');c.translate(-x,-y);c.beginPath();polygon.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.clip();c.drawImage(image,0,0);
 return {canvas,x,y,width,height};
}
export function paint(ctx,part,matrix=IDENTITY,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.transform(...matrix);ctx.drawImage(part.canvas,part.x,part.y);ctx.restore();}
function triangle(ctx,canvas,s,d){
 const [p,q,r]=s,[u,v,w]=d,det=p[0]*(q[1]-r[1])+q[0]*(r[1]-p[1])+r[0]*(p[1]-q[1]);if(Math.abs(det)<1e-7)return;
 const coeff=k=>[(u[k]*(q[1]-r[1])+v[k]*(r[1]-p[1])+w[k]*(p[1]-q[1]))/det,(u[k]*(r[0]-q[0])+v[k]*(p[0]-r[0])+w[k]*(q[0]-p[0]))/det,(u[k]*(q[0]*r[1]-r[0]*q[1])+v[k]*(r[0]*p[1]-p[0]*r[1])+w[k]*(p[0]*q[1]-q[0]*p[1]))/det];
 const a=coeff(0),b=coeff(1),cx=(u[0]+v[0]+w[0])/3,cy=(u[1]+v[1]+w[1])/3;
 ctx.save();ctx.beginPath();d.forEach(([x,y],i)=>{const dx=x-cx,dy=y-cy,len=Math.hypot(dx,dy)||1,ex=x+dx/len*.35,ey=y+dy/len*.35;i?ctx.lineTo(ex,ey):ctx.moveTo(ex,ey);});ctx.closePath();ctx.clip();ctx.transform(a[0],b[0],a[1],b[1],a[2],b[2]);ctx.drawImage(canvas,0,0);ctx.restore();
}
export function warp(ctx,part,mapPoint,cell=14){
 const cols=Math.max(1,Math.ceil(part.width/cell)),rows=Math.max(1,Math.ceil(part.height/cell));
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x0=i*part.width/cols,x1=(i+1)*part.width/cols,y0=j*part.height/rows,y1=(j+1)*part.height/rows;
  const s=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],d=s.map(([x,y])=>mapPoint([x+part.x,y+part.y]));
  triangle(ctx,part.canvas,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(ctx,part.canvas,[s[0],s[2],s[3]],[d[0],d[2],d[3]]);
 }
}
export function shadow(ctx,x,y,rx,ry,alpha=.25){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const gradient=ctx.createRadialGradient(0,0,0,0,0,1);gradient.addColorStop(0,`rgba(36,21,32,${alpha})`);gradient.addColorStop(1,'rgba(36,21,32,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();}
