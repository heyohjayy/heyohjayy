// Pin README images to committed content, avoiding stale branch-image caches.
// Run after committing rebuilt cards; then commit the updated README.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const readmePath=path.join(root,'README.md');
let readme=await fs.readFile(readmePath,'utf8');
for(const theme of ['light','dark']){
  const asset=`assets/profile-${theme}.png`;
  if(git('hash-object',asset)!==git('rev-parse',`HEAD:${asset}`)){
    throw new Error(`Commit rebuilt ${asset} before refreshing its README reference.`);
  }
  const revision=git('log','-1','--format=%H','--',asset);
  if(!/^[0-9a-f]{40}$/.test(revision))throw new Error(`No committed revision for ${asset}`);
  const url=`https://raw.githubusercontent.com/heyohjayy/heyohjayy/${revision}/${asset}`;
  // Match only the target attribute's value, preserving its closing quote.
  const target=new RegExp(`((?:src|srcset)=")[^"]*assets/profile-${theme}\\.png(?:\\?[^"]*)?(?=")`,'g');
  let count=0;readme=readme.replace(target,(_,prefix)=>{count++;return prefix+url;});
  if(count!==1)throw new Error(`Expected one ${theme} card reference; found ${count}`);
  console.log(`Pinned ${theme} card to ${revision.slice(0,8)}`);
}
await fs.writeFile(readmePath,readme);
