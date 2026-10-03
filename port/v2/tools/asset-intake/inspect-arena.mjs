#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {inspectArenaSet} from './arena-set.mjs';
const[file,root]=process.argv.slice(2);if(!file||process.argv.length>4)throw Error('Usage: node inspect-arena.mjs MANIFEST.json [SOURCE_ROOT]');
console.log(JSON.stringify(inspectArenaSet(root?path.resolve(root):path.dirname(path.resolve(file)),JSON.parse(fs.readFileSync(file))),null,2));
