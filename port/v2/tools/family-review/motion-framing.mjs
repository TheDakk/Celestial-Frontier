export function motionBounds(poses){
 const box={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
 for(const positions of poses)for(const a of Object.values(positions))for(let i=0;i<a.length;i+=2){
  if(!Number.isFinite(a[i])||!Number.isFinite(a[i+1]))throw Error('Nonfinite motion extent');
  box.minX=Math.min(box.minX,a[i]);box.minY=Math.min(box.minY,a[i+1]);box.maxX=Math.max(box.maxX,a[i]);box.maxY=Math.max(box.maxY,a[i+1]);
 }
 if(!(box.maxX>box.minX&&box.maxY>box.minY))throw Error('Empty motion extent');return box;
}
export function fitMotionBounds(box,viewport){
 const scale=Math.min(viewport.width/(box.maxX-box.minX),viewport.height/(box.maxY-box.minY));
 if(!(Number.isFinite(scale)&&scale>0))throw Error('Invalid motion viewport');
 return {scale,x:viewport.x-box.minX*scale,y:viewport.y-box.minY*scale};
}
export function containsMotion(box,fit,view){return box.minX*fit.scale+fit.x>=view.x-1e-6&&box.minY*fit.scale+fit.y>=view.y-1e-6&&box.maxX*fit.scale+fit.x<=view.x+view.width+1e-6&&box.maxY*fit.scale+fit.y<=view.y+view.height+1e-6;}
