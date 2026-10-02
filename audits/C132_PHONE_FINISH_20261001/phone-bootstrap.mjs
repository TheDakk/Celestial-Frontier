import '/client.mjs';
const button=document.querySelector('button'),status=document.querySelector('pre');
button.addEventListener('click',async()=>{
 button.disabled=true;
 const update=()=>{status.textContent=JSON.stringify(window.phoneFinish.snapshot(),null,2);};
 const timer=setInterval(update,500);
 try{
  await window.phoneFinish.start();update();
  const reply=await fetch('/output/probe-state.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(window.phoneFinish.snapshot())});
  if(!reply.ok)throw Error('Probe receipt refused: '+reply.status);
  status.textContent+='\nReceipt retained. Visual verdict remains REJECTED; no device qualification.';
 }catch(error){status.textContent+='\nProbe failure: '+String(error);}finally{clearInterval(timer);}
},{once:true});
