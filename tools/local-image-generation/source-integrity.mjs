import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Evidence finalization must survive missing/unreadable captured inputs. */
export async function recheckSourceFiles(rows){
  const failures=[];
  for(const row of rows){
    try{
      const bytes=await readFile(row.file);
      if((row.bytes!==undefined&&bytes.length!==row.bytes)
        ||createHash('sha256').update(bytes).digest('hex')!==row.sha256)
        failures.push({path:row.path,reason:'source-changed'});
    }catch(error){failures.push({path:row.path,reason:'source-unreadable',code:error.code??null,message:String(error.message)});}
  }
  return {unchanged:failures.length===0,checked:rows.length,failures};
}
