import fs from 'node:fs';import {registerHooks} from 'node:module';
const base=import.meta.dirname,source=new URL('../../port/v2/tools/creature-animation/',import.meta.url);
registerHooks({resolve(spec,ctx,next){if(ctx.parentURL?.startsWith(new URL('./',import.meta.url).href)&&spec.startsWith('./')&&!fs.existsSync(new URL(spec,ctx.parentURL)))return next(new URL(spec,source).href,ctx);return next(spec,ctx);}});
