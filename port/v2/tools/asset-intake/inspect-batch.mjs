#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {inspectArtBatch} from './art-batch.mjs';
const [file,root]=process.argv.slice(2);if(!file||process.argv.length>4)throw Error('Usage: node inspect-batch.mjs BATCH_MANIFEST.json [SOURCE_ROOT]');
console.log(JSON.stringify(inspectArtBatch(root?path.resolve(root):path.dirname(path.resolve(file)),JSON.parse(fs.readFileSync(file))),null,2));
