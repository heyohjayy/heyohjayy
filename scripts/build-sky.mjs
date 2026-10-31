// Compile the vendored engine without adding any browser runtime dependency.
import fs from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=await fs.readFile(new URL('../vendor-sources/shader-sky.ts',import.meta.url),'utf8');
await fs.mkdir(new URL('../site/vendor/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../site/vendor/shader-sky.js',import.meta.url),stripTypeScriptTypes(source,{mode:'strip'}));
console.log('Compiled Shader Sky preview engine.');
