import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {recheckSourceFiles} from './source-integrity.mjs';

test('final source receipt survives deletion and corruption, checks all rows, and passes after restoration',async()=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'cf-source-receipt-'));
  const bytes=Buffer.from('retained source');
  const rows=['tool','canonical'].map(name=>({path:name,file:path.join(directory,name),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));
  try{
    for(const row of rows)await fs.writeFile(row.file,bytes);
    assert.deepEqual(await recheckSourceFiles(rows),{unchanged:true,checked:2,failures:[]});
    await fs.unlink(rows[0].file);await fs.writeFile(rows[1].file,'modified source');
    const red=await recheckSourceFiles(rows);
    assert.equal(red.unchanged,false);assert.equal(red.checked,2);
    assert.deepEqual(red.failures.map(x=>[x.path,x.reason]),[['tool','source-unreadable'],['canonical','source-changed']]);
    assert.equal(red.failures[0].code,'ENOENT');
    // The surrounding finalizer can still serialize its red receipt.
    await fs.writeFile(path.join(directory,'result.json'),JSON.stringify({status:red.unchanged?'PASS':'FAIL',sourceIntegrity:red}));
    assert.equal(JSON.parse(await fs.readFile(path.join(directory,'result.json'),'utf8')).status,'FAIL');
    for(const row of rows)await fs.writeFile(row.file,bytes);
    assert.deepEqual(await recheckSourceFiles(rows),{unchanged:true,checked:2,failures:[]});
  }finally{await fs.rm(directory,{recursive:true,force:true});}
});
