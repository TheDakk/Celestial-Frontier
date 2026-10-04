import {rolldown} from '../../port/v2/node_modules/rolldown/dist/index.mjs';
const b='audits/C203_NATIVE_HOLDS_20261004',bundle=await rolldown({input:b+'/cache-timing.ts',platform:'node'});try{await bundle.write({file:b+'/cache-timing.bundle.mjs',format:'es',codeSplitting:false});}finally{await bundle.close();}await import('./cache-timing.bundle.mjs');
