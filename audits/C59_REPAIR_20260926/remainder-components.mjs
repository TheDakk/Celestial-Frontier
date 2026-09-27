export function remainderComponents(labels,width,remainder){
 const seen=new Uint8Array(labels.length),groups=[];
 for(let seed=0;seed<labels.length;seed++)if(labels[seed]===remainder&&!seen[seed]){
  const pixels=[seed],border=new Map();seen[seed]=1;
  for(let k=0;k<pixels.length;k++){const p=pixels[k],x=p%width;for(const q of[x? p-1:-1,x+1<width?p+1:-1,p-width,p+width])if(q>=0&&q<labels.length){const id=labels[q];if(id===remainder){if(!seen[q]){seen[q]=1;pixels.push(q);}}else if(id)border.set(id,(border.get(id)??0)+1);}}
  groups.push({pixels,border:[...border].sort((a,b)=>b[1]-a[1])});
 }return groups.sort((a,b)=>b.pixels.length-a.pixels.length);
}
