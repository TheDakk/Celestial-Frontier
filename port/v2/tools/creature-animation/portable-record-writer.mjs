/** CLI-only adapter. Normalize new source metadata before its recipe is sealed.
 * Historical records and the browser admission/hash owner remain unchanged. */
import path from 'node:path';import fs from 'node:fs';import{fileURLToPath}from'node:url';
import{sealFamilyRecord}from'./family-record.mjs';
import{sealRecord}from'./quadruped-template.mjs';
export const RECORD_REPO_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
export function portableRecordSource(source,root=RECORD_REPO_ROOT){
 if(typeof source!=='string'||!source.length||source.includes('\0'))throw Error('Record source: nonempty path required');
 const flavour=(/^[A-Za-z]:[\\/]/.test(root)||root.startsWith('\\\\'))?path.win32:path;
 if(flavour!==path.win32&&(/^[A-Za-z]:[\\/]/.test(source)||source.startsWith('\\\\')))throw Error('Record source: foreign absolute path');
 const relative=flavour.relative(root,flavour.resolve(root,source));
 if(!relative||relative==='..'||relative.startsWith('..'+flavour.sep)||flavour.isAbsolute(relative))throw Error('Record source: outside repository');
 return relative.split(flavour.sep).join('/');
}
function draft(input,root){
 const source=portableRecordSource(input.source,root),file=path.resolve(root,source),realRoot=fs.realpathSync(root),real=fs.realpathSync(file);
 portableRecordSource(real,realRoot); // Symlinks cannot export another checkout.
 return {...input,source};
}
export const sealPortableFamilyRecord=async(input,root=RECORD_REPO_ROOT)=>sealFamilyRecord(draft(input,root));
export const sealPortableQuadrupedRecord=async(input,root=RECORD_REPO_ROOT)=>{const {recipeHash:_old,boundsCheck:_bounds,...body}=draft(input,root);return sealRecord(body);};
