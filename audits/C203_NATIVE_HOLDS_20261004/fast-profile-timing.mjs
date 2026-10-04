import {rolldown} from '../../port/v2/node_modules/rolldown/dist/index.mjs';
const b='audits/C203_NATIVE_HOLDS_20261004',bundle=await rolldown({input:b+'/fast-profile-timing.ts',platform:'node'});try{await bundle.write({file:b+'/fast-profile-timing.bundle.mjs',format:'es',codeSplitting:false});}finally{await bundle.close();}await import('./fast-profile-timing.bundle.mjs');
